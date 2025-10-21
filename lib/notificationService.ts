import { supabase } from './supabase';

export interface NotificationData {
  user_id: string;
  type: 'like' | 'comment' | 'friend_request';
  source_user_id: string;
  content_type?: 'insight' | 'article' | 'paper' | 'book';
  content_id?: string;
  message: string;
}

export interface Notification extends NotificationData {
  id: string;
  is_read: boolean;
  created_at: string;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(data: NotificationData): Promise<Notification> {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    return notification;
  }

  /**
   * Get notifications for a user
   */
  static async getNotifications(userId: string, limit = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        source_user:profiles!notifications_source_user_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Subscribe to real-time notification changes for a user
   * Returns a cleanup function to unsubscribe
   */
  static subscribeToNotifications(
    userId: string,
    callback: (unreadCount: number) => void
  ): () => void {
    // Initial fetch
    this.getUnreadCount(userId)
      .then(callback)
      .catch(error => console.error('Error fetching initial unread count:', error));

    // Set up real-time subscription
    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          try {
            const count = await this.getUnreadCount(userId);
            callback(count);
          } catch (error) {
            console.error('Error updating unread count:', error);
          }
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Helper methods to create specific notification types
   */
  static async createLikeNotification(
    userId: string,
    sourceUserId: string,
    contentType: 'insight' | 'article' | 'paper' | 'book',
    contentId: string,
    sourceUserName: string
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'like',
      source_user_id: sourceUserId,
      content_type: contentType,
      content_id: contentId,
      message: `liked your ${contentType}`,
    });
  }

  static async createCommentNotification(
    userId: string,
    sourceUserId: string,
    contentType: 'insight' | 'article' | 'paper' | 'book',
    contentId: string,
    sourceUserName: string
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'comment',
      source_user_id: sourceUserId,
      content_type: contentType,
      content_id: contentId,
      message: `commented on your ${contentType}`,
    });
  }

  static async createFriendRequestNotification(
    userId: string,
    sourceUserId: string,
    sourceUserName: string
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'friend_request',
      source_user_id: sourceUserId,
      message: `sent you a friend request`,
    });
  }
}