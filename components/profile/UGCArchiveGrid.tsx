import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SIZE = width / COLUMN_COUNT;

interface UGCArchiveGridProps {
    userId: string;
}

type TabType = 'insights' | 'timelapses' | 'saved';

export const UGCArchiveGrid: React.FC<UGCArchiveGridProps> = ({ userId }) => {
    const { colors } = useTheme();
    const [activeTab, setActiveTab] = useState<TabType>('insights');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchContent();
    }, [activeTab, userId]);

    const fetchContent = async () => {
        if (!userId) return;
        setLoading(true);
        setItems([]);

        try {
            let data: any[] = [];
            let error: any = null;

            if (activeTab === 'insights') {
                const result = await supabase
                    .from('insights')
                    .select('*')
                    .eq('author_id', userId)
                    .order('created_at', { ascending: false });
                data = result.data || [];
                error = result.error;
            } else if (activeTab === 'timelapses') {
                const result = await supabase
                    .from('timelapse_sessions')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });
                data = result.data || [];
                error = result.error;
            }

            if (error) {
                console.error('Error fetching grid content:', error);
            } else {
                setItems(data);
            }
        } catch (e) {
            console.error('Exception fetching grid content', e);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        // Determine image source or placeholder
        // For Insights: 'image_url' or text fallback
        // For Timelapses: 'storage_path' implies we might need to construct a URL or show a placeholder

        let imageUrl = null;
        let isVideo = false;

        if (activeTab === 'insights') {
            // Assuming insights have image_url or we use a text placeholder
            imageUrl = item.image_url;
        } else if (activeTab === 'timelapses') {
            // Timelapses usually don't have a thumbnail URL stored directly yet (ref: schema).
            // We'll use a generic placeholder or try to derive one if possible.
            // For MVP, sticking to a nice icon placeholder if no explicit thumb.
            isVideo = true;
        }

        return (
            <TouchableOpacity style={[styles.gridItem, { borderColor: colors.background }]}>
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={[styles.placeholder, { backgroundColor: colors.card }]}>
                        <Feather
                            name={isVideo ? "video" : "file-text"}
                            size={24}
                            color={colors.textSecondary}
                        />
                    </View>
                )}
                {/* Overlay for Stats */}
                {activeTab === 'timelapses' && (
                    <View style={styles.statOverlay}>
                        <Text style={styles.statText}>{Math.floor((item.duration_seconds || 0) / 60)}m</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Tabs */}
            <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'insights' && styles.activeTab]}
                    onPress={() => setActiveTab('insights')}
                >
                    <Feather name="grid" size={20} color={activeTab === 'insights' ? colors.text : colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'timelapses' && styles.activeTab]}
                    onPress={() => setActiveTab('timelapses')}
                >
                    <Feather name="clock" size={20} color={activeTab === 'timelapses' ? colors.text : colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
                    onPress={() => setActiveTab('saved')} // Placeholder functionality
                >
                    <Feather name="bookmark" size={20} color={activeTab === 'saved' ? colors.text : colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Grid */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <Text style={{ color: colors.textSecondary }}>Loading...</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    numColumns={COLUMN_COUNT}
                    scrollEnabled={false} // Nesting in parent ScrollView
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={{ color: colors.textSecondary }}>No content yet.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        minHeight: 300,
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        marginBottom: 1,
    },
    tab: {
        paddingVertical: 16,
        flex: 1,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#EAB308', // Gold/Yellow
    },
    gridItem: {
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        borderWidth: 1,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    statOverlay: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 4,
        borderRadius: 4,
    },
    statText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    }

});
