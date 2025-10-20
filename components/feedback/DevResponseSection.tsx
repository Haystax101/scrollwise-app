import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { formatDistanceToNow } from 'date-fns';

interface DevResponseSectionProps {
  response: string;
  respondedAt: string;
}

export const DevResponseSection: React.FC<DevResponseSectionProps> = ({
  response,
  respondedAt
}) => {
  const { colors } = useTheme();

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface || colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.primary,
      marginTop: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    headerText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    responseText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.text,
      marginBottom: 8,
    },
    timestamp: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Feather name="shield" size={16} color={colors.primary} />
        <Text style={dynamicStyles.headerText}>Developer Response</Text>
      </View>
      <Text style={dynamicStyles.responseText}>{response}</Text>
      <Text style={dynamicStyles.timestamp}>
        Responded {formatDistanceToNow(new Date(respondedAt), { addSuffix: true })}
      </Text>
    </View>
  );
};
