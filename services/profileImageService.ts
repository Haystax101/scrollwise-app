import { supabase } from '../lib/supabase';

/**
 * Service for handling profile images with default fallback
 * Uses profileIconDefault.png from Supabase storage when no avatar is set
 */

// Default profile image as base64 - reliable fallback that works immediately
const DEFAULT_PROFILE_IMAGE_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiByeD0iNTAiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIzMCIgeT0iMjAiPgo8cGF0aCBkPSJNMjAgMjFWMTlBNCA0IDAgMCAwIDE2IDE1SDhBNCA0IDAgMCAwIDQgMTlWMjEiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSI3IiByPSI0IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo8L3N2Zz4K';

export const profileImageService = {
  /**
   * Get the appropriate profile image URL for a user
   * Returns default image if no avatar_url is provided
   */
  getProfileImageUrl(avatarUrl: string | null | undefined): string {
    if (avatarUrl && avatarUrl.trim() !== '') {
      return avatarUrl;
    }
    return DEFAULT_PROFILE_IMAGE_URL;
  },

  /**
   * Get profile image URL from a user profile object
   * Handles both direct avatar_url field and nested user objects
   */
  getProfileImageFromUser(user: any): string {
    const avatarUrl = user?.avatar_url || user?.user?.avatar_url || user?.profiles?.avatar_url;
    return this.getProfileImageUrl(avatarUrl);
  },

  /**
   * Upload profile image to Supabase storage
   * Returns the public URL of the uploaded image
   */
  async uploadProfileImage(
    userId: string, 
    imageUri: string, 
    fileName?: string
  ): Promise<{ url: string | null; error: Error | null }> {
    try {
      // Generate filename if not provided
      const finalFileName = fileName || `${userId}-${Date.now()}.jpg`;
      
      // Convert image URI to blob for upload
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(finalFileName, blob, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Error uploading profile image:', error);
        return { url: null, error };
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      return { url: publicUrlData.publicUrl, error: null };
    } catch (error) {
      console.error('Exception uploading profile image:', error);
      return { url: null, error: error as Error };
    }
  },

  /**
   * Update user's avatar_url in the profiles table
   */
  async updateUserAvatarUrl(userId: string, avatarUrl: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
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
   * Remove user's profile image (set back to default)
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
   * Check if a URL is the default profile image
   */
  isDefaultProfileImage(avatarUrl: string | null | undefined): boolean {
    return !avatarUrl || avatarUrl.trim() === '' || avatarUrl === DEFAULT_PROFILE_IMAGE_URL;
  },

  /**
   * Get the default profile image URL (for reference)
   */
  getDefaultImageUrl(): string {
    return DEFAULT_PROFILE_IMAGE_URL;
  }
};