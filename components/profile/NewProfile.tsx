import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import SettingsModal from '../SettingsModal';
import { AchievementService, UserAchievement } from '../../services/achievementService';
import { voltzService } from '../../lib/voltzService';
import { onboardingService } from '../../services/onboardingService';
import { profileImageService } from '../../services/profileImageService';
import { analytics, ANALYTICS_EVENTS } from '../../lib/posthog';

// New Profile Components
import { NewProfileHeader } from './NewProfileHeader';
import { LevelProgressCard } from './LevelProgressCard';
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

// Remove local Achievement interface, use the one from AchievementService

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
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  // Core profile data
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [fullName, setFullName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [totalVoltzEarned, setTotalVoltzEarned] = useState<number>(0);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [spendableVoltz, setSpendableVoltz] = useState<number>(0);
  const [levelProgress, setLevelProgress] = useState<number>(0);
  
  // Component data states
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
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
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showCareerGoalModal, setShowCareerGoalModal] = useState(false);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data?.user || null);
    };
    getUser();
  }, []);

  // Fetch all profile data
  const fetchProfileData = useCallback(async () => {
    if (!currentUser) return;
    
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
      } else if (profileData) {
        setFullName(profileData.full_name || '');
        // Use profile image service to get proper URL with default fallback
        setAvatarUrl(profileImageService.getProfileImageUrl(profileData.avatar_url));
      }

      // Fetch comprehensive voltz stats using voltzService
      const voltzStats = await voltzService.getVoltzStats(currentUser.id);
      setTotalVoltzEarned(voltzStats.totalVoltzEarned);
      setUserLevel(voltzStats.level);
      setSpendableVoltz(voltzStats.spendableVoltz);
      setLevelProgress(voltzStats.levelProgress);

      // CRITICAL: Proper update sequence for real-time changes
      try {
        // Step 1: Check and award any new achievements the user has earned
        console.log('Checking for new achievements...');
        const { data: newAchievements, error: checkError } = await supabase
          .rpc('check_all_user_achievements', { target_user_id: currentUser.id });
        
        if (checkError) {
          console.error('Error checking new achievements:', checkError);
        } else if (newAchievements && newAchievements[0]?.newly_awarded_count > 0) {
          console.log(`Awarded ${newAchievements[0].newly_awarded_count} new achievements!`);
          
          // Step 2: If achievements were awarded, immediately refresh voltz stats to get updated level
          console.log('Refreshing voltz stats after achievement awards...');
          const updatedVoltzStats = await voltzService.getVoltzStats(currentUser.id);
          setTotalVoltzEarned(updatedVoltzStats.totalVoltzEarned);
          setUserLevel(updatedVoltzStats.level);
          setSpendableVoltz(updatedVoltzStats.spendableVoltz);
          setLevelProgress(updatedVoltzStats.levelProgress);
        }
        
        // Step 3: Fetch all user achievements (including any newly awarded ones)
        const achievementsData = await AchievementService.getUserAchievements(currentUser.id);
        setAchievements(achievementsData);
      } catch (achievementsError) {
        console.error('Error fetching achievements:', achievementsError);
        setAchievements([]);
      }

      // Step 4: Check onboarding progress based on achievements
      try {
        // Get current progress based on existing achievements
        const onboardingProgress = await onboardingService.getProgress(currentUser.id);
        
        // Check if onboarding completion achievement should be awarded
        await onboardingService.checkAndAwardCompletion(currentUser.id);
        
        // Show onboarding card for users who haven't completed all steps
        if (!onboardingProgress || !onboardingProgress.is_completed) {
          setShowOnboardingProgress(true);
        } else {
          setShowOnboardingProgress(false);
        }
      } catch (onboardingError) {
        console.error('Error handling onboarding progress:', onboardingError);
        // Default to showing onboarding for new users
        setShowOnboardingProgress(true);
      }

      // Fetch career goals using the enhanced schema
      const { data: careerGoalsData, error: careerGoalsError } = await supabase
        .rpc('get_user_career_goals', { user_id_param: currentUser.id });

      if (careerGoalsError) {
        console.error('Error fetching career goals:', careerGoalsError);
      } else if (careerGoalsData && careerGoalsData.length > 0) {
        const goalData = careerGoalsData[0]; // Get primary career goal
        setCareerGoal({
          goal: goalData.goal,
          timeframe: goalData.timeframe,
          companies: goalData.companies?.length > 0 ? goalData.companies : undefined
        });
      }

      // Fetch industries with IDs
      const { data: industriesData, error: industriesError } = await supabase
        .from('user_industries')
        .select('industries (id, name), stage')
        .eq('user_id', currentUser.id);

      if (industriesError) {
        console.error('Error fetching industries:', industriesError);
      } else {
        const formattedIndustries = (industriesData || []).map((ui: any) => ({
          id: ui.industries.id,
          name: ui.industries.name,
          stage: ui.stage
        }));
        setIndustries(formattedIndustries);
      }

      // Fetch streak data from user_streaks table
      const { data: streakData, error: streakError } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', currentUser.id)
        .eq('streak_type', 'daily_learning')
        .single();

      // Fetch content engagement data by counting unique interactions
      const [articleLikesRes, articleSavesRes, articleCommentsRes, paperLikesRes, paperSavesRes, paperCommentsRes, bookLikesRes, bookSavesRes, bookCommentsRes, insightLikesRes, insightSavesRes, insightCommentsRes] = await Promise.all([
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

      // Calculate unique content pieces engaged with
      const uniqueArticles = new Set([
        ...(articleLikesRes.data?.map(r => `article_${r.article_id}`) || []),
        ...(articleSavesRes.data?.map(r => `article_${r.article_id}`) || []),
        ...(articleCommentsRes.data?.map(r => `article_${r.article_id}`) || [])
      ]);
      const uniquePapers = new Set([
        ...(paperLikesRes.data?.map(r => `paper_${r.paper_id}`) || []),
        ...(paperSavesRes.data?.map(r => `paper_${r.paper_id}`) || []),
        ...(paperCommentsRes.data?.map(r => `paper_${r.paper_id}`) || [])
      ]);
      const uniqueBooks = new Set([
        ...(bookLikesRes.data?.map(r => `book_${r.book_id}`) || []),
        ...(bookSavesRes.data?.map(r => `book_${r.book_id}`) || []),
        ...(bookCommentsRes.data?.map(r => `book_${r.book_id}`) || [])
      ]);
      const uniqueInsights = new Set([
        ...(insightLikesRes.data?.map(r => `insight_${r.insight_id}`) || []),
        ...(insightSavesRes.data?.map(r => `insight_${r.insight_id}`) || []),
        ...(insightCommentsRes.data?.map(r => `insight_${r.insight_id}`) || [])
      ]);

      const totalInteractions = (articleLikesRes.data?.length || 0) + (articleSavesRes.data?.length || 0) + (articleCommentsRes.data?.length || 0) +
                               (paperLikesRes.data?.length || 0) + (paperSavesRes.data?.length || 0) + (paperCommentsRes.data?.length || 0) +
                               (bookLikesRes.data?.length || 0) + (bookSavesRes.data?.length || 0) + (bookCommentsRes.data?.length || 0) +
                               (insightLikesRes.data?.length || 0) + (insightSavesRes.data?.length || 0) + (insightCommentsRes.data?.length || 0);

      const contentEngaged = uniqueArticles.size + uniquePapers.size + uniqueBooks.size + uniqueInsights.size;

      // Fetch achievements count
      const { data: achievementsCountData, error: achievementsCountError } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', currentUser.id);

      if (achievementsCountError) {
        console.error('Error fetching achievements count:', achievementsCountError);
      }

      if (streakError) {
        console.error('Error fetching streak data:', streakError);
      }

      setLearningStats({
        currentStreak: streakData?.current_streak || 1, // Default to 1 if no streak data
        totalInteractions,
        achievementsCount: achievementsCountData?.length || 0
      });

      // Fetch enhanced profile data from new schema
      const [sectionsRes, skillsRes, experiencesRes, educationRes, projectsRes] = await Promise.all([
        // Keep fetching summary from profile_sections
        supabase
          .from('profile_sections')
          .select('section_type, content')
          .eq('user_id', currentUser.id),
        
        // Fetch skills from user_skills table
        supabase
          .from('user_skills')
          .select('skill_name, proficiency_level')
          .eq('user_id', currentUser.id)
          .eq('is_featured', true)
          .order('endorsement_count', { ascending: false }),
        
        // Fetch experiences from user_experiences table
        supabase
          .from('user_experiences')
          .select(`
            id,
            position_title,
            description,
            start_date,
            end_date,
            is_current,
            employment_type,
            companies (name)
          `)
          .eq('user_id', currentUser.id)
          .order('start_date', { ascending: false }),
        
        // Fetch education from user_education table
        supabase
          .from('user_education')
          .select(`
            id,
            degree_name,
            university_name,
            field_of_study,
            start_date,
            end_date,
            is_current
          `)
          .eq('user_id', currentUser.id)
          .order('start_date', { ascending: false }),
        
        // Fetch projects from user_projects table
        supabase
          .from('user_projects')
          .select('title, description, start_date, end_date, status')
          .eq('user_id', currentUser.id)
          .order('start_date', { ascending: false })
      ]);

      // Process all the data
      const sectionMap: any = {};
      
      // Process profile sections (summary)
      if (sectionsRes.error) {
        console.error('Error fetching profile sections:', sectionsRes.error);
      } else {
        const sections = sectionsRes.data || [];
        sections.forEach((section: any) => {
          sectionMap[section.section_type] = section.content;
        });
      }
      
      // Process skills
      if (skillsRes.error) {
        console.error('Error fetching skills:', skillsRes.error);
      } else {
        sectionMap.skills = (skillsRes.data || []).map((skill: any) => skill.skill_name);
      }
      
      // Process experiences
      if (experiencesRes.error) {
        console.error('Error fetching experiences:', experiencesRes.error);
      } else {
        sectionMap.experience = (experiencesRes.data || []).map((exp: any) => ({
          id: exp.id, // Add the ID for deletion
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
      
      // Process education
      if (educationRes.error) {
        console.error('Error fetching education:', educationRes.error);
      } else {
        sectionMap.education = (educationRes.data || []).map((edu: any) => ({
          id: edu.id, // Add the ID for deletion
          degree: `${edu.degree_name}${edu.field_of_study ? ` ${edu.field_of_study}` : ''}`,
          university: edu.university_name || 'Unknown Institution',
          stage: edu.field_of_study,
          period: formatDatePeriod(edu.start_date, edu.end_date, edu.is_current),
          startDate: edu.start_date,
          endDate: edu.end_date,
          isCurrent: edu.is_current
        }));
      }
      
      // Process projects
      if (projectsRes.error) {
        console.error('Error fetching projects:', projectsRes.error);
      } else {
        sectionMap.projects = (projectsRes.data || []).map((project: any) => ({
          title: project.title,
          description: project.description
        }));
      }
      
      setProfileData(sectionMap);

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchProfileData();
    
    // Track profile view
    if (currentUser?.id) {
      analytics.screen('Profile', {
        user_id: currentUser.id,
        timestamp: new Date().toISOString()
      });
      
      analytics.track(ANALYTICS_EVENTS.PROFILE_VIEWED, {
        user_id: currentUser.id,
        timestamp: new Date().toISOString()
      });
    }
  }, [fetchProfileData, currentUser?.id]);

  // Set up real-time subscription for achievements
  useEffect(() => {
    if (!currentUser?.id) return;

    const subscription = AchievementService.subscribeToUserAchievements(
      currentUser.id,
      (newAchievement) => {
        console.log('🏆 New achievement earned:', newAchievement.title);
        
        // Track achievement earned event
        analytics.track(ANALYTICS_EVENTS.ACHIEVEMENT_EARNED, {
          user_id: currentUser.id,
          achievement_id: newAchievement.achievement_id,
          achievement_title: newAchievement.title,
          achievement_type: newAchievement.achievement_type,
          timestamp: new Date().toISOString()
        });
        
        // Add new achievement to the list
        setAchievements(prev => [newAchievement, ...prev]);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser?.id]);

  // Set up real-time subscription for profile changes (voltz and level updates)
  useEffect(() => {
    if (!currentUser?.id) return;
    
    const profileChannel = supabase
      .channel('profile-updates')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles', 
          filter: `id=eq.${currentUser.id}` 
        },
        async (payload) => {
          console.log('⚡ Profile updated:', payload.new);
          
          // Track level up if level increased
          if (payload.new.level !== undefined && payload.new.level > userLevel) {
            analytics.track(ANALYTICS_EVENTS.LEVEL_UP, {
              user_id: currentUser.id,
              previous_level: userLevel,
              new_level: payload.new.level,
              total_voltz_earned: payload.new.total_voltz_earned,
              timestamp: new Date().toISOString()
            });
          }
          
          // Update immediate state values
          if (payload.new.total_voltz_earned !== undefined) {
            setTotalVoltzEarned(payload.new.total_voltz_earned);
          }
          if (payload.new.level !== undefined) {
            setUserLevel(payload.new.level);
          }
          if (payload.new.spendable_voltz !== undefined) {
            setSpendableVoltz(payload.new.spendable_voltz);
          }
          
          // Refresh comprehensive voltz stats to get updated progress calculations
          try {
            const voltzStats = await voltzService.getVoltzStats(currentUser.id);
            setLevelProgress(voltzStats.levelProgress);
          } catch (error) {
            console.error('Error refreshing voltz stats after profile update:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [currentUser?.id]);

  // Event handlers
  const handleAvatarPress = () => {
    setShowPhotoUpload(true);
  };

  const handlePhotoUploaded = (imageUrl: string) => {
    setAvatarUrl(imageUrl);
  };



  const handleEditCareerGoal = () => {
    setShowCareerGoalModal(true);
  };

  const handleCareerGoalSave = (goalData: CareerGoal) => {
    setCareerGoal(goalData);
    // Refresh profile data to ensure consistency
    fetchProfileData();
  };

  const handleEditIndustries = () => {
    setShowIndustrySelection(true);
  };

  const handleIndustrySave = async (selectedIndustries: any[]) => {
    // Update local state
    const formattedIndustries = selectedIndustries.map(industry => ({
      name: industry.name,
      stage: 'interested'
    }));
    setIndustries(formattedIndustries);
    setShowIndustrySelection(false);
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
              // Could navigate to relevant screen or show guidance
            }}
          />
        )}
        
        <LevelProgressCard
          level={userLevel}
          currentVoltz={totalVoltzEarned}
          spendableVoltz={spendableVoltz}
          levelProgress={levelProgress}
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
          achievements={achievements}
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
        navigateTo={router.push}
        signOut={signOut || (async () => {})}
      />

      <PhotoUploadModal
        visible={showPhotoUpload}
        onClose={() => setShowPhotoUpload(false)}
        onImageUploaded={handlePhotoUploaded}
        userId={currentUser?.id || ''}
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