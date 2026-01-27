import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

export interface FeedItem {
    id: string;
    type: 'post' | 'message' | 'timelapse' | 'insight';
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

    // Insight/Timelapse Specifics
    image_url?: string;
    video_url?: string;
    duration?: number;
    likes_count?: number;
    comments_count?: number;
    saves_count?: number;
    views_count?: number;
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
            // Include own content now for verifying ("View your own stuff once")
            // feedParams = feedParams.filter((item: FeedItem) => item.user_id !== userId);
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
            // .neq('author_id', userId) // Allow own insights for now
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
    },
    // Fetch Timelapses for Feed
    async getTimelapses(limit = 100, userId: string, offset = 0): Promise<FeedItem[]> {
        // 1. Fetch Timelapses (Increased limit to cast a wider net)
        const { data, error } = await supabase
            .from('timelapse_sessions')
            .select(`
                *,
                profiles:user_id (
                  full_name,
                  avatar_url,
                  tagline
                )
            `)
            .order('created_at', { ascending: false })
            .limit(limit)
        // .range(offset, offset + limit - 1); // Temporarily remove offset range to ensure we scan the top 100 always

        if (error) {
            console.error('Error fetching timelapses:', error);
            return [];
        }

        // 2. Fetch "Who I Follow" to identify Friends
        const { data: myFollowing } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', userId);

        const myFollowingIds = new Set(myFollowing?.map(f => f.following_id) || []);

        // 3. Filter & Sort
        const processed = data
            .filter((item: any) => {
                // Privacy Check
                if (item.user_id === userId) return true;
                if (item.privacy_level === 'private') return false;
                if (item.privacy_level === 'friends') {
                    return myFollowingIds.has(item.user_id);
                }
                return true; // Public
            })
            .map((item: any) => ({
                id: item.id,
                type: 'timelapse' as const,
                content: item.description || '',
                title: 'Focus Session',
                user_id: item.user_id,
                created_at: item.created_at,
                author: {
                    name: item.profiles?.full_name || 'User',
                    avatar: item.profiles?.avatar_url || '',
                    handle: '',
                    role: item.profiles?.tagline || ''
                },
                author_name: item.profiles?.full_name || 'User',
                author_avatar: item.profiles?.avatar_url || '',

                video_url: item.video_url,
                duration: item.duration_seconds || 0,
                likes_count: item.likes_count || 0,
                comments_count: item.comments_count || 0,
                saves_count: item.saves_count || 0,
                views_count: item.views_count || 0,

                // Helper for sorting
                isFriend: myFollowingIds.has(item.user_id)
            }))
            .sort((a, b) => {
                // Priority 1: Timelapses by Friends
                if (a.isFriend && !b.isFriend) return -1;
                if (!a.isFriend && b.isFriend) return 1;

                // Priority 2: Recency
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

        return processed;
    },

    // Toggle Like
    async toggleLike(itemId: string, itemType: 'timelapse' | 'insight', userId: string): Promise<boolean> {
        const table = itemType === 'timelapse' ? 'timelapse_likes' : 'insight_likes'; // Assuming insight_likes exists
        const idCol = itemType === 'timelapse' ? 'timelapse_id' : 'insight_id';

        // Check exists
        const { data } = await supabase
            .from(table)
            .select('id')
            .eq(idCol, itemId)
            .eq('user_id', userId)
            .single();

        if (data) {
            // Unlike
            await supabase.from(table).delete().eq('id', data.id);
            return false;
        } else {
            // Like
            await supabase.from(table).insert({ [idCol]: itemId, user_id: userId });
            return true;
        }
    },

    // Toggle Save
    async toggleSave(itemId: string, itemType: 'timelapse', userId: string): Promise<boolean> {
        const table = 'timelapse_saves';
        const { data } = await supabase
            .from(table)
            .select('id')
            .eq('timelapse_id', itemId)
            .eq('user_id', userId)
            .single();

        if (data) {
            await supabase.from(table).delete().eq('id', data.id);
            return false;
        } else {
            await supabase.from(table).insert({ timelapse_id: itemId, user_id: userId });
            return true;
        }
    },

    // Add Comment
    async addComment(itemId: string, itemType: 'timelapse', userId: string, content: string): Promise<boolean> {
        const table = 'timelapse_comments';
        const { error } = await supabase
            .from(table)
            .insert({
                timelapse_id: itemId,
                user_id: userId,
                content: content
            });
        return !error;
    },

    // Get Single Timelapse by ID
    async getTimelapseById(id: string): Promise<FeedItem | null> {
        const { data, error } = await supabase
            .from('timelapse_sessions')
            .select(`
                *,
                profiles:user_id (
                  full_name,
                  avatar_url,
                  tagline
                )
            `)
            .eq('id', id)
            .single();

        if (error || !data) return null;

        const item = data;
        return {
            id: item.id,
            type: 'timelapse' as const,
            content: item.description || '',
            title: 'Focus Session',
            user_id: item.user_id,
            created_at: item.created_at,
            author: {
                name: item.profiles?.full_name || 'User',
                avatar: item.profiles?.avatar_url || '',
                handle: '',
                role: item.profiles?.tagline || ''
            },
            author_name: item.profiles?.full_name || 'User',
            author_avatar: item.profiles?.avatar_url || '',
            video_url: item.video_url,
            duration: item.duration_seconds || 0,
            likes_count: item.likes_count || 0,
            comments_count: item.comments_count || 0,
            saves_count: item.saves_count || 0,
            views_count: item.views_count || 0,
        } as any;
    },

    // Get Single Insight by ID
    async getInsightById(id: string): Promise<FeedItem | null> {
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
            .eq('id', id)
            .single();

        if (error || !data) return null;

        const item = data;
        return {
            id: String(item.id),
            type: 'insight' as const,
            content: item.content || '',
            title: item.title,
            user_id: item.author_id,
            created_at: item.created_at,
            author: {
                name: item.profiles?.full_name || 'User',
                avatar: item.profiles?.avatar_url || '',
                handle: '',
                role: item.profiles?.tagline || '',
                company: '',
                industry: '',
                location: '',
                currentProject: '',
                projectTags: []
            },
            author_name: item.profiles?.full_name || 'User',
            author_avatar: item.profiles?.avatar_url || '',
            image_url: item.image_url,
            media_urls: item.image_url ? [item.image_url] : [],
            likes_count: item.likes_count,
            comments_count: item.comments_count,
            saves_count: item.saves_count,
            views_count: item.views_count
        } as any;
    }

};
