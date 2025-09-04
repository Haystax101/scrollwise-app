import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface FlagButtonProps {
  contentId: number | string;
  contentType: 'article' | 'paper' | 'book' | 'insight';
  size?: number;
  style?: ViewStyle;
  initialFlagged?: boolean;
  onFlagToggle?: (isFlagged: boolean, flagCount: number) => void;
}

export const FlagButton: React.FC<FlagButtonProps> = ({
  contentId,
  contentType,
  size = 24,
  style,
  initialFlagged = false,
  onFlagToggle
}) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [isFlagged, setIsFlagged] = useState(initialFlagged);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check user's flag status for this content when component mounts
    checkUserFlagStatus();
  }, [contentId, contentType, user]);

  const checkUserFlagStatus = async () => {
    if (!user) return;

    try {
      // Simple direct query to check if user has flagged this content
      // Convert content ID to string format for consistency
      const processedContentId = String(contentId);
      
      const { data, error } = await supabase
        .from('user_content_flags')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_type', contentType)
        .eq('content_id', processedContentId)
        .maybeSingle();

      if (error) {
        console.error('Error checking flag status:', error);
        return;
      }

      // If we found a record, the user has flagged this content
      setIsFlagged(!!data);
    } catch (error) {
      console.error('Exception checking flag status:', error);
    }
  };

  const handleFlagPress = async () => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to flag content.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (isLoading) return;

    // Show confirmation dialog for first-time flaggers
    if (!isFlagged) {
      Alert.alert(
        'Flag Content',
        'Are you sure you want to flag this content as inappropriate?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Flag',
            style: 'destructive',
            onPress: () => performToggle(),
          },
        ]
      );
    } else {
      // Direct unflag without confirmation
      performToggle();
    }
  };

  const performToggle = async () => {
    setIsLoading(true);

    try {
      // Convert content ID to string format for RPC function (handles both numeric and UUID)
      const processedContentId = String(contentId);
      
      const { data, error } = await supabase.rpc('toggle_content_flag', {
        p_user_id: user!.id,
        p_content_id: processedContentId,
        p_content_type: contentType
      });

      if (error) {
        console.error('Error toggling flag:', error);
        Alert.alert(
          'Error',
          'Failed to update flag status. Please try again.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      if (data) {
        const newFlaggedState = data.flagged;
        const newFlagCount = data.flag_count;

        setIsFlagged(newFlaggedState);
        
        // Call callback if provided
        if (onFlagToggle) {
          onFlagToggle(newFlaggedState, newFlagCount);
        }

        // Show feedback to user
        if (newFlaggedState) {
          // Optional: Show success message
          // Alert.alert('Content Flagged', 'Thank you for helping keep our community safe.');
        }
      }
    } catch (error) {
      console.error('Exception toggling flag:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const iconColor = isFlagged 
    ? '#EF4444' // Red when flagged
    : colors.textSecondary; // Secondary text color when not flagged

  const iconOpacity = isLoading ? 0.5 : 1;

  const buttonStyles = StyleSheet.create({
    button: {
      width: size + 8,
      height: size + 8,
      borderRadius: (size + 8) / 2,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      ...style,
    },
    buttonPressed: {
      transform: [{ scale: 0.95 }],
    },
  });

  return (
    <TouchableOpacity
      style={buttonStyles.button}
      onPress={handleFlagPress}
      disabled={isLoading}
      activeOpacity={0.7}
      accessible={true}
      accessibilityLabel={isFlagged ? 'Remove flag from content' : 'Flag content as inappropriate'}
      accessibilityRole="button"
    >
      <Feather
        name={isFlagged ? 'alert-circle' : 'flag'}
        size={size}
        color={iconColor}
        style={{ opacity: iconOpacity }}
      />
    </TouchableOpacity>
  );
};