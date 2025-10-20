import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { feedContentPreloader } from '../services/FeedContentPreloader';
import { InsightsPublisher } from './insights/InsightsPublisher';
import { InsightsEditor } from './insights/InsightsEditor';
import { InsightsStatsOverview } from './insights/InsightsStatsOverview';
import { InsightsCardsList } from './insights/InsightsCardsList';
import { SavedInsightsList } from './insights/SavedInsightsList';
import { FloatingCreateButton } from './insights/FloatingCreateButton';
import { FeedbackBoardModal } from './feedback/FeedbackBoardModal';
import { Insight } from '../types';

interface SavedInsight {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  author_id?: string;
  author?: {
    full_name: string;
  };
}

interface InsightsStats {
  postsCount: number;
  totalLikes: number;
  totalComments: number;
  voltzEarned: number;
}

const Insights = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  // State management
  const [userInsights, setUserInsights] = useState<Insight[]>([]);
  const [savedInsights, setSavedInsights] = useState<SavedInsight[]>([]);
  const [insightsStats, setInsightsStats] = useState<InsightsStats>({
    postsCount: 0,
    totalLikes: 0,
    totalComments: 0,
    voltzEarned: 0
  });
  const [loading, setLoading] = useState(true);
  const [showPublisher, setShowPublisher] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingInsight, setEditingInsight] = useState<Insight | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

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
          type: 'insight' as const,
          content: item.content,
          created_at: item.created_at,
          title: item.content ? item.content.substring(0, 50) + (item.content.length > 50 ? '...' : '') : '',
          likes_count: item.likes_count || 0,
          comments_count: item.comments_count || 0,
          views_count: item.views_count || 0,
          saves_count: item.saves_count || 0,
          author: {
            name: item.author?.full_name || 'You',
            handle: '@' + (item.author?.full_name?.toLowerCase().replace(/\s+/g, '') || 'you'),
            avatar: item.author?.avatar_url || '',
            role: '',
            company: '',
            industry: '',
            location: '',
            currentProject: '',
            projectTags: []
          }
        }));
        setUserInsights(formattedInsights);
      }

      // Fetch saved insights
      const { data: savedInsightsData, error: savedInsightsError } = await supabase
        .from('insight_saves')
        .select(`
          insights!insight_id(
            id, content, created_at, likes_count, comments_count, views_count, author_id,
            author:profiles!author_id(full_name, avatar_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (savedInsightsError) {
        console.error('Error fetching saved insights:', savedInsightsError);
      } else {
        const formattedSaved = (savedInsightsData || [])
          .map((item: any) => {
            const insight = item.insights;
            if (!insight) return null;
            
            // Map to SavedInsight interface format
            return {
              id: insight.id,
              content: insight.content,
              created_at: insight.created_at,
              likes_count: insight.likes_count || 0,
              comments_count: insight.comments_count || 0,
              views_count: insight.views_count || 0,
              author_id: insight.author_id,
              author: insight.author ? {
                full_name: insight.author.full_name
              } : undefined
            };
          })
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
  const handleInsightPress = async (insight: Insight) => {
    // Navigate to insight detail page with back button
    router.push({
      pathname: `/insight/${insight.id}`,
      params: {
        showBackButton: 'true'
      }
    });
  };

  const handleSavedInsightPress = async (savedInsight: SavedInsight) => {
    // Navigate to insight detail page with back button
    router.push({
      pathname: `/insight/${savedInsight.id}`,
      params: {
        showBackButton: 'true'
      }
    });
  };

  const handleEditInsight = (insight: Insight) => {
    setEditingInsight(insight);
    setShowEditor(true);
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

  const handleUnsaveInsight = async (savedInsight: SavedInsight) => {
    try {
      await supabase
        .from('insight_saves')
        .delete()
        .eq('user_id', user?.id)
        .eq('insight_id', savedInsight.id);
      setSavedInsights(prev => prev.filter(i => i.id !== savedInsight.id));
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

  const handleEditorComplete = () => {
    setShowEditor(false);
    setEditingInsight(null);
    fetchData(); // Refresh the insights list
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 60,
    },
    feedbackButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 8,
      position: 'absolute',
      top: 60,
      right: 0,
      zIndex: 10,
    },
    feedbackButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    feedbackButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    scrollContainer: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 160,
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

  if (showEditor && editingInsight) {
    return <InsightsEditor insight={editingInsight} onComplete={handleEditorComplete} />;
  }

  return (
    <View style={styles.container}>
      {/* Feedback Button */}
      <View style={styles.feedbackButtonContainer}>
        <TouchableOpacity
          style={[styles.feedbackButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowFeedbackModal(true)}
        >
          <Text style={styles.feedbackButtonText}>FEEDBACK</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
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
        </View>
        
        <InsightsCardsList
          insights={userInsights}
          loading={loading}
          onInsightPress={handleInsightPress}
          onDeletePress={handleDeleteInsight}
          onEditPress={handleEditInsight}
        />

        {/* Saved Insights Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Insights</Text>
        </View>
        
        <SavedInsightsList
          savedInsights={savedInsights}
          loading={loading}
          onInsightPress={handleSavedInsightPress}
          onUnsavePress={handleUnsaveInsight}
          onInsightUpdate={(updatedInsight) => {
            setSavedInsights(prev => 
              prev.map(insight => 
                insight.id === updatedInsight.id ? {...insight, content: updatedInsight.content} : insight
              )
            );
          }}
          onInsightDelete={(insightId) => {
            setSavedInsights(prev => prev.filter(insight => insight.id !== insightId));
          }}
        />
      </ScrollView>

      {/* Floating Create Button */}
      <FloatingCreateButton onPress={() => setShowPublisher(true)} />

      {/* Feedback Board Modal */}
      <FeedbackBoardModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </View>
  );
};

export default Insights;