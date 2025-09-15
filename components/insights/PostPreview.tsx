import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useInsightsTheme } from '../../lib/insightsTheme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface MediaType {
  type: 'photo' | 'reel';
  source: string;
}

interface Props {
  insightText: string;
  selectedMedia: MediaType | null;
  onBack: () => void;
  onContinue: () => void;
  buttonText?: string;
}

export const PostPreview: React.FC<Props> = ({
  insightText,
  selectedMedia,
  onBack,
  onContinue,
  buttonText = 'Continue'
}) => {
  const { colors, spacing, borderRadius } = useInsightsTheme();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .single();

          if (!error && profile) {
            setUserProfile(profile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      gap: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    backButton: {
      padding: spacing.sm,
      marginRight: spacing.sm,
      borderRadius: borderRadius.full,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.insightsTextPrimary,
    },
    previewContainer: {
      backgroundColor: colors.insightsCard,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.insightsBorder,
    },
    previewLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.insightsTextSecondary,
      marginBottom: spacing.sm,
    },
    postCard: {
      borderWidth: 1,
      borderColor: colors.insightsBorder,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.insightsBorder,
      gap: spacing.sm,
    },
    avatar: {
      width: 40,
      height: 40,
      backgroundColor: colors.gray[700],
      borderRadius: borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarImage: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.insightsTextPrimary,
    },
    userTitle: {
      fontSize: 12,
      color: colors.insightsTextSecondary,
    },
    postContent: {
      padding: spacing.sm,
    },
    postText: {
      fontSize: 16,
      color: colors.insightsTextPrimary,
      lineHeight: 24,
      marginBottom: spacing.sm,
    },
    postImage: {
      width: '100%',
      height: 200,
      borderRadius: borderRadius.lg,
      resizeMode: 'cover',
    },
    postActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.insightsBorder,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    actionCount: {
      fontSize: 12,
      color: colors.insightsTextSecondary,
    },
    continueButton: {
      width: '100%',
      paddingVertical: spacing.md,
      backgroundColor: colors.yellow[400],
      borderRadius: borderRadius.lg,
      marginTop: spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    continueButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.black,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={20} color={colors.insightsTextPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Preview Your Post</Text>
      </View>

      {/* Preview Container */}
      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>Post Preview</Text>
        <View style={styles.postCard}>
          {/* Post Header */}
          <View style={styles.postHeader}>
            <View style={styles.avatar}>
              {userProfile?.avatar_url || user?.user_metadata?.profile_picture ? (
                <Image 
                  source={{ uri: userProfile?.avatar_url || user?.user_metadata?.profile_picture }} 
                  style={styles.avatarImage}
                />
              ) : (
                <Feather name="user" size={20} color={colors.insightsTextSecondary} />
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userProfile?.full_name || user?.user_metadata?.full_name || user?.full_name || user?.name || 'You'}</Text>
            </View>
          </View>

          {/* Post Content */}
          <View style={styles.postContent}>
            <Text style={styles.postText}>
              {insightText || 'Your insight text will appear here'}
            </Text>
            {selectedMedia && (
              <Image source={{ uri: selectedMedia.source }} style={styles.postImage} />
            )}
          </View>

          {/* Post Actions */}
          <View style={styles.postActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Feather name="heart" size={20} color={colors.insightsTextSecondary} />
              <Text style={styles.actionCount}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Feather name="message-circle" size={20} color={colors.insightsTextSecondary} />
              <Text style={styles.actionCount}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Feather name="bookmark" size={20} color={colors.insightsTextSecondary} />
              <Text style={styles.actionCount}>0</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Continue Button */}
      <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
        <Text style={styles.continueButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};