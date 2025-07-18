import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import Insights from './Insights';

const dummyConversations = [
  { id: '1', userName: 'John Doe', lastMessage: 'Hey, how are you?', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
  { id: '2', userName: 'Jane Smith', lastMessage: 'Are we still on for tomorrow?', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
  { id: '3', userName: 'Peter Jones', lastMessage: 'Can you send me the file?', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
  { id: '4', userName: 'Amy Williams', lastMessage: 'Thanks for your help!', avatar: 'https://randomuser.me/api/portraits/women/4.jpg' },
];

type ViewMode = 'chats' | 'insights';

const Chats = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('chats');

  const handleChatPress = (chatId: string) => {
    router.push(`/chat/${chatId}`);
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
        <FlatList
          data={dummyConversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleChatPress(item.id)} style={styles.conversationItem}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              <View style={styles.conversationText}>
                <Text style={styles.userName}>{item.userName}</Text>
                <Text style={styles.lastMessage}>{item.lastMessage}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Insights />
      )}
    </SafeAreaView>
  );
};

export default Chats; 