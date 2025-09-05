/**
 * Achievement color mapping by category type
 */

export interface AchievementColorScheme {
  primary: string;
  background: string;
  border: string;
  text: string;
}

export const ACHIEVEMENT_COLORS: Record<string, AchievementColorScheme> = {
  learning: {
    primary: '#EAB308', // Golden yellow - learning/knowledge
    background: '#FEF3C7', // Light golden background
    border: '#F59E0B',
    text: '#92400E'
  },
  engagement: {
    primary: '#3B82F6', // Blue - engagement/interaction
    background: '#DBEAFE',
    border: '#2563EB',
    text: '#1E40AF'
  },
  streak: {
    primary: '#EF4444', // Red - streaks/consistency
    background: '#FEE2E2',
    border: '#DC2626',
    text: '#991B1B'
  },
  milestone: {
    primary: '#8B5CF6', // Purple - milestones/achievements
    background: '#EDE9FE',
    border: '#7C3AED',
    text: '#5B21B6'
  },
  social: {
    primary: '#10B981', // Green - social interaction
    background: '#D1FAE5',
    border: '#059669',
    text: '#065F46'
  },
  skill: {
    primary: '#F59E0B', // Orange - skill development
    background: '#FEF3C7',
    border: '#D97706',
    text: '#92400E'
  },
  completion: {
    primary: '#6366F1', // Indigo - completion/mastery
    background: '#E0E7FF',
    border: '#4F46E5',
    text: '#3730A3'
  },
  // Default fallback
  default: {
    primary: '#6B7280', // Gray
    background: '#F3F4F6',
    border: '#9CA3AF',
    text: '#374151'
  }
};

/**
 * Get color scheme for an achievement based on its category/type
 */
export function getAchievementColors(achievementType: string): AchievementColorScheme {
  // Normalize the type (handle both 'achievement_type' and 'category' fields)
  const normalizedType = achievementType.toLowerCase().trim();
  
  // Return the specific color scheme or default
  return ACHIEVEMENT_COLORS[normalizedType] || ACHIEVEMENT_COLORS.default;
}

/**
 * Get just the primary color for an achievement (for simple use cases)
 */
export function getAchievementPrimaryColor(achievementType: string): string {
  return getAchievementColors(achievementType).primary;
}

/**
 * Check if an achievement type is valid
 */
export function isValidAchievementType(achievementType: string): boolean {
  const normalizedType = achievementType.toLowerCase().trim();
  return normalizedType in ACHIEVEMENT_COLORS && normalizedType !== 'default';
}

/**
 * Get all available achievement types
 */
export function getAvailableAchievementTypes(): string[] {
  return Object.keys(ACHIEVEMENT_COLORS).filter(type => type !== 'default');
}