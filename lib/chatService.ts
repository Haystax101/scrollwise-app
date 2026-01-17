import { supabase } from './supabase';

export interface ChatPreview {
    chat_id: string;
    updated_at: string;
    last_message_content: string | null;
    last_message_at: string | null;
    unread_count: number;
    partner_id: string | null;
    partner_name: string | null;
    partner_avatar: string | null;
    is_group: boolean;
    group_name: string | null;
}

export interface DirectMessage {
    id: string;
    chat_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    is_system_message: boolean;
    media_url?: string;
    author_name?: string;
    author_avatar?: string;
}

export const chatService = {
    /**
     * Fetches the user's inbox (list of chats).
     */
    getMyChats: async (): Promise<ChatPreview[]> => {
        const { data, error } = await supabase.rpc('get_my_chats');
        if (error) {
            console.error('Error fetching chats:', error);
            throw error;
        }
        return data || [];
    },

    /**
     * Gets an existing 1-on-1 chat or creates a new one.
     */
    getOrCreateDirectChat: async (partnerId: string): Promise<string> => {
        const { data, error } = await supabase.rpc('get_or_create_direct_chat', {
            partner_id: partnerId
        });
        if (error) {
            console.error('Error creating chat:', error);
            throw error;
        }
        return data; // Returns the UUID of the chat
    },

    /**
     * Sends a message to a chat.
     */
    sendMessage: async (chatId: string, content: string): Promise<string> => {
        const { data, error } = await supabase.rpc('send_direct_message', {
            p_chat_id: chatId,
            p_content: content
        });
        if (error) {
            console.error('Error sending message:', error);
            throw error;
        }
        return data; // Returns the new message ID
    },

    /**
     * Fetches messages for a specific chat.
     */
    getMessages: async (chatId: string): Promise<DirectMessage[]> => {
        const { data, error } = await supabase
            .from('chat_messages')
            .select(`
                *,
                sender:sender_id (
                    full_name,
                    avatar_url
                )
            `)
            .eq('chat_id', chatId)
            .order('created_at', { ascending: false }); // Bottom-up (newest first)

        if (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }

        // Map to flat structure if needed, or keep as is.
        // Let's return as is but typed
        return data.map((msg: any) => ({
            ...msg,
            author_name: msg.sender?.full_name,
            author_avatar: msg.sender?.avatar_url
        }));
    },

    /**
     * Marks a chat as read.
     */
    markAsRead: async (chatId: string): Promise<void> => {
        const { error } = await supabase.rpc('mark_chat_read', {
            p_chat_id: chatId
        });
        if (error) console.error('Error marking read:', error);
    },

    /**
     * Subscribes to new messages in a chat.
     */
    subscribeToChat: (chatId: string, callback: (payload: any) => void) => {
        return supabase
            .channel(`chat:${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `chat_id=eq.${chatId}`
                },
                callback
            )
            .subscribe();
    }
};
