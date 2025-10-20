import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface FeedbackVoteButtonProps {
  voteType: 'up' | 'down';
  count: number;
  userVoted: boolean;
  onPress: () => void;
  loading?: boolean;
}

export const FeedbackVoteButton: React.FC<FeedbackVoteButtonProps> = ({
  voteType,
  count,
  userVoted,
  onPress,
  loading = false
}) => {
  const { colors } = useTheme();

  const activeColor = voteType === 'up' ? '#ffcc00' : '#ff6b6b';
  const iconName = voteType === 'up' ? 'arrow-up' : 'arrow-down';

  const dynamicStyles = StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: userVoted ? activeColor : colors.border,
      backgroundColor: userVoted ? `${activeColor}15` : colors.background,
      gap: 6,
    },
    count: {
      fontSize: 14,
      fontWeight: '600',
      color: userVoted ? activeColor : colors.textSecondary,
    },
  });

  return (
    <TouchableOpacity
      style={dynamicStyles.button}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={activeColor} />
      ) : (
        <>
          <Feather
            name={iconName}
            size={16}
            color={userVoted ? activeColor : colors.textSecondary}
          />
          <Text style={dynamicStyles.count}>{count}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};
