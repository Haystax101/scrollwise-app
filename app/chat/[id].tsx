import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

const ChatScreen = () => {
  const { id: chatId } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data);
    }
  }, [chatId]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${chatId}` }, (payload) => {
        setMessages((prevMessages) => [...prevMessages, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, fetchMessages]);

  const handleSend = async () => {
    if (newMessage.trim() === '' || !user) return;

    const { error } = await supabase.from('chat_messages').insert([
      { chat_id: chatId, sender_id: user.id, content: newMessage.trim() },
    ]);

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.sender_id === user?.id ? styles.myMessage : styles.theirMessage]}>
      <Text style={styles.messageText}>{item.content}</Text>
    </View>
  );

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    list: { flex: 1, paddingHorizontal: 10 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: colors.border },
    input: { flex: 1, backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, color: colors.text },
    sendButton: { backgroundColor: colors.primary, borderRadius: 20, padding: 10 },
    messageContainer: { padding: 10, borderRadius: 10, marginVertical: 5, maxWidth: '80%' },
    myMessage: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
    theirMessage: { backgroundColor: colors.card, alignSelf: 'flex-start' },
    messageText: { color: colors.text },
  });

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={{ paddingVertical: 10 }}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={{ color: colors.primaryText }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;