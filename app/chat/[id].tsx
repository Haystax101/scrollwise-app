import React from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Image, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Feather } from '@expo/vector-icons';

const dummyMessages = [
  { id: '1', text: 'Hey, how are you?', sender: 'John Doe' },
  { id: '2', text: 'I am good, thanks! How about you?', sender: 'Me' },
  { id: '3', text: 'Doing great! Are we still on for tomorrow?', sender: 'John Doe' },
  { id: '4', text: 'Yes, absolutely!', sender: 'Me' },
];

const ChatDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const router = useRouter();

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
    messageContainer: {
      marginVertical: 4,
      maxWidth: '80%',
    },
    myMessage: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: 12,
    },
    theirMessage: {
      alignSelf: 'flex-start',
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    messageText: {
      fontSize: 16,
    },
    myMessageText: {
      color: colors.primaryText,
    },
    theirMessageText: {
      color: colors.text,
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -500}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-down" size={28} color={colors.text} />
          </TouchableOpacity>
          <Image source={{ uri: `https://randomuser.me/api/portraits/men/${id}.jpg` }} style={styles.avatar} />
          <Text style={styles.userName}>John Doe</Text>
        </View>
        <FlatList
          data={dummyMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[
              styles.messageContainer,
              item.sender === 'Me' ? styles.myMessage : styles.theirMessage
            ]}>
              <Text style={[
                styles.messageText,
                item.sender === 'Me' ? styles.myMessageText : styles.theirMessageText
              ]}>
                {item.text}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.messageList}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.inputPlaceholder}
          />
          <TouchableOpacity style={styles.sendButton}>
            <Feather name="send" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatDetailScreen; 