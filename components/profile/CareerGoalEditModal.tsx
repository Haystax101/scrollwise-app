import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

interface CareerGoal {
  goal: string;
  timeframe: string;
  companies?: string[];
}

interface CareerGoalEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (goalData: CareerGoal) => void;
  currentGoal?: CareerGoal | null;
  userId: string;
}

const TIMEFRAME_OPTIONS = [
  { label: '6 months', value: '6 months' },
  { label: '1 year', value: '1 year' },
  { label: '2 years', value: '2 years' },
  { label: '3 years', value: '3 years' },
  { label: '5 years', value: '5 years' },
  { label: '10+ years', value: '10+ years' },
];

export const CareerGoalEditModal: React.FC<CareerGoalEditModalProps> = ({
  visible,
  onClose,
  onSave,
  currentGoal,
  userId
}) => {
  const { colors, isDark, getCardTextColor } = useTheme();
  const [goal, setGoal] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [companiesText, setCompaniesText] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialize form with current goal data
  useEffect(() => {
    if (currentGoal) {
      setGoal(currentGoal.goal || '');
      setTimeframe(currentGoal.timeframe || '');
      setCompaniesText(currentGoal.companies?.join(', ') || '');
    } else {
      setGoal('');
      setTimeframe('');
      setCompaniesText('');
    }
  }, [currentGoal, visible]);


  const handleSave = async () => {
    if (!goal.trim()) {
      Alert.alert('Error', 'Please enter your career goal');
      return;
    }

    if (!timeframe) {
      Alert.alert('Error', 'Please select a timeframe');
      return;
    }

    setSaving(true);
    try {
      // Save to database
      const goalData = {
        user_id: userId,
        goal: goal.trim(),
        timeframe,
        goal_type: 'career',
        status: 'active' // Use status column instead of is_active
      };

      // Delete existing career goals (keep other goal types)
      await supabase
        .from('user_goals')
        .delete()
        .eq('user_id', userId)
        .eq('goal_type', 'career'); // Only delete career goals

      // Insert new goal
      const { error: goalError } = await supabase
        .from('user_goals')
        .insert(goalData);

      if (goalError) {
        throw goalError;
      }

      // Clear existing goal companies first
      await supabase
        .from('user_goal_companies')
        .delete()
        .eq('user_id', userId);

      // Save companies if any
      if (companiesText.trim()) {
        const companyNames = companiesText.split(',').map(name => name.trim()).filter(name => name);

        for (const companyName of companyNames) {
          // Check if company exists
          const { data: existingCompany } = await supabase
            .from('companies')
            .select('id')
            .eq('name', companyName)
            .single();

          let companyId;
          if (existingCompany) {
            companyId = existingCompany.id;
          } else {
            // Create new company
            const { data: newCompany, error: companyError } = await supabase
              .from('companies')
              .insert({
                name: companyName,
                industry_sector: 'Technology' // Default
              })
              .select('id')
              .single();

            if (companyError) {
              console.error('Error creating company:', companyError);
              continue;
            }
            companyId = newCompany.id;
          }

          // Link company to user goal
          const { error: linkError } = await supabase
            .from('user_goal_companies')
            .insert({
              user_id: userId,
              company_id: companyId
            });

          if (linkError) {
            console.error('Error linking company to goal:', linkError);
          }
        }
      }

      // Call parent callback
      const companyNames = companiesText.trim() ? companiesText.split(',').map(name => name.trim()).filter(name => name) : [];
      onSave({
        goal: goal.trim(),
        timeframe,
        companies: companyNames
      });

      onClose();
    } catch (error) {
      console.error('Error saving career goal:', error);
      Alert.alert('Error', 'Failed to save career goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 24,
      width: '90%',
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    scrollContent: {
      flexGrow: 1,
    },
    section: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      backgroundColor: isDark ? colors.surface : colors.background,
      minHeight: 60,
      textAlignVertical: 'top',
    },
    timeframeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
    },
    timeframeOption: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      margin: 4,
    },
    timeframeOptionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    timeframeText: {
      fontSize: 14,
      color: colors.text,
    },
    timeframeTextSelected: {
      color: '#FFFFFF', // Always white for selected text on colored background
    },
    helperText: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 6,
    },
    buttonContainer: {
      flexDirection: 'row',
      marginTop: 24,
    },
    button: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 8,
    },
    cancelButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text,
    },
    saveButtonText: {
      color: '#FFFFFF', // Always white for button text
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {currentGoal ? 'Edit Career Goal' : 'Set Career Goal'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.label}>What's your career goal? *</Text>
              <TextInput
                style={styles.textInput}
                value={goal}
                onChangeText={setGoal}
                placeholder="e.g., Become a Senior Software Engineer"
                placeholderTextColor={colors.textTertiary}
                multiline
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Timeframe *</Text>
              <View style={styles.timeframeGrid}>
                {TIMEFRAME_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.timeframeOption,
                      timeframe === option.value && styles.timeframeOptionSelected
                    ]}
                    onPress={() => setTimeframe(option.value)}
                  >
                    <Text style={[
                      styles.timeframeText,
                      timeframe === option.value && styles.timeframeTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Target Companies (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={companiesText}
                onChangeText={setCompaniesText}
                placeholder="e.g., Google, Microsoft, Apple"
                placeholderTextColor={colors.textTertiary}
                multiline
              />
              <Text style={styles.helperText}>
                Separate multiple companies with commas
              </Text>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>
                {saving ? 'Saving...' : 'Save Goal'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};