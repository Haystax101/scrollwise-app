import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Image, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface OtherUser {
  full_name: string;
  avatar_url: string;
}

const ChatDetailScreen = () => {
  const { id: chatId } = useLocalSearchParams();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);

  // Helper to detect and label insight messages
  const formatMessageContent = (content: string) => {
    if (content.startsWith('[INSIGHT]')) {
      return <Text><Text style={{ fontWeight: 'bold', color: colors.primary }}>[INSIGHT]</Text> {content.replace(/^\[INSIGHT\]\s*/, '')}</Text>;
    }
    return content;
  };

  const fetchChatInfo = useCallback(async () => {
    if (!chatId || !user) return;

    // Fetch chat participants
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .select('participant_ids')
      .eq('id', Array.isArray(chatId) ? chatId[0] : chatId)
      .single();

    if (chatError || !chatData) {
      // Handle error or no chat found
      setLoading(false);
      return;
    }

    // Identify the other user
    const otherUserId = chatData.participant_ids.find((id: string) => id !== user.id);
    if (otherUserId) {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', otherUserId)
        .single();
      if (!userError) {
        setOtherUser(userData);
      }
    }

    // Fetch messages
    const { data: messageData, error: messageError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', Array.isArray(chatId) ? chatId[0] : chatId)
      .order('created_at', { ascending: false });

    if (!messageError) {
      setMessages(messageData);
    }
    setLoading(false);
  }, [chatId, user]);

  useEffect(() => {
    fetchChatInfo();

    console.log('Setting up Supabase Realtime subscription for chat:', chatId);
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${Array.isArray(chatId) ? chatId[0] : chatId}`,
        },
        (payload) => {
          console.log('Realtime payload received:', payload);
          setMessages((currentMessages) => [payload.new as ChatMessage, ...currentMessages]);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Removing Supabase Realtime subscription for chat:', chatId);
      supabase.removeChannel(channel);
    };
  }, [chatId, fetchChatInfo]);

  const handleSend = async () => {
    console.log('Send pressed:', { newMessage, user });
    if (newMessage.trim() === '' || !user) {
      console.log('Message is empty or user is not defined.');
      return;
    }

    const chat_id_val = Array.isArray(chatId) ? chatId[0] : chatId;
    console.log('Attempting to insert message:', {
      chat_id: chat_id_val,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    // Optimistically add message to UI
    const optimisticMessage: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      content: newMessage.trim(),
      sender_id: user.id,
      created_at: new Date().toISOString(),
    };
    setMessages((msgs) => [optimisticMessage, ...msgs]);

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        chat_id: chat_id_val,
        sender_id: user.id,
        content: newMessage.trim(),
      });

    if (error) {
      console.log('Error inserting message:', error);
      // Remove optimistic message if failed
      setMessages((msgs) => msgs.filter((m) => m.id !== optimisticMessage.id));
    } else {
      console.log('Message sent successfully.');
    }
    setNewMessage('');
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.sender_id === user?.id;
    return (
      <View style={[styles.messageRow, { justifyContent: isMyMessage ? 'flex-end' : 'flex-start' }]}> 
        <View>
          <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.theirMessage]}>
            <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
              {typeof item.content === 'string' ? formatMessageContent(item.content) : item.content}
            </Text>
          </View>
          <Text style={[styles.timestamp, isMyMessage ? styles.myTimestamp : styles.theirTimestamp]}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    backButton: {
      marginRight: 16,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    userName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    messageList: {
      flex: 1,
      padding: 16,
    },
    messageRow: {
      flexDirection: 'row',
      marginVertical: 4,
    },
    messageContainer: {
      maxWidth: '80%',
      borderRadius: 18,
    },
    myMessage: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    theirMessage: {
      alignSelf: 'flex-start',
      backgroundColor: isDark ? colors.border : colors.surface,
      borderBottomLeftRadius: 4,
      borderWidth: isDark ? 0 : 1,
      borderColor: colors.border,
    },
    messageText: {
      fontSize: 16,
      padding: 12,
    },
    myMessageText: {
      color: colors.primaryText,
    },
    theirMessageText: {
      color: colors.text,
    },
    timestamp: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 4,
    },
    myTimestamp: {
      alignSelf: 'flex-end',
    },
    theirTimestamp: {
      alignSelf: 'flex-start',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    input: {
      flex: 1,
      height: 40,
      borderRadius: 20,
      paddingHorizontal: 16,
      backgroundColor: colors.inputBackground,
      color: colors.inputText,
      borderColor: colors.inputBorder,
      borderWidth: 1,
    },
    sendButton: {
      marginLeft: 8,
      padding: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-down" size={28} color={colors.text} />
          </TouchableOpacity>
          <Image
            source={{ uri: otherUser?.avatar_url || `https://randomuser.me/api/portraits/men/${chatId}.jpg` }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{otherUser?.full_name || 'Chat'}</Text>
        </View>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          inverted
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.inputPlaceholder}
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Feather name="send" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatDetailScreen; 