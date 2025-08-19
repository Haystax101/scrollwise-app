import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

interface Education {
  university?: string;
  degree?: string;
  stage?: string;
  period?: string;
}

interface Experience {
  company?: string;
  role?: string;
  period?: string;
  description?: string;
}

interface Project {
  title: string;
  description: string;
}

interface ProfileData {
  summary?: string;
  education?: Education[];
  experience?: Experience[];
  projects?: Project[];
  skills?: string[];
}

interface ProfileCustomizationSectionsProps {
  profileData: ProfileData;
  userId: string;
  onDataUpdate: (data: ProfileData) => void;
  loading?: boolean;
}

type EditableSection = 'summary' | 'education' | 'experience' | 'projects' | 'skills' | null;

export const ProfileCustomizationSections: React.FC<ProfileCustomizationSectionsProps> = ({
  profileData,
  userId,
  onDataUpdate,
  loading = false
}) => {
  const { colors, isDark } = useTheme();
  const [editingSection, setEditingSection] = useState<EditableSection>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  const handleEditSection = (section: EditableSection, currentValue: string) => {
    setEditingSection(section);
    setEditingValue(currentValue);
  };

  const handleSaveSection = async () => {
    if (!editingSection || !userId) return;
    
    try {
      if (editingSection === 'summary' || editingSection === 'skills') {
        // Save to profile_sections table
        await supabase
          .from('profile_sections')
          .upsert({
            user_id: userId,
            section_type: editingSection,
            content: editingValue
          });
        
        const updatedData = {
          ...profileData,
          [editingSection]: editingSection === 'skills' 
            ? editingValue.split(',').map(s => s.trim()).filter(s => s) 
            : editingValue
        };
        onDataUpdate(updatedData);
      }
      
      Alert.alert('Success', `${editingSection} updated successfully!`);
    } catch (error) {
      console.error('Error updating profile section:', error);
      Alert.alert('Error', 'Failed to update profile section.');
    } finally {
      setEditingSection(null);
      setEditingValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditingValue('');
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 20,
    },
    headerIcon: {
      marginRight: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    sectionsContainer: {
      paddingHorizontal: 20,
    },
    section: {
      backgroundColor: isDark ? colors.surface : colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.border : 'transparent',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionIcon: {
      marginRight: 8,
    },
    editButton: {
      backgroundColor: isDark ? colors.border : colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    editButtonText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    sectionContent: {
      minHeight: 40,
    },
    contentText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    emptyContent: {
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: 16,
    },
    workItem: {
      marginBottom: 16,
      paddingLeft: 16,
      borderLeftWidth: 2,
      borderLeftColor: colors.border,
    },
    workHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    workTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    workPeriod: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    workCompany: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    workDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    skillTag: {
      backgroundColor: isDark ? colors.border : colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
      marginBottom: 8,
    },
    skillText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    addButton: {
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      borderRadius: 16,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    addButtonText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
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

  const renderSection = (
    sectionKey: string,
    title: string,
    icon: string,
    content: React.ReactNode,
    emptyText: string,
    hasContent: boolean
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitle}>
          <View style={styles.sectionIcon}>
            <Feather name={icon as any} size={20} color={colors.primary} />
          </View>
          <Text style={[styles.sectionTitle, { marginLeft: 0 }]}>{title}</Text>
        </View>
        {hasContent && (
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => handleEditSection(
              sectionKey as EditableSection, 
              sectionKey === 'skills' 
                ? (profileData.skills || []).join(', ')
                : profileData.summary || ''
            )}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.sectionContent}>
        {hasContent ? content : (
          <Text style={styles.emptyContent}>{emptyText}</Text>
        )}
        {!hasContent && (
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => handleEditSection(sectionKey as EditableSection, '')}
          >
            <Text style={styles.addButtonText}>+ Add {title}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Feather name="user" size={20} color={colors.primary} />
          </View>
          <Text style={styles.title}>Profile Sections</Text>
        </View>
        <Text style={styles.emptyContent}>Loading profile sections...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Feather name="user" size={20} color={colors.primary} />
        </View>
        <Text style={styles.title}>Profile Sections</Text>
      </View>
      
      <ScrollView style={styles.sectionsContainer} showsVerticalScrollIndicator={false}>
        {/* Summary Section */}
        {renderSection(
          'summary',
          'Summary',
          'user',
          <Text style={styles.contentText}>{profileData.summary}</Text>,
          'Add a professional summary to introduce yourself',
          !!profileData.summary
        )}

        {/* Work Experience Section */}
        {renderSection(
          'experience',
          'Work Experience',
          'briefcase',
          profileData.experience?.map((exp, index) => (
            <View key={index} style={styles.workItem}>
              <View style={styles.workHeader}>
                <Text style={styles.workTitle}>{exp.role || 'Role'}</Text>
                <Text style={styles.workPeriod}>{exp.period || 'Period'}</Text>
              </View>
              <View style={styles.workCompany}>
                <Feather name="building" size={14} color={colors.textSecondary} />
                <Text style={[styles.workCompany, { marginLeft: 4, marginBottom: 0 }]}>
                  {exp.company || 'Company'}
                </Text>
              </View>
              {exp.description && (
                <Text style={styles.workDescription}>{exp.description}</Text>
              )}
            </View>
          )),
          'Add your work experience to showcase your professional journey',
          !!(profileData.experience && profileData.experience.length > 0)
        )}

        {/* Education Section */}
        {renderSection(
          'education',
          'Education',
          'book-open',
          profileData.education?.map((edu, index) => (
            <View key={index} style={styles.workItem}>
              <View style={styles.workHeader}>
                <Text style={styles.workTitle}>{edu.degree || 'Degree'}</Text>
                <Text style={styles.workPeriod}>{edu.period || 'Period'}</Text>
              </View>
              <View style={styles.workCompany}>
                <Feather name="book-open" size={14} color={colors.textSecondary} />
                <Text style={[styles.workCompany, { marginLeft: 4, marginBottom: 0 }]}>
                  {edu.university || 'Institution'}
                </Text>
              </View>
              {edu.stage && (
                <Text style={styles.workDescription}>{edu.stage}</Text>
              )}
            </View>
          )),
          'Add your educational background',
          !!(profileData.education && profileData.education.length > 0)
        )}

        {/* Skills Section */}
        {renderSection(
          'skills',
          'Skills',
          'code',
          (
            <View style={styles.skillsContainer}>
              {profileData.skills?.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          ),
          'Add your skills and expertise areas',
          !!(profileData.skills && profileData.skills.length > 0)
        )}

        {/* Projects Section */}
        {renderSection(
          'projects',
          'Projects',
          'folder',
          profileData.projects?.map((project, index) => (
            <View key={index} style={styles.workItem}>
              <Text style={styles.workTitle}>{project.title}</Text>
              <Text style={styles.workDescription}>{project.description}</Text>
            </View>
          )),
          'Showcase your projects and achievements',
          !!(profileData.projects && profileData.projects.length > 0)
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editingSection !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit {editingSection}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleCancelEdit}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[
                styles.textInput,
                editingSection === 'summary' ? { height: 120 } : { height: 80 }
              ]}
              value={editingValue}
              onChangeText={setEditingValue}
              placeholder={`Enter your ${editingSection}...`}
              placeholderTextColor={colors.textTertiary}
              multiline={true}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={handleCancelEdit}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleSaveSection}
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