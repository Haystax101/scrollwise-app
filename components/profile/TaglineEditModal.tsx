import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

interface TaglineEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (tagline: string | null) => void;
  userId: string;
  currentTagline: string | null;
}

export const TaglineEditModal: React.FC<TaglineEditModalProps> = ({
  visible,
  onClose,
  onSave,
  userId,
  currentTagline,
}) => {
  const { colors } = useTheme();
  const [tagline, setTagline] = useState('');
  const [saving, setSaving] = useState(false);

  // Character limit
  const MAX_LENGTH = 100;

  useEffect(() => {
    if (visible) {
      setTagline(currentTagline || '');
    }
  }, [visible, currentTagline]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const trimmedTagline = tagline.trim();
      const finalTagline = trimmedTagline || null;

      const { error } = await supabase
        .from('profiles')
        .update({ tagline: finalTagline })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      console.log('✅ Tagline saved successfully');
      onSave(finalTagline);
    } catch (error) {
      console.error('Error saving tagline:', error);
      Alert.alert(
        'Error',
        'Failed to save your tagline. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    Alert.alert(
      'Remove Tagline',
      'Are you sure you want to remove your tagline?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ tagline: null })
                .eq('id', userId);

              if (error) {
                throw error;
              }

              console.log('✅ Tagline removed successfully');
              onSave(null);
            } catch (error) {
              console.error('Error removing tagline:', error);
              Alert.alert(
                'Error',
                'Failed to remove your tagline. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
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
      paddingVertical: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
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
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    input: {
      backgroundColor: colors.inputBackground || colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      minHeight: 50,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputFocused: {
      borderColor: colors.primary,
    },
    removeButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.error || '#FF6B6B',
      borderRadius: 8,
      marginTop: 16,
    },
    removeButtonText: {
      color: colors.error || '#FF6B6B',
      fontSize: 14,
      fontWeight: '600',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const characterCount = tagline.length;
  const canSave = !saving;

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
          <Text style={styles.title}>Edit Tagline</Text>
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

        <View style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your tagline</Text>
              <Text
                style={[
                  styles.characterCount,
                  characterCount > MAX_LENGTH && styles.characterCountWarning,
                ]}
              >
                {characterCount}/{MAX_LENGTH}
              </Text>
            </View>
            <Text style={styles.description}>
              Write a short tagline that describes you. This appears below your name on your profile.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Building the future of AI • Stanford CS • Coffee enthusiast"
              placeholderTextColor={colors.textSecondary}
              value={tagline}
              onChangeText={setTagline}
              maxLength={MAX_LENGTH + 10} // Allow slight overflow for better UX
              multiline={false}
            />

            {currentTagline && (
              <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
                <Text style={styles.removeButtonText}>Remove tagline</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {saving && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </View>
    </Modal>
  );
};