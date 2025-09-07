import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { NewProfileHeader } from './NewProfileHeader';
import { AnimatedLevelProgressBar } from './AnimatedLevelProgressBar';
import { LearningStatsGrid } from './LearningStatsGrid';
import { LeaderboardCard } from './LeaderboardCard';
import { SavedContentScrollView } from './SavedContentScrollView';
import { AchievementsBelt } from './AchievementsBelt';
import { CareerGoalCard } from './CareerGoalCard';
import { IndustryInterestsCard } from './IndustryInterestsCard';
import { ExperienceCard } from './ExperienceCard';
import { EducationCard } from './EducationCard';
import { SkillsCard } from './SkillsCard';
import { IndustrySelectionPage } from './IndustrySelectionPage';
import { CareerGoalEditModal } from './CareerGoalEditModal';
import { OnboardingProgressCard } from '../onboarding/OnboardingProgressCard';
import SettingsModal from '../SettingsModal';
import { supabase } from '../../lib/supabase';
import { voltzService } from '../../lib/voltzService';
import { AchievementService, UserAchievement } from '../../services/achievementService';
import { onboardingService } from '../../services/onboardingService';
import { useIndustries } from '../../context/IndustriesContext';
import type { Industry } from '../../types';

// Define types locally to avoid import issues
interface LearningStats {
  currentStreak: number;
  totalInteractions: number;
  achievementsCount: number;
}

interface ProfileData {
  experience?: any[];
  education?: any[];
  skills?: string[];
  projects?: any[];
  summary?: string;
}

interface CareerGoal {
  goal: string;
  timeframe: string;
  companies?: string[];
}

const formatDatePeriod = (startDate: string | null, endDate: string | null, isCurrent: boolean): string => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const start = formatDate(startDate);
  const end = isCurrent ? 'Present' : formatDate(endDate);
  
  return `${start} - ${end}`;
};

interface NewProfileProps {
  user: any; // Supabase user
  navigateTo?: (screen: string) => void;
  signOut?: () => Promise<void>;
}

export const NewProfile: React.FC<NewProfileProps> = ({ user: userProp, navigateTo, signOut }) => {
  console.log('🔍 NewProfile: Component initializing', { 
    hasUser: !!userProp, 
    userId: userProp?.id,
    userEmail: userProp?.email 
  });
  
  const { colors } = useTheme();
  const { refreshIndustries } = useIndustries();
  
  // Core profile data
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [fullName, setFullName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [totalVoltzEarned, setTotalVoltzEarned] = useState<number>(0);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [spendableVoltz, setSpendableVoltz] = useState<number>(0);
  const [levelProgress, setLevelProgress] = useState<number>(0);
  const [voltzForCurrentLevel, setVoltzForCurrentLevel] = useState<number>(0);
  const [voltzForNextLevel, setVoltzForNextLevel] = useState<number>(100);
  const [isLevelled, setIsLevelled] = useState<boolean>(false);
  
  // Track previous values for level-up animations
  const [previousLevel, setPreviousLevel] = useState<number | undefined>(undefined);
  const [previousVoltz, setPreviousVoltz] = useState<number | undefined>(undefined);
  
  // Refs to track component lifecycle
  const isMountedRef = useRef(true);
  
  // Component data states
  const [careerGoal, setCareerGoal] = useState<CareerGoal | null>(null);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [showOnboardingProgress, setShowOnboardingProgress] = useState<boolean>(false);
  const [learningStats, setLearningStats] = useState<LearningStats>({
    currentStreak: 0,
    totalInteractions: 0,
    achievementsCount: 0
  });
  const [profileData, setProfileData] = useState<ProfileData>({});
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [showIndustrySelection, setShowIndustrySelection] = useState(false);
  const [showCareerGoalModal, setShowCareerGoalModal] = useState(false);
  
  // Component lifecycle management
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Get current user
  useEffect(() => {
    // Use the prop user directly for now
    if (isMountedRef.current) {
      setCurrentUser(userProp || null);
    }
  }, [userProp]);
  
  // Fetch all profile data
  const fetchProfileData = useCallback(async () => {
    if (!currentUser || !isMountedRef.current) return;

    if (isMountedRef.current) {
      setLoading(true);
    }
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
        // TODO: ProfileImageService disabled due to crash - needs fixing
        // setAvatarUrl(profileImageService.getProfileImageUrl(profileData.avatar_url));
        setAvatarUrl(null);
      }

      // Fetch comprehensive voltz stats using voltzService
      const voltzStats = await voltzService.getVoltzStats(currentUser.id);
      if (isMountedRef.current) {
        // Store previous values for debugging
        setPreviousLevel(userLevel);
        setPreviousVoltz(totalVoltzEarned);

        // Update all voltz and level data
        setTotalVoltzEarned(voltzStats.totalVoltzEarned);
        setUserLevel(voltzStats.level);
        setSpendableVoltz(voltzStats.spendableVoltz);
        setLevelProgress(voltzStats.levelProgress);
        setVoltzForCurrentLevel(voltzStats.voltzForCurrentLevel);
        setVoltzForNextLevel(voltzStats.voltzForNextLevel);
        setIsLevelled(voltzStats.isLevelled);

        console.log('📊 Profile loaded - isLevelled:', voltzStats.isLevelled, 'Level:', voltzStats.level);
      }

      // CRITICAL: Proper update sequence for real-time changes
      try {
        // Step 1: Fetch all user achievements (for counting only) - temporarily disabled
        // const achievementsData = await AchievementService.getUserAchievements(currentUser.id);
      } catch (achievementsError) {
        console.error('Error fetching achievements:', achievementsError);
      }

      // Step 2: Check onboarding progress based on achievements
      try {
        const onboardingProgress = await onboardingService.getProgress(currentUser.id);
        await onboardingService.checkAndAwardCompletion(currentUser.id);

        if (isMountedRef.current) {
          if (!onboardingProgress || !onboardingProgress.is_completed) {
            setShowOnboardingProgress(true);
          } else {
            setShowOnboardingProgress(false);
          }
        }
      } catch (onboardingError) {
        console.error('Error handling onboarding progress:', onboardingError);
        if (isMountedRef.current) {
          setShowOnboardingProgress(true);
        }
      }

      // Fetch career goals using direct table queries (no RPC)
      try {
        const { data: goalData, error: goalError } = await supabase
          .from('user_goals')
          .select('goal, timeframe, goal_type')
          .eq('user_id', currentUser.id)
          .eq('goal_type', 'career')
          .single();

        if (goalError && goalError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error fetching career goal:', goalError);
        } else if (goalData && isMountedRef.current) {
          // Fetch associated companies
          const { data: companiesData, error: companiesError } = await supabase
            .from('user_goal_companies')
            .select('companies(name)')
            .eq('user_id', currentUser.id);

          if (companiesError) {
            console.error('Error fetching goal companies:', companiesError);
          }

          const companies = companiesData?.map((c: any) => c.companies?.name).filter(Boolean) || [];
          
          setCareerGoal({
            goal: goalData.goal || '',
            timeframe: goalData.timeframe || '',
            companies: companies.length > 0 ? companies : undefined
          });
          
          console.log('✅ Career goal loaded successfully:', goalData.goal);
        } else {
          console.log('📝 No career goal found for user');
        }
      } catch (careerGoalsError) {
        console.error('Exception fetching career goals:', careerGoalsError);
      }

      // Fetch industries with IDs
      const { data: industriesData, error: industriesError } = await supabase
        .from('user_industries')
        .select('industries (id, name), stage')
        .eq('user_id', currentUser.id);

      if (industriesError) {
        console.error('Error fetching industries:', industriesError);
      } else if (isMountedRef.current) {
        const formattedIndustries = (industriesData || []).map((ui: any) => ({
          id: ui.industries.id,
          name: ui.industries.name,
          stage: ui.stage
        }));
        setIndustries(formattedIndustries);
      }

      // Fetch learning stats
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', currentUser.id)
        .eq('streak_type', 'daily_learning')
        .single();

      // Calculate engagement stats
      const [articleLikesRes, articleSavesRes, articleCommentsRes,
        paperLikesRes, paperSavesRes, paperCommentsRes, bookLikesRes, bookSavesRes,
        bookCommentsRes, insightLikesRes, insightSavesRes, insightCommentsRes] = await Promise.all([
        supabase.from('article_likes').select('article_id').eq('user_id', currentUser.id),
        supabase.from('article_saves').select('article_id').eq('user_id', currentUser.id),
        supabase.from('comments').select('article_id').eq('user_id', currentUser.id),
        supabase.from('paper_likes').select('paper_id').eq('user_id', currentUser.id),
        supabase.from('paper_saves').select('paper_id').eq('user_id', currentUser.id),
        supabase.from('paper_comments').select('paper_id').eq('user_id', currentUser.id),
        supabase.from('book_likes').select('book_id').eq('user_id', currentUser.id),
        supabase.from('book_saves').select('book_id').eq('user_id', currentUser.id),
        supabase.from('book_comments').select('book_id').eq('user_id', currentUser.id),
        supabase.from('insight_likes').select('insight_id').eq('user_id', currentUser.id),
        supabase.from('insight_saves').select('insight_id').eq('user_id', currentUser.id),
        supabase.from('insight_comments').select('insight_id').eq('user_id', currentUser.id)
      ]);

      const totalInteractions = (articleLikesRes.data?.length || 0) + 
                               (articleSavesRes.data?.length || 0) + (articleCommentsRes.data?.length || 0) +
                               (paperLikesRes.data?.length || 0) + 
                               (paperSavesRes.data?.length || 0) + (paperCommentsRes.data?.length || 0) +
                               (bookLikesRes.data?.length || 0) + 
                               (bookSavesRes.data?.length || 0) + (bookCommentsRes.data?.length || 0) +
                               (insightLikesRes.data?.length || 0) + 
                               (insightSavesRes.data?.length || 0) + (insightCommentsRes.data?.length || 0);

      const { data: achievementsCountData } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', currentUser.id);

      if (isMountedRef.current) {
        setLearningStats({
          currentStreak: streakData?.current_streak || 1,
          totalInteractions,
          achievementsCount: achievementsCountData?.length || 0
        });
      }

      // Fetch enhanced profile data
      const [sectionsRes, skillsRes, experiencesRes, educationRes, projectsRes] = await Promise.all([
        supabase.from('profile_sections').select('section_type, content').eq('user_id', currentUser.id),
        supabase.from('user_skills').select('skill_name, proficiency_level').eq('user_id', currentUser.id).eq('is_featured', true).order('endorsement_count', { ascending: false }),
        supabase.from('user_experiences').select('id, position_title, description, start_date, end_date, is_current, employment_type, companies (name)').eq('user_id', currentUser.id).order('start_date', { ascending: false }),
        supabase.from('user_education').select('id, degree_name, university_name, field_of_study, start_date, end_date, is_current').eq('user_id', currentUser.id).order('start_date', { ascending: false }),
        supabase.from('user_projects').select('title, description, start_date, end_date, status').eq('user_id', currentUser.id).order('start_date', { ascending: false })
      ]);

      // Process all the data
      const sectionMap: any = {};
      
      if (sectionsRes.data) {
        sectionsRes.data.forEach((section: any) => {
          sectionMap[section.section_type] = section.content;
        });
      }
      
      if (skillsRes.data) {
        sectionMap.skills = skillsRes.data.map((skill: any) => skill.skill_name);
      }
      
      if (experiencesRes.data) {
        sectionMap.experience = experiencesRes.data.map((exp: any) => ({
          id: exp.id,
          role: exp.position_title,
          company: exp.companies?.name || 'Unknown Company',
          description: exp.description,
          period: formatDatePeriod(exp.start_date, exp.end_date, exp.is_current),
          startDate: exp.start_date,
          endDate: exp.end_date,
          isCurrent: exp.is_current,
          employmentType: exp.employment_type
        }));
      }
      
      if (educationRes.data) {
        sectionMap.education = educationRes.data.map((edu: any) => ({
          id: edu.id,
          degree: `${edu.degree_name}${edu.field_of_study ? ` in ${edu.field_of_study}` : ''}`,
          university: edu.university_name || 'Unknown Institution',
          stage: edu.field_of_study,
          period: formatDatePeriod(edu.start_date, edu.end_date, edu.is_current),
          startDate: edu.start_date,
          endDate: edu.end_date,
          isCurrent: edu.is_current
        }));
      }
      
      if (projectsRes.data) {
        sectionMap.projects = projectsRes.data.map((project: any) => ({
          title: project.title,
          description: project.description
        }));
      }
      
      if (isMountedRef.current) {
        setProfileData(sectionMap);
      }

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    fetchProfileData();
    
    // Track profile view (analytics temporarily disabled)
    if (currentUser?.id) {
      console.log('📊 Profile viewed by user:', currentUser.id);
    }
  }, [currentUser?.id]);

  // Event handlers
  const handleEditCareerGoal = () => {
    if (isMountedRef.current) {
      setShowCareerGoalModal(true);
    }
  };

  const handleCareerGoalSave = (goalData: CareerGoal) => {
    if (isMountedRef.current) {
      setCareerGoal(goalData);
      fetchProfileData();
    }
  };

  const handleEditIndustries = () => {
    if (isMountedRef.current) {
      setShowIndustrySelection(true);
    }
  };

  const handleIndustrySave = async (selectedIndustries: any[]) => {
    if (!isMountedRef.current) return;
    
    try {
      const formattedIndustries = selectedIndustries.map(industry => ({
        id: industry.id || industry.name,
        name: industry.name,
        stage: 'interested'
      }));
      setIndustries(formattedIndustries);
      setShowIndustrySelection(false);
      
      console.log('🔄 Profile: Refreshing industries context after industry update...');
      await refreshIndustries();
      console.log('✅ Profile: Industries context refreshed successfully');
      
      // TODO: AsyncStorage operations disabled due to potential native build crash
      // try {
      //   const AsyncStorage = await import('@react-native-async-storage/async-storage');
      //   const viewedKey = `viewed_content_${currentUser?.id}`;
      //   await AsyncStorage.default.removeItem(viewedKey);
      //   console.log('🧹 Profile: Cleared viewed content cache to show fresh industry content');
      // } catch (cacheError) {
      //   console.warn('⚠️ Profile: Failed to clear viewed content cache:', cacheError);
      // }
      console.log('⚠️ AsyncStorage cache clearing disabled for crash testing');
      
    } catch (error) {
      console.error('❌ Profile: Error in handleIndustrySave:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    gradientHeader: {
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    settingsButton: {
      position: 'absolute',
      top: 60,
      right: 20,
      zIndex: 1,
      padding: 8,
    },
    scrollContainer: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 120,
    },
  });

  // Show industry selection page if active
  if (showIndustrySelection) {
    return (
      <IndustrySelectionPage
        onBack={() => setShowIndustrySelection(false)}
        onSave={handleIndustrySave}
        initialIndustries={industries.map(industry => ({
          id: industry.id || industry.name,
          name: industry.name
        }))}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.gradientHeader, { backgroundColor: colors.background }]}
        >
          <TouchableOpacity
            style={styles.settingsButton}
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
          previousLevel={previousLevel}
          previousVoltz={previousVoltz}
          triggerLevelUpAnimation={isLevelled}
          onLevelUpAnimationComplete={async () => {
            if (currentUser?.id) {
              console.log('🎬 Level-up animation complete, resetting flag...');
              await voltzService.resetLevelUpFlag(currentUser.id);
              setIsLevelled(false);
            }
          }}
        />

        <LearningStatsGrid
          stats={learningStats}
          loading={loading}
        />

        <LeaderboardCard
          loading={loading}
        />

        <SavedContentScrollView
          loading={loading}
        />

        <AchievementsBelt
          userId={currentUser?.id || ''}
          loading={loading}
        />

        <CareerGoalCard
          goalData={careerGoal}
          onEditPress={handleEditCareerGoal}
          loading={loading}
        />

        <IndustryInterestsCard
          industries={industries}
          onEditPress={handleEditIndustries}
          loading={loading}
        />

        <ExperienceCard
          experiences={profileData.experience || []}
          userId={currentUser?.id || ''}
          loading={loading}
          onRefresh={fetchProfileData}
        />

        <EducationCard
          education={profileData.education || []}
          userId={currentUser?.id || ''}
          loading={loading}
          onRefresh={fetchProfileData}
        />

        <SkillsCard
          skills={profileData.skills || []}
          userId={currentUser?.id || ''}
          loading={loading}
          onRefresh={fetchProfileData}
        />
      </ScrollView>

      <SettingsModal
        visible={isSettingsModalVisible}
        onClose={() => setIsSettingsModalVisible(false)}
        navigateTo={navigateTo || (() => {})}
        signOut={signOut || (async () => {})}
      />

      <CareerGoalEditModal
        visible={showCareerGoalModal}
        onClose={() => setShowCareerGoalModal(false)}
        onSave={handleCareerGoalSave}
        currentGoal={careerGoal}
        userId={currentUser?.id || ''}
      />
    </View>
  );
};