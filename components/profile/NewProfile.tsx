import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
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

export const NewProfile: React.FC<NewProfileProps> = ({ user: userProp, navigateTo, signOut }) => {
  console.log('🔍 NewProfile: Component initializing', { 
    hasUser: !!userProp, 
    userId: userProp?.id,
    userEmail: userProp?.email 
  });
  
  const { colors } = useTheme();
  const router = useRouter();
  const { refreshIndustries } = useIndustries();

  // Core profile data
  const [currentUser] = useState<any>(userProp);
  const [fullName, setFullName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [totalVoltzEarned, setTotalVoltzEarned] = useState<number>(0);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [spendableVoltz, setSpendableVoltz] = useState<number>(0);
  const [levelProgress, setLevelProgress] = useState<number>(0);
  const [voltzForCurrentLevel, setVoltzForCurrentLevel] = useState<number>(0);
  const [voltzForNextLevel, setVoltzForNextLevel] = useState<number>(100);
  const [isLevelled, setIsLevelled] = useState<boolean>(false);

  // Component data states
  const [careerGoal, setCareerGoal] = useState<CareerGoal | null>(null);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [showOnboardingProgress, setShowOnboardingProgress] = useState<boolean>(false);
  const [learningStats, setLearningStats] = useState<LearningStats>({
    currentStreak: 0,
    totalInteractions: 0,
    achievementsCount: 0
  });
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [showIndustrySelection, setShowIndustrySelection] = useState(false);
  const [showCareerGoalModal, setShowCareerGoalModal] = useState(false);

  // Refs to track component lifecycle
  const isMountedRef = useRef(true);

  // Component lifecycle management
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch all profile data
  const fetchProfileData = useCallback(async () => {
    if (!currentUser || !isMountedRef.current) return;
    
    setLoading(true);
    
    try {
      // Fetch basic profile info
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, created_at, avatar_url')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profileData && isMountedRef.current) {
        setFullName(profileData.full_name || '');
        setAvatarUrl(profileImageService.getProfileImageUrl(profileData.avatar_url));
      }

      // Fetch voltz stats
      const voltzStats = await voltzService.getVoltzStats(currentUser.id);
      if (isMountedRef.current) {
        setTotalVoltzEarned(voltzStats.totalVoltzEarned);
        setUserLevel(voltzStats.level);
        setSpendableVoltz(voltzStats.spendableVoltz);
        setLevelProgress(voltzStats.levelProgress);
        setVoltzForCurrentLevel(voltzStats.voltzForCurrentLevel);
        setVoltzForNextLevel(voltzStats.voltzForNextLevel);
        setIsLevelled(voltzStats.isLevelled);
      }

      // Fetch achievements (no crash-causing RPC calls)
      const achievementsData = await AchievementService.getUserAchievements(currentUser.id);
      
      // Check onboarding progress
      try {
        const onboardingProgress = await onboardingService.getProgress(currentUser.id);
        if (isMountedRef.current) {
          setShowOnboardingProgress(!onboardingProgress || !onboardingProgress.is_completed);
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
        if (isMountedRef.current) {
          setShowOnboardingProgress(true);
        }
      }

      // Set learning stats
      if (isMountedRef.current) {
        setLearningStats({
          currentStreak: 0,
          totalInteractions: 0,
          achievementsCount: achievementsData.length
        });
      }

    } catch (error) {
      console.error('Error in fetchProfileData:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [currentUser]);

  // Load profile data when component mounts
  useEffect(() => {
    if (currentUser?.id) {
      fetchProfileData();
      
      // Track profile view
      analytics.screen('Profile', {
        user_id: currentUser.id,
        timestamp: new Date().toISOString()
      });
    }
  }, [currentUser?.id, fetchProfileData]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    content: {
      flex: 1,
    },
  });

  // Simple loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={{ padding: 8 }}
            onPress={() => setIsSettingsModalVisible(true)}
          >
            <Feather name="settings" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <NewProfileHeader
            fullName={fullName}
            avatarUrl={avatarUrl}
            userLevel={userLevel}
            onAvatarPress={() => {}}
          />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {showOnboardingProgress && currentUser && (
            <OnboardingProgressCard 
              userId={currentUser.id}
              onStepPress={(step) => {
                console.log('User wants to complete onboarding step:', step);
              }}
            />
          )}

          <AnimatedLevelProgressBar
            level={userLevel}
            currentVoltz={totalVoltzEarned}
            spendableVoltz={spendableVoltz}
            levelProgress={levelProgress}
            voltzForCurrentLevel={voltzForCurrentLevel}
            voltzForNextLevel={voltzForNextLevel}
            progressPercentage={levelProgress}
            onLevelUp={() => {
              if (currentUser?.id) {
                setIsLevelled(false);
              }
            }}
          />

          <LearningStatsGrid
            currentStreak={learningStats.currentStreak}
            totalInteractions={learningStats.totalInteractions}
            achievementsCount={learningStats.achievementsCount}
            loading={loading}
          />

          <LeaderboardCard
            user={currentUser}
            loading={loading}
          />

          <AchievementsBelt
            userId={currentUser?.id || ''}
            loading={loading}
          />

          <CareerGoalCard
            goal={careerGoal}
            loading={loading}
            onEdit={() => setShowCareerGoalModal(true)}
          />

          <IndustryInterestsCard
            industries={industries}
            loading={loading}
            onEdit={() => setShowIndustrySelection(true)}
          />

        </ScrollView>
      </View>

      <SettingsModal
        visible={isSettingsModalVisible}
        onClose={() => setIsSettingsModalVisible(false)}
        navigateTo={router.push}
        signOut={signOut || (async () => {})}
      />

      <CareerGoalEditModal
        visible={showCareerGoalModal}
        onClose={() => setShowCareerGoalModal(false)}
        onSave={(goalData: CareerGoal) => {
          setCareerGoal(goalData);
          fetchProfileData();
        }}
        currentGoal={careerGoal}
        userId={currentUser?.id || ''}
      />
    </>
  );
};