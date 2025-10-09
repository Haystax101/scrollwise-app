import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { streakService } from '../../services/streakService';

interface StreakEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  userId: string;
  currentTarget: number;
}

export const StreakEditModal: React.FC<StreakEditModalProps> = ({
  visible,
  onClose,
  onSave,
  userId,
  currentTarget,
}) => {
  const { colors } = useTheme();
  const [targetDays, setTargetDays] = useState(currentTarget.toString());
  const [saving, setSaving] = useState(false);

  const presetTargets = [7, 14, 30, 60, 100];

  const handleSave = async () => {
    const target = parseInt(targetDays);

    if (isNaN(target) || target < 1 || target > 365) {
      Alert.alert('Invalid Target', 'Please enter a number between 1 and 365 days.');
      return;
    }

    try {
      setSaving(true);
      const success = await streakService.updateStreakTarget(userId, target);

      if (success) {
        onSave();
      } else {
        Alert.alert('Error', 'Failed to update streak target. Please try again.');
      }
    } catch (error) {
      console.error('Error updating streak target:', error);
      Alert.alert('Error', 'Failed to update streak target. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePresetSelect = (days: number) => {
    setTargetDays(days.toString());
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      width: '90%',
      maxWidth: 400,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    description: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 24,
      lineHeight: 22,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    presetGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    presetButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    presetButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    presetText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    presetTextSelected: {
      color: 'white',
    },
    inputContainer: {
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
    },
    inputFocused: {
      borderColor: colors.primary,
    },
    inputHint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    saveButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      fontSize: 16,
      color: 'white',
      fontWeight: '600',
    },
  });

  const isValidTarget = () => {
    const target = parseInt(targetDays);
    return !isNaN(target) && target >= 1 && target <= 365;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose}>
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Streak Goal</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Set your daily learning streak goal. This helps you stay motivated and track your progress.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Select</Text>
            <View style={styles.presetGrid}>
              {presetTargets.map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.presetButton,
                    parseInt(targetDays) === days && styles.presetButtonSelected,
                  ]}
                  onPress={() => handlePresetSelect(days)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      parseInt(targetDays) === days && styles.presetTextSelected,
                    ]}
                  >
                    {days} days
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Custom Goal</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  !isValidTarget() && { borderColor: colors.error || '#EF4444' },
                ]}
                value={targetDays}
                onChangeText={setTargetDays}
                placeholder="Enter number of days"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.inputHint}>
                Enter a goal between 1 and 365 days
              </Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!isValidTarget() || saving) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!isValidTarget() || saving}
            >
              {saving ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.saveButtonText}>Saving...</Text>
                </>
              ) : (
                <Text style={styles.saveButtonText}>Save Goal</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};