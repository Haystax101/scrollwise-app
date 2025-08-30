import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

interface SkillsCardProps {
  skills: string[];
  userId: string;
  loading?: boolean;
  onRefresh?: () => Promise<void>;
}

export const SkillsCard: React.FC<SkillsCardProps> = ({
  skills,
  userId,
  loading = false,
  onRefresh
}) => {
  const { colors, isDark } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [skillsText, setSkillsText] = useState('');

  const handleEditSkills = () => {
    setSkillsText((skills || []).join(', '));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!userId) return;

    try {
      const skillsArray = skillsText.split(',').map(s => s.trim()).filter(s => s);

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

      Alert.alert('Success', 'Skills updated successfully!');
      setShowModal(false);

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error updating skills:', error);
      Alert.alert('Error', 'Failed to update skills.');
    }
  };

  // Function to get skill level color
  const getSkillColor = (index: number) => {
    const colors = ['#EAB308', '#10B981', '#3B82F6', '#8B5CF6', '#F97316'];
    return colors[index % colors.length];
  };

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
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIcon: {
      marginRight: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    editButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    editButtonText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    skillTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingHorizontal: 16,
      borderWidth: isDark ? 0 : 1,
      borderColor: isDark ? 'transparent' : colors.border,
      paddingVertical: 12,
      marginBottom: 8,
    },
    skillDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    skillText: {
      fontSize: 14,
      color: 'white',
      fontWeight: '500',
    },
    addSkillButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#EAB308',
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    addSkillText: {
      fontSize: 24,
      color: colors.primary,
      fontWeight: '300',
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
      height: 80,
      marginBottom: 16,
    },
    helperText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 16,
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
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Feather name="code" size={24} color={colors.primary} />
            </View>
            <Text style={styles.title}>Skills</Text>
          </View>
        </View>
        <Text style={styles.emptyText}>Loading skills...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Feather name="code" size={24} color={colors.primary} />
          </View>
          <Text style={styles.title}>Skills</Text>
        </View>
        {skills && skills.length > 0 && (
          <TouchableOpacity style={styles.editButton} onPress={handleEditSkills}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {skills && skills.length > 0 ? (
        <View style={styles.skillsContainer}>
          {skills.map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <View style={[styles.skillDot, { backgroundColor: getSkillColor(index) }]} />
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.addSkillButton} onPress={handleEditSkills}>
            <Text style={styles.addSkillText}>+</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Add your skills and expertise areas
          </Text>
        </View>
      )}

      {(!skills || skills.length === 0) && (
        <TouchableOpacity style={styles.addButton} onPress={handleEditSkills}>
          <Text style={styles.addButtonText}>+ Add skills</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Skills</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setShowModal(false)}
              >
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.textInput}
              value={skillsText}
              onChangeText={setSkillsText}
              placeholder="Enter your skills separated by commas..."
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
            />
            
            <Text style={styles.helperText}>
              Separate skills with commas (e.g., JavaScript, React, Node.js, Python)
            </Text>

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