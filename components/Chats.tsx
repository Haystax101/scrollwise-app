
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Insights from './Insights';

type ViewMode = 'chats' | 'insights';

interface ChatListItem {
  chatId: string;
  userName: string;
  avatar: string;
  lastMessage: string;
  otherUserId: string;
}

const Chats = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('chats');
  const [chatList, setChatList] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Fetch all users except current user
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .neq('id', user.id);
    if (usersError) {
      setLoading(false);
      return;
    }
    // For each other user, check for chat and fetch latest message
    const chatItems: ChatListItem[] = [];
    for (const otherUser of users) {
      // Find chat between current user and other user
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('id, participant_ids')
        .contains('participant_ids', [user.id, otherUser.id]);
      if (chatError) continue;
      let chatId = '';
      if (chat && chat.length > 0) {
        chatId = chat[0].id;
        // Fetch latest message
        const { data: messages, error: msgError } = await supabase
          .from('chat_messages')
          .select('content, created_at, sender_id')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: false })
          .limit(1);
        let lastMessage = '';
        if (messages && messages.length > 0) {
          lastMessage = messages[0].content;
        }
        chatItems.push({
          chatId,
          userName: otherUser.full_name,
          avatar: otherUser.avatar_url,
          lastMessage,
          otherUserId: otherUser.id,
        });
      } else {
        // No chat exists, create a button to start chat
        chatItems.push({
          chatId: '',
          userName: otherUser.full_name,
          avatar: otherUser.avatar_url,
          lastMessage: '',
          otherUserId: otherUser.id,
        });
      }
    }
    setChatList(chatItems);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchChats();
    // TODO: Add Supabase Realtime subscription for chat_messages
  }, [fetchChats]);

  const handleChatPress = async (chatId: string, otherUserId: string) => {
    if (chatId) {
      router.push(`/chat/${chatId}`);
    } else {
      // Create new chat
      const { data: newChat, error: newChatError } = await supabase
        .from('chats')
        .insert([{ participant_ids: [user.id, otherUserId] }])
        .select('id')
        .single();
      if (newChat && newChat.id) {
        fetchChats();
        router.push(`/chat/${newChat.id}`);
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      paddingHorizontal: 16,
      paddingVertical: 10,
      color: colors.text,
    },
    toggleContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    toggleButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    activeToggleButton: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    toggleButtonText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    activeToggleButtonText: {
      fontWeight: 'bold',
      color: colors.text,
    },
    conversationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 16,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    conversationText: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    lastMessage: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    startChatButton: {
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginLeft: 8,
    },
    startChatButtonText: {
      color: colors.primaryText,
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{viewMode === 'chats' ? 'Chats' : 'Insights'}</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'chats' && styles.activeToggleButton]}
          onPress={() => setViewMode('chats')}
        >
          <Text style={[styles.toggleButtonText, viewMode === 'chats' && styles.activeToggleButtonText]}>
            Chats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'insights' && styles.activeToggleButton]}
          onPress={() => setViewMode('insights')}
        >
          <Text style={[styles.toggleButtonText, viewMode === 'insights' && styles.activeToggleButtonText]}>
            Insights
          </Text>
        </TouchableOpacity>
      </View>
      {viewMode === 'chats' ? (
        loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator />
          </View>
        ) : (
          <FlatList
            data={chatList}
            keyExtractor={(item) => item.otherUserId}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleChatPress(item.chatId, item.otherUserId)}
                style={styles.conversationItem}
              >
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={styles.conversationText}>
                  <Text style={styles.userName}>{item.userName}</Text>
                  <Text style={styles.lastMessage}>{item.lastMessage || 'No messages yet.'}</Text>
                </View>
                {!item.chatId && (
                  <TouchableOpacity
                    style={styles.startChatButton}
                    onPress={() => handleChatPress(item.chatId, item.otherUserId)}
                  >
                    <Text style={styles.startChatButtonText}>Start Chat</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )}
          />
        )
      ) : (
        <Insights />
      )}
    </SafeAreaView>
  );
};

export default Chats;