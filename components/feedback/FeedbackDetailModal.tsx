import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { FeedbackVoteButton } from './FeedbackVoteButton';
import { DevResponseSection } from './DevResponseSection';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';
import type { Feedback } from '../../types/feedback';

interface FeedbackDetailModalProps {
  visible: boolean;
  feedback: Feedback | null;
  userUpvoted: boolean;
  userDownvoted: boolean;
  onClose: () => void;
  onUpvote: () => void;
  onDownvote: () => void;
  onDelete?: () => void;
}

export const FeedbackDetailModal: React.FC<FeedbackDetailModalProps> = ({
  visible,
  feedback,
  userUpvoted,
  userDownvoted,
  onClose,
  onUpvote,
  onDownvote,
  onDelete
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!feedback) return null;

  const isOwner = user?.id === feedback.user_id;

  const getStatusColor = () => {
    const isDark = colors.background === '#000000' || colors.background === '#0a0a0a';
    switch (feedback.status) {
      case 'under_review':
        return isDark ? '#ffcc00' : '#ffa726';
      case 'in_progress':
        return isDark ? '#4a9eff' : '#2196f3';
      case 'completed':
        return isDark ? '#4caf50' : '#66bb6a';
      case 'declined':
        return isDark ? '#f44336' : '#ef5350';
      case 'planned':
        return isDark ? '#9c27b0' : '#ab47bc';
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = () => {
    switch (feedback.status) {
      case 'under_review':
        return 'Under Review';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'declined':
        return 'Declined';
      case 'planned':
        return 'Planned';
      default:
        return feedback.status;
    }
  };

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert(
      'Delete Feedback',
      'Are you sure you want to delete this feedback? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const { error } = await supabase
                .from('feedback')
                .delete()
                .eq('id', feedback.id)
                .eq('user_id', user!.id); // Ensure user can only delete their own

              if (error) throw error;

              Alert.alert('Deleted', 'Your feedback has been deleted.', [
                { text: 'OK', onPress: () => {
                  onClose();
                  onDelete?.();
                }}
              ]);
            } catch (error) {
              console.error('Error deleting feedback:', error);
              Alert.alert('Error', 'Failed to delete feedback. Please try again.');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 40,
    },
    closeButton: {
      padding: 8,
    },
    menuButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    scrollContent: {
      paddingVertical: 20,
      gap: 16,
    },
    feedbackTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      lineHeight: 32,
    },
    timestamp: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    feedbackBody: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
      marginBottom: 16,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginBottom: 16,
    },
    statusText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#000000',
    },
    voteSection: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    menuOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'transparent',
    },
    menuContainer: {
      position: 'absolute',
      top: 60,
      right: 20,
      backgroundColor: colors.card || colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
      minWidth: 150,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    menuItemText: {
      fontSize: 15,
      fontWeight: '500',
      color: '#f44336',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity style={dynamicStyles.closeButton} onPress={onClose}>
            <Feather name="x" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={dynamicStyles.title}>Feedback</Text>
          {isOwner && (
            <TouchableOpacity
              style={dynamicStyles.menuButton}
              onPress={() => setShowMenu(!showMenu)}
            >
              <Feather name="more-vertical" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          {!isOwner && <View style={{ width: 40 }} />}
        </View>

        <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={false}>
          <View style={dynamicStyles.scrollContent}>
            {/* Title */}
            <Text style={dynamicStyles.feedbackTitle}>{feedback.title}</Text>

            {/* Timestamp */}
            <Text style={dynamicStyles.timestamp}>
              {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
            </Text>

            {/* Status Badge */}
            <View style={[dynamicStyles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={dynamicStyles.statusText}>{getStatusLabel()}</Text>
            </View>

            {/* Body */}
            <Text style={dynamicStyles.feedbackBody}>{feedback.body}</Text>

            {/* Vote Buttons */}
            <View style={dynamicStyles.voteSection}>
              <FeedbackVoteButton
                voteType="up"
                count={feedback.upvotes_count}
                userVoted={userUpvoted}
                onPress={onUpvote}
              />
              <FeedbackVoteButton
                voteType="down"
                count={feedback.downvotes_count}
                userVoted={userDownvoted}
                onPress={onDownvote}
              />
            </View>

            {/* Developer Response */}
            {feedback.dev_response && feedback.dev_response_at && (
              <DevResponseSection
                response={feedback.dev_response}
                respondedAt={feedback.dev_response_at}
              />
            )}
          </View>
        </ScrollView>

        {/* Delete Menu */}
        {showMenu && (
          <>
            <TouchableOpacity
              style={dynamicStyles.menuOverlay}
              onPress={() => setShowMenu(false)}
              activeOpacity={1}
            />
            <View style={dynamicStyles.menuContainer}>
              <TouchableOpacity
                style={dynamicStyles.menuItem}
                onPress={handleDelete}
              >
                <Feather name="trash-2" size={18} color="#f44336" />
                <Text style={dynamicStyles.menuItemText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {deleting && (
          <View style={dynamicStyles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </View>
    </Modal>
  );
};
