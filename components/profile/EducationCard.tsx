import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, Switch, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

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
  startDate?: string;
  endDate?: string;
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

  const handleAddEducation = () => {
    setEditingIndex(-1);
    setFormData({});
    setShowModal(true);
  };

  const handleEditEducation = (index: number) => {
    const edu = education[index];
    setEditingIndex(index);
    setFormData({
      degreeName: edu.degree || '',
      universityName: edu.university || '',
      fieldOfStudy: edu.stage || '',
      isCurrent: edu.period?.includes('Present') || false
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.degreeName || !formData.universityName) {
      Alert.alert('Error', 'Degree and university name are required.');
      return;
    }

    try {
      const educationData = {
        user_id: userId,
        degree_name: formData.degreeName,
        university_name: formData.universityName,
        field_of_study: formData.fieldOfStudy || null,
        start_date: formData.startDate || null,
        end_date: formData.isCurrent ? null : formData.endDate,
        is_current: formData.isCurrent || false
      };

      const { error } = await supabase.from('user_education').insert(educationData);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Education added successfully!');
      setShowModal(false);
      setFormData({});

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error saving education:', error);
      Alert.alert('Error', 'Failed to save education.');
    }
  };

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      marginBottom: 24,
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
      backgroundColor: isDark ? '#2D3748' : '#374151',
      borderRadius: 16,
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
      color: '#EAB308',
      fontWeight: '500',
    },
    addButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: '#EAB308',
      borderStyle: 'dashed',
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    addButtonText: {
      fontSize: 16,
      color: '#EAB308',
      fontWeight: '500',
    },
    emptyState: {
      backgroundColor: isDark ? '#2D3748' : '#374151',
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
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
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Feather name="book-open" size={24} color="#EAB308" />
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
        <View style={styles.educationList}>
          {education.map((edu, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.educationItem}
              onPress={() => handleEditEducation(index)}
            >
              <View style={styles.educationHeader}>
                <Text style={styles.degreeTitle}>{edu.degree || 'Degree'}</Text>
                <Text style={styles.period}>{edu.period || 'Period'}</Text>
              </View>
              
              <View style={styles.university}>
                <Feather name="book-open" size={16} color="#EAB308" />
                <Text style={styles.universityText}>{edu.university || 'Institution'}</Text>
              </View>

              {edu.stage && edu.stage.includes('3.') && (
                <View style={styles.gpaContainer}>
                  <Text style={styles.gpaText}>GPA: {edu.stage}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
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

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>I currently study here</Text>
                <Switch
                  value={formData.isCurrent || false}
                  onValueChange={(value) => setFormData({...formData, isCurrent: value})}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.card}
                />
              </View>
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
                onPress={handleSave}
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