import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import { Feather, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useIndustries } from '../context/IndustriesContext';
import { supabase } from '../lib/supabase';
import { optimizeIndustryName, removeHtmlTags } from '../utils/textUtils';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 48) / 2; // 2 columns with padding

const getIndustryColor = (industryId: string): string => {
  const colors = [
    '#9C27B0', '#B71C1C', '#1565C0', '#1B5E20', '#5E35B1',
    '#880E4F', '#C51162', '#311B92', '#004D40',
  ];
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

export default function SavedFeedPage() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const { allIndustries } = useIndustries();

  const [savedContent, setSavedContent] = useState<SavedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSavedContent();
    }
  }, [user]);

  const fetchSavedContent = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch all saved content types
      const [articlesRes, papersRes, booksRes] = await Promise.all([
        supabase
          .from('article_saves')
          .select(`
            created_at,
            articles!article_id (
              id,
              title,
              summary,
              author,
              created_at,
              industry_id
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('paper_saves')
          .select(`
            created_at,
            papers!paper_id (
              id,
              title,
              content_simple,
              authors,
              created_at,
              industry_id
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('book_saves')
          .select(`
            created_at,
            books!book_id (
              id,
              title,
              short_summary,
              author,
              created_at,
              industry_id
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      // Process and combine all saved content
      const allSaved: SavedContent[] = [];

      articlesRes.data?.forEach(save => {
        if (save.articles) {
          allSaved.push({
            id: save.articles.id,
            title: save.articles.title,
            type: 'article',
            summary: save.articles.summary,
            author: save.articles.author,
            created_at: save.articles.created_at,
            industry_id: save.articles.industry_id,
            saved_at: save.created_at
          });
        }
      });

      papersRes.data?.forEach(save => {
        if (save.papers) {
          allSaved.push({
            id: save.papers.id,
            title: save.papers.title,
            type: 'paper',
            summary: save.papers.content_simple,
            authors: save.papers.authors,
            created_at: save.papers.created_at,
            industry_id: save.papers.industry_id,
            saved_at: save.created_at
          });
        }
      });

      booksRes.data?.forEach(save => {
        if (save.books) {
          allSaved.push({
            id: save.books.id,
            title: save.books.title,
            type: 'book',
            summary: save.books.short_summary,
            author: save.books.author,
            created_at: save.books.created_at,
            industry_id: save.books.industry_id,
            saved_at: save.created_at
          });
        }
      });

      // Sort by saved_at date
      allSaved.sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime());

      setSavedContent(allSaved);
    } catch (error) {
      console.error('Error fetching saved content:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSavedContent();
    setRefreshing(false);
  };

  const getIndustryName = (industryId: string): string => {
    const industry = allIndustries.find(ind => ind.id === industryId);
    return industry ? optimizeIndustryName(industry.name) : 'Unknown';
  };

  const handleContentPress = (item: SavedContent) => {
    router.push({
      pathname: '/feed',
      params: {
        contentType: item.type,
        contentId: item.id,
        animationDirection: 'left',
        showBackButton: 'true',
        backTo: 'saved-feed'
      }
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <Feather name="file-text" size={14} color={colors.textSecondary} />;
      case 'paper':
        return <MaterialCommunityIcons name="file-document-outline" size={14} color={colors.textSecondary} />;
      case 'book':
        return <FontAwesome name="book" size={14} color={colors.textSecondary} />;
      default:
        return <Feather name="file" size={14} color={colors.textSecondary} />;
    }
  };

  const renderGridItem = ({ item }: { item: SavedContent }) => (
    <TouchableOpacity
      style={[styles.gridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleContentPress(item)}
    >
      <View
        style={[
          styles.industryBadge,
          { backgroundColor: getIndustryColor(item.industry_id) }
        ]}
      >
        <Text style={styles.industryText} numberOfLines={1}>
          {getIndustryName(item.industry_id)}
        </Text>
      </View>

      <Text style={[styles.gridTitle, { color: colors.text }]} numberOfLines={3}>
        {item.title}
      </Text>

      {(item.author || item.authors) && (
        <Text style={[styles.gridAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.author || (item.authors && item.authors.join(', '))}
        </Text>
      )}

      <View style={styles.gridFooter}>
        <View style={styles.typeContainer}>
          {getTypeIcon(item.type)}
          <Text style={[styles.typeText, { color: colors.textSecondary }]}>
            {item.type}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather name="bookmark" size={48} color={colors.textSecondary} />
      <Text style={[styles.emptyText, { color: colors.text }]}>No saved content</Text>
      <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
        Save articles, papers, and books to access them here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.border + '20' }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Saved Content</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={savedContent}
          renderItem={renderGridItem}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContent: {
    padding: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridCard: {
    width: CARD_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    height: 180,
  },
  industryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  industryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 18,
    flex: 1,
  },
  gridAuthor: {
    fontSize: 12,
    marginBottom: 8,
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
});
