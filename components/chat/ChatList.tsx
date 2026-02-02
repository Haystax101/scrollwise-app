import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';
import { chatService, ChatPreview } from '../../lib/chatService';
import { profileImageService } from '../../services/profileImageService';
import { useAuth } from '../../context/AuthContext';
import { Feather } from '@expo/vector-icons';

export const ChatList = () => {
    const { colors } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const [chats, setChats] = useState<ChatPreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadChats = async () => {
        try {
            setLoading(true);
            const data = await chatService.getMyChats();
            setChats(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user) loadChats();

        // Simple polling for now
        const interval = setInterval(loadChats, 5000); // 5s poll for inbox updates
        return () => clearInterval(interval);
    }, [user]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadChats();
    };

    const handlePressChat = (chatId: string) => {
        router.push({
            pathname: '/messages/[id]',
            params: { id: chatId }
        });
    };

    const renderItem = ({ item }: { item: ChatPreview }) => {
        const avatarUrl = item.partner_avatar
            ? profileImageService.getProfileImageUrl(item.partner_avatar)
            : null;

        // Determine display name
        const displayName = item.is_group
            ? item.group_name || 'Group Chat'
            : item.partner_name || 'Unknown User';

        const timeAgo = item.last_message_at
            ? formatDistanceToNow(new Date(item.last_message_at), { addSuffix: false })
                .replace('about ', '')
                .replace(' hours', 'h')
                .replace(' minutes', 'm')
                .replace(' days', 'd')
            : '';

        return (
            <TouchableOpacity
                style={styles.itemContainer}
                onPress={() => handlePressChat(item.chat_id)}
                activeOpacity={0.7}
            >
                {/* Avatar - Clickable */}
                <TouchableOpacity onPress={() => router.push({ pathname: '/user-profile', params: { userId: item.partner_id } })}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={avatarUrl ? { uri: avatarUrl } : require('../../assets/profileIconDefault.png')}
                            style={styles.avatar}
                        />
                        {item.unread_count > 0 && (
                            <View style={[styles.unreadBadgeData, { backgroundColor: colors.error }]}>
                                <Text style={styles.unreadCountText}>
                                    {item.unread_count > 9 ? '9+' : item.unread_count}
                                </Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

                {/* Content */}
                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.nameText, { color: colors.text }]} numberOfLines={1}>
                            {displayName}
                        </Text>
                        <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                            {timeAgo}
                        </Text>
                    </View>

                    <Text
                        style={[
                            styles.messageText,
                            { color: item.unread_count > 0 ? colors.text : colors.textSecondary, fontWeight: item.unread_count > 0 ? '600' : '400' }
                        ]}
                        numberOfLines={1}
                    >
                        {item.last_message_content || 'No messages yet'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={chats}
                renderItem={renderItem}
                keyExtractor={item => item.chat_id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Feather name="message-square" size={48} color="rgba(255,255,255,0.3)" />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No messages yet</Text>
                            <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>Start a conversation with a friend!</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 100, // Keep bottom padding for scrolling
    },
    itemContainer: {
        flexDirection: 'row',
        padding: 16,
        // No margin bottom for contiguous items
        // No border radius for full width
        alignItems: 'center',
        backgroundColor: 'rgba(30,30,30,0.4)', // Darker glass base
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        borderTopWidth: 1, // Subtle top highlight
        borderTopColor: 'rgba(255,255,255,0.1)', // "Faint white light source"
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 52, // Slightly larger
        height: 52,
        borderRadius: 26,
        backgroundColor: '#333',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    unreadBadgeData: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#1E1E1E', // Match generic dark bg
    },
    unreadCountText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    nameText: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Montserrat_700Bold',
        flex: 1,
        marginRight: 8,
    },
    timeText: {
        fontSize: 12,
        fontFamily: 'Montserrat_400Regular',
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
        fontFamily: 'Montserrat_400Regular',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        opacity: 0.7
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        fontFamily: 'Oswald_700Bold',
    },
    emptySubText: {
        fontSize: 14,
        marginTop: 8,
        fontFamily: 'Montserrat_400Regular',
    }
});
