import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, Switch, ScrollView } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { DatabaseAutocompleteInput } from '../onboarding/DatabaseAutocompleteInput';
import { DateInput, validateDate, validateDateRange, dateInputToDbDate, dbDateToDateInput, formatPeriod, calculateDuration } from '../../utils/dateUtils';

interface Experience {
  id?: string;
  company?: string;
  role?: string;
  period?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  employmentType?: string;
}

interface ExperienceCardProps {
  experiences: Experience[];
  userId: string;
  loading?: boolean;
  onRefresh?: () => Promise<void>;
}

interface StructuredExperienceData {
  positionTitle?: string;
  companyName?: string;
  description?: string;
  startDate?: DateInput;
  endDate?: DateInput;
  isCurrent?: boolean;
  employmentType?: string;
}

export const ExperienceCard: React.FC<ExperienceCardProps> = ({
  experiences,
  userId,
  loading = false,
  onRefresh
}) => {
  const { colors, isDark } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [formData, setFormData] = useState<StructuredExperienceData>({});
  const [dateErrors, setDateErrors] = useState<{[key: string]: string}>({});
  const [swipeableRefs, setSwipeableRefs] = useState<{[key: number]: Swipeable | null}>({});

  const handleAddExperience = () => {
    setEditingIndex(-1);
    setFormData({
      startDate: { month: '', year: '' },
      endDate: { month: '', year: '' }
    });
    setDateErrors({});
    setShowModal(true);
  };

  const handleEditExperience = (index: number) => {
    const exp = experiences[index];
    setEditingIndex(index);
    setFormData({
      positionTitle: exp.role || '',
      companyName: exp.company || '',
      description: exp.description || '',
      startDate: exp.startDate ? dbDateToDateInput(exp.startDate) : { month: '', year: '' },
      endDate: exp.endDate ? dbDateToDateInput(exp.endDate) : { month: '', year: '' },
      isCurrent: exp.period?.includes('Present') || exp.isCurrent || false,
      employmentType: exp.employmentType || 'full_time'
    });
    setDateErrors({});
    setShowModal(true);
  };

  const validateAndSave = () => {
    const errors: {[key: string]: string} = {};
    
    // Basic validation
    if (!formData.positionTitle?.trim()) {
      errors.positionTitle = 'Position title is required';
    }
    if (!formData.companyName?.trim()) {
      errors.companyName = 'Company name is required';
    }
    
    // Date validation
    if (!formData.startDate || !formData.startDate.month || !formData.startDate.year) {
      errors.startDate = 'Start date is required';
    } else {
      const startValidation = validateDate(formData.startDate);
      if (!startValidation.isValid) {
        errors.startDate = startValidation.error!;
      }
    }
    
    if (!formData.isCurrent) {
      if (!formData.endDate || !formData.endDate.month || !formData.endDate.year) {
        errors.endDate = 'End date is required';
      } else {
        const endValidation = validateDate(formData.endDate);
        if (!endValidation.isValid) {
          errors.endDate = endValidation.error!;
        } else if (formData.startDate && formData.startDate.month && formData.startDate.year) {
          const rangeValidation = validateDateRange(formData.startDate, formData.endDate);
          if (!rangeValidation.isValid) {
            errors.endDate = rangeValidation.error!;
          }
        }
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setDateErrors(errors);
      return;
    }
    
    handleSave();
  };

  const handleSave = async () => {
    try {
      // Find or create company
      let companyId;
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .ilike('name', formData.companyName)
        .single();

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({ name: formData.companyName })
          .select('id')
          .single();

        if (companyError) throw companyError;
        companyId = newCompany.id;
      }

      const startDbDate = formData.startDate ? dateInputToDbDate(formData.startDate) : null;
      const endDbDate = !formData.isCurrent && formData.endDate ? dateInputToDbDate(formData.endDate) : null;

      const experienceData = {
        user_id: userId,
        position_title: formData.positionTitle,
        company_id: companyId,
        description: formData.description || null,
        start_date: startDbDate,
        end_date: endDbDate,
        is_current: formData.isCurrent || false,
        employment_type: formData.employmentType || 'full_time'
      };

      const { error } = await supabase.from('user_experiences').insert(experienceData);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Experience added successfully!');
      setShowModal(false);
      setFormData({});
      setDateErrors({});

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error saving experience:', error);
      Alert.alert('Error', 'Failed to save experience.');
    }
  };

  const handleDeleteExperience = async (index: number) => {
    Alert.alert(
      'Delete Experience',
      'Are you sure you want to delete this work experience?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const exp = experiences[index];
              if (exp.id) {
                const { error } = await supabase
                  .from('user_experiences')
                  .delete()
                  .eq('id', exp.id)
                  .eq('user_id', userId);
                
                if (error) throw error;
              }
              
              if (onRefresh) {
                await onRefresh();
              }
              
              // Close the swipeable
              if (swipeableRefs[index]) {
                swipeableRefs[index]?.close();
              }
            } catch (error) {
              console.error('Error deleting experience:', error);
              Alert.alert('Error', 'Failed to delete experience.');
            }
          }
        }
      ]
    );
  };

  const renderRightActions = (index: number) => (
    <TouchableOpacity
      onPress={() => handleDeleteExperience(index)}
      style={styles.rightActionContainer}
      accessibilityLabel="Delete experience"
      accessibilityRole="button"
      activeOpacity={0.8}
    >
      <FontAwesome name="trash" size={18} color="#fff" />
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isDark ? colors.surface : colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      marginHorizontal: 20,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.border : 'transparent',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerIcon: {
      marginRight: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    experienceList: {
      gap: 16,
    },
    experienceItem: {
      backgroundColor: isDark ? '#2D3748' : '#374151',
      borderRadius: 16,
      padding: 20,
    },
    experienceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    positionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: 'white',
      flex: 1,
    },
    period: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.7)',
      marginLeft: 16,
    },
    company: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    companyText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
      marginLeft: 4,
    },
    duration: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.6)',
      marginBottom: 8,
      fontStyle: 'italic',
    },
    description: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      lineHeight: 20,
    },
    addButton: {
      alignItems: 'center',
      marginTop: 16,
      paddingVertical: 8,
    },
    addButtonText: {
      fontSize: 16,
      color: '#EAB308',
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyText: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'center',
      marginBottom: 16,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      margin: 20,
      borderRadius: 16,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    formRow: {
      marginBottom: 16,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.inputBackground,
      textAlignVertical: 'top',
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    switchLabel: {
      fontSize: 14,
      color: colors.text,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 16,
    },
    modalButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      marginLeft: 8,
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    cancelButton: {
      backgroundColor: colors.textTertiary,
    },
    modalButtonText: {
      color: 'white',
      fontWeight: '600',
    },
    dateRow: {
      flexDirection: 'row',
      gap: 12,
    },
    dateInputContainer: {
      flex: 1,
    },
    dateLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    dateInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.inputBackground,
    },
    errorInput: {
      borderColor: '#EF4444',
    },
    errorText: {
      fontSize: 12,
      color: '#EF4444',
      marginTop: 4,
    },
    rightActionContainer: {
      width: 80,
      backgroundColor: '#dc2626',
      justifyContent: 'center',
      alignItems: 'center',
      borderTopRightRadius: 12,
      borderBottomRightRadius: 12,
      marginVertical: 6,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Feather name="briefcase" size={24} color="#EAB308" />
          </View>
          <Text style={styles.title}>Work Experience</Text>
        </View>
        <Text style={styles.emptyText}>Loading experience...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Feather name="briefcase" size={24} color="#EAB308" />
        </View>
        <Text style={styles.title}>Work Experience</Text>
      </View>

      {experiences && experiences.length > 0 ? (
        <GestureHandlerRootView style={styles.experienceList}>
          {experiences.map((exp, index) => (
            <Swipeable
              key={index}
              ref={(ref) => {
                if (ref) {
                  setSwipeableRefs(prev => ({...prev, [index]: ref}));
                }
              }}
              renderRightActions={() => renderRightActions(index)}
              friction={2}
              rightThreshold={40}
              overshootRight={false}
            >
              <TouchableOpacity 
                style={styles.experienceItem}
                onPress={() => handleEditExperience(index)}
              >
              <View style={styles.experienceHeader}>
                <Text style={styles.positionTitle}>{exp.role || 'Position'}</Text>
                <Text style={styles.period}>
                  {exp.startDate ? formatPeriod(exp.startDate, exp.endDate, exp.isCurrent || false) : 'Period'}
                </Text>
              </View>
              
              <View style={styles.company}>
                <Feather name="briefcase" size={16} color="#EAB308" />
                <Text style={styles.companyText}>{exp.company || 'Company'}</Text>
              </View>
              
              {exp.startDate && exp.endDate && !exp.isCurrent && (
                <Text style={styles.duration}>
                  {calculateDuration(exp.startDate, exp.endDate)}
                </Text>
              )}
              
              {exp.description && (
                <Text style={styles.description}>{exp.description}</Text>
              )}
              </TouchableOpacity>
            </Swipeable>
          ))}
        </GestureHandlerRootView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Add your work experience to showcase your professional journey
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.addButton} onPress={handleAddExperience}>
        <Text style={styles.addButtonText}>+ Add experience</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingIndex >= 0 ? 'Edit' : 'Add'} Experience
              </Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setShowModal(false)}
              >
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Position Title *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.positionTitle || ''}
                  onChangeText={(text) => setFormData({...formData, positionTitle: text})}
                  placeholder="e.g. Software Engineer"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Company *</Text>
                <DatabaseAutocompleteInput
                  label=""
                  value={formData.companyName || ''}
                  onChangeText={(text) => setFormData({...formData, companyName: text})}
                  onSelect={(item) => setFormData({...formData, companyName: item.name})}
                  searchType="companies"
                  placeholder="e.g. Google, Microsoft"
                  maxResults={5}
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, { height: 80 }]}
                  value={formData.description || ''}
                  onChangeText={(text) => setFormData({...formData, description: text})}
                  placeholder="Describe your role and achievements..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Start Date *</Text>
                <View style={styles.dateRow}>
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateLabel}>Month</Text>
                    <TextInput
                      style={[styles.dateInput, dateErrors.startDate && styles.errorInput]}
                      value={formData.startDate?.month || ''}
                      onChangeText={(text) => {
                        setFormData({...formData, startDate: {...formData.startDate!, month: text}});
                        if (dateErrors.startDate) {
                          const newErrors = {...dateErrors};
                          delete newErrors.startDate;
                          setDateErrors(newErrors);
                        }
                      }}
                      placeholder="Jan"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateLabel}>Year</Text>
                    <TextInput
                      style={[styles.dateInput, dateErrors.startDate && styles.errorInput]}
                      value={formData.startDate?.year || ''}
                      onChangeText={(text) => {
                        setFormData({...formData, startDate: {...formData.startDate!, year: text}});
                        if (dateErrors.startDate) {
                          const newErrors = {...dateErrors};
                          delete newErrors.startDate;
                          setDateErrors(newErrors);
                        }
                      }}
                      placeholder="2020"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                {dateErrors.startDate && (
                  <Text style={styles.errorText}>{dateErrors.startDate}</Text>
                )}
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>I currently work here</Text>
                <Switch
                  value={formData.isCurrent || false}
                  onValueChange={(value) => {
                    setFormData({...formData, isCurrent: value});
                    if (value && dateErrors.endDate) {
                      const newErrors = {...dateErrors};
                      delete newErrors.endDate;
                      setDateErrors(newErrors);
                    }
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.card}
                />
              </View>

              {!formData.isCurrent && (
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>End Date *</Text>
                  <View style={styles.dateRow}>
                    <View style={styles.dateInputContainer}>
                      <Text style={styles.dateLabel}>Month</Text>
                      <TextInput
                        style={[styles.dateInput, dateErrors.endDate && styles.errorInput]}
                        value={formData.endDate?.month || ''}
                        onChangeText={(text) => {
                          setFormData({...formData, endDate: {...formData.endDate!, month: text}});
                          if (dateErrors.endDate) {
                            const newErrors = {...dateErrors};
                            delete newErrors.endDate;
                            setDateErrors(newErrors);
                          }
                        }}
                        placeholder="Dec"
                        placeholderTextColor={colors.textTertiary}
                      />
                    </View>
                    <View style={styles.dateInputContainer}>
                      <Text style={styles.dateLabel}>Year</Text>
                      <TextInput
                        style={[styles.dateInput, dateErrors.endDate && styles.errorInput]}
                        value={formData.endDate?.year || ''}
                        onChangeText={(text) => {
                          setFormData({...formData, endDate: {...formData.endDate!, year: text}});
                          if (dateErrors.endDate) {
                            const newErrors = {...dateErrors};
                            delete newErrors.endDate;
                            setDateErrors(newErrors);
                          }
                        }}
                        placeholder="2024"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  {dateErrors.endDate && (
                    <Text style={styles.errorText}>{dateErrors.endDate}</Text>
                  )}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={validateAndSave}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};