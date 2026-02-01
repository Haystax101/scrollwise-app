import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Image, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { FriendsService } from '../../lib/friendsService';
import { chatService } from '../../lib/chatService';
import { ShareService } from '../../lib/shareService';
import { profileImageService } from '../../services/profileImageService';
import type { SharedContent } from '../../lib/chatService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FriendsListItem } from '../../types/friends';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ShareSheetProps {
    visible: boolean;
    onClose: () => void;
    content: {
        id: string | number;
        type: 'article' | 'insight' | 'video' | 'paper' | 'book' | 'podcast' | 'timelapse';
        title?: string;
        summary?: string;
        url?: string;
        image_url?: string;
        author?: {
            name: string;
            avatar?: string;
        };
    };
}

export const ShareSheet: React.FC<ShareSheetProps> = ({ visible, onClose, content }) => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [view, setView] = useState<'menu' | 'search'>('menu');
    const [searchQuery, setSearchQuery] = useState('');
    const [friends, setFriends] = useState<FriendsListItem[]>([]);
    const [filteredFriends, setFilteredFriends] = useState<FriendsListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [sendingMap, setSendingMap] = useState<Record<string, boolean>>({});
    const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (visible) {
            setView('menu');
            setSearchQuery('');
            setSentMap({});
            loadFriends();
        }
    }, [visible]);

    const loadFriends = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await FriendsService.getFriends(user.id);
            setFriends(data);
            setFilteredFriends(data);
        } catch (error) {
            console.error("Failed to load friends", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter logic
    useEffect(() => {
        if (!friends.length) return;
        if (!searchQuery.trim()) {
            setFilteredFriends(friends);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredFriends(friends.filter(f =>
                f.friend.full_name.toLowerCase().includes(query)
            ));
        }
    }, [searchQuery, friends]);

    const handleSendToFriend = async (friendId: string, friendName: string) => {
        if (sendingMap[friendId]) return;

        setSendingMap(prev => ({ ...prev, [friendId]: true }));
        try {
            const chatId = await chatService.getOrCreateDirectChat(friendId);
            const deepLink = `supercharged://content/${content.type}/${content.id}`;
            const messageBody = `Shared ${content.type}: ${content.title || 'Content'}`;

            const sharedContent: SharedContent = {
                id: String(content.id),
                type: content.type as any,
                title: content.title || 'Shared Content',
                summary: content.summary,
                image: content.image_url, // map image_url to image
                url: content.url || deepLink,
                author: content.author
            };

            await chatService.sendMessage(chatId, messageBody, sharedContent);
            setSentMap(prev => ({ ...prev, [friendId]: true }));
        } catch (error) {
            console.error("Failed to share internally", error);
            Alert.alert("Error", `Could not send to ${friendName}.`);
        } finally {
            setSendingMap(prev => ({ ...prev, [friendId]: false }));
        }
    };

    const handleExternalShare = async () => {
        try {
            await ShareService.shareContent({
                type: content.type as any, // Cast to match generic if needed
                id: String(content.id),
                title: content.title || 'Shared Content',
                summary: content.summary
            });
            // Optional: Close sheet after external share? 
            // Usually native sheet opens on top, so we can keep this open or close it.
            // Let's close it to be clean.
            onClose();
        } catch (error) {
            console.error("External share failed", error);
        }
    };

    const renderFriendItem = ({ item }: { item: FriendsListItem }) => {
        const friendId = item.friend.id;
        const isSending = sendingMap[friendId];
        const isSent = sentMap[friendId];

        return (
            <TouchableOpacity
                style={[styles.friendItem, { borderBottomColor: colors.border }]}
                onPress={() => handleSendToFriend(friendId, item.friend.full_name)}
                disabled={isSending || isSent}
            >
                <Image
                    source={item.friend.avatar_url ? { uri: profileImageService.getProfileImageUrl(item.friend.avatar_url) } : require('../../assets/profileIconDefault.png')}
                    style={styles.avatar}
                />
                <View style={styles.friendInfo}>
                    <Text style={[styles.friendName, { color: colors.text }]}>{item.friend.full_name}</Text>
                    {item.friend.public_profile && (
                        <Text style={[styles.friendUsername, { color: colors.textSecondary }]}>
                            {/* Assuming username or fallback */}
                            Supercharged User
                        </Text>
                    )}
                </View>

                <View style={[
                    styles.actionButton,
                    isSent ? { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border } : { backgroundColor: colors.primary }
                ]}>
                    {isSending ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : isSent ? (
                        <Text style={[styles.actionButtonText, { color: colors.text }]}>Sent</Text>
                    ) : (
                        <Text style={[styles.actionButtonText, { color: 'white' }]}>Send</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.keyboardAvoid}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.container, { backgroundColor: colors.card, paddingBottom: insets.bottom }]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Header handle */}
                        <View style={styles.handleContainer}>
                            <View style={[styles.handle, { backgroundColor: colors.border }]} />
                        </View>

                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <Feather name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
                            <TextInput
                                style={[styles.searchInput, { backgroundColor: colors.background, color: colors.text }]}
                                placeholder="Search"
                                placeholderTextColor={colors.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        {/* Friend List */}
                        <View style={styles.listContainer}>
                            {/* Empty State / Loading */}
                            {loading ? (
                                <View style={styles.centerState}>
                                    <ActivityIndicator color={colors.primary} />
                                </View>
                            ) : filteredFriends.length === 0 ? (
                                <View style={styles.centerState}>
                                    <Text style={{ color: colors.textSecondary }}>No friends found.</Text>
                                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>Add more friends to share quickly!</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={filteredFriends}
                                    renderItem={renderFriendItem}
                                    keyExtractor={item => item.id}
                                    style={styles.list}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                />
                            )}
                        </View>

                        {/* Footer: External Share */}
                        <TouchableOpacity
                            style={[styles.externalShareButton, { borderTopColor: colors.border }]}
                            onPress={handleExternalShare}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: colors.background }]}>
                                <Feather name="share" size={20} color={colors.text} />
                            </View>
                            <Text style={[styles.externalShareText, { color: colors.text }]}>Share via...</Text>
                        </TouchableOpacity>

                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    keyboardAvoid: {
        width: '100%',
    },
    container: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: SCREEN_HEIGHT * 0.7, // 70% height
        width: '100%',
    },
    handleContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
        position: 'relative',
    },
    searchIcon: {
        position: 'absolute',
        left: 12,
        zIndex: 1,
    },
    searchInput: {
        flex: 1,
        height: 40,
        borderRadius: 10,
        paddingLeft: 40,
        paddingRight: 16,
        fontSize: 16,
    },
    listContainer: {
        height: 300, // Fixed height area for list
    },
    list: {
        flex: 1,
    },
    centerState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
        backgroundColor: '#333',
    },
    friendInfo: {
        flex: 1,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '600',
    },
    friendUsername: {
        fontSize: 13,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    externalShareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    externalShareText: {
        fontSize: 16,
        fontWeight: '500',
    }
});
