import React, { useEffect, useState, useRef } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Text, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { chatService, DirectMessage } from '../../lib/chatService';
import { FeedItem } from '../../components/communities/FeedItem'; // Reusing our glassmorphic bubble component
import { profileImageService } from '../../services/profileImageService';

export default function ChatScreen() {
    const { id } = useLocalSearchParams<{ id: string; name?: string; avatar?: string }>(); // Chat ID
    // We can also pass 'name' and 'avatar' params for instant header rendering
    const params = useLocalSearchParams();

    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { session } = useAuth();
    const router = useRouter();

    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [text, setText] = useState('');

    useEffect(() => {
        if (id) {
            loadMessages();
            chatService.markAsRead(id);

            // Real-time subscription
            const channel = chatService.subscribeToChat(id, (payload) => {
                // If new message comes in, append it (if not already optimistically added)
                const newMsg = payload.new;
                // We need to fetch sender info or just add it if it's us? 
                // For simplicity, re-fetch or just append with unknown sender for a sec?
                // Better: Just reload for now or append if it's not ours (ours is optimistic)
                if (newMsg.sender_id !== session?.user.id) {
                    // In efficient app we'd just append, but we lack author info in the payload payload usually just has table columns
                    loadMessages(); // Brute force refresh for MVP
                }
            });

            return () => {
                channel.unsubscribe();
            };
        }
    }, [id]);

    const loadMessages = async () => {
        try {
            const data = await chatService.getMessages(id!);
            setMessages(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!text.trim() || !session?.user) return;

        const content = text.trim();
        setText('');
        setSending(true);

        // Optimistic Update
        const tempId = 'temp-' + Date.now();
        const optimisticMsg: DirectMessage = {
            id: tempId,
            chat_id: id!,
            sender_id: session.user.id,
            content: content,
            created_at: new Date().toISOString(),
            is_system_message: false,
            author_name: 'You', // Or get from profile context
            author_avatar: ''
        };

        setMessages(prev => [optimisticMsg, ...prev]);

        try {
            await chatService.sendMessage(id!, content);
            // Success - keep it (maybe update ID if we wanted perfection)
        } catch (e) {
            console.error(e);
            // Remove optimistic on failure?
        } finally {
            setSending(false);
        }
    };

    // Adapt DirectMessage to FeedItemType for the FeedItem component
    const renderItem = ({ item }: { item: DirectMessage }) => {
        const feedItem: any = {
            id: item.id,
            type: 'message', // Force type message for bubbles
            content: item.content,
            user_id: item.sender_id,
            created_at: item.created_at,
            author_name: item.author_name || 'User',
            author_avatar: item.author_avatar,
            media_urls: item.media_url ? [item.media_url] : []
        };

        return <FeedItem item={feedItem} currentUserId={session?.user?.id || ''} />;
    };

    // Correctly extracting name and avatar from params which could be strings or arrays
    const partnerName = Array.isArray(params.name) ? params.name[0] : (params.name || 'Chat');
    const partnerAvatar = Array.isArray(params.avatar) ? params.avatar[0] : params.avatar;


    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    {partnerAvatar && (
                        <Image
                            source={{ uri: profileImageService.getProfileImageUrl(partnerAvatar) || undefined }}
                            style={styles.headerAvatar}
                        />
                    )}
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{partnerName}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Messages List */}
            <FlatList
                data={messages}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                inverted
                contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 20, paddingTop: 20 }}
                ListEmptyComponent={!loading ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ color: colors.textSecondary }}>No messages yet.</Text>
                    </View>
                ) : null}
            />

            {/* Input Bar */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={[
                    styles.inputContainer,
                    { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }
                ]}>


                    <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                        placeholder="Message..."
                        placeholderTextColor={colors.textSecondary}
                        value={text}
                        onChangeText={setText}
                        multiline
                    />

                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={!text.trim() || sending}
                        style={[styles.sendButton, { backgroundColor: text.trim() ? colors.primary : colors.border }]}
                    >
                        <Feather name="arrow-up" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        backgroundColor: '#333'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    attachButton: {
        padding: 10,
        marginBottom: 4,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        marginHorizontal: 8,
        maxHeight: 100,
        fontSize: 16,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    }
});
