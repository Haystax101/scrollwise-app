import { supabase } from '../lib/supabase';

/**
 * Service for handling profile images.
 */
export const profileImageService = {
  /**
   * Get the appropriate profile image URL for a user.
   * Returns the Supabase URL if avatarUrl is valid, otherwise null.
   */
  getProfileImageUrl(avatarUrl: string | null | undefined): string | null {
    if (avatarUrl && avatarUrl.trim() !== '') {
      // Assuming avatarUrl is a path in Supabase storage
      const { data } = supabase.storage.from('avatars').getPublicUrl(avatarUrl);
      return data?.publicUrl || null;
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
      const finalFileName = fileName || `${userId}-${Date.now()}.jpg`;
      
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(finalFileName, blob, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Error uploading profile image:', error);
        return { url: null, path: null, error };
      }

      // Update user's avatar_url in the profiles table
      const updateSuccess = await this.updateUserAvatarUrl(userId, data.path);
      if (!updateSuccess) {
        return { 
          url: null, 
          path: null, 
          error: new Error('Failed to update user avatar URL in database') 
        };
      }

      // Generate public URL
      const publicUrl = this.getProfileImageUrl(data.path);
      
      return { 
        url: publicUrl, 
        path: data.path, 
        error: null 
      };
    } catch (error) {
      console.error('Exception uploading profile image:', error);
      return { url: null, path: null, error: error as Error };
    }
  },

  /**
   * Update user's avatar_url in the profiles table.
   */
  async updateUserAvatarUrl(userId: string, avatarPath: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarPath })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user avatar URL:', error);
        return false;
      }

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