import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface CreateFeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TITLE_MIN = 5;
const TITLE_MAX = 200;
const BODY_MIN = 10;
const BODY_MAX = 2000;

export const CreateFeedbackModal: React.FC<CreateFeedbackModalProps> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setTitle('');
      setBody('');
    }
  }, [visible]);

  const isTitleValid = title.trim().length >= TITLE_MIN && title.length <= TITLE_MAX;
  const isBodyValid = body.trim().length >= BODY_MIN && body.length <= BODY_MAX;
  const canSubmit = isTitleValid && isBodyValid && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          title: title.trim(),
          body: body.trim(),
          status: 'under_review'
        });

      if (error) throw error;

      Alert.alert(
        'Success',
        'Your feedback has been submitted! Thank you for helping us improve.',
        [{ text: 'OK', onPress: () => {
          onClose();
          onSuccess();
        }}]
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert(
        'Error',
        'Failed to submit your feedback. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 40,
    },
    closeButton: {
      padding: 8,
    },
    submitButton: {
      padding: 8,
    },
    submitText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    submitTextDisabled: {
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    scrollContent: {
      paddingVertical: 20,
      gap: 24,
    },
    section: {
      gap: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    characterCount: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    characterCountWarning: {
      color: '#f44336',
    },
    input: {
      backgroundColor: colors.inputBackground || colors.background,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    titleInput: {
      minHeight: 50,
    },
    bodyInput: {
      minHeight: 150,
      textAlignVertical: 'top',
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={dynamicStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={dynamicStyles.header}>
          <TouchableOpacity style={dynamicStyles.closeButton} onPress={onClose}>
            <Feather name="x" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={dynamicStyles.title}>New Feedback</Text>
          <TouchableOpacity
            style={dynamicStyles.submitButton}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Text style={[dynamicStyles.submitText, !canSubmit && dynamicStyles.submitTextDisabled]}>
              Submit
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={false}>
          <View style={dynamicStyles.scrollContent}>
            {/* Title Section */}
            <View style={dynamicStyles.section}>
              <View style={dynamicStyles.sectionHeader}>
                <Text style={dynamicStyles.sectionTitle}>Title</Text>
                <Text
                  style={[
                    dynamicStyles.characterCount,
                    title.length > TITLE_MAX && dynamicStyles.characterCountWarning,
                  ]}
                >
                  {title.length}/{TITLE_MAX}
                </Text>
              </View>
              <Text style={dynamicStyles.description}>
                A concise summary of your feedback or feature request
              </Text>
              <TextInput
                style={[dynamicStyles.input, dynamicStyles.titleInput]}
                placeholder="e.g., Add dark mode toggle to settings"
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
                maxLength={TITLE_MAX + 50}
                autoFocus
              />
            </View>

            {/* Body Section */}
            <View style={dynamicStyles.section}>
              <View style={dynamicStyles.sectionHeader}>
                <Text style={dynamicStyles.sectionTitle}>Description</Text>
                <Text
                  style={[
                    dynamicStyles.characterCount,
                    body.length > BODY_MAX && dynamicStyles.characterCountWarning,
                  ]}
                >
                  {body.length}/{BODY_MAX}
                </Text>
              </View>
              <Text style={dynamicStyles.description}>
                Provide details about your feedback, why it's important, and how it could improve the app
              </Text>
              <TextInput
                style={[dynamicStyles.input, dynamicStyles.bodyInput]}
                multiline
                placeholder="Describe your feedback in detail..."
                placeholderTextColor={colors.textSecondary}
                value={body}
                onChangeText={setBody}
                maxLength={BODY_MAX + 50}
              />
            </View>
          </View>
        </ScrollView>

        {submitting && (
          <View style={dynamicStyles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};
