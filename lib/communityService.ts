import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

export interface FeedItem {
    id: string;
    type: 'post' | 'message';
    content: string;
    title?: string;
    media_urls?: string[];
    user_id: string;
    created_at: string;
    author_name: string;
    author_avatar: string;
    community_id?: string;
    community_name?: string;
    community_avatar?: string;
}

export const communityService = {
    // Fetch General Feed (FYP)
    async getGeneralFeed(limit = 50, offset = 0, userId?: string): Promise<FeedItem[]> {
        const { data, error } = await supabase.rpc('get_general_community_feed', {
            limit_count: limit,
            offset_count: offset
        });

        if (error) {
            console.error('Error fetching general feed:', error);
            return [];
        }

        let feedParams = data || [];

        // Client-side filter for now since RPC modification requires migration
        if (userId) {
            feedParams = feedParams.filter((item: FeedItem) => item.user_id !== userId);
        }

        return feedParams;
    },

    // Fetch unified feed (Posts + Messages)
    async getCommunityFeed(communityId: string, limit = 50, offset = 0): Promise<FeedItem[]> {
        const { data, error } = await supabase.rpc('get_community_feed', {
            target_community_id: communityId,
            limit_count: limit,
            offset_count: offset
        });

        if (error) {
            console.error('Error fetching community feed:', error);
            return [];
        }

        return data || [];
    },

    // Send a simple text message
    async sendMessage(communityId: string, content: string, userId: string): Promise<boolean> {
        const { error } = await supabase
            .from('community_messages')
            .insert({
                community_id: communityId,
                user_id: userId,
                content: content
            });

        if (error) {
            console.error('Error sending message:', error);
            return false;
        }
        return true;
    },

    // Create a rich post
    async createPost(communityId: string, userId: string, content: string, title?: string, mediaUrls?: string[]): Promise<boolean> {
        const { error } = await supabase
            .from('community_posts')
            .insert({
                community_id: communityId,
                user_id: userId,
                content: content,
                title: title,
                media_urls: mediaUrls
            });

        if (error) {
            console.error('Error creating post:', error);
            return false;
        }
        return true;
    },

    // Get list of communities (for selection) - Placeholder
    async getMyCommunities(userId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('communities')
            .select('*')
            //.eq('privacy_level', 'public') // Simplified for now
            .limit(10);

        if (error) {
            console.error('Error fetching communities:', error);
            return [];
        }
        return data || [];
    },

    // Upload Update
    async uploadCommunityImage(uri: string): Promise<string | null> {
        try {
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            const fileName = `post-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            const filePath = `${fileName}`;

            const { data, error } = await supabase.storage
                .from('community-media')
                .upload(filePath, decode(base64), {
                    contentType: 'image/jpeg',
                });

            if (error) {
                console.error('Error uploading image:', error);
                return null;
            }

            // Get Public URL
            const { data: publicUrlData } = supabase.storage
                .from('community-media')
                .getPublicUrl(filePath);

            return publicUrlData.publicUrl;
        } catch (e) {
            console.error('Error in uploadCommunityImage:', e);
            return null;
        }
    },

    // Fetch Insights for Community Feed
    async getInsights(limit = 20, userId: string): Promise<FeedItem[]> {
        const { data, error } = await supabase
            .from('insights')
            .select(`
                *,
                profiles:author_id (
                  full_name,
                  avatar_url,
                  tagline
                )
            `)
            .neq('author_id', userId) // Filter own insights
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching insights:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            id: String(item.id),
            type: 'insight' as const,
            content: item.content || '',
            title: item.title,
            user_id: item.author_id,
            created_at: item.created_at,
            // Construct nested author object for InsightCard
            author: {
                name: item.profiles?.full_name || 'User',
                avatar: item.profiles?.avatar_url || '',
                handle: '',
                role: item.profiles?.tagline || '', // Use tagline as role fallback
                company: '',
                industry: '',
                location: '',
                currentProject: '',
                projectTags: []
            },
            // Keep flat fields if needed for other components, but author object is primary for InsightCard
            author_name: item.profiles?.full_name || 'User',
            author_avatar: item.profiles?.avatar_url || '',

            image_url: item.image_url, // For InsightCard
            media_urls: item.image_url ? [item.image_url] : [],
            likes_count: item.likes_count,
            comments_count: item.comments_count,
            saves_count: item.saves_count,
            views_count: item.views_count
        } as any));
    }
};
