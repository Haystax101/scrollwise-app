import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface CareerGoal {
  goal: string;
  timeframe: string;
  companies?: string[]; // From user_goal_companies joined with companies
}

interface CareerGoalCardProps {
  goalData: CareerGoal | null;
  onEditPress: () => void;
  loading?: boolean;
}

export const CareerGoalCard: React.FC<CareerGoalCardProps> = ({
  goalData,
  onEditPress,
  loading = false
}) => {
  const { colors, isDark } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 20,
    },
    headerIcon: {
      marginRight: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    card: {
      backgroundColor: isDark ? colors.surface : colors.card,
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 20,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.border : 'transparent',
      position: 'relative',
    },
    editButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      padding: 4,
    },
    goalContent: {
      paddingRight: 40,
    },
    goalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    goalIcon: {
      marginRight: 12,
      width: 20,
    },
    goalLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 8,
    },
    goalValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    companiesContainer: {
      marginTop: 8,
    },
    companiesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 4,
    },
    companyTag: {
      backgroundColor: isDark ? colors.border : colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 4,
    },
    companyText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyIcon: {
      marginBottom: 12,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textTertiary,
      textAlign: 'center',
      marginBottom: 16,
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
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
          <View style={styles.headerIcon}>
            <Feather name="target" size={20} color={colors.primary} />
          </View>
          <Text style={styles.title}>Career Goal</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.emptyText}>Loading career goal...</Text>
        </View>
      </View>
    );
  }

  if (!goalData || !goalData.goal) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Feather name="target" size={20} color={colors.primary} />
          </View>
          <Text style={styles.title}>Career Goal</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="target" size={32} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyText}>Set your career goal</Text>
            <Text style={styles.emptySubtext}>
              Define where you want to be in your career journey
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={onEditPress}>
              <Text style={styles.addButtonText}>Add Career Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Feather name="target" size={20} color={colors.primary} />
        </View>
        <Text style={styles.title}>Career Goal</Text>
      </View>
      <View style={styles.card}>
        <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
          <Feather name="edit" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <View style={styles.goalContent}>
          <View style={styles.goalRow}>
            <View style={styles.goalIcon}>
              <Feather name="briefcase" size={16} color={colors.textTertiary} />
            </View>
            <Text style={styles.goalLabel}>Goal:</Text>
            <Text style={styles.goalValue}>{goalData.goal}</Text>
          </View>
          
          {goalData.timeframe && (
            <View style={styles.goalRow}>
              <View style={styles.goalIcon}>
                <Feather name="clock" size={16} color={colors.textTertiary} />
              </View>
              <Text style={styles.goalLabel}>Timeline:</Text>
              <Text style={styles.goalValue}>{goalData.timeframe}</Text>
            </View>
          )}
          
          {goalData.companies && goalData.companies.length > 0 && (
            <View style={styles.companiesContainer}>
              <View style={styles.goalRow}>
                <View style={styles.goalIcon}>
                  <Feather name="building" size={16} color={colors.textTertiary} />
                </View>
                <Text style={styles.goalLabel}>Target Companies:</Text>
              </View>
              <View style={styles.companiesRow}>
                {goalData.companies.map((company, index) => (
                  <View key={index} style={styles.companyTag}>
                    <Text style={styles.companyText}>{company}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};