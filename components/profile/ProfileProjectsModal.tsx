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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

interface ProfileProjectsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  userId: string;
  currentWorkingOn: string | null;
}

export const ProfileProjectsModal: React.FC<ProfileProjectsModalProps> = ({
  visible,
  onClose,
  onSave,
  userId,
  currentWorkingOn,
}) => {
  const { colors } = useTheme();
  const [workingOn, setWorkingOn] = useState('');
  const [loading, setSaving] = useState(false);

  // Character limit
  const MAX_LENGTH = 400;

  useEffect(() => {
    if (visible && currentWorkingOn) {
      setWorkingOn(currentWorkingOn);
    } else if (visible) {
      setWorkingOn('');
    }
  }, [visible, currentWorkingOn]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const projectData = {
        user_id: userId,
        working_on: workingOn.trim() || null,
        updated_at: new Date().toISOString(),
      };

      // Use upsert to insert or update only the working_on field
      const { error } = await supabase
        .from('profile_passions')
        .upsert(projectData, {
          onConflict: 'user_id',
        });

      if (error) {
        throw error;
      }

      console.log('✅ Projects saved successfully');
      onSave();
    } catch (error) {
      console.error('Error saving projects:', error);
      Alert.alert(
        'Error',
        'Failed to save your projects. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  const styles = StyleSheet.create({
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
      paddingBottom: 20,
      backgroundColor: colors.background,
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
    saveButton: {
      padding: 8,
    },
    saveText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    saveTextDisabled: {
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
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    characterCount: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    characterCountWarning: {
      color: colors.error || '#FF6B6B',
    },
    input: {
      backgroundColor: colors.inputBackground || colors.background,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      minHeight: 120,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputFocused: {
      borderColor: colors.primary,
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

  const workingOnCount = workingOn.length;
  const canSave = !loading;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Projects</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={!canSave}
          >
            <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.scrollContent}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>What are you working on?</Text>
                <Text
                  style={[
                    styles.characterCount,
                    workingOnCount > MAX_LENGTH && styles.characterCountWarning,
                  ]}
                >
                  {workingOnCount}/{MAX_LENGTH}
                </Text>
              </View>
              <Text style={styles.description}>
                Tell others about your current projects, goals, or areas of focus -
                both professional and personal.
              </Text>
              <TextInput
                style={styles.input}
                multiline
                placeholder="e.g., Launching an AI-powered analytics platform, learning Spanish, training for a marathon..."
                placeholderTextColor={colors.textSecondary}
                value={workingOn}
                onChangeText={setWorkingOn}
                maxLength={MAX_LENGTH + 50} // Allow slight overflow for better UX
                autoFocus
              />
            </View>
          </View>
        </ScrollView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </View>
    </Modal>
  );
};
