import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

interface EditInsightModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  initialContent: string;
  insightId: string;
}

export const EditInsightModal: React.FC<EditInsightModalProps> = ({
  visible,
  onClose,
  onSave,
  initialContent,
  insightId
}) => {
  const { colors } = useTheme();
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Insight content cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('insights')
        .update({ content: content.trim() })
        .eq('id', insightId);

      if (error) {
        throw error;
      }

      onSave(content.trim());
      onClose();
      Alert.alert('Success', 'Insight updated successfully!');
    } catch (error) {
      console.error('Error updating insight:', error);
      Alert.alert('Error', 'Failed to update insight. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setContent(initialContent);
    onClose();
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 16,
      margin: 20,
      width: '90%',
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    contentContainer: {
      padding: 20,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.inputBackground,
      textAlignVertical: 'top',
      minHeight: 150,
      maxHeight: 300,
    },
    characterCount: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'right',
      marginTop: 8,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    button: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      marginLeft: 12,
    },
    cancelButton: {
      backgroundColor: colors.textTertiary,
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    disabledButton: {
      opacity: 0.5,
    },
    buttonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 16,
    },
  });

  const maxLength = 1000; // Set a reasonable max length for insights
  const remainingChars = maxLength - content.length;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={handleCancel}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Insight</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={handleCancel}
              >
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.contentContainer}>
              <TextInput
                style={styles.textInput}
                value={content}
                onChangeText={setContent}
                placeholder="Share your insight..."
                placeholderTextColor={colors.textTertiary}
                multiline={true}
                maxLength={maxLength}
                editable={!saving}
              />
              <Text 
                style={[
                  styles.characterCount,
                  remainingChars < 50 && { color: colors.error }
                ]}
              >
                {remainingChars} characters remaining
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={saving}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.button, 
                  styles.saveButton,
                  (saving || !content.trim()) && styles.disabledButton
                ]}
                onPress={handleSave}
                disabled={saving || !content.trim()}
              >
                <Text style={styles.buttonText}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};