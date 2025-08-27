import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, Switch, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { DatabaseAutocompleteInput } from '../onboarding/DatabaseAutocompleteInput';

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
  startDate?: string;
  endDate?: string;
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

  const handleAddExperience = () => {
    setEditingIndex(-1);
    setFormData({});
    setShowModal(true);
  };

  const handleEditExperience = (index: number) => {
    const exp = experiences[index];
    setEditingIndex(index);
    setFormData({
      positionTitle: exp.role || '',
      companyName: exp.company || '',
      description: exp.description || '',
      isCurrent: exp.period?.includes('Present') || false,
      employmentType: 'full-time'
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.positionTitle || !formData.companyName) {
      Alert.alert('Error', 'Position title and company name are required.');
      return;
    }

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

      const experienceData = {
        user_id: userId,
        position_title: formData.positionTitle,
        company_id: companyId,
        description: formData.description || null,
        start_date: formData.startDate || null,
        end_date: formData.isCurrent ? null : formData.endDate,
        is_current: formData.isCurrent || false,
        employment_type: formData.employmentType || 'full-time'
      };

      const { error } = await supabase.from('user_experiences').insert(experienceData);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Experience added successfully!');
      setShowModal(false);
      setFormData({});

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error saving experience:', error);
      Alert.alert('Error', 'Failed to save experience.');
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
    description: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      lineHeight: 20,
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
        <View style={styles.experienceList}>
          {experiences.map((exp, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.experienceItem}
              onPress={() => handleEditExperience(index)}
            >
              <View style={styles.experienceHeader}>
                <Text style={styles.positionTitle}>{exp.role || 'Position'}</Text>
                <Text style={styles.period}>{exp.period || 'Period'}</Text>
              </View>
              
              <View style={styles.company}>
                <Feather name="briefcase" size={16} color="#EAB308" />
                <Text style={styles.companyText}>{exp.company || 'Company'}</Text>
              </View>
              
              {exp.description && (
                <Text style={styles.description}>{exp.description}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
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

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>I currently work here</Text>
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