import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { BlurView } from 'expo-blur';
import { ArrowRightIcon, BookOpenIcon } from 'react-native-heroicons/outline';
import { format } from 'date-fns';

interface RecentItem {
    id: string; // session_id
    content_id: number;
    content_type: string;
    session_end_time: string;
    max_scroll_depth: number;
    slides_viewed: number;
    total_slides: number;
    // We would need to join with content tables to get title/image, 
    // but for MVP let's store/fetch it or just use specific RPC.
    // simpler: Let's create an RPC to get this rich data easily.
    title?: string;
    subtitle?: string; // Author/Site
}

// Temporary: Since joining across dynamic content types + partitions is complex in client SQL, 
// we will assume a helper function `get_recent_sessions_rich` exists or we fetch the latest raw sessions 
// and then fetch details. For MVP, let's fetch raw and fetch details on mount.

export const RecentReadsList = () => {
    const { colors, theme } = useTheme();
    const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

    useEffect(() => {
        fetchRecentSessions();
    }, []);

    const fetchRecentSessions = async () => {
        // Fetch last 5 sessions
        const { data, error } = await supabase
            .from('learning_sessions_partitioned')
            .select('*')
            .order('session_end_time', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Error fetching recent sessions:', error);
            return;
        }

        // Hydrate with content details (basic mock or separate fetch for now to keep it moving)
        // In V2 strict, we should have a view. For now, we will just display what we have.
        // Or better: Let's just fetch the Article title if it's an article.

        const hydratedData = await Promise.all((data || []).map(async (session) => {
            let title = `Content #${session.content_id}`;
            let subtitle = session.content_type;

            if (session.content_type === 'article') {
                const { data: article } = await supabase.from('articles').select('title, site_name').eq('id', session.content_id).single();
                if (article) {
                    title = article.title;
                    subtitle = article.site_name || 'Article';
                }
            } else if (session.content_type === 'video') {
                const { data: video } = await supabase.from('videos').select('title, site_name').eq('id', session.content_id).single();
                if (video) {
                    title = video.title;
                    subtitle = video.site_name || 'Video';
                }
            }

            return {
                ...session,
                title,
                subtitle
            };
        }));

        setRecentItems(hydratedData);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.heading, { color: colors.text }]}>Recent Knowledge</Text>
                <Pressable>
                    <Text style={{ color: colors.primary, fontSize: 14 }}>View All</Text>
                </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
                {recentItems.map((item, index) => (
                    <BlurView
                        key={item.id || index}
                        intensity={20}
                        tint={theme === 'dark' ? 'dark' : 'light'}
                        style={[styles.card, { borderColor: colors.border }]}
                    >
                        {/* Simplified Content: Title, Source, Action */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                                {item.title}
                            </Text>
                            <Text style={[styles.subtitle, { color: colors.text + '60' }]} numberOfLines={1}>
                                {item.subtitle}
                            </Text>
                        </View>

                        <Pressable style={[styles.consolidateButton, { backgroundColor: colors.card }]}>
                            <Text style={[styles.buttonText, { color: colors.primary }]}>Consolidate</Text>
                            <ArrowRightIcon size={12} color={colors.primary} />
                        </Pressable>
                    </BlurView>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    heading: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Montserrat_700Bold',
    },
    list: {
        paddingHorizontal: 20,
        gap: 12,
    },
    card: {
        width: 200,
        padding: 16,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconBadge: {
        padding: 6,
        borderRadius: 8,
    },
    date: {
        fontSize: 10,
        fontWeight: '600',
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
        height: 40, // Fixed height for 2 lines
    },
    subtitle: {
        fontSize: 12,
        marginBottom: 12,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 10,
        fontWeight: '600',
    },
    consolidateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    buttonText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
});
