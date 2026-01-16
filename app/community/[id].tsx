import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { communityService, FeedItem as FeedItemType } from '../../lib/communityService';
import { FeedItem } from '../../components/communities/FeedItem';
import { useAuth } from '../../context/AuthContext';
import { BlurView } from 'expo-blur';

export default function CommunityDetailScreen() {
    const { id } = useLocalSearchParams();
    const communityId = Array.isArray(id) ? id[0] : id;
    const { colors } = useTheme();
    const { session } = useAuth();
    const router = useRouter();

    const [feed, setFeed] = useState<FeedItemType[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);

    const flatListRef = useRef<FlatList>(null);

    const fetchFeed = async () => {
        if (!communityId) return;
        try {
            const data = await communityService.getCommunityFeed(communityId);
            setFeed(data); // Inverted list, so newest first? RPC sorts DESC.
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchFeed();

        // Polling for MVP (Realtime would be separate task)
        const interval = setInterval(fetchFeed, 5000);
        return () => clearInterval(interval);
    }, [communityId]);

    const handleSendMessage = async () => {
        if (!messageText.trim() || !communityId || !session?.user) return;

        setSending(true);
        // Optimistic update?
        const newMessage: FeedItemType = {
            id: 'temp-' + Date.now(),
            type: 'message',
            content: messageText,
            user_id: session.user.id,
            created_at: new Date().toISOString(),
            author_name: 'You', // Placeholder
            author_avatar: ''
        };
        setFeed([newMessage, ...feed]);
        setMessageText('');

        await communityService.sendMessage(communityId, newMessage.content, session.user.id);
        setSending(false);
        fetchFeed(); // Sync
    };

    const handleCreatePost = () => {
        // Open Create Post Modal
        // For MVP, router.push('/create-post') or modal
        console.log('Open Create Post Modal');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Community Chat</Text>
                <TouchableOpacity style={styles.menuButton}>
                    <Feather name="more-horizontal" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Unified Feed */}
            <FlatList
                ref={flatListRef}
                data={feed}
                renderItem={({ item }) => (
                    <FeedItem
                        item={item}
                        currentUserId={session?.user?.id || ''}
                    />
                )}
                keyExtractor={(item) => item.id}
                inverted // WhatsApp style: Bottom up? 
                // Wait, if RPC returns DESC (newest first), Inverted means newest at bottom?
                // Standard Chat: List is anchored to bottom. Newest items at bottom.
                // If RPC returns DESC (Newest...Oldest), then [0] is Newest.
                // Inverted List renders [0] at bottom. Correct.
                contentContainerStyle={styles.listContent}
                refreshing={refreshing}
                onRefresh={fetchFeed}
            />

            {/* Input Bar */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TouchableOpacity onPress={handleCreatePost} style={styles.attachButton}>
                        <Feather name="plus" size={24} color={colors.primary} />
                    </TouchableOpacity>

                    <TextInput
                        style={[styles.textInput, { color: colors.text, backgroundColor: colors.background }]}
                        placeholder="Message..."
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 4,
    },
    menuButton: {
        padding: 4,
    },
    listContent: {
        paddingVertical: 16,
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
