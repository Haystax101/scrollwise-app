import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
  const { colors, isDark } = useTheme();

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
      borderRadius: 16,
      marginVertical: 8,
      marginHorizontal: 16,
      overflow: 'hidden',
    },
    gradient: {
      padding: 20,
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
      marginTop: 20,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 12,
      marginLeft: 12,
    },
    replyButton: {
      backgroundColor: colors.primary,
    },
    dismissButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.error,
    },
    actionButtonText: {
      color: colors.text,
      fontWeight: '600',
      marginLeft: 8,
    },
    replyButtonText: {
      color: colors.primaryText,
    },
    button: {
        marginLeft: 8,
    }
  });

  const InsightCard = ({ item }: { item: any }) => {
    const cardContent = (
      <View style={isDark ? styles.gradient : [styles.insightCard, { padding: 20 }]}>
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
            <Feather name="message-square" size={18} color={colors.primaryText} />
            <Text style={[styles.actionButtonText, styles.replyButtonText]}>Reply</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.dismissButton]} onPress={() => handleReject(item.id)}>
            <Feather name="x" size={18} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    );

    if (isDark) {
      return (
        <View style={styles.insightCard}>
          <LinearGradient
            colors={['#1A1B2E', '#2D2D3A']}
            style={styles.gradient}
          >
            {cardContent}
          </LinearGradient>
        </View>
      );
    }

    return (
      <View style={[styles.insightCard, { backgroundColor: colors.card }]}>
        {cardContent}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={dummyInsights}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InsightCard item={item} />}
      />
    </View>
  );
};

export default Insights; 