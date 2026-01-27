import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export const ViewTracking = {
    // Return Map of ContentKey -> ViewCount
    async loadViewCounts(userId: string): Promise<Map<string, number>> {
        try {
            const countsKey = `view_counts_${userId}`;
            const countsData = await AsyncStorage.getItem(countsKey);

            if (countsData) {
                // parsed: { "insight-123": 5, ... }
                const parsed = JSON.parse(countsData);
                return new Map(Object.entries(parsed));
            }

            // Legacy Migration: Check strict viewed set? 
            // If strict set exists, maybe initialize counts to 1? 
            // For now, let's just start fresh or treat existing "viewed" as count 1 if needed.
            const oldKey = `viewed_content_${userId}`; // Using old key to seed?
            const oldData = await AsyncStorage.getItem(oldKey);
            if (oldData) {
                const oldSet = JSON.parse(oldData);
                const map = new Map<string, number>();
                if (Array.isArray(oldSet)) {
                    oldSet.forEach(k => map.set(k, 1));
                }
                return map;
            }

        } catch (error) {
            console.error('Error loading view counts:', error);
        }
        return new Map();
    },

    async markAsViewed(userId: string, contentId: string | number, contentType: string, currentCounts: Map<string, number>): Promise<Map<string, number>> {
        const viewKey = `${contentType}-${contentId}`;
        const currentCount = currentCounts.get(viewKey) || 0;

        // Update Count
        const newCounts = new Map(currentCounts);
        newCounts.set(viewKey, currentCount + 1);

        // Persist local
        try {
            const countsKey = `view_counts_${userId}`;
            const obj = Object.fromEntries(newCounts);
            await AsyncStorage.setItem(countsKey, JSON.stringify(obj));
        } catch (error) {
            console.error('Error saving view counts:', error);
        }

        // Persist remote (Fire and forget, only if needed for analytics)
        // We'll keep the existing RPC call if it tracks "views" generally
        // Persist remote (Unique View Logic)
        try {
            await supabase.rpc('record_unique_view', {
                p_user_id: userId,
                p_content_type: contentType,
                p_content_id: String(contentId) // Ensure string for text column
            });
        } catch (error) {
            console.error('Error recording view in database:', error);
        }

        return newCounts;
    }
};
