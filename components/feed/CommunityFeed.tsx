import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { communityService, FeedItem as FeedItemType } from '../../lib/communityService';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { FeedItem } from '../../components/communities/FeedItem';

interface CommunityFeedProps {
    selectedCommunity: any | null;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({ selectedCommunity }) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { session } = useAuth();
    const router = useRouter();

    // Data State
    const [feed, setFeed] = useState<FeedItemType[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Removed internal community fetching/dropdown logic in favor of props

    useEffect(() => {
        fetchFeed();
        // MVP Polling
        const interval = setInterval(fetchFeed, 10000);
        return () => clearInterval(interval);
    }, [selectedCommunity]);

    const fetchFeed = async () => {
        setLoading(true);
        try {
            if (selectedCommunity) {
                // Specific Community Feed (Chat + Posts)
                const data = await communityService.getCommunityFeed(selectedCommunity.id);
                setFeed(data);
            } else {
                // General FYP (Posts Only)
                const data = await communityService.getGeneralFeed();
                setFeed(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedCommunity || !session?.user) return;

        setSending(true);
        const newMessage: FeedItemType = {
            id: 'temp-' + Date.now(),
            type: 'message',
            content: messageText,
            user_id: session.user.id,
            created_at: new Date().toISOString(),
            author_name: 'You',
            author_avatar: ''
        };
        // Optimistic update
        setFeed([newMessage, ...feed]);
        setMessageText('');

        await communityService.sendMessage(selectedCommunity.id, newMessage.content, session.user.id);
        setSending(false);
        fetchFeed(); // Sync
    };

    const handleCreatePost = () => {
        if (selectedCommunity) {
            router.push({
                pathname: '/create-community-post',
                params: { communityId: selectedCommunity.id }
            });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>

            {/* Header/Selector removed (handled by parent Index) */}

            {/* Feed List */}
            <FlatList
                data={feed}
                renderItem={({ item }) => <FeedItem item={item} currentUserId={session?.user?.id || ''} />}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{
                    // Inverted List:
                    // paddingTop = Space at visual BOTTOM (Input area)
                    // paddingBottom = Space at visual TOP (Header area)
                    paddingTop: selectedCommunity ? 180 : 120,
                    paddingBottom: insets.top + 70,
                    paddingHorizontal: 0
                }}
                inverted={!!selectedCommunity} // Specific groups are chat-like (bottom up), General is Feed (top down)? 


                refreshing={refreshing}
                onRefresh={fetchFeed}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={{ color: colors.textSecondary }}>No posts yet.</Text>
                        </View>
                    ) : null
                }
            />

            {/* Loading Indicator */}
            {loading && (
                <View style={[styles.loadingOverlay, { top: insets.top + 150 }]}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            )}

            {/* Chat Input (Only for Specific Groups) */}
            {selectedCommunity && (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} // Adjust for TabBar height
                    style={[styles.inputWrapper, { bottom: Platform.OS === 'ios' ? 85 : 65 }]} // Floating above TabBar
                >
                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                        <TouchableOpacity onPress={handleCreatePost} style={styles.attachButton}>
                            <Feather name="plus" size={24} color={colors.primary} />
                        </TouchableOpacity>

                        <TextInput
                            style={[styles.textInput, { color: colors.text, backgroundColor: colors.background }]}
                            placeholder={`Message ${selectedCommunity.name}...`}
                            placeholderTextColor={colors.textSecondary}
                            value={messageText}
                            onChangeText={setMessageText}
                            multiline
                        />

                        <TouchableOpacity
                            onPress={handleSendMessage}
                            style={[styles.sendButton, { opacity: messageText.trim() ? 1 : 0.5 }]}
                            disabled={!messageText.trim() || sending}
                        >
                            <Feather name="send" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    selectorContainer: {
        position: 'absolute',
        left: 20,
        right: 20,
        height: 40,
        justifyContent: 'center',
    },
    selectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    selectorText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    dropdownOverlay: {
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: 0,
        zIndex: 99,
    },
    dropdownMenu: {
        borderRadius: 16,
        borderWidth: 1,
        paddingVertical: 8,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        maxHeight: 300,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    dropdownText: {
        fontSize: 16,
        fontWeight: '500',
    },
    miniAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    miniAvatarImg: {
        width: 24,
        height: 24,
    },
    miniAvatarText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#888',
    },
    loadingOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    inputWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
    },
    attachButton: {
        padding: 8,
        marginRight: 8,
    },
    textInput: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        maxHeight: 100,
        fontSize: 16,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
});
