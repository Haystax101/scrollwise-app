import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import SettingsModal from '../SettingsModal';

// New Profile Components
import { NewProfileHeader } from './NewProfileHeader';
import { LevelProgressCard } from './LevelProgressCard';
import { LearningStatsGrid } from './LearningStatsGrid';
import { AchievementsBelt } from './AchievementsBelt';
import { CareerGoalCard } from './CareerGoalCard';
import { IndustryInterestsCard } from './IndustryInterestsCard';
import { ProfileCustomizationSections } from './ProfileCustomizationSections';
import { IndustrySelectionPage } from './IndustrySelectionPage';
import { PhotoUploadModal } from './PhotoUploadModal';
import { CareerGoalEditModal } from './CareerGoalEditModal';

interface NewProfileProps {
  user: any; // Supabase user
  navigateTo?: (screen: string) => void;
  signOut?: () => Promise<void>;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  earned_at: string;
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
  timeSpentLearning: string;
  totalInteractions: number;
  contentEngaged: number;
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
  
  // Component data states
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [careerGoal, setCareerGoal] = useState<CareerGoal | null>(null);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [learningStats, setLearningStats] = useState<LearningStats>({
    timeSpentLearning: '0h 0m',
    totalInteractions: 0,
    contentEngaged: 0
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
        .select('full_name, email, created_at, total_voltz_earned, level, avatar_url, spendable_voltz')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profileData) {
        setFullName(profileData.full_name || '');
        setAvatarUrl(profileData.avatar_url);
        setTotalVoltzEarned(profileData.total_voltz_earned ?? 0);
        setUserLevel(profileData.level ?? 1);
        setSpendableVoltz(profileData.spendable_voltz ?? 0);
      }

      // Fetch achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('id, title, description, icon_name, earned_at')
        .eq('user_id', currentUser.id)
        .order('earned_at', { ascending: false });

      if (achievementsError) {
        console.error('Error fetching achievements:', achievementsError);
      } else {
        setAchievements(achievementsData || []);
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

      // Fetch learning stats using enhanced function
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_enhanced_user_stats', { user_id_param: currentUser.id });

      if (statsError) {
        console.error('Error fetching enhanced learning stats:', statsError);
      } else if (statsData && statsData.length > 0) {
        const stats = statsData[0];
        const minutes = parseInt(stats.minutes_learned) || 0;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        setLearningStats({
          timeSpentLearning: `${hours}h ${remainingMinutes}m`,
          totalInteractions: (parseInt(stats.posts_liked) || 0) + (parseInt(stats.posts_saved) || 0),
          contentEngaged: parseInt(stats.content_pieces_engaged) || 0
        });
      }

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
          role: exp.position_title,
          company: exp.companies?.name || 'Unknown Company',
          description: exp.description,
          period: formatDatePeriod(exp.start_date, exp.end_date, exp.is_current)
        }));
      }
      
      // Process education
      if (educationRes.error) {
        console.error('Error fetching education:', educationRes.error);
      } else {
        sectionMap.education = (educationRes.data || []).map((edu: any) => ({
          degree: `${edu.degree_name}${edu.field_of_study ? ` ${edu.field_of_study}` : ''}`,
          university: edu.university_name || 'Unknown Institution',
          stage: edu.field_of_study,
          period: formatDatePeriod(edu.start_date, edu.end_date, edu.is_current)
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
  }, [fetchProfileData]);

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

  const handleProfileDataUpdate = (newData: ProfileData) => {
    setProfileData(newData);
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
        <LinearGradient
          colors={['#4F46E5', '#8B5CF6']}
          style={styles.gradientHeader}
        >
          <TouchableOpacity 
            style={styles.settingsButton} 
            onPress={() => setIsSettingsModalVisible(true)}
          >
            <Feather name="settings" size={24} color="white" />
          </TouchableOpacity>
          
          <NewProfileHeader
            fullName={fullName}
            avatarUrl={avatarUrl}
            userId={currentUser?.id}
            onAvatarPress={handleAvatarPress}
          />
        </LinearGradient>
        <LevelProgressCard
          level={userLevel}
          currentVoltz={totalVoltzEarned}
          spendableVoltz={spendableVoltz}
        />

        <LearningStatsGrid
          stats={learningStats}
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

        <ProfileCustomizationSections
          profileData={profileData}
          userId={currentUser?.id || ''}
          onDataUpdate={handleProfileDataUpdate}
          onRefresh={fetchProfileData}
          loading={loading}
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