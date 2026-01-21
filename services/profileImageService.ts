import { supabase } from '../lib/supabase';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * Service for handling profile images.
 */

/**
 * Compress image to save bucket space and improve performance
 */
const compressImage = async (uri: string): Promise<string> => {
  try {
    console.log('Compressing image:', uri);

    // Use the non-hook API with conservative sizing to prevent memory crashes
    // First resize to a reasonable intermediate size to reduce memory load
    const ctx = ImageManipulator.manipulate(uri);

    // More aggressive initial resize to prevent memory issues with very large images
    // Target max dimension of 800px instead of 300px to reduce processing load
    ctx.resize({ width: 800 });

    const imageRef = await ctx.renderAsync();
    const result = await imageRef.saveAsync({
      compress: 0.7, // Slightly less aggressive compression
      format: SaveFormat.JPEG
    });

    // Now do final resize to target size of 300px
    const finalCtx = ImageManipulator.manipulate(result.uri);
    finalCtx.resize({ width: 300 });

    const finalImageRef = await finalCtx.renderAsync();
    const finalResult = await finalImageRef.saveAsync({
      compress: 0.6,
      format: SaveFormat.JPEG
    });

    console.log('Image compressed successfully:', {
      originalUri: uri,
      intermediateUri: result.uri,
      finalUri: finalResult.uri,
      finalWidth: finalResult.width,
      finalHeight: finalResult.height
    });

    return finalResult.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    console.warn('Compression failed, likely due to memory constraints. Using original image.');
    // If compression fails due to memory issues, return original URI as fallback
    return uri;
  }
};

export const profileImageService = {
  /**
   * Get the appropriate profile image URL for a user.
   * Returns the Supabase URL if avatarUrl is valid, otherwise null.
   */
  getProfileImageUrl(avatarUrl: string | null | undefined): string | null {
    if (avatarUrl && avatarUrl.trim() !== '') {
      try {
        // Check if it's already a full URL (skip processing)
        if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
          return avatarUrl;
        }

        // Reject local file paths (invalid data from previous uploads)
        if (avatarUrl.startsWith('file://')) {
          console.warn('Found local file path in avatar_url, treating as invalid:', avatarUrl);
          return null;
        }

        // Assuming avatarUrl is a path in Supabase storage
        const { data } = supabase.storage.from('avatars').getPublicUrl(avatarUrl);
        const url = data?.publicUrl;

        if (url) {
          // console.log('Generated profile image URL:', url);
          return url;
        } else {
          // console.warn('Failed to generate public URL for avatar path:', avatarUrl);
          return null;
        }
      } catch (error) {
        console.error('Error generating profile image URL:', error);
        return null;
      }
    }
    return null;
  },

  /**
   * Get profile image URL from a user profile object.
   * Handles both direct avatar_url field and nested user objects.
   */
  getProfileImageFromUser(user: any): string | null {
    const avatarUrl = user?.avatar_url || user?.user?.avatar_url || user?.profiles?.avatar_url;
    return this.getProfileImageUrl(avatarUrl);
  },

  /**
   * Upload profile image to Supabase storage.
   * Returns the public URL and path of the uploaded image.
   */
  async uploadProfileImage(
    userId: string,
    imageUri: string,
    fileName?: string
  ): Promise<{ url: string | null; path: string | null; error: Error | null }> {
    try {
      console.log('🚀 Starting profile image upload for user:', userId);
      console.log('📷 Original image URI:', imageUri);

      // Get current avatar_url to delete old file later
      console.log('🔍 Getting current avatar URL to delete old file...');
      const currentAvatarPath = await this.getCurrentUserAvatarPath(userId);
      if (currentAvatarPath) {
        console.log('🎯 Found existing avatar to delete:', currentAvatarPath);
      } else {
        console.log('✨ No existing avatar found for user (first upload or no previous avatar)');
      }

      // Compress image before upload to save bucket space
      console.log('Compressing profile image...');
      const compressedUri = await compressImage(imageUri);
      console.log('Using compressed image URI:', compressedUri);

      // Get file extension from URI (always use jpg after compression)
      const fileExt = 'jpg'; // JPEG format after compression
      const finalFileName = fileName || `${userId}-${Date.now()}.${fileExt}`;

      console.log('Generated filename:', finalFileName);

      // Convert compressed image URI to ArrayBuffer
      console.log('Converting compressed image URI to ArrayBuffer...');
      const arrayBuffer = await fetch(compressedUri).then((res) => res.arrayBuffer());

      console.log('ArrayBuffer size:', arrayBuffer.byteLength, 'bytes');

      if (arrayBuffer.byteLength === 0) {
        throw new Error('Image file is empty or could not be read');
      }

      // Upload to Supabase Storage using ArrayBuffer
      console.log('Uploading to Supabase storage bucket: avatars');
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(finalFileName, arrayBuffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg' // Always JPEG after compression
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        return { url: null, path: null, error };
      }

      if (!data || !data.path) {
        console.error('Upload succeeded but no path returned:', data);
        return { url: null, path: null, error: new Error('Upload succeeded but no file path returned') };
      }

      console.log('File uploaded successfully to path:', data.path);

      // Update user's avatar_url in the profiles table
      console.log('Updating user avatar_url in profiles table...');
      const updateSuccess = await this.updateUserAvatarUrl(userId, data.path);
      if (!updateSuccess) {
        console.error('Failed to update user avatar URL in database');
        return {
          url: null,
          path: null,
          error: new Error('Failed to update user avatar URL in database')
        };
      }

      // Clean up ALL old avatar files for this user, keeping only the current one
      console.log('🧹 Cleaning up old avatar files for user...');

      // Add a small delay to ensure new upload is fully completed before cleanup
      console.log('⏳ Waiting 1 second for upload to complete before cleanup...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const cleanupResult = await this.cleanupUserAvatarFiles(userId, data.path);
      if (cleanupResult.cleaned > 0) {
        console.log(`✅ Successfully cleaned up ${cleanupResult.cleaned} old avatar file(s)`);
      } else {
        console.log('ℹ️ No old avatar files found to clean up');
      }

      if (cleanupResult.errors.length > 0) {
        console.warn('⚠️ Some cleanup errors occurred:', cleanupResult.errors);
      }

      // Generate public URL
      console.log('Generating public URL for uploaded image...');
      const publicUrl = this.getProfileImageUrl(data.path);

      console.log('Profile image upload completed successfully:', {
        path: data.path,
        publicUrl: publicUrl,
        fileSize: arrayBuffer.byteLength
      });

      return {
        url: publicUrl,
        path: data.path,
        error: null
      };
    } catch (error) {
      console.error('Exception during profile image upload:', error);
      console.error('Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        imageUri
      });
      return { url: null, path: null, error: error as Error };
    }
  },

  /**
   * Update user's avatar_url in the profiles table.
   */
  async updateUserAvatarUrl(userId: string, avatarPath: string): Promise<boolean> {
    try {
      console.log('Updating profiles table with avatar_url:', {
        userId,
        avatarPath
      });

      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarPath })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('Database error updating user avatar URL:', error);
        return false;
      }

      console.log('Successfully updated user avatar URL in database:', data);
      return true;
    } catch (error) {
      console.error('Exception updating user avatar URL:', error);
      return false;
    }
  },

  /**
   * Remove user's profile image (set back to default).
   * This deletes ALL user avatar files from storage and sets avatar_url to null in database.
   */
  async removeUserAvatar(userId: string): Promise<boolean> {
    try {
      console.log('🗑️ Removing user avatar for user:', userId);

      // Update database first (set avatar_url to null)
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error removing user avatar from database:', error);
        return false;
      }

      console.log('✅ Successfully updated database to remove avatar_url');

      // Clean up ALL avatar files for this user from storage
      console.log('🧹 Cleaning up all avatar files for user...');
      const cleanupResult = await this.cleanupUserAvatarFiles(userId, ''); // Empty string means delete all user files

      if (cleanupResult.cleaned > 0) {
        console.log(`✅ Successfully cleaned up ${cleanupResult.cleaned} avatar file(s) from storage`);
      } else {
        console.log('ℹ️ No avatar files found in storage to clean up');
      }

      if (cleanupResult.errors.length > 0) {
        console.warn('⚠️ Some cleanup errors occurred:', cleanupResult.errors);
        // Still return true since database was updated successfully
      }

      return true;
    } catch (error) {
      console.error('❌ Exception removing user avatar:', error);
      return false;
    }
  },

  /**
   * Check if a URL is the default profile image.
   */
  isDefaultProfileImage(avatarUrl: string | null | undefined): boolean {
    return !avatarUrl || avatarUrl.trim() === '';
  },

  /**
   * Get current user's avatar path from database.
   * Returns null if user has no avatar or if there's an error.
   */
  async getCurrentUserAvatarPath(userId: string): Promise<string | null> {
    try {
      console.log('Fetching current avatar path for user:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching current avatar path:', error);
        return null;
      }

      const avatarPath = data?.avatar_url;
      if (!avatarPath || avatarPath.trim() === '') {
        console.log('User has no current avatar');
        return null;
      }

      // Skip deletion if it's a full URL (external image)
      if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
        console.log('Current avatar is external URL, not deleting:', avatarPath);
        return null;
      }

      console.log('✅ Current avatar path found:', avatarPath);
      console.log('📋 Avatar path details:', {
        path: avatarPath,
        pathType: typeof avatarPath,
        pathLength: avatarPath.length,
        isStoragePath: !avatarPath.startsWith('http')
      });
      return avatarPath;
    } catch (error) {
      console.error('Exception fetching current avatar path:', error);
      return null;
    }
  },

  /**
   * Delete avatar file from Supabase storage.
   * This is used to clean up old avatar files when users upload new ones.
   */
  async deleteAvatarFromStorage(avatarPath: string): Promise<boolean> {
    try {
      console.log('Attempting to delete avatar from storage:', avatarPath);

      // The Supabase storage remove API expects an array of file paths
      console.log('🗑️ Calling Supabase storage remove with:', [avatarPath]);

      const { data, error } = await supabase.storage
        .from('avatars')
        .remove([avatarPath]);

      if (error) {
        console.error('❌ Supabase storage deletion error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          name: error.name,
          avatarPath
        });
        return false;
      }

      // Log the exact response from Supabase
      console.log('📋 Supabase delete response:', {
        data: data,
        dataType: typeof data,
        dataLength: data?.length,
        hasData: !!data,
        isArray: Array.isArray(data)
      });

      // Check if deletion actually occurred
      if (!data || data.length === 0) {
        console.warn('⚠️ Deletion request succeeded but no files were reported as deleted');
        console.warn('⚠️ This might mean:');
        console.warn('   - File didn\'t exist in storage');
        console.warn('   - Path was incorrect');
        console.warn('   - File was already deleted');
        console.warn('   - Timing issue with concurrent operations');
        return false;
      }

      console.log('✅ Successfully deleted avatar from storage:', {
        avatarPath,
        deletedFiles: data,
        deletedCount: data.length,
        firstDeletedFile: data[0]
      });
      return true;
    } catch (error) {
      console.error('❌ Exception during avatar deletion:', error);
      console.error('❌ Exception details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        avatarPath
      });
      return false;
    }
  },

  /**
   * Clean up all old avatar files for a specific user, keeping only the current one.
   * This ensures each user has only one avatar file in storage.
   */
  async cleanupUserAvatarFiles(userId: string, currentFilePath: string): Promise<{ cleaned: number; errors: string[] }> {
    try {
      console.log('🧹 Starting cleanup of old avatar files for user:', userId);
      console.log('🎯 Current file to keep:', currentFilePath);

      // Get all files in the avatars bucket
      const { data: allFiles, error: listError } = await supabase.storage
        .from('avatars')
        .list();

      if (listError) {
        console.error('❌ Error listing avatar files:', listError);
        return { cleaned: 0, errors: [listError.message] };
      }

      if (!allFiles || allFiles.length === 0) {
        console.log('📁 No files found in avatars bucket');
        return { cleaned: 0, errors: [] };
      }

      // Find all files belonging to this user (files start with userId)
      const userFiles = allFiles.filter(file =>
        file.name && file.name.startsWith(userId)
      );

      console.log('📋 User files analysis:', {
        totalFiles: allFiles.length,
        userFiles: userFiles.length,
        userFileNames: userFiles.map(f => f.name),
        currentFile: currentFilePath
      });

      // Find files to delete (all user files except the current one)
      const filesToDelete = userFiles.filter(file =>
        file.name !== currentFilePath
      );

      console.log('🗑️ Files to delete:', {
        count: filesToDelete.length,
        files: filesToDelete.map(f => f.name)
      });

      if (filesToDelete.length === 0) {
        console.log('✨ No old files to clean up');
        return { cleaned: 0, errors: [] };
      }

      const errors: string[] = [];
      let cleaned = 0;

      // Delete each old file
      for (const file of filesToDelete) {
        try {
          console.log(`🗑️ Deleting old file: ${file.name}`);

          const { data, error } = await supabase.storage
            .from('avatars')
            .remove([file.name]);

          console.log(`🔍 Delete response for ${file.name}:`, {
            hasError: !!error,
            error: error,
            data: data,
            dataType: typeof data,
            dataLength: data?.length
          });

          if (error) {
            const errorMsg = `Failed to delete ${file.name}: ${error.message}`;
            console.error('❌', errorMsg);
            errors.push(errorMsg);
          } else if (!data || data.length === 0) {
            const warningMsg = `Delete request for ${file.name} succeeded but no files were deleted (likely permissions issue)`;
            console.warn('⚠️', warningMsg);
            console.warn('💡 Check Supabase Storage policies for DELETE operations on avatars bucket');
            errors.push(warningMsg);
          } else {
            console.log('✅ Successfully deleted:', file.name);
            cleaned++;
          }
        } catch (error) {
          const errorMsg = `Exception deleting ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error('❌', errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`🧹 Cleanup completed: ${cleaned} files cleaned, ${errors.length} errors`);
      return { cleaned, errors };

    } catch (error) {
      console.error('❌ Exception during user avatar cleanup:', error);
      return { cleaned: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  },

  /**
   * Clean up orphaned avatar files in storage.
   * This is a utility method to remove files that exist in storage but are not referenced in the database.
   * Use with caution - should only be run by administrators.
   */
  async cleanupOrphanedAvatars(): Promise<{ cleaned: number; errors: string[] }> {
    try {
      console.log('Starting cleanup of orphaned avatar files...');

      // Get all files in the avatars bucket
      const { data: files, error: listError } = await supabase.storage
        .from('avatars')
        .list();

      if (listError) {
        console.error('Error listing avatar files:', listError);
        return { cleaned: 0, errors: [listError.message] };
      }

      if (!files || files.length === 0) {
        console.log('No avatar files found in storage');
        return { cleaned: 0, errors: [] };
      }

      console.log(`Found ${files.length} files in avatars storage`);

      // Get all avatar_url references from the database
      const { data: profiles, error: dbError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .not('avatar_url', 'is', null);

      if (dbError) {
        console.error('Error fetching avatar URLs from database:', dbError);
        return { cleaned: 0, errors: [dbError.message] };
      }

      const referencedPaths = new Set(
        (profiles || [])
          .map(p => p.avatar_url)
          .filter(url => url && !url.startsWith('http'))
      );

      console.log(`Found ${referencedPaths.size} referenced avatar paths in database`);

      // Find orphaned files
      const orphanedFiles = files.filter(file =>
        file.name && !referencedPaths.has(file.name)
      );

      console.log(`Found ${orphanedFiles.length} orphaned files to clean up`);

      const errors: string[] = [];
      let cleaned = 0;

      // Delete orphaned files
      for (const file of orphanedFiles) {
        try {
          const success = await this.deleteAvatarFromStorage(file.name);
          if (success) {
            cleaned++;
            console.log(`Cleaned up orphaned file: ${file.name}`);
          } else {
            errors.push(`Failed to delete ${file.name}`);
          }
        } catch (error) {
          const errorMsg = `Error deleting ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`Cleanup completed: ${cleaned} files cleaned, ${errors.length} errors`);
      return { cleaned, errors };

    } catch (error) {
      console.error('Exception during avatar cleanup:', error);
      return { cleaned: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  },
};