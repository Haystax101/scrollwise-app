import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { DatabaseAutocompleteInput } from '../onboarding/DatabaseAutocompleteInput';

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

interface Project {
  id?: string;
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
  status?: string;
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
  onRefresh?: () => Promise<void>;
  loading?: boolean;
}

type EditableSection = 'summary' | 'education' | 'experience' | 'projects' | 'skills' | null;
type EditMode = 'text' | 'structured';

interface StructuredEditData {
  // Experience fields
  positionTitle?: string;
  companyName?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  employmentType?: string;
  
  // Education fields
  degreeName?: string;
  universityName?: string;
  fieldOfStudy?: string;
  
  // Project fields
  projectTitle?: string;
  projectDescription?: string;
  projectStatus?: string;
}

export const ProfileCustomizationSections: React.FC<ProfileCustomizationSectionsProps> = ({
  profileData,
  userId,
  onDataUpdate,
  onRefresh,
  loading = false
}) => {
  const { colors, isDark } = useTheme();
  const [editingSection, setEditingSection] = useState<EditableSection>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [editMode, setEditMode] = useState<EditMode>('text');
  const [structuredData, setStructuredData] = useState<StructuredEditData>({});
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  const handleEditSection = (section: EditableSection, currentValue: string, index: number = -1) => {
    setEditingSection(section);
    setEditingValue(currentValue);
    setEditingIndex(index);
    
    if (section === 'summary' || section === 'skills') {
      setEditMode('text');
    } else {
      setEditMode('structured');
      
      // Populate structured data if editing existing item
      if (index >= 0) {
        if (section === 'experience' && profileData.experience?.[index]) {
          const exp = profileData.experience[index];
          setStructuredData({
            positionTitle: exp.role || '',
            companyName: exp.company || '',
            description: exp.description || '',
            isCurrent: exp.period?.includes('Present') || false,
            employmentType: 'full-time'
          });
        } else if (section === 'education' && profileData.education?.[index]) {
          const edu = profileData.education[index];
          setStructuredData({
            degreeName: edu.degree || '',
            universityName: edu.university || '',
            fieldOfStudy: edu.stage || '',
            isCurrent: edu.period?.includes('Present') || false
          });
        } else if (section === 'projects' && profileData.projects?.[index]) {
          const proj = profileData.projects[index];
          setStructuredData({
            projectTitle: proj.title || '',
            projectDescription: proj.description || '',
            projectStatus: 'completed'
          });
        }
      } else {
        // Reset for new item
        setStructuredData({});
      }
    }
  };

  const handleSaveSection = async () => {
    if (!editingSection || !userId) return;
    
    try {
      if (editingSection === 'summary') {
        // Save summary to profile_sections table (keep as text blob)
        await supabase
          .from('profile_sections')
          .upsert({
            user_id: userId,
            section_type: editingSection,
            content: editingValue
          });
        
        const updatedData = {
          ...profileData,
          summary: editingValue
        };
        onDataUpdate(updatedData);
        
      } else if (editingSection === 'skills') {
        // Parse skills and save to user_skills table
        const skillsArray = editingValue.split(',').map(s => s.trim()).filter(s => s);
        
        // First, delete existing skills for this user
        await supabase
          .from('user_skills')
          .delete()
          .eq('user_id', userId);
        
        // Insert new skills
        if (skillsArray.length > 0) {
          const skillsData = skillsArray.map(skill => ({
            user_id: userId,
            skill_name: skill,
            proficiency_level: 'intermediate', // Default proficiency
            is_featured: true,
            endorsement_count: 0
          }));
          
          await supabase
            .from('user_skills')
            .insert(skillsData);
        }
        
        const updatedData = {
          ...profileData,
          skills: skillsArray
        };
        onDataUpdate(updatedData);
        
      } else if (editingSection === 'experience') {
        await handleSaveExperience();
        
      } else if (editingSection === 'education') {
        await handleSaveEducation();
        
      } else if (editingSection === 'projects') {
        await handleSaveProject();
      }
      
      Alert.alert('Success', `${editingSection} updated successfully!`);
    } catch (error) {
      console.error('Error updating profile section:', error);
      Alert.alert('Error', 'Failed to update profile section.');
    } finally {
      setEditingSection(null);
      setEditingValue('');
      setStructuredData({});
      setEditingIndex(-1);
    }
  };
  
  const handleSaveExperience = async () => {
    if (!structuredData.positionTitle || !structuredData.companyName) {
      Alert.alert('Error', 'Position title and company name are required.');
      return;
    }
    
    // Find or create company
    let companyId;
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .ilike('name', structuredData.companyName)
      .single();
    
    if (existingCompany) {
      companyId = existingCompany.id;
    } else {
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({ name: structuredData.companyName })
        .select('id')
        .single();
      
      if (companyError) throw companyError;
      companyId = newCompany.id;
    }
    
    const experienceData = {
      user_id: userId,
      position_title: structuredData.positionTitle,
      company_id: companyId,
      description: structuredData.description || null,
      start_date: structuredData.startDate || null,
      end_date: structuredData.isCurrent ? null : structuredData.endDate,
      is_current: structuredData.isCurrent || false,
      employment_type: structuredData.employmentType || 'full_time'
    };
    
    // Insert new experience
    const { error } = await supabase.from('user_experiences').insert(experienceData);
    
    if (error) {
      throw error;
    }
    
    // Clear the form and close editing mode
    setStructuredData({});
    setEditingSection(null);
    
    // Refresh the profile data to show the new experience
    if (onRefresh) {
      await onRefresh();
    }
  };
  
  const handleSaveEducation = async () => {
    if (!structuredData.degreeName || !structuredData.universityName) {
      Alert.alert('Error', 'Degree and university name are required.');
      return;
    }
    
    // Simplified: store degree and university as text fields
    const educationData = {
      user_id: userId,
      degree_name: structuredData.degreeName,
      university_name: structuredData.universityName,
      field_of_study: structuredData.fieldOfStudy || null,
      start_date: structuredData.startDate || null,
      end_date: structuredData.isCurrent ? null : structuredData.endDate,
      is_current: structuredData.isCurrent || false
    };
    
    const { error } = await supabase.from('user_education').insert(educationData);
    
    if (error) {
      throw error;
    }
    
    // Clear the form and close editing mode
    setStructuredData({});
    setEditingSection(null);
    
    // Refresh the profile data to show the new education
    if (onRefresh) {
      await onRefresh();
    }
  };
  
  const handleSaveProject = async () => {
    if (!structuredData.projectTitle) {
      Alert.alert('Error', 'Project title is required.');
      return;
    }
    
    const projectData = {
      user_id: userId,
      title: structuredData.projectTitle,
      description: structuredData.projectDescription || null,
      start_date: structuredData.startDate || null,
      end_date: structuredData.endDate || null,
      status: structuredData.projectStatus || 'completed'
    };
    
    const { error } = await supabase.from('user_projects').insert(projectData);
    
    if (error) {
      throw error;
    }
    
    // Clear the form and close editing mode
    setStructuredData({});
    setEditingSection(null);
    
    // Refresh the profile data to show the new project
    if (onRefresh) {
      await onRefresh();
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditingValue('');
    setStructuredData({});
    setEditingIndex(-1);
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
      color: '#FFFFFF', // Always white for button text
      fontWeight: '600',
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
            onPress={() => handleEditSection(sectionKey as EditableSection, '', -1)}
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
            <TouchableOpacity key={index} style={styles.workItem} onPress={() => handleEditSection('experience', '', index)}>
              <View style={styles.workHeader}>
                <Text style={styles.workTitle}>{exp.role || 'Role'}</Text>
                <Text style={styles.workPeriod}>{exp.period || 'Period'}</Text>
              </View>
              <View style={styles.workCompany}>
                <Feather name="home" size={14} color={colors.textSecondary} />
                <Text style={[styles.workCompany, { marginLeft: 4, marginBottom: 0 }]}>
                  {exp.company || 'Company'}
                </Text>
              </View>
              {exp.description && (
                <Text style={styles.workDescription}>{exp.description}</Text>
              )}
            </TouchableOpacity>
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
            <TouchableOpacity key={index} style={styles.workItem} onPress={() => handleEditSection('education', '', index)}>
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
            </TouchableOpacity>
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
            <TouchableOpacity key={index} style={styles.workItem} onPress={() => handleEditSection('projects', '', index)}>
              <Text style={styles.workTitle}>{project.title}</Text>
              <Text style={styles.workDescription}>{project.description}</Text>
            </TouchableOpacity>
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
                {editingIndex >= 0 ? 'Edit' : 'Add'} {editingSection}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleCancelEdit}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {editMode === 'text' ? (
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
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                {editingSection === 'experience' && (
                  <>
                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Position Title *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={structuredData.positionTitle || ''}
                        onChangeText={(text) => setStructuredData({...structuredData, positionTitle: text})}
                        placeholder="e.g. Software Engineer"
                        placeholderTextColor={colors.textTertiary}
                      />
                    </View>
                    
                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Company *</Text>
                      <DatabaseAutocompleteInput
                        label=""
                        value={structuredData.companyName || ''}
                        onChangeText={(text) => setStructuredData({...structuredData, companyName: text})}
                        onSelect={(item) => setStructuredData({...structuredData, companyName: item.title})}
                        searchType="companies"
                        placeholder="e.g. Google, Microsoft"
                        maxResults={5}
                      />
                    </View>
                    
                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Description</Text>
                      <TextInput
                        style={[styles.textInput, { height: 80 }]}
                        value={structuredData.description || ''}
                        onChangeText={(text) => setStructuredData({...structuredData, description: text})}
                        placeholder="Describe your role and achievements..."
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        textAlignVertical="top"
                      />
                    </View>
                    
                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>I currently work here</Text>
                      <Switch
                        value={structuredData.isCurrent || false}
                        onValueChange={(value) => setStructuredData({...structuredData, isCurrent: value})}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={colors.card}
                      />
                    </View>
                  </>
                )}
                
                {editingSection === 'education' && (
                  <>
                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Degree *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={structuredData.degreeName || ''}
                        onChangeText={(text) => setStructuredData({...structuredData, degreeName: text})}
                        placeholder="e.g. Bachelor of Science"
                        placeholderTextColor={colors.textTertiary}
                      />
                    </View>
                    
                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>University/Institution *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={structuredData.universityName || ''}
                        onChangeText={(text) => setStructuredData({...structuredData, universityName: text})}
                        placeholder="e.g. University of Cambridge"
                        placeholderTextColor={colors.textTertiary}
                      />
                    </View>
                    
                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Field of Study</Text>
                      <TextInput
                        style={styles.textInput}
                        value={structuredData.fieldOfStudy || ''}
                        onChangeText={(text) => setStructuredData({...structuredData, fieldOfStudy: text})}
                        placeholder="e.g. Computer Science"
                        placeholderTextColor={colors.textTertiary}
                      />
                    </View>
                    
                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>I currently study here</Text>
                      <Switch
                        value={structuredData.isCurrent || false}
                        onValueChange={(value) => setStructuredData({...structuredData, isCurrent: value})}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={colors.card}
                      />
                    </View>
                  </>
                )}
                
                {editingSection === 'projects' && (
                  <>
                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Project Title *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={structuredData.projectTitle || ''}
                        onChangeText={(text) => setStructuredData({...structuredData, projectTitle: text})}
                        placeholder="e.g. E-commerce Mobile App"
                        placeholderTextColor={colors.textTertiary}
                      />
                    </View>
                    
                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Description</Text>
                      <TextInput
                        style={[styles.textInput, { height: 80 }]}
                        value={structuredData.projectDescription || ''}
                        onChangeText={(text) => setStructuredData({...structuredData, projectDescription: text})}
                        placeholder="Describe your project and its impact..."
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        textAlignVertical="top"
                      />
                    </View>
                  </>
                )}
              </ScrollView>
            )}
            
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