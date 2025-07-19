// components/InsightCard.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface InsightCardProps {
  insight: {
    id: string;
    content: string;
    author_id: string;
    author_name: string;
    author_avatar: string;
  };
}

const { height: screenHeight } = Dimensions.get('window');

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitResponse = async () => {
    if (!user || response.trim() === '') return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('insight_responses').insert({
        insight_id: insight.id,
        responder_id: user.id,
        original_author_id: insight.author_id,
        content: response.trim(),
      });

      if (error) throw error;

      Alert.alert('Success', 'Your response has been sent.');
      setResponse('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send response.');
      console.error('Error submitting insight response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      padding: 16,
      marginVertical: 8,
      marginHorizontal: 16,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
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
    authorInfo: {
      flex: 1,
    },
    authorName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    insightContent: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 16,
      lineHeight: 24,
    },
    responseContainer: {
      flexDirection: 'row',
      alignItems: 'center',
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
      marginRight: 8,
    },
    sendButton: {
      padding: 8,
    },
  });

  return (
    <View style={{ height: screenHeight, justifyContent: 'center' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Image source={{ uri: insight.author_avatar || 'https://randomuser.me/api/portraits/lego/1.jpg' }} style={styles.avatar} />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{insight.author_name}</Text>
            </View>
          </View>
          <Text style={styles.insightContent}>{insight.content}</Text>
          <View style={styles.responseContainer}>
            <TextInput
              style={styles.input}
              placeholder="Share your thoughts..."
              placeholderTextColor={colors.inputPlaceholder}
              value={response}
              onChangeText={setResponse}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSubmitResponse} disabled={isSubmitting}>
              <Feather name="send" size={24} color={isSubmitting ? colors.textSecondary : colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default InsightCard; 