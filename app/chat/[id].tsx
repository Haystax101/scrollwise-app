import React from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Image, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { UserDetailModal } from '../../components/profile/UserDetailModal';

const dummyMessages = [
  { id: '1', text: 'Hey, how are you?', sender: 'John Doe', timestamp: '10:00 AM' },
  { id: '2', text: 'I am good, thanks! How about you?', sender: 'Me', timestamp: '10:01 AM' },
  { id: '3', text: 'Doing great! Are we still on for tomorrow?', sender: 'John Doe', timestamp: '10:01 AM' },
  { id: '4', text: 'Yes, absolutely!', sender: 'Me', timestamp: '10:02 AM' },
];

const ChatDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
      title: '', // fallback
    });
  }, [navigation]);

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

  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const { user } = useAuth(); // Need current user for modal

  const handleHeaderPress = () => {
    setShowProfileModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -500}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-left" size={28} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            onPress={handleHeaderPress}
            activeOpacity={0.7}
          >
            <Image source={{ uri: 'https://i.pravatar.cc/150?u=' + id }} style={[styles.avatar, { backgroundColor: colors.border }]} />
            <Text style={styles.userName}>John Doe</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={dummyMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.messageRow, { justifyContent: item.sender === 'Me' ? 'flex-end' : 'flex-start' }]}>
              <View>
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
                <Text style={[styles.timestamp, item.sender === 'Me' ? styles.myTimestamp : styles.theirTimestamp]}>
                  {item.timestamp}
                </Text>
              </View>
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

        <UserDetailModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userId={id as string} // In real app this would be the actual user ID
          currentUserId={user?.id}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatDetailScreen; 