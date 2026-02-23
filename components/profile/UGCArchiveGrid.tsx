import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Dimensions, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { UGCOptionsModal } from './UGCOptionsModal';
import { UGCDetailModal } from './UGCDetailModal';
import { UGCEditModal } from './UGCEditModal';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SIZE = width / COLUMN_COUNT;

interface UGCArchiveGridProps {
    userId: string;
}

type TabType = 'insights' | 'timelapses' | 'saved';

// Extracted Component for Timelapse Items to handle thumbnail fetching
const TimelapseGridItem = ({ item, userId, onPress, onLongPress }: { item: any, userId: string, onPress: () => void, onLongPress?: () => void }) => {
    const { colors } = useTheme();
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchThumbnail = async () => {
            // Try to find the first image in the storage
            // Path structure: user_id/session_id/filename.jpg
            try {
                const pathPrefix = `${userId}/${item.id}`;
                const { data, error } = await supabase.storage
                    .from('timelapse-images')
                    .list(pathPrefix, {
                        limit: 1,
                        sortBy: { column: 'name', order: 'asc' }
                    });

                if (data && data.length > 0) {
                    const firstFile = data[0];
                    const { data: urlData } = supabase.storage
                        .from('timelapse-images')
                        .getPublicUrl(`${pathPrefix}/${firstFile.name}`);
                    setThumbnailUrl(urlData.publicUrl);
                }
            } catch (e) {
                console.log('Error fetching timelapse thumbnail', e);
            }
        };

        if (item.id) {
            fetchThumbnail();
        }
    }, [item.id, userId]);

    return (
        <TouchableOpacity
            style={[styles.gridItem, { borderColor: colors.background }]}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
        >
            {thumbnailUrl ? (
                <Image source={{ uri: thumbnailUrl }} style={styles.image} resizeMode="cover" />
            ) : (
                <View style={[styles.placeholder, { backgroundColor: colors.card }]}>
                    <Feather name="video" size={24} color={colors.textSecondary} />
                </View>
            )}
            <View style={styles.statOverlay}>
                <Feather name="play" size={10} color="white" style={{ marginRight: 2 }} />
                <Text style={styles.statText}>{Math.floor((item.duration_seconds || 0) / 60)}m</Text>
            </View>
        </TouchableOpacity>
    );
};

export const UGCArchiveGrid: React.FC<UGCArchiveGridProps> = ({ userId }) => {
    const { colors } = useTheme();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('insights');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);



    // Options Modal State
    const [selectedOptionItem, setSelectedOptionItem] = useState<any>(null);
    const [isOptionModalVisible, setIsOptionModalVisible] = useState(false);

    // Detail Modal State
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

    // Edit Modal State
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);

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
            } else if (activeTab === 'saved') {
                // Fetch saved items
                const [articlesRes, papersRes, booksRes, insightsRes, videosRes] = await Promise.all([
                    supabase.from('article_saves').select('created_at, articles (id, title, image_url)').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
                    supabase.from('paper_saves').select('created_at, papers (id, title, image_url)').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
                    supabase.from('book_saves').select('created_at, books (id, title)').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
                    supabase.from('insight_saves').select('created_at, insights (id, content, image_url)').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
                    supabase.from('content_saves').select('created_at, content_id, content_type').eq('user_id', userId).eq('content_type', 'video').order('created_at', { ascending: false }).limit(20)
                ]);

                const savedItems: any[] = [];
                // Process results...
                if (articlesRes.data) articlesRes.data.forEach((s: any) => s.articles && savedItems.push({ ...s.articles, type: 'article', saved_at: s.created_at }));
                if (papersRes.data) papersRes.data.forEach((s: any) => s.papers && savedItems.push({ ...s.papers, type: 'paper', saved_at: s.created_at }));
                if (booksRes.data) booksRes.data.forEach((s: any) => s.books && savedItems.push({ ...s.books, type: 'book', saved_at: s.created_at }));
                if (insightsRes.data) insightsRes.data.forEach((s: any) => s.insights && savedItems.push({ ...s.insights, type: 'insight', saved_at: s.created_at }));

                // Videos needing extra fetch
                if (videosRes.data && videosRes.data.length > 0) {
                    const videoIds = videosRes.data.map((v: any) => v.content_id);
                    const { data: videos } = await supabase.from('videos').select('id, title, image_url').in('id', videoIds);
                    videos?.forEach(v => savedItems.push({ ...v, type: 'video', saved_at: new Date().toISOString() }));
                }

                savedItems.sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime());
                data = savedItems;
            } else if (activeTab === 'saved') {
                // Fetch saved items
                const [articlesRes, papersRes, booksRes, insightsRes, videosRes] = await Promise.all([
                    supabase.from('article_saves').select('created_at, articles (id, title, image_url)').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
                    supabase.from('paper_saves').select('created_at, papers (id, title, image_url)').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
                    supabase.from('book_saves').select('created_at, books (id, title)').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
                    supabase.from('insight_saves').select('created_at, insights (id, content, image_url)').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
                    supabase.from('content_saves').select('created_at, content_id, content_type').eq('user_id', userId).eq('content_type', 'video').order('created_at', { ascending: false }).limit(20)
                ]);

                const savedItems: any[] = [];
                // Process results...
                if (articlesRes.data) articlesRes.data.forEach((s: any) => s.articles && savedItems.push({ ...s.articles, type: 'article', saved_at: s.created_at }));
                if (papersRes.data) papersRes.data.forEach((s: any) => s.papers && savedItems.push({ ...s.papers, type: 'paper', saved_at: s.created_at }));
                if (booksRes.data) booksRes.data.forEach((s: any) => s.books && savedItems.push({ ...s.books, type: 'book', saved_at: s.created_at }));
                if (insightsRes.data) insightsRes.data.forEach((s: any) => s.insights && savedItems.push({ ...s.insights, type: 'insight', saved_at: s.created_at }));

                // Videos needing extra fetch
                if (videosRes.data && videosRes.data.length > 0) {
                    const videoIds = videosRes.data.map((v: any) => v.content_id);
                    const { data: videos } = await supabase.from('videos').select('id, title, image_url').in('id', videoIds);
                    videos?.forEach(v => savedItems.push({ ...v, type: 'video', saved_at: new Date().toISOString() }));
                }

                savedItems.sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime());
                data = savedItems;
            }

            if (error) {
                console.error('Error fetching grid content:', error);
            } else {
                if (activeTab === 'insights') {
                    // Debug log for user issue
                    console.log('🔍 Fetched insights:', data.map(i => ({ id: i.id, has_image: !!i.image_url, url_len: i.image_url?.length })));
                }
                setItems(data);
            }
        } catch (e) {
            console.error('Exception fetching grid content', e);
        } finally {
            setLoading(false);
        }
    };

    const handleItemPress = (item: any) => {
        // Unify behavior: Always open options first
        openOptions(item);
    };

    const handleItemLongPress = (item: any) => {
        openOptions(item);
    };

    const openOptions = (item: any) => {
        setSelectedOptionItem(item);
        setIsOptionModalVisible(true);
    };



    const handleOptionView = () => {
        setIsOptionModalVisible(false);

        // Close the profile modal first
        if (router.canDismiss()) {
            router.dismiss();
        }

        // Use a slight delay to allow modal to close before pushing new screen
        setTimeout(() => {
            if (activeTab === 'timelapses' || activeTab === 'insights') {
                const type = activeTab === 'timelapses' ? 'timelapse' : 'insight';
                router.push({
                    pathname: '/(tabs)/',
                    params: {
                        contentType: type,
                        contentId: selectedOptionItem.id,
                        animationDirection: 'left',
                        showBackButton: 'true',
                        backTo: 'profile'
                    }
                });
            } else if (activeTab === 'saved') {
                router.push({
                    pathname: '/(tabs)/',
                    params: {
                        contentType: selectedOptionItem.type,
                        contentId: selectedOptionItem.id,
                        animationDirection: 'left',
                        showBackButton: 'true',
                        backTo: 'profile'
                    }
                });
            }
        }, 100);
    };

    const handleOptionEdit = () => {
        setIsOptionModalVisible(false);
        setIsEditModalVisible(true);
    };

    const handleEditSave = () => {
        fetchContent(); // Refresh grid
    };

    const handleOptionDelete = async () => {
        setIsOptionModalVisible(false);
        if (!selectedOptionItem) return;

        Alert.alert(
            "Delete Item",
            "Are you sure you want to delete this item? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            // Determine table based on activeTab
                            const table = activeTab === 'timelapses' ? 'timelapse_sessions' : 'insights';

                            // Cleanup Storage Files
                            if (activeTab === 'insights' && selectedOptionItem.image_url) {
                                try {
                                    // Extract filename from URL (assuming it's the last part)
                                    const filename = selectedOptionItem.image_url.split('/').pop();
                                    if (filename) {
                                        console.log('🗑️ Deleting insight image:', filename);
                                        await supabase.storage
                                            .from('content-images')
                                            .remove([filename]);
                                    }
                                } catch (err) {
                                    console.log('⚠️ Failed to clean up insight image:', err);
                                    // Continue with DB delete even if file cleanup fails
                                }
                            } else if (activeTab === 'timelapses') {
                                try {
                                    // 1. Delete Video File
                                    // Use video_url which is the actual file path in 'timelapses' bucket
                                    if (selectedOptionItem.video_url) {
                                        console.log('🗑️ Deleting timelapse video:', selectedOptionItem.video_url);
                                        await supabase.storage
                                            .from('timelapses')
                                            .remove([selectedOptionItem.video_url]);
                                    }

                                    // 2. Delete Thumbnails
                                    // Thumbnails are stored in 'timelapse-images' bucket under folder: userId/itemId/
                                    const pathPrefix = `${userId}/${selectedOptionItem.id}`;
                                    const { data: files } = await supabase.storage
                                        .from('timelapse-images')
                                        .list(pathPrefix);

                                    if (files && files.length > 0) {
                                        const filePaths = files.map(f => `${pathPrefix}/${f.name}`);
                                        console.log('🗑️ Deleting timelapse thumbnails:', filePaths);
                                        await supabase.storage
                                            .from('timelapse-images')
                                            .remove(filePaths);
                                    }
                                } catch (err) {
                                    console.log('⚠️ Failed to clean up timelapse files:', err);
                                    // Continue with DB delete
                                }
                            }

                            console.log('🗑️ Attempting to delete item from DB:', { table, id: selectedOptionItem.id });
                            const { error } = await supabase
                                .from(table)
                                .delete()
                                .eq('id', selectedOptionItem.id);

                            if (error) {
                                console.log('❌ Delete Error:', error);
                                throw error;
                            } else {
                                console.log('✅ Delete Successful');
                            }

                            // Refresh content
                            fetchContent();
                        } catch (e) {
                            console.error("Error deleting item:", e);
                            Alert.alert("Error", "Failed to delete item.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => {
        // TIMELAPSES
        if (activeTab === 'timelapses') {
            return (
                <TimelapseGridItem
                    item={item}
                    userId={userId}
                    onPress={() => handleItemPress(item)}
                    onLongPress={() => handleItemLongPress(item)}
                />
            );
        }

        // TEXT-ONLY INSIGHT PREVIEW
        if (activeTab === 'insights' && !item.image_url) {
            const previewText = item.content
                ? (item.content.length > 50 ? item.content.substring(0, 50) + '...' : item.content)
                : 'No content';

            return (
                <TouchableOpacity
                    style={[styles.gridItem, { borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }]}
                    onPress={() => handleItemPress(item)}
                    onLongPress={() => handleItemLongPress(item)}
                    activeOpacity={0.7}
                >
                    <BlurView
                        intensity={20}
                        tint="systemMaterialDark"
                        style={styles.textPreviewItem}
                    >
                        <Text
                            style={[styles.textPreviewContent, { color: colors.textSecondary }]}
                            numberOfLines={3}
                        >
                            {previewText}
                        </Text>
                        <View style={styles.textIconOverlay}>
                            <Feather name="align-left" size={12} color={colors.primary} />
                        </View>
                    </BlurView>
                </TouchableOpacity>
            );
        }

        // SAVED ITEMS
        if (activeTab === 'saved') {
            return (
                <TouchableOpacity
                    style={[styles.gridItem, { borderColor: colors.background, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', padding: 8 }]}
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.7}
                >
                    {item.image_url ? (
                        <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
                    ) : (
                        <View style={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <Feather
                                name={item.type === 'book' ? 'book' : item.type === 'article' ? 'file-text' : item.type === 'video' ? 'video' : 'bookmark'}
                                size={24}
                                color={colors.textSecondary}
                            />
                            <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 4, textAlign: 'center' }} numberOfLines={3}>
                                {item.title || item.content || 'Untitled'}
                            </Text>
                        </View>
                    )}
                    {item.image_url && (
                        <View style={styles.statOverlay}>
                            {item.type === 'book' && <Feather name="book" size={10} color="white" />}
                            {item.type === 'article' && <Feather name="file-text" size={10} color="white" />}
                            {item.type === 'video' && <Feather name="video" size={10} color="white" />}
                        </View>
                    )}
                </TouchableOpacity>
            );
        }



        // IMAGE INSIGHT
        return (
            <TouchableOpacity
                style={[styles.gridItem, { borderColor: colors.background }]}
                onPress={() => handleItemPress(item)}
                onLongPress={() => handleItemLongPress(item)}
                activeOpacity={0.7}
            >
                <Image
                    source={{ uri: item.image_url }}
                    style={styles.image}
                    resizeMode="cover"
                    onError={(e) => console.log(`❌ Grid Image Load Error [${item.id}]:`, e.nativeEvent.error, item.image_url)}
                    onLoad={() => console.log(`✅ Grid Image Loaded [${item.id}]`)}
                />
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
                    onPress={() => setActiveTab('saved')}
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
                    scrollEnabled={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={{ color: colors.textSecondary }}>No content yet.</Text>
                        </View>
                    }
                />
            )}



            {/* Options Modal */}
            <UGCOptionsModal
                visible={isOptionModalVisible}
                onClose={() => setIsOptionModalVisible(false)}
                onView={handleOptionView}
                onEdit={activeTab === 'insights' ? handleOptionEdit : undefined}
                onDelete={handleOptionDelete}
                itemType={activeTab === 'timelapses' ? 'timelapse' : 'image'}
            />

            {/* Detail Modal */}
            <UGCDetailModal
                visible={isDetailModalVisible}
                onClose={() => setIsDetailModalVisible(false)}
                item={selectedOptionItem}
            />

            {/* Edit Modal */}
            <UGCEditModal
                visible={isEditModalVisible}
                onClose={() => setIsEditModalVisible(false)}
                onSave={handleEditSave}
                item={selectedOptionItem}
            />
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
        borderBottomColor: '#EAB308',
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
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center'
    },
    statText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    textPreviewItem: {
        flex: 1,
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textPreviewContent: {
        fontSize: 10,
        textAlign: 'center',
        lineHeight: 14,
    },
    textIconOverlay: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        opacity: 0.7
    }
});
