import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { useIndustries } from '../../context/IndustriesContext';
import { supabase } from '../../lib/supabase';
import { optimizeIndustryName, removeHtmlTags } from '../../utils/textUtils';

const { width: screenWidth } = Dimensions.get('window');
const CARD_MARGIN = 12;
const CONTAINER_PADDING = 40; // 20px on each side
const AVAILABLE_WIDTH = screenWidth - CONTAINER_PADDING;
const CARD_WIDTH = (AVAILABLE_WIDTH - CARD_MARGIN) / 2; // 2 cards per row with margin

const getIndustryColor = (industryId: string): string => {
  const colors = [
    '#9C27B0', // Purple
    '#B71C1C', // Red
    '#1565C0', // Blue
    '#1B5E20', // Green
    '#5E35B1', // Purple
    '#880E4F', // Pink
    '#C51162', // Pink
    '#311B92', // Purple
    '#004D40', // Teal
  ];

  // Use industryId as seed for consistent color assignment
  const hash = industryId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  return colors[Math.abs(hash) % colors.length];
};

interface SavedContent {
  id: number;
  title: string;
  type: 'article' | 'paper' | 'book';
  summary?: string;
  author?: string;
  authors?: string[];
  created_at: string;
  industry_id: string;
  saved_at: string;
}

interface AllSavedContentPageProps {
  onBack: () => void;
}

export const AllSavedContentPage: React.FC<AllSavedContentPageProps> = ({
  onBack
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { allIndustries } = useIndustries();
  const [savedContent, setSavedContent] = useState<SavedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  const fetchSavedContent = useCallback(async () => {
    if (!user) {
      if (isMountedRef.current) {
        setLoading(false);
      }
      return;
    }

    try {
      if (isMountedRef.current) {
        setLoading(true);
      }

      // Fetch saved articles, papers, and books in parallel (no limit for "see all")
      const [articlesRes, papersRes, booksRes] = await Promise.all([
        supabase
          .from('article_saves')
          .select(`
            created_at,
            articles (
              id, title, summary, author, created_at, industry_id
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('paper_saves')
          .select(`
            created_at,
            papers (
              id, title, content_simple, authors, created_at, industry_id
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('book_saves')
          .select(`
            created_at,
            books (
              id, title, short_summary, author, created_at, industry_id
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      const allSavedContent: SavedContent[] = [];

      // Process articles
      if (articlesRes.data) {
        articlesRes.data.forEach((item: any) => {
          if (item.articles) {
            allSavedContent.push({
              id: item.articles.id,
              title: item.articles.title,
              type: 'article',
              summary: item.articles.summary,
              author: item.articles.author,
              created_at: item.articles.created_at,
              industry_id: item.articles.industry_id,
              saved_at: item.created_at
            });
          }
        });
      }

      // Process papers
      if (papersRes.data) {
        papersRes.data.forEach((item: any) => {
          if (item.papers) {
            allSavedContent.push({
              id: item.papers.id,
              title: item.papers.title,
              type: 'paper',
              summary: item.papers.content_simple,
              authors: item.papers.authors,
              created_at: item.papers.created_at,
              industry_id: item.papers.industry_id,
              saved_at: item.created_at
            });
          }
        });
      }

      // Process books
      if (booksRes.data) {
        booksRes.data.forEach((item: any) => {
          if (item.books) {
            allSavedContent.push({
              id: item.books.id,
              title: item.books.title,
              type: 'book',
              summary: item.books.short_summary,
              author: item.books.author,
              created_at: item.books.created_at,
              industry_id: item.books.industry_id,
              saved_at: item.created_at
            });
          }
        });
      }

      // Sort by saved date
      allSavedContent.sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime());

      if (isMountedRef.current) {
        setSavedContent(allSavedContent);
      }

    } catch (error) {
      console.error('Error fetching saved content:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchSavedContent();

    // Cleanup function for component unmount
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchSavedContent]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <Feather name="file-text" size={16} color={colors.textSecondary} />;
      case 'paper':
        return <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.textSecondary} />;
      case 'book':
        return <FontAwesome name="book" size={16} color={colors.textSecondary} />;
      default:
        return <Feather name="bookmark" size={16} color={colors.textSecondary} />;
    }
  };

  const handleContentPress = (content: SavedContent) => {
    // Only navigate if component is still mounted
    if (!isMountedRef.current) {
      return;
    }

    // Navigate to the appropriate content view in the feed
    router.push({
      pathname: '/feed',
      params: {
        contentId: content.id.toString(),
        contentType: content.type
      }
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backText: {
      fontSize: 16,
      color: colors.primary,
      marginLeft: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    headerRight: {
      width: 60, // Balance the header
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    savedContentGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingBottom: 100, // Extra padding for bottom navbar
    },
    savedContentCard: {
      width: CARD_WIDTH,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    savedContentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    savedContentType: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
      textTransform: 'capitalize',
      marginLeft: 4,
    },
    savedContentDot: {
      fontSize: 12,
      color: colors.textSecondary,
      marginHorizontal: 4,
    },
    savedContentIndustry: {
      fontSize: 12,
      flex: 1,
    },
    savedContentTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 18,
      marginBottom: 6,
    },
    savedContentAuthor: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginBottom: 6,
    },
    savedContentSummary: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 16,
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Saved Content</Text>

          <View style={styles.headerRight} />
        </View>

        <View style={styles.loadingContainer}>
          <Feather name="bookmark" size={48} color={colors.textTertiary} />
          <Text style={styles.loadingText}>Loading saved content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!savedContent || savedContent.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Saved Content</Text>

          <View style={styles.headerRight} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Feather name="bookmark" size={48} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No Saved Content Yet</Text>
          <Text style={styles.emptyText}>
            Start saving articles, papers, and books to see them here!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Saved Content</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.savedContentGrid}>
          {savedContent.map((content) => {
            const industryName = allIndustries.find(ind => ind.id === content.industry_id)?.name;
            const optimizedIndustryName = industryName ? optimizeIndustryName(industryName) : undefined;
            const industryColor = getIndustryColor(content.industry_id);
            const displayAuthor = content.type === 'paper' && content.authors ? content.authors[0] : content.author;

            return (
              <TouchableOpacity
                key={`${content.type}-${content.id}`}
                style={styles.savedContentCard}
                onPress={() => handleContentPress(content)}
              >
                <View style={styles.savedContentHeader}>
                  {getTypeIcon(content.type)}
                  <Text style={styles.savedContentType} numberOfLines={1}>
                    {content.type}
                  </Text>
                  {optimizedIndustryName && (
                    <>
                      <Text style={styles.savedContentDot}>•</Text>
                      <Text style={[styles.savedContentIndustry, { color: industryColor }]} numberOfLines={1}>
                        {optimizedIndustryName}
                      </Text>
                    </>
                  )}
                </View>

                <Text style={styles.savedContentTitle} numberOfLines={3}>
                  {removeHtmlTags(content.title)}
                </Text>

                {displayAuthor && (
                  <Text style={styles.savedContentAuthor} numberOfLines={1}>
                    {displayAuthor}
                  </Text>
                )}

                {content.summary && (
                  <Text style={styles.savedContentSummary} numberOfLines={4}>
                    {content.summary}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};