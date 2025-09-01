import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { profileImageService } from '../../services/profileImageService';

interface NewProfileHeaderProps {
  fullName: string;
  avatarUrl?: string | null;
  userLevel: number;
  onAvatarPress: () => void;
}

export const NewProfileHeader: React.FC<NewProfileHeaderProps> = ({
  fullName,
  avatarUrl,
  userLevel,
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
      borderWidth: 3,
      borderColor: '#EAB308',
    },
    avatarEditOverlay: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: '#EAB308',
      borderRadius: 16,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? colors.surface : 'white',
    },
    nameContainer: {
      alignItems: 'center',
      marginBottom: 12,
    },
    userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    userHandle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    levelBadge: {
      backgroundColor: '#EAB308',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    levelBadgeText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#000000',
      marginLeft: 4,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.avatarContainer} onPress={onAvatarPress}>
        <Image
          source={{ uri: profileImageService.getProfileImageUrl(avatarUrl) }}
          style={styles.avatar}
          defaultSource={{ uri: profileImageService.getDefaultImageUrl() }}
          onError={() => {
            console.log('Profile image failed to load, using default');
          }}
        />
        <View style={styles.avatarEditOverlay}>
          <Feather name="zap" size={16} color="#000000" />
        </View>
      </TouchableOpacity>
      
      <View style={styles.nameContainer}>
        <Text style={styles.userName}>{fullName}</Text>
        <Text style={styles.userHandle}>@{fullName.toLowerCase().replace(/\s+/g, '')}</Text>
        <View style={styles.levelBadge}>
          <Feather name="zap" size={16} color="#000000" />
          <Text style={styles.levelBadgeText}>Level {userLevel}</Text>
        </View>
      </View>
    </View>
  );
};