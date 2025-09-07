import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { useIndustries } from '../../context/IndustriesContext';
import { Feather } from '@expo/vector-icons';
import SettingsModal from '../SettingsModal';
import { AchievementService, UserAchievement } from '../../services/achievementService';
import { voltzService } from '../../lib/voltzService';
import { onboardingService } from '../../services/onboardingService';
import { profileImageService } from '../../services/profileImageService';
import { analytics, ANALYTICS_EVENTS } from '../../lib/posthog';

// New Profile Components
import { NewProfileHeader } from './NewProfileHeader';
import { AnimatedLevelProgressBar } from './AnimatedLevelProgressBar';
import { LearningStatsGrid } from './LearningStatsGrid';
import { LeaderboardCard } from './LeaderboardCard';
import { AchievementsBelt } from './AchievementsBelt';
import { CareerGoalCard } from './CareerGoalCard';
import { IndustryInterestsCard } from './IndustryInterestsCard';
import { ExperienceCard } from './ExperienceCard';
import { EducationCard } from './EducationCard';
import { SkillsCard } from './SkillsCard';
import { IndustrySelectionPage } from './IndustrySelectionPage';
import { PhotoUploadModal } from './PhotoUploadModal';
import { CareerGoalEditModal } from './CareerGoalEditModal';
import { SavedContentScrollView } from './SavedContentScrollView';
import { OnboardingProgressCard } from '../onboarding/OnboardingProgressCard';

interface NewProfileProps {
  user: any; // Supabase user
  navigateTo?: (screen: string) => void;
  signOut?: () => Promise<void>;
}

interface CareerGoal {
  goal: string;
  timeframe: string;
  companies?: string[];
}

interface Industry {
  id?: string;
  name: string;
  stage?: string;
}

interface LearningStats {
  currentStreak: number;
  totalInteractions: number;
  achievementsCount: number;
}

interface ProfileData {
  summary?: string;
  education?: any[];
  experience?: any[];
  projects?: any[];
  skills?: string[];
}

// Helper function to format date periods
const formatDatePeriod = (startDate: string | null, endDate: string | null, isCurrent: boolean): string => {
  if (!startDate) return '';
  
  const start = new Date(startDate);
  const startFormatted = start.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  
  if (isCurrent) {
    return `${startFormatted} - Present`;
  } else if (endDate) {
    const end = new Date(endDate);
    const endFormatted = end.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    return `${startFormatted} - ${endFormatted}`;
  } else {
    return startFormatted;
  }
};

export const NewProfile: React.FC<NewProfileProps> = ({ user: userProp, navigateTo, signOut }) => {
  
  // TODO: Temporarily return minimal component to isolate crash - replace with full component after testing
  return (
    <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 18 }}>Profile Loading...</Text>
      <Text style={{ color: '#fff', fontSize: 14, marginTop: 10 }}>User: {userProp?.email || 'Not found'}</Text>
    </View>
  );
};