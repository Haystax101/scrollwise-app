import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, Switch, ScrollView } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { DateInput, validateDate, validateDateRange, dateInputToDbDate, dbDateToDateInput, formatPeriod, calculateDuration } from '../../utils/dateUtils';

interface Education {
  id?: string;
  university?: string;
  degree?: string;
  stage?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
}

interface EducationCardProps {
  education: Education[];
  userId: string;
  loading?: boolean;
  onRefresh?: () => Promise<void>;
}

interface StructuredEducationData {
  degreeName?: string;
  universityName?: string;
  fieldOfStudy?: string;
  startDate?: DateInput;
  endDate?: DateInput;
  isCurrent?: boolean;
}

export const EducationCard: React.FC<EducationCardProps> = ({
  education,
  userId,
  loading = false,
  onRefresh
}) => {
  const { colors, isDark } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [formData, setFormData] = useState<StructuredEducationData>({});
  const [dateErrors, setDateErrors] = useState<{[key: string]: string}>({});
  const swipeableRefs = useRef<{[key: number]: Swipeable | null}>({});

  const handleAddEducation = () => {
    setEditingIndex(-1);
    setFormData({
      startDate: { month: '', year: '' },
      endDate: { month: '', year: '' }
    });
    setDateErrors({});
    setShowModal(true);
  };

  const handleEditEducation = (index: number) => {
    const edu = education[index];
    setEditingIndex(index);
    setFormData({
      degreeName: edu.degree || '',
      universityName: edu.university || '',
      fieldOfStudy: edu.stage || '',
      startDate: edu.startDate ? dbDateToDateInput(edu.startDate) : { month: '', year: '' },
      endDate: edu.endDate ? dbDateToDateInput(edu.endDate) : { month: '', year: '' },
      isCurrent: edu.period?.includes('Present') || edu.isCurrent || false
    });
    setDateErrors({});
    setShowModal(true);
  };

  const validateAndSave = () => {
    const errors: {[key: string]: string} = {};
    
    // Basic validation
    if (!formData.degreeName?.trim()) {
      errors.degreeName = 'Degree is required';
    }
    if (!formData.universityName?.trim()) {
      errors.universityName = 'University is required';
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
      const startDbDate = formData.startDate ? dateInputToDbDate(formData.startDate) : null;
      const endDbDate = !formData.isCurrent && formData.endDate ? dateInputToDbDate(formData.endDate) : null;
      
      const educationData = {
        user_id: userId,
        degree_name: formData.degreeName,
        university_name: formData.universityName,
        field_of_study: formData.fieldOfStudy || null,
        start_date: startDbDate,
        end_date: endDbDate,
        is_current: formData.isCurrent || false
      };

      const { error } = await supabase.from('user_education').insert(educationData);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Education added successfully!');
      setShowModal(false);
      setFormData({});
      setDateErrors({});

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error saving education:', error);
      Alert.alert('Error', 'Failed to save education.');
    }
  };

  const handleDeleteEducation = async (index: number) => {
    Alert.alert(
      'Delete Education',
      'Are you sure you want to delete this education entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const edu = education[index];
              console.log('DELETE_EDUCATION_ATTEMPT', {
                index,
                eduId: edu.id,
                eduData: edu,
                userId,
                hasEduId: !!edu.id,
                hasUserId: !!userId,
              });
              
              if (!edu.id) {
                console.warn('DELETE_EDUCATION_SKIPPED: No edu.id found', { edu });
                Alert.alert('Error', 'Cannot delete: Education entry has no ID.');
                return;
              }
              
              if (!userId) {
                console.warn('DELETE_EDUCATION_SKIPPED: No userId found', { userId });
                Alert.alert('Error', 'Cannot delete: User not authenticated.');
                return;
              }
              
              const { error, status, statusText, data } = await supabase
                .from('user_education')
                .delete()
                .eq('id', edu.id)
                .eq('user_id', userId)
                .select(); // Add select to see what was actually deleted
              
              console.log('DELETE_EDUCATION_RESULT', {
                error,
                status,
                statusText,
                deletedData: data,
                errorCode: (error as any)?.code,
                errorMessage: error?.message,
                errorDetails: (error as any)?.details,
                errorHint: (error as any)?.hint,
              });
              
              if (error) {
                console.error('DELETE_EDUCATION_ERROR', {
                  table: 'user_education',
                  eduId: edu.id,
                  userId,
                  status,
                  code: (error as any)?.code,
                  details: (error as any)?.details,
                  hint: (error as any)?.hint,
                  message: error.message,
                });
                throw error;
              }
              
              console.log('DELETE_EDUCATION_SUCCESS', {
                deletedCount: data?.length || 0,
                deletedItems: data,
              });
              
              if (onRefresh) {
                console.log('REFRESH_EDUCATION_DATA: Calling onRefresh');
                await onRefresh();
              }
              
              // Close the swipeable
              if (swipeableRefs.current[index]) {
                swipeableRefs.current[index]?.close();
              }
            } catch (error) {
              console.error('DELETE_EDUCATION_EXCEPTION:', {
                error,
                errorName: (error as any)?.name,
                errorMessage: (error as any)?.message,
                errorStack: (error as any)?.stack,
              });
              Alert.alert('Error', `Failed to delete education: ${(error as any)?.message || 'Unknown error'}`);
            }
          }
        }
      ]
    );
  };

  const renderRightActions = (index: number) => (
    <TouchableOpacity
      onPress={() => handleDeleteEducation(index)}
      style={styles.rightActionContainer}
      accessibilityLabel="Delete education"
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
    educationList: {
      gap: 16,
    },
    educationItem: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: isDark ? 0 : 1,
      borderColor: isDark ? 'transparent' : colors.border,
      padding: 20,
    },
    educationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    degreeTitle: {
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
    university: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    universityText: {
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
    gpaContainer: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(234, 179, 8, 0.2)',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginTop: 8,
    },
    gpaText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    addButton: {
      alignItems: 'center',
      marginTop: 16,
      paddingVertical: 8,
    },
    addButtonText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
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
            <Feather name="book-open" size={24} color={colors.primary} />
          </View>
          <Text style={styles.title}>Education</Text>
        </View>
        <Text style={styles.emptyText}>Loading education...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Feather name="book-open" size={24} color="#EAB308" />
        </View>
        <Text style={styles.title}>Education</Text>
      </View>

      {education && education.length > 0 ? (
        <GestureHandlerRootView style={styles.educationList}>
          {education.map((edu, index) => (
            <Swipeable
              key={index}
              ref={(ref) => {
                swipeableRefs.current[index] = ref;
              }}
              renderRightActions={() => renderRightActions(index)}
              friction={2}
              rightThreshold={40}
              overshootRight={false}
            >
              <TouchableOpacity 
                style={styles.educationItem}
                onPress={() => handleEditEducation(index)}
              >
              <View style={styles.educationHeader}>
                <Text style={styles.degreeTitle}>{edu.degree || 'Degree'}</Text>
                <Text style={styles.period}>
                  {edu.startDate ? formatPeriod(edu.startDate, edu.endDate, edu.isCurrent || false) : 'Period'}
                </Text>
              </View>
              
              <View style={styles.university}>
                <Feather name="book-open" size={16} color={colors.primary} />
                <Text style={styles.universityText}>{edu.university || 'Institution'}</Text>
              </View>
              
              {edu.startDate && edu.endDate && !edu.isCurrent && (
                <Text style={styles.duration}>
                  {calculateDuration(edu.startDate, edu.endDate)}
                </Text>
              )}

              {edu.stage && edu.stage.includes('3.') && (
                <View style={styles.gpaContainer}>
                  <Text style={styles.gpaText}>GPA: {edu.stage}</Text>
                </View>
              )}
              </TouchableOpacity>
            </Swipeable>
          ))}
        </GestureHandlerRootView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Add your educational background
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.addButton} onPress={handleAddEducation}>
        <Text style={styles.addButtonText}>+ Add education</Text>
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
                {editingIndex >= 0 ? 'Edit' : 'Add'} Education
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
                <Text style={styles.formLabel}>Degree *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.degreeName || ''}
                  onChangeText={(text) => setFormData({...formData, degreeName: text})}
                  placeholder="e.g. Bachelor of Science"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>University/Institution *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.universityName || ''}
                  onChangeText={(text) => setFormData({...formData, universityName: text})}
                  placeholder="e.g. University of Cambridge"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Field of Study</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.fieldOfStudy || ''}
                  onChangeText={(text) => setFormData({...formData, fieldOfStudy: text})}
                  placeholder="e.g. Computer Science"
                  placeholderTextColor={colors.textTertiary}
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
                <Text style={styles.switchLabel}>I currently study here</Text>
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