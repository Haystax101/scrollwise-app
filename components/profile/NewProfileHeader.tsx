import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface NewProfileHeaderProps {
  fullName: string;
  avatarUrl?: string | null;
  userLevel: number;
  tagline?: string | null;
  onAvatarPress: () => void;
  onTaglinePress: () => void;
}

export const NewProfileHeader: React.FC<NewProfileHeaderProps> = ({
  fullName,
  avatarUrl,
  userLevel,
  tagline,
  onAvatarPress,
  onTaglinePress
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
      marginBottom: 4,
    },
    tagline: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
      marginBottom: 8,
      paddingHorizontal: 20,
    },
    addTaglineButton: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: colors.textSecondary,
      borderRadius: 12,
      marginBottom: 8,
    },
    addTaglineText: {
      fontSize: 12,
      color: colors.textSecondary,
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
      <TouchableOpacity style={styles.avatarContainer} disabled={true}>
        <Image
          source={require('../../assets/profileIconDefault.png')}
          style={styles.avatar}
        />
        <View style={styles.avatarEditOverlay}>
          <Feather name="zap" size={16} color="#000000" />
        </View>
      </TouchableOpacity>
      
      <View style={styles.nameContainer}>
        <Text style={styles.userName}>{fullName}</Text>
        <Text style={styles.userHandle}>@{fullName.toLowerCase().replace(/\s+/g, '')}</Text>

        {tagline ? (
          <TouchableOpacity onPress={onTaglinePress}>
            <Text style={styles.tagline}>{tagline}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.addTaglineButton} onPress={onTaglinePress}>
            <Text style={styles.addTaglineText}>Add tagline</Text>
          </TouchableOpacity>
        )}

        <View style={styles.levelBadge}>
          <Feather name="zap" size={16} color="#000000" />
          <Text style={styles.levelBadgeText}>Level {userLevel}</Text>
        </View>
      </View>
    </View>
  );
};