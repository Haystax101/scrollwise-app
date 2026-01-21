import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export const ViewTracking = {
    async loadViewedContent(userId: string): Promise<Set<string>> {
        try {
            const viewedKey = `viewed_content_${userId}`;
            const viewedData = await AsyncStorage.getItem(viewedKey);
            if (viewedData) {
                return new Set(JSON.parse(viewedData));
            }
        } catch (error) {
            console.error('Error loading viewed content:', error);
        }
        return new Set();
    },

    async markAsViewed(userId: string, contentId: string | number, contentType: string, currentViewed: Set<string>): Promise<Set<string>> {
        const viewKey = `${contentType}-${contentId}`;

        if (currentViewed.has(viewKey)) return currentViewed;

        const newViewed = new Set(currentViewed);
        newViewed.add(viewKey);

        // Persist local
        try {
            const viewedKey = `viewed_content_${userId}`;
            await AsyncStorage.setItem(viewedKey, JSON.stringify(Array.from(newViewed)));
        } catch (error) {
            console.error('Error saving viewed content:', error);
        }

        // Persist remote
        try {
            await supabase.rpc('record_content_view', {
                p_user_id: userId,
                p_content_type: contentType,
                p_content_id: contentId,
                p_view_duration: 3
            });
        } catch (error) {
            console.error('Error recording view in database:', error);
        }

        return newViewed;
    }
};
