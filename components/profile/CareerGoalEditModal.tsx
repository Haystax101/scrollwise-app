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
import { DatabaseAutocompleteInput } from '../onboarding/DatabaseAutocompleteInput';
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
  const { colors, isDark } = useTheme();
  const [goal, setGoal] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [companySearchValue, setCompanySearchValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialize form with current goal data
  useEffect(() => {
    if (currentGoal) {
      setGoal(currentGoal.goal || '');
      setTimeframe(currentGoal.timeframe || '');
      setSelectedCompanies(currentGoal.companies || []);
    } else {
      setGoal('');
      setTimeframe('');
      setSelectedCompanies([]);
    }
    setCompanySearchValue(''); // Always clear the search input when modal opens
  }, [currentGoal, visible]);

  const handleAddCompany = (companyName: string) => {
    if (companyName && !selectedCompanies.includes(companyName)) {
      setSelectedCompanies([...selectedCompanies, companyName]);
      setCompanySearchValue(''); // Clear the search input after adding
    }
  };

  const handleRemoveCompany = (companyName: string) => {
    setSelectedCompanies(selectedCompanies.filter(c => c !== companyName));
  };

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
        target_level: 'Professional', // Default value
        is_active: true
      };

      // Delete existing goal
      await supabase
        .from('user_goals')
        .delete()
        .eq('user_id', userId)
        .neq('goal', 'maintain_learning_streak'); // Don't delete streak goals

      // Insert new goal
      const { error: goalError } = await supabase
        .from('user_goals')
        .insert(goalData);

      if (goalError) {
        throw goalError;
      }

      // Save companies if any
      if (selectedCompanies.length > 0) {
        // First, get or create company records
        for (const companyName of selectedCompanies) {
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
      onSave({
        goal: goal.trim(),
        timeframe,
        companies: selectedCompanies
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
      color: 'white',
    },
    companiesContainer: {
      marginTop: 12,
    },
    companyTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    companyTag: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    companyTagText: {
      color: 'white',
      fontSize: 14,
      marginRight: 4,
    },
    removeButton: {
      padding: 2,
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
      color: 'white',
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
              <DatabaseAutocompleteInput
                label="Add companies you're interested in"
                value={companySearchValue}
                onChangeText={setCompanySearchValue}
                onSelect={(item) => handleAddCompany(item.title)}
                searchType="companies"
                placeholder="Search for companies..."
              />
              
              {selectedCompanies.length > 0 && (
                <View style={styles.companiesContainer}>
                  <View style={styles.companyTags}>
                    {selectedCompanies.map((company, index) => (
                      <View key={index} style={styles.companyTag}>
                        <Text style={styles.companyTagText}>{company}</Text>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemoveCompany(company)}
                        >
                          <Feather name="x" size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}
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