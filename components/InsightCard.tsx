import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Feather } from '@expo/vector-icons';
import type { Insight } from '../types';

const { height: screenHeight } = Dimensions.get('window');

interface InsightCardProps {
  insight: Insight;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [response, setResponse] = useState('');

  const dynamicStyles = StyleSheet.create({
    wrapper: {
      height: screenHeight,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 16,
      paddingBottom: 120, // Initial offset for bottom nav
    },
    profileSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    avatar: {
      width: 90,
      height: 90,
      borderRadius: 45,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: colors.accent,
    },
    authorName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    authorHandle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    profileDetailsToggle: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    toggleText: {
      color: colors.textSecondary,
    },
    expandedDetails: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      width: '100%',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    detailRow: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    detailItem: {
      flex: 1,
      paddingRight: 10,
    },
    detailLabel: {
      fontSize: 14,
      color: colors.accent,
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    projectSection: {
      marginTop: 4,
    },
    insightCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    insightBody: {
      fontSize: 18,
      color: colors.text,
      lineHeight: 26,
      textAlign: 'center',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },
    textInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colors.inputText,
      marginRight: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    submitButton: {
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 12,
    },
  });

  return (
    <View style={dynamicStyles.wrapper}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={dynamicStyles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            <View style={dynamicStyles.profileSection}>
              {!isExpanded && (
                <Image source={{ uri: insight.author.avatar }} style={dynamicStyles.avatar} />
              )}
              <Text style={dynamicStyles.authorName}>{insight.author.name}</Text>
              <Text style={dynamicStyles.authorHandle}>@{insight.author.handle}</Text>
              <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={dynamicStyles.profileDetailsToggle}>
                <Text style={dynamicStyles.toggleText}>{isExpanded ? 'Hide' : 'View'} profile details </Text>
                <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {isExpanded && (
              <View style={dynamicStyles.expandedDetails}>
                <View style={dynamicStyles.detailRow}>
                  <View style={dynamicStyles.detailItem}>
                    <Text style={dynamicStyles.detailLabel}>Industry</Text>
                    <Text style={dynamicStyles.detailValue}>{insight.author.industry}</Text>
                  </View>
                  <View style={dynamicStyles.detailItem}>
                    <Text style={dynamicStyles.detailLabel}>Company</Text>
                    <Text style={dynamicStyles.detailValue}>{insight.author.company}</Text>
                  </View>
                </View>
                <View style={dynamicStyles.detailRow}>
                  <View style={dynamicStyles.detailItem}>
                    <Text style={dynamicStyles.detailLabel}>Role</Text>
                    <Text style={dynamicStyles.detailValue}>{insight.author.role}</Text>
                  </View>
                  <View style={dynamicStyles.detailItem}>
                    <Text style={dynamicStyles.detailLabel}>Location</Text>
                    <Text style={dynamicStyles.detailValue}>{insight.author.location}</Text>
                  </View>
                </View>
                <View style={dynamicStyles.projectSection}>
                  <Text style={dynamicStyles.detailLabel}>Current Project</Text>
                  <Text style={dynamicStyles.detailValue}>{insight.author.currentProject}</Text>
                </View>
              </View>
            )}

            <View style={dynamicStyles.insightCard}>
              <Text style={dynamicStyles.insightBody}>"{insight.content}"</Text>
            </View>

            <View style={dynamicStyles.inputContainer}>
              <TextInput
                style={dynamicStyles.textInput}
                placeholder="Share your thoughts..."
                placeholderTextColor={colors.textSecondary}
                value={response}
                onChangeText={setResponse}
                onFocus={() => setIsExpanded(false)}
              />
              <TouchableOpacity style={dynamicStyles.submitButton}>
                <Feather name="send" size={20} color={colors.primaryText} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default InsightCard; 