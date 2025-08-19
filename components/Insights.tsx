import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { InsightsPublisher } from './insights/InsightsPublisher';
import { InsightsStatsOverview } from './insights/InsightsStatsOverview';
import { InsightsCardsList } from './insights/InsightsCardsList';
import { SavedInsightsList } from './insights/SavedInsightsList';
import { Insight } from '../types';

interface InsightsStats {
  postsCount: number;
  totalLikes: number;
  totalComments: number;
  voltzEarned: number;
}

const Insights = () => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  // State management
  const [userInsights, setUserInsights] = useState<Insight[]>([]);
  const [savedInsights, setSavedInsights] = useState<Insight[]>([]);
  const [insightsStats, setInsightsStats] = useState<InsightsStats>({
    postsCount: 0,
    totalLikes: 0,
    totalComments: 0,
    voltzEarned: 0
  });
  const [loading, setLoading] = useState(true);
  const [showPublisher, setShowPublisher] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch user's own insights with counts
      const { data: ownInsights, error: ownInsightsError } = await supabase
        .from('insights')
        .select(`id, content, created_at, likes_count, saves_count, comments_count, views_count,
          author:profiles!author_id(full_name, avatar_url)
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (ownInsightsError) {
        console.error('Error fetching insights:', ownInsightsError);
      } else {
        const formattedInsights = (ownInsights || []).map((item: any) => ({
          id: item.id,
          content: item.content,
          created_at: item.created_at,
          likes_count: item.likes_count || 0,
          comments_count: item.comments_count || 0,
          views_count: item.views_count || 0,
          saves_count: item.saves_count || 0,
          author: item.author
        }));
        setUserInsights(formattedInsights);
      }

      // Fetch saved insights
      const { data: savedInsightsData, error: savedInsightsError } = await supabase
        .from('insight_saves')
        .select(`
          insights!insight_id(
            id, content, created_at, likes_count, comments_count, views_count,
            author:profiles!author_id(full_name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (savedInsightsError) {
        console.error('Error fetching saved insights:', savedInsightsError);
      } else {
        const formattedSaved = (savedInsightsData || [])
          .map((item: any) => item.insights)
          .filter(Boolean);
        setSavedInsights(formattedSaved);
      }

      // Calculate stats
      const totalLikes = (ownInsights || []).reduce((sum: number, insight: any) => sum + (insight.likes_count || 0), 0);
      const totalComments = (ownInsights || []).reduce((sum: number, insight: any) => sum + (insight.comments_count || 0), 0);
      const postsCount = (ownInsights || []).length;
      
      // Calculate Voltz earned (simplified calculation based on engagement)
      const voltzEarned = totalLikes * 5 + totalComments * 10;

      setInsightsStats({
        postsCount,
        totalLikes,
        totalComments,
        voltzEarned
      });

    } catch (error) {
      console.error('Error fetching insights data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Event handlers
  const handleInsightPress = (insight: Insight) => {
    // Navigate to insight detail or open modal
    console.log('Insight pressed:', insight.id);
  };

  const handleEditInsight = (insight: Insight) => {
    // Open edit modal or navigate to edit screen
    console.log('Edit insight:', insight.id);
  };

  const handleDeleteInsight = async (insight: Insight) => {
    try {
      await supabase.from('insights').delete().eq('id', insight.id);
      setUserInsights(prev => prev.filter(i => i.id !== insight.id));
      // Recalculate stats
      fetchData();
    } catch (error) {
      console.error('Error deleting insight:', error);
    }
  };

  const handleUnsaveInsight = async (insight: Insight) => {
    try {
      await supabase
        .from('insight_saves')
        .delete()
        .eq('user_id', user?.id)
        .eq('insight_id', insight.id);
      setSavedInsights(prev => prev.filter(i => i.id !== insight.id));
    } catch (error) {
      console.error('Error unsaving insight:', error);
    }
  };

  const handleAnalyticsToggle = () => {
    setShowAnalytics(!showAnalytics);
  };

  const handlePublisherComplete = () => {
    setShowPublisher(false);
    fetchData(); // Refresh the insights list
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 60,
    },
    scrollContainer: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 100,
    },
    createInsightButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 30,
      marginVertical: 20,
      marginHorizontal: 20,
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    createInsightButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 12,
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    seeAllButton: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
  });

  if (showPublisher) {
    return <InsightsPublisher onComplete={handlePublisherComplete} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Create Insight Button */}
        <TouchableOpacity 
          style={styles.createInsightButton} 
          onPress={() => setShowPublisher(true)}
        >
          <Feather name="plus" size={18} color="white" />
          <Text style={styles.createInsightButtonText}>Create Insight</Text>
        </TouchableOpacity>

        {/* Stats Overview */}
        <InsightsStatsOverview
          stats={insightsStats}
          loading={loading}
          onAnalyticsToggle={handleAnalyticsToggle}
          showAnalytics={showAnalytics}
        />

        {/* My Insights Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Insights</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <InsightsCardsList
          insights={userInsights}
          loading={loading}
          onInsightPress={handleInsightPress}
          onEditPress={handleEditInsight}
          onDeletePress={handleDeleteInsight}
        />

        {/* Saved Insights Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Insights</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <SavedInsightsList
          savedInsights={savedInsights}
          loading={loading}
          onInsightPress={handleInsightPress}
          onUnsavePress={handleUnsaveInsight}
        />
      </ScrollView>
    </View>
  );
};

export default Insights;