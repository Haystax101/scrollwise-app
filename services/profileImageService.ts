import { supabase } from '../lib/supabase';
// NOTE: Install with: npm install expo-image-manipulator
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * Service for handling profile images.
 */
/**
 * Compress image to save bucket space and improve performance
 */
const compressImage = async (uri: string): Promise<string> => {
  try {
    console.log('Compressing image:', uri);
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: 400 } }], // Max width 400px
      { compress: 0.7, format: SaveFormat.JPEG } // 70% quality
    );
    console.log('Image compressed successfully:', {
      originalUri: uri,
      compressedUri: result.uri,
      width: result.width,
      height: result.height
    });
    return result.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    // If compression fails, return original URI as fallback
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
        
        // Assuming avatarUrl is a path in Supabase storage
        const { data } = supabase.storage.from('avatars').getPublicUrl(avatarUrl);
        const url = data?.publicUrl;
        
        if (url) {
          console.log('Generated profile image URL:', url);
          return url;
        } else {
          console.warn('Failed to generate public URL for avatar path:', avatarUrl);
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
      console.log('Starting profile image upload for user:', userId);
      console.log('Original image URI:', imageUri);
      
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
        message: error.message,
        stack: error.stack,
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
   */
  async removeUserAvatar(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (error) {
        console.error('Error removing user avatar:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception removing user avatar:', error);
      return false;
    }
  },

  /**
   * Check if a URL is the default profile image.
   */
  isDefaultProfileImage(avatarUrl: string | null | undefined): boolean {
    return !avatarUrl || avatarUrl.trim() === '';
  },
};