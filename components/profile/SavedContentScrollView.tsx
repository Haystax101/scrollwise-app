import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { Feather, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { useIndustries } from '../../context/IndustriesContext';
import { optimizeIndustryName, removeHtmlTags } from '../../utils/textUtils';

const { width: screenWidth } = Dimensions.get('window');

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

interface SavedContentScrollViewProps {
  loading?: boolean;
}

export const SavedContentScrollView: React.FC<SavedContentScrollViewProps> = ({ loading: parentLoading = false }) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { allIndustries } = useIndustries();
  const [savedContent, setSavedContent] = useState<SavedContent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedContent = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch saved articles, papers, and books in parallel
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
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('paper_saves')
          .select(`
            created_at,
            papers (
              id, title, content_simple, authors, created_at, industry_id
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
        
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
          .limit(10)
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

      // Sort by saved date and limit to 8 most recent items
      allSavedContent.sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime());
      setSavedContent(allSavedContent.slice(0, 8));

    } catch (error) {
      console.error('Error fetching saved content:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedContent();
  }, [fetchSavedContent]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <Feather name="file-text" size={14} color={colors.textSecondary} />;
      case 'paper':
        return <MaterialCommunityIcons name="file-document-outline" size={14} color={colors.textSecondary} />;
      case 'book':
        return <FontAwesome name="book" size={14} color={colors.textSecondary} />;
      default:
        return <Feather name="bookmark" size={14} color={colors.textSecondary} />;
    }
  };

  const handleContentPress = (content: SavedContent) => {
    // Navigate to the appropriate content view in the feed
    router.push({
      pathname: '/feed',
      params: { 
        contentId: content.id.toString(),
        contentType: content.type
      }
    });
  };

  const renderSavedContentItem = (content: SavedContent, index: number) => {
    const industryName = allIndustries.find(ind => ind.id === content.industry_id)?.name;
    const optimizedIndustryName = industryName ? optimizeIndustryName(industryName) : undefined;
    const industryColor = getIndustryColor(content.industry_id);
    const displayAuthor = content.type === 'paper' && content.authors ? content.authors[0] : content.author;

    return (
      <TouchableOpacity
        key={`${content.type}-${content.id}`}
        style={[styles.savedItemCard, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={() => handleContentPress(content)}
      >
        <View style={styles.savedItemHeader}>
          {getTypeIcon(content.type)}
          <Text style={[styles.savedItemType, { color: colors.textSecondary }]} numberOfLines={1}>
            {content.type}
          </Text>
          {optimizedIndustryName && (
            <>
              <Text style={[styles.savedItemDot, { color: colors.textSecondary }]}>•</Text>
              <Text style={[styles.savedItemIndustry, { color: industryColor }]} numberOfLines={1}>
                {optimizedIndustryName}
              </Text>
            </>
          )}
        </View>
        
        <Text style={[styles.savedItemTitle, { color: colors.text }]} numberOfLines={2}>
          {removeHtmlTags(content.title)}
        </Text>
        
        {displayAuthor && (
          <Text style={[styles.savedItemAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
            {displayAuthor}
          </Text>
        )}
        
        {content.summary && (
          <Text style={[styles.savedItemSummary, { color: colors.text }]} numberOfLines={3}>
            {content.summary}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (parentLoading || loading) {
    return (
      <View style={[styles.container, { 
        backgroundColor: isDark ? colors.surface : colors.card,
        borderColor: colors.border 
      }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Saved Content</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (savedContent.length === 0) {
    return (
      <View style={[styles.container, { 
        backgroundColor: isDark ? colors.surface : colors.card,
        borderColor: colors.border 
      }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Saved Content</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="bookmark" size={24} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No saved content yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
            Tap the bookmark icon on articles, papers, or books to save them here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { 
      backgroundColor: isDark ? colors.surface : colors.card,
      borderColor: colors.border 
    }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Saved Content</Text>
        <TouchableOpacity onPress={() => router.push('/saved-feed')}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {savedContent.map((content, index) => renderSavedContentItem(content, index))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    marginHorizontal: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    paddingRight: 16,
  },
  savedItemCard: {
    width: screenWidth * 0.72,
    marginRight: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  savedItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  savedItemType: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
    marginLeft: 4,
  },
  savedItemDot: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  savedItemIndustry: {
    fontSize: 12,
    flex: 1,
  },
  savedItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  savedItemAuthor: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  savedItemSummary: {
    fontSize: 13,
    lineHeight: 16,
    opacity: 0.8,
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 16,
  },
});