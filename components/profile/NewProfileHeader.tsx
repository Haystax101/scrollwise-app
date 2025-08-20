import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

interface NewProfileHeaderProps {
  fullName: string;
  avatarUrl?: string | null;
  userId: string;
  onAvatarPress: () => void;
}

export const NewProfileHeader: React.FC<NewProfileHeaderProps> = ({
  fullName,
  avatarUrl,
  userId,
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
  });

  return (
    <View style={styles.container}>
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
    </View>
  );
};