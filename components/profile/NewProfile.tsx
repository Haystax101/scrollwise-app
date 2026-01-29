import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Share } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLocalSearchParams } from 'expo-router';
// import { Feather } from '@expo/vector-icons';
import { TaglineEditModal } from './TaglineEditModal';
import { BioEditModal } from './BioEditModal';
import { IndustrySelectionPage } from './IndustrySelectionPage';
import { AllAchievementsPage } from './AllAchievementsPage';
import { CareerGoalEditModal } from './CareerGoalEditModal';
import { PhotoUploadModal } from './PhotoUploadModal';
import { SocialProfileHeader } from './SocialProfileHeader';
import { UGCArchiveGrid } from './UGCArchiveGrid'; // [NEW]
import { NetworkModal } from './NetworkModal';
import SettingsModal from '../SettingsModal';
import { supabase } from '../../lib/supabase';
import { voltzService } from '../../lib/voltzService';
import { streakService, StreakInfo } from '../../services/streakService';
// import { onboardingService } from '../../services/onboardingService';
import { profileImageService } from '../../services/profileImageService';
import { useIndustries } from '../../context/IndustriesContext';
import type { Industry } from '../../types';

// Define types locally to avoid import issues
/*
interface LearningStats {
  connectionsCount: number;
  totalInteractions: number;
  achievementsCount: number;
}

interface ProfileData {
  summary?: string;
}

interface ProfilePassion {
  passionate_about: string | null;
  working_on: string | null;
}
*/

interface CareerGoal {
  goal: string;
  timeframe: string;
  companies?: string[];
}


interface NewProfileProps {
  user: any; // Supabase user
  navigateTo?: (screen: string) => void;
  signOut?: () => Promise<void>;
  deleteAccount?: () => Promise<void>;
}

export const NewProfile: React.FC<NewProfileProps> = ({ user: userProp, navigateTo, signOut, deleteAccount }) => {
  console.log('🔍 NewProfile: Component initializing', {
    hasUser: !!userProp,
    userId: userProp?.id,
    userEmail: userProp?.email
  });

  const { colors } = useTheme();
  const { refreshIndustries } = useIndustries();
  const { openSettings } = useLocalSearchParams();

  // Core profile data
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [fullName, setFullName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [totalVoltzEarned, setTotalVoltzEarned] = useState<number>(0);
  const [userLevel, setUserLevel] = useState<number>(1);
  // const [spendableVoltz, setSpendableVoltz] = useState<number>(0);
  // const [levelProgress, setLevelProgress] = useState<number>(0);
  // const [voltzForCurrentLevel, setVoltzForCurrentLevel] = useState<number>(0);
  // const [voltzForNextLevel, setVoltzForNextLevel] = useState<number>(100);
  // const [isLevelled, setIsLevelled] = useState<boolean>(false);

  // Track previous values for level-up animations
  // const [previousLevel, setPreviousLevel] = useState<number | undefined>(undefined);
  // const [previousVoltz, setPreviousVoltz] = useState<number | undefined>(undefined);

  // Refs to track component lifecycle
  const isMountedRef = useRef(true);

  // Component data states
  const [careerGoal, setCareerGoal] = useState<CareerGoal | null>(null);
  const [industries, setIndustries] = useState<Industry[]>([]);
  // const [showOnboardingProgress, setShowOnboardingProgress] = useState<boolean>(false);
  // const [learningStats, setLearningStats] = useState<LearningStats>({
  //   connectionsCount: 0,
  //   totalInteractions: 0,
  //   achievementsCount: 0
  // });
  // const [profileData, setProfileData] = useState<ProfileData>({});
  // const [profilePassions, setProfilePassions] = useState<ProfilePassion | null>(null);
  const [userTagline, setUserTagline] = useState<string | null>(null);
  const [userBio, setUserBio] = useState<string | null>(null);
  const [userLinks, setUserLinks] = useState<any>(null);

  // UI states
  // const [loading, setLoading] = useState(true);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [showIndustrySelection, setShowIndustrySelection] = useState(false);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [showCareerGoalModal, setShowCareerGoalModal] = useState(false);
  const [showTaglineModal, setShowTaglineModal] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [isClockedIn, setIsClockedIn] = useState(false);

  // Social Graph State
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [networkModalTab, setNetworkModalTab] = useState<'followers' | 'following'>('followers');

  // Fetch streak info on load
  const loadStreakInfo = async () => {
    if (!currentUser?.id) return;
    try {
      const info = await streakService.getStreakInfo(currentUser.id);
      setStreakInfo(info);
      // Simple logic for MVP: check if last_activity_date is today
      if (info && info.last_activity_date) {
        const lastDate = new Date(info.last_activity_date).toDateString();
        const today = new Date().toDateString();
        setIsClockedIn(lastDate === today);
      }
    } catch (e) {
      console.error('Streak load error', e);
    }
  };

  useEffect(() => {
    if (currentUser) loadStreakInfo();
  }, [currentUser]);

  const handleClockIn = async () => {
    if (!currentUser?.id) return;
    try {
      await streakService.logDailyActivity(currentUser.id, ['clock_in']);
      await loadStreakInfo(); // Refresh UI
      setIsClockedIn(true);
      alert("Clocked In! Streak maintained.");
    } catch (e) {
      console.error("Clock In failed", e);
    }
  };

  // Component lifecycle management
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Handle opening settings modal from privacy policy navigation
  useEffect(() => {
    if (openSettings === 'true') {
      setIsSettingsModalVisible(true);
    }
  }, [openSettings]);

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

    /*
    if (isMountedRef.current) {
      setLoading(true);
    }
    */
    try {
      // Fetch basic profile info including tagline
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, created_at, avatar_url, tagline, bio, links')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profileData && isMountedRef.current) {
        setFullName(profileData.full_name || '');
        setUserTagline(profileData.tagline);
        setUserBio(profileData.bio);
        setUserLinks(profileData.links);
        setAvatarUrl(profileImageService.getProfileImageUrl(profileData.avatar_url));
      }

      // Fetch comprehensive voltz stats using voltzService
      const voltzStats = await voltzService.getVoltzStats(currentUser.id);
      if (isMountedRef.current) {
        // Store previous values for debugging
        // setPreviousLevel(userLevel);
        // setPreviousVoltz(totalVoltzEarned);

        // Update all voltz and level data
        setTotalVoltzEarned(voltzStats.totalVoltzEarned);
        setUserLevel(voltzStats.level);
        // setSpendableVoltz(voltzStats.spendableVoltz);
        // setLevelProgress(voltzStats.levelProgress);
        // setVoltzForCurrentLevel(voltzStats.voltzForCurrentLevel);
        // setVoltzForNextLevel(voltzStats.voltzForNextLevel);
        // setIsLevelled(voltzStats.isLevelled);

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
      /*
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
      */

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

      // Fetch connections count
      /*
       const { count: connectionsCount } = await supabase
         .from('friendships')
         .select('*', { count: 'exact', head: true })
         .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`)
         .eq('status', 'accepted');
 
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
       */

      /*
      if (isMountedRef.current) {
        setLearningStats({
          connectionsCount: connectionsCount || 0,
          totalInteractions,
          achievementsCount: achievementsCountData?.length || 0
        });
      }
      */

      // Fetch profile passions data
      /*
      const { data: passionsData, error: passionsError } = await supabase
        .from('profile_passions')
        .select('passionate_about, working_on')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (passionsError && passionsError.code !== 'PGRST116') {
        console.error('Error fetching profile passions:', passionsError);
      } 
      */
      /*
      else if (isMountedRef.current) {
        setProfilePassions(passionsData);
      }
      */

      // Fetch Follow Counts
      try {
        const { data: followCounts, error: followError } = await supabase.rpc('get_follow_counts', { target_user_id: currentUser.id });
        if (!followError && followCounts && isMountedRef.current) {
          setFollowersCount(followCounts.followers || 0);
          setFollowingCount(followCounts.following || 0);
        }
      } catch (e) {
        console.error('Error fetching follow counts', e);
      }

      // Fetch basic profile sections (summary only)
      const { data: sectionsData } = await supabase
        .from('profile_sections')
        .select('section_type, content')
        .eq('user_id', currentUser.id);

      // Process basic sections data
      const sectionMap: any = {};

      if (sectionsData) {
        sectionsData.forEach((section: any) => {
          sectionMap[section.section_type] = section.content;
        });
      }

      /*
      if (isMountedRef.current) {
        setProfileData(sectionMap);
      }
      */

    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
    /*
    finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
    */
  }, [currentUser]);

  useEffect(() => {
    fetchProfileData();

    // Track profile view (analytics temporarily disabled)
    if (currentUser?.id) {
      console.log('📊 Profile viewed by user:', currentUser.id);
    }
  }, [currentUser?.id]);

  // Event handlers
  /*
  const handleEditCareerGoal = () => {
    if (isMountedRef.current) {
      setShowCareerGoalModal(true);
    }
  };
  */

  const handleCareerGoalSave = (goalData: CareerGoal) => {
    if (isMountedRef.current) {
      setCareerGoal(goalData);
      fetchProfileData();
    }
  };

  const handleTaglinePress = () => {
    if (isMountedRef.current) {
      setShowTaglineModal(true);
    }
  };

  const handleTaglineSave = (newTagline: string | null) => {
    if (isMountedRef.current) {
      setUserTagline(newTagline);
      setShowTaglineModal(false);
    }
  };

  const handleBioSave = (newBio: string | null) => {
    if (isMountedRef.current) {
      setUserBio(newBio);
      setShowBioModal(false);
    }
  };

  const handleAvatarPress = () => {
    if (isMountedRef.current) {
      setShowPhotoUploadModal(true);
    }
  };

  const handlePhotoUploaded = (newAvatarUrl: string | null) => {
    if (isMountedRef.current) {
      setAvatarUrl(newAvatarUrl);
      setShowPhotoUploadModal(false);
    }
  };

  const handleEditIndustries = () => {
    if (isMountedRef.current) {
      setShowIndustrySelection(true);
    }
  };

  /*
  const handleShowAllAchievements = () => {
    if (isMountedRef.current) {
      setShowAllAchievements(true);
    }
  };
  */


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

  // Show all achievements page if active
  if (showAllAchievements) {
    return (
      <AllAchievementsPage
        onBack={() => setShowAllAchievements(false)}
        userId={currentUser?.id || ''}
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
        <View style={{ backgroundColor: colors.background }}>
          <SocialProfileHeader
            user={currentUser}
            fullName={fullName}
            avatarUrl={avatarUrl}
            tagline={userTagline}
            level={userLevel}
            voltz={totalVoltzEarned}
            streak={streakInfo?.current_streak || 0}
            isClockedIn={isClockedIn}
            onClockIn={handleClockIn}
            onSettings={() => setIsSettingsModalVisible(true)}
            onEditAvatar={handleAvatarPress}
            onEditTagline={handleTaglinePress}
            onEditIndustries={handleEditIndustries}
            onOpenNetwork={(tab) => {
              setNetworkModalTab(tab);
              setShowNetworkModal(true);
            }}
            followersCount={followersCount}
            followingCount={followingCount}
            bio={userBio}
            links={userLinks}
            onEditBio={() => setShowBioModal(true)}
            onShareProfile={async () => {
              try {
                const profileLink = `supercharged://profile/${currentUser?.id}`;
                const message = `Check out my profile on Supercharged! ${profileLink}`;

                const result = await Share.share({
                  message: message,
                  url: profileLink, // iOS often uses this field
                  title: 'Share Profile'
                });

                if (result.action === Share.sharedAction) {
                  if (result.activityType) {
                    // shared with activity type of result.activityType
                  } else {
                    // shared
                  }
                } else if (result.action === Share.dismissedAction) {
                  // dismissed
                }
              } catch (error) {
                console.error('Error sharing profile:', error);
              }
            }}
          />
        </View>

        {/* UGC Grid */}
        <UGCArchiveGrid userId={currentUser?.id} />
      </ScrollView>

      {/* Modals */}
      <NetworkModal
        visible={showNetworkModal}
        onClose={() => setShowNetworkModal(false)}
        userId={currentUser?.id || ''}
        initialTab={networkModalTab}
      />

      <SettingsModal
        visible={isSettingsModalVisible}
        onClose={() => setIsSettingsModalVisible(false)}
        navigateTo={navigateTo || (() => { })}
        signOut={signOut || (async () => { })}
        deleteAccount={deleteAccount || (async () => { })}
      />

      <CareerGoalEditModal
        visible={showCareerGoalModal}
        onClose={() => setShowCareerGoalModal(false)}
        onSave={handleCareerGoalSave}
        currentGoal={careerGoal}
        userId={currentUser?.id || ''}
      />

      <TaglineEditModal
        visible={showTaglineModal}
        onClose={() => setShowTaglineModal(false)}
        onSave={handleTaglineSave}
        userId={currentUser?.id || ''}
        currentTagline={userTagline}
      />

      <BioEditModal
        visible={showBioModal}
        onClose={() => setShowBioModal(false)}
        onSave={handleBioSave}
        userId={currentUser?.id || ''}
        currentBio={userBio}
      />

      <PhotoUploadModal
        visible={showPhotoUploadModal}
        onClose={() => setShowPhotoUploadModal(false)}
        onImageUploaded={handlePhotoUploaded}
        userId={currentUser?.id || ''}
        currentAvatarUrl={avatarUrl}
      />
    </View>
  );
};