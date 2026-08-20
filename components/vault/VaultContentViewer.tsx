import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SearchResult } from '../../lib/smartSearchService';
import { ArticleCard } from '../ArticleCard';
import { PaperCard } from '../PaperCard';
import { BookCard } from '../BookCard';
import { CommentsModal } from '../CommentsModal';
import { supabase } from '../../lib/supabase';
import type { Book, Article, Paper } from '../../types';

interface VaultContentViewerProps {
  content: SearchResult | null;
  onClose: () => void;
}

export const VaultContentViewer: React.FC<VaultContentViewerProps> = ({ content, onClose }) => {
  const { colors } = useTheme();
  const [fullContent, setFullContent] = useState<SearchResult | Book | Article | Paper | null>(null);
  const [loading, setLoading] = useState(false);

  // Comments modal state
  const [commentsContentId, setCommentsContentId] = useState<number | null>(null);

  // Comments handlers
  const handleOpenComments = (contentId: number) => {
    setCommentsContentId(contentId);
  };

  const handleCloseComments = () => {
    setCommentsContentId(null);
  };

  const handleCommentsCountChange = (newCount: number) => {
    // Update comment count if needed - could update fullContent state
    console.log('Comments count changed:', newCount);
  };

  useEffect(() => {
    const fetchFullContent = async () => {
      if (!content) return;

      // For books, fetch full data including key_insights
      if (content.type === 'book' && !content.key_insights) {
        setLoading(true);
        try {
          console.log('VAULT: Fetching full book data for ID:', content.id);
          const { data: fullBook, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', content.id)
            .single();

          if (error) {
            console.error('VAULT: Error fetching full book:', error);
            setFullContent(content);
          } else {
            console.log('VAULT: Fetched full book with insights:', {
              id: fullBook.id,
              title: fullBook.title,
              key_insights_length: fullBook.key_insights?.length || 0
            });
            setFullContent(fullBook as Book);
          }
        } catch (error) {
          console.error('VAULT: Error fetching book:', error);
          setFullContent(content);
        } finally {
          setLoading(false);
        }
      } else {
        // For articles, papers, or books that already have full data
        setFullContent(content);
      }
    };

    fetchFullContent();
  }, [content]);

  if (!content) return null;

  if (loading) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading content...</Text>

          {/* Back button still available while loading */}
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.background + 'F0', borderColor: colors.border, borderWidth: 1 }]}
            onPress={onClose}
          >
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </>
    );
  }

  if (!fullContent) return null;

  const renderContentCard = () => {
    switch (fullContent.type || content.type) {
      case 'article':
        return (
          <ArticleCard
            article={fullContent as any}
            isActive={true}
            showBackButton={false}
            backTo={null}
            onOpenComments={handleOpenComments}
            onUserInteraction={(contentId, action) => console.log('Article interaction:', contentId, action)}
            isInVault={true}
          />
        );
      case 'paper':
        return (
          <PaperCard
            paper={fullContent as any}
            isActive={true}
            onOpenComments={handleOpenComments}
            onUserInteraction={(contentId, action) => console.log('Paper interaction:', contentId, action)}
            isInVault={true}
          />
        );
      case 'book':
        return (
          <BookCard
            book={fullContent as Book}
            onOpenComments={handleOpenComments}
            onUserInteraction={(contentId, action) => console.log('Book interaction:', contentId, action)}
            isInVault={true}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Content takes full screen */}
        <View style={styles.content}>
          {renderContentCard()}
        </View>

        {/* Overlay back button */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.background + 'F0', borderColor: colors.border, borderWidth: 1 }]}
          onPress={onClose}
        >
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Comments Modal */}
        <CommentsModal
          videoId={commentsContentId}
          visible={!!commentsContentId}
          onClose={handleCloseComments}
          onCommentsCountChange={handleCommentsCountChange}
          contentType={
            commentsContentId
              ? (fullContent.type || content.type) as 'article' | 'paper' | 'book' | 'insight'
              : undefined
          }
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    top: 60, // Account for status bar
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // Ensure it's on top
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10, // Higher elevation for Android
  },
});