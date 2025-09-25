import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ProfilePassionsModal } from './ProfilePassionsModal';

interface ProfilePassion {
  passionate_about: string | null;
  working_on: string | null;
}

interface ProfilePassionsCardProps {
  passions: ProfilePassion | null;
  userId: string;
  loading: boolean;
  onRefresh: () => void;
}

export const ProfilePassionsCard: React.FC<ProfilePassionsCardProps> = ({
  passions,
  userId,
  loading,
  onRefresh
}) => {
  const { colors } = useTheme();
  const [showModal, setShowModal] = useState(false);

  const handleEditPress = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleModalSave = useCallback(() => {
    setShowModal(false);
    onRefresh();
  }, [onRefresh]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      marginVertical: 10,
      borderRadius: 16,
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    editButton: {
      padding: 4,
    },
    loadingContainer: {
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      gap: 16,
    },
    section: {
      gap: 8,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionContent: {
      fontSize: 16,
      lineHeight: 22,
      color: colors.text,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    emptyContainer: {
      padding: 20,
      alignItems: 'center',
      gap: 8,
    },
    emptyIcon: {
      marginBottom: 8,
    },
    addButton: {
      marginTop: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.primary,
      borderRadius: 20,
    },
    addButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>What drives you</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }


  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>What you're passionate about</Text>
          <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
            <Feather name="edit-2" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {passions?.passionate_about ? (
          <View style={styles.content}>
            <Text style={styles.sectionContent}>{passions.passionate_about}</Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Feather
              name="heart"
              size={32}
              color={colors.textSecondary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>Share what you're passionate about</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleEditPress}>
              <Text style={styles.addButtonText}>Add passion</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ProfilePassionsModal
        visible={showModal}
        onClose={handleModalClose}
        onSave={handleModalSave}
        userId={userId}
        currentPassions={passions}
      />
    </>
  );
};