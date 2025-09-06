import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { formatNumber } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { InsightOptionsModal } from './InsightOptionsModal';
import { EditInsightModal } from './EditInsightModal';
const defaultProfileImage = require('../../assets/profileIconDefault.png');

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

interface SavedInsightsListProps {
  savedInsights: SavedInsight[];
  loading?: boolean;
  onInsightPress?: (insight: SavedInsight) => void;
  onUnsavePress?: (insight: SavedInsight) => void;
  onInsightUpdate?: (insight: SavedInsight) => void;
  onInsightDelete?: (insightId: string) => void;
}

export const SavedInsightsList: React.FC<SavedInsightsListProps> = ({
  savedInsights,
  loading = false,
  onInsightPress,
  onUnsavePress,
  onInsightUpdate,
  onInsightDelete
}) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<SavedInsight | null>(null);

  

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d`;
    }
  };


  const handleOptionsPress = (insight: SavedInsight) => {
    setSelectedInsight(insight);
    setOptionsModalVisible(true);
  };

  const handleEditPress = () => {
    setOptionsModalVisible(false);
    if (selectedInsight) {
      setEditModalVisible(true);
    }
  };

  const handleDeletePress = async () => {
    if (!selectedInsight) return;
    
    try {
      const { error } = await supabase
        .from('insights')
        .delete()
        .eq('id', selectedInsight.id);

      if (error) throw error;

      onInsightDelete?.(selectedInsight.id);
      setOptionsModalVisible(false);
      setSelectedInsight(null);
    } catch (error) {
      console.error('Error deleting insight:', error);
    }
  };

  const handleUnsavePress = (insight: SavedInsight) => {
    onUnsavePress?.(insight);
    setOptionsModalVisible(false);
  };

  const handleEditSave = (newContent: string) => {
    if (selectedInsight && onInsightUpdate) {
      const updatedInsight = { ...selectedInsight, content: newContent };
      onInsightUpdate(updatedInsight);
      setSelectedInsight(null);
    }
  };

  const isOwner = (insight: SavedInsight): boolean => {
    return !!(user && insight.author_id && user.id === insight.author_id);
  };

  const styles = StyleSheet.create({
    container: {
      paddingLeft: 20,
    },
    scrollContent: {
      paddingRight: 20,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    emptyIcon: {
      marginBottom: 16,
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
    },
    insightCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      marginRight: 16,
      overflow: 'hidden',
      width: 320,
      height: 250,
      borderWidth: 0,
      borderColor: 'transparent',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      flexDirection: 'column',
    },
    userHeader: {
      flexDirection: 'row',
      padding: 16,
      alignItems: 'flex-start',
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      marginRight: 12,
    },
    userInfo: {
      flex: 1,
    },
    name: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    timestampContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    timestamp: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    contentSection: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 0,
      paddingBottom: 12,
      justifyContent: 'flex-start',
    },
    contentText: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
    },
    viewsSection: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    viewsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    viewsText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 6,
    },
    engagementSection: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 4,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    actionText: {
      marginLeft: 4,
      fontSize: 16,
      color: colors.text,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loading saved insights...</Text>
        </View>
      </View>
    );
  }

  if (!savedInsights || savedInsights.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="bookmark" size={32} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyText}>No saved insights</Text>
          <Text style={styles.emptySubtext}>
            Save insights you find interesting to read later
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.container}
      >
      {savedInsights.map((insight) => (
        <TouchableOpacity
          key={insight.id}
          style={styles.insightCard}
          onPress={() => onInsightPress?.(insight)}
        >
          
          {/* User Header */}
          <View style={styles.userHeader}>
            <Image source={defaultProfileImage} style={styles.avatar} />
            <View style={styles.userInfo}>
              <Text style={styles.name}>{insight.author?.full_name || 'User'}</Text>
              {insight.created_at && (
                <View style={styles.timestampContainer}>
                  <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                  <Text style={styles.timestamp}>{formatTimestamp(insight.created_at)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Content */}
          <View style={styles.contentSection}>
            <Text style={styles.contentText} numberOfLines={4} ellipsizeMode="tail">{insight.content}</Text>
          </View>

          {/* Bottom Section - Views and Engagement */}
          <View>
            {/* Views Section */}
            <View style={styles.viewsSection}>
              <View style={styles.viewsContainer}>
                <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.viewsText}>{formatNumber(insight.views_count || 0)} views</Text>
              </View>
            </View>

            {/* Engagement Bar */}
            <View style={styles.engagementSection}>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="heart-outline" size={20} color={colors.text} />
                  <Text style={styles.actionText}>{formatNumber(insight.likes_count || 0)}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
                  <Text style={styles.actionText}>{formatNumber(insight.comments_count || 0)}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => {
                  Alert.alert(
                    'Unsave Insight',
                    'Are you sure you want to unsave this insight?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Unsave', 
                        style: 'destructive',
                        onPress: () => onUnsavePress?.(insight)
                      }
                    ]
                  );
                }}>
                  <Ionicons name="bookmark" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
      </ScrollView>
      
      {/* Options Modal */}
      <InsightOptionsModal
        visible={optionsModalVisible}
        onClose={() => {
          setOptionsModalVisible(false);
          setSelectedInsight(null);
        }}
        onEdit={handleEditPress}
        onDelete={handleDeletePress}
        onUnsave={() => selectedInsight && handleUnsavePress(selectedInsight)}
        isOwner={selectedInsight ? isOwner(selectedInsight) : false}
      />

      {/* Edit Modal */}
      {selectedInsight && (
        <EditInsightModal
          visible={editModalVisible}
          onClose={() => {
            setEditModalVisible(false);
            setSelectedInsight(null);
          }}
          onSave={handleEditSave}
          initialContent={selectedInsight.content}
          insightId={selectedInsight.id}
        />
      )}
    </>
  );
};