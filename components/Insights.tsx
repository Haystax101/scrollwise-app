import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Feather } from '@expo/vector-icons';

const dummyInsights = [
  {
    id: '1',
    userName: 'Jane Doe',
    jobTitle: 'Quantum Physicist',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    userMessage: 'This is a fascinating take on quantum mechanics. I\'d love to discuss it further.',
    insightTitle: 'The Future of Quantum Computing',
  },
  {
    id: '2',
    userName: 'John Smith',
    jobTitle: 'AI Researcher',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    userMessage: 'I think AI in education will be transformative, but we need to consider the ethical implications.',
    insightTitle: 'AI in Education',
  },
];

const Insights = () => {
  const { colors } = useTheme();

  const handleAccept = (insightId: string) => {
    console.log(`Accepted insight ${insightId}`);
  };

  const handleReject = (insightId: string) => {
    console.log(`Rejected insight ${insightId}`);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    insightCard: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 16,
      marginVertical: 8,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    jobTitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    messageText: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 8,
    },
    insightContext: {
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    insightItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    insightText: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 8,
    },
    responseText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 12,
        fontStyle: 'italic',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      marginLeft: 8,
    },
    replyButton: {
      backgroundColor: colors.primary,
    },
    rejectButton: {
      backgroundColor: '#E57373',
    },
    actionButtonText: {
      color: 'white',
      fontWeight: 'bold',
      marginLeft: 6,
    },
    button: {
        marginLeft: 8,
    }
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={dummyInsights}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.insightCard}>
            <View style={styles.cardHeader}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.userName}</Text>
                <Text style={styles.jobTitle}>{item.jobTitle}</Text>
              </View>
            </View>
            <Text style={styles.messageText}>"{item.userMessage}"</Text>
            <Text style={styles.insightContext}>Response to your insight: {item.insightTitle}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.actionButton, styles.replyButton]} onPress={() => handleAccept(item.id)}>
                <Feather name="message-square" size={16} color="white" />
                <Text style={styles.actionButtonText}>Reply</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleReject(item.id)}>
                <Feather name="x" size={16} color="white" />
                <Text style={styles.actionButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default Insights; 