import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

interface NewProfileHeaderProps {
  fullName: string;
  bio?: string;
  avatarUrl?: string | null;
  userId: string;
  onEditPress: () => void;
  onAvatarPress: () => void;
}

export const NewProfileHeader: React.FC<NewProfileHeaderProps> = ({
  fullName,
  bio,
  avatarUrl,
  userId,
  onEditPress,
  onAvatarPress
}) => {
  const { colors, isDark } = useTheme();

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      marginBottom: 16,
      paddingTop: 16,
      position: 'relative',
    },
    editButton: {
      position: 'absolute',
      top: 16,
      right: 0,
      zIndex: 1,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    avatar: {
      width: 112,
      height: 112,
      borderRadius: 56,
      borderWidth: 2,
      borderColor: 'white',
    },
    avatarEditOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: colors.primary,
      borderRadius: 16,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'white',
    },
    nameContainer: {
      marginBottom: 8,
    },
    userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
    },
    bioContainer: {
      textAlign: 'center',
      marginBottom: 16,
      width: '100%',
      maxWidth: 280,
      paddingHorizontal: 20,
    },
    bioText: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 22,
    },
    emptyBioText: {
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: 14,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
        <Feather name="edit" size={18} color="rgba(255, 255, 255, 0.7)" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.avatarContainer} onPress={onAvatarPress}>
        <Image
          source={
            avatarUrl 
              ? { uri: avatarUrl } 
              : require('../../profileIcon.png')
          }
          style={styles.avatar}
        />
        <View style={styles.avatarEditOverlay}>
          <Feather name="edit-2" size={16} color="white" />
        </View>
      </TouchableOpacity>
      
      <View style={styles.nameContainer}>
        <Text style={styles.userName}>{fullName}</Text>
      </View>
      
      <View style={styles.bioContainer}>
        {bio && bio.trim() ? (
          <Text style={styles.bioText}>
            {bio}
          </Text>
        ) : (
          <Text style={styles.emptyBioText}>
            Add a bio to tell others about yourself
          </Text>
        )}
      </View>
    </View>
  );
};