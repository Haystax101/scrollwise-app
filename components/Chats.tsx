import React from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';

const dummyConversations = [
  { id: '1', userName: 'John Doe', lastMessage: 'Hey, how are you?', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
  { id: '2', userName: 'Jane Smith', lastMessage: 'Are we still on for tomorrow?', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
  { id: '3', userName: 'Peter Jones', lastMessage: 'Can you send me the file?', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
  { id: '4', userName: 'Amy Williams', lastMessage: 'Thanks for your help!', avatar: 'https://randomuser.me/api/portraits/women/4.jpg' },
];

const Chats = () => {
  const { colors } = useTheme();
  const router = useRouter();

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
    conversationItem: {
      flexDirection: 'row',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: 'center',
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 16,
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
      <Text style={styles.header}>Chats</Text>
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
    </SafeAreaView>
  );
};

export default Chats; 