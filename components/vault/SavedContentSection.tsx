import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
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

interface SavedContentSectionProps {
  searchQuery?: string;
}

export const SavedContentSection: React.FC<SavedContentSectionProps> = ({ searchQuery = '' }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const { allIndustries } = useIndustries();

  const [savedContent, setSavedContent] = useState<SavedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredContent, setFilteredContent] = useState<SavedContent[]>([]);

  useEffect(() => {
    console.log('📄 SavedContentSection: Component mounted, user:', user?.id);
    if (user) {
      fetchSavedContent();
    }
  }, [user]);

  // Filter saved content based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContent(savedContent);
    } else {
      const filtered = savedContent.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContent(filtered);
    }
  }, [savedContent, searchQuery]);

  const fetchSavedContent = useCallback(async () => {
    if (!user) {
      console.log('📄 SavedContentSection: No user available');
      return;
    }

    console.log('📄 SavedContentSection: Fetching saved content for user:', user.id);
    setLoading(true);
    try {
      // Fetch all saved content types (limit to 50 total, ~17 each)
      const [articlesRes, papersRes, booksRes] = await Promise.all([
        supabase
          .from('article_saves')
          .select(`
            saved_at,
            articles (
              id,
              title,
              summary,
              author,
              created_at,
              industry_id
            )
          `)
          .eq('user_id', user.id)
          .order('saved_at', { ascending: false })
          .limit(20),

        supabase
          .from('paper_saves')
          .select(`
            saved_at,
            papers (
              id,
              title,
              summary,
              authors,
              created_at,
              industry_id
            )
          `)
          .eq('user_id', user.id)
          .order('saved_at', { ascending: false })
          .limit(20),

        supabase
          .from('book_saves')
          .select(`
            saved_at,
            books (
              id,
              title,
              summary,
              author,
              created_at,
              industry_id
            )
          `)
          .eq('user_id', user.id)
          .order('saved_at', { ascending: false })
          .limit(20)
      ]);

      console.log('📄 SavedContentSection: Raw responses - articles:', articlesRes.data?.length, 'papers:', papersRes.data?.length, 'books:', booksRes.data?.length);
      console.log('📄 SavedContentSection: Articles error:', articlesRes.error);
      console.log('📄 SavedContentSection: Papers error:', papersRes.error);
      console.log('📄 SavedContentSection: Books error:', booksRes.error);

      // Process and combine all saved content
      const allSaved: SavedContent[] = [];

      // Process articles
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
            saved_at: save.saved_at
          });
        }
      });

      // Process papers
      papersRes.data?.forEach(save => {
        if (save.papers) {
          allSaved.push({
            id: save.papers.id,
            title: save.papers.title,
            type: 'paper',
            summary: save.papers.summary,
            authors: save.papers.authors,
            created_at: save.papers.created_at,
            industry_id: save.papers.industry_id,
            saved_at: save.saved_at
          });
        }
      });

      // Process books
      booksRes.data?.forEach(save => {
        if (save.books) {
          allSaved.push({
            id: save.books.id,
            title: save.books.title,
            type: 'book',
            summary: save.books.summary,
            author: save.books.author,
            created_at: save.books.created_at,
            industry_id: save.books.industry_id,
            saved_at: save.saved_at
          });
        }
      });

      // Sort by saved_at date
      allSaved.sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime());

      console.log('📄 SavedContentSection: Fetched', allSaved.length, 'saved items');
      setSavedContent(allSaved);
    } catch (error) {
      console.error('📄 SavedContentSection: Error fetching saved content:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
        animationDirection: 'left'
      }
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <Feather name="file-text" size={16} color={colors.textSecondary} />;
      case 'paper':
        return <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.textSecondary} />;
      case 'book':
        return <FontAwesome name="book" size={16} color={colors.textSecondary} />;
      default:
        return <Feather name="file" size={16} color={colors.textSecondary} />;
    }
  };

  const renderSavedItem = ({ item }: { item: SavedContent }) => (
    <TouchableOpacity
      style={[styles.savedCard, { backgroundColor: colors.background, borderColor: colors.border }]}
      onPress={() => handleContentPress(item)}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.industryBadge,
            { backgroundColor: getIndustryColor(item.industry_id) }
          ]}
        >
          <Text style={styles.industryText}>
            {getIndustryName(item.industry_id)}
          </Text>
        </View>
        <View style={styles.typeContainer}>
          {getTypeIcon(item.type)}
          <Text style={[styles.typeText, { color: colors.textSecondary }]}>
            {item.type}
          </Text>
        </View>
      </View>

      <Text style={[styles.savedTitle, { color: colors.text }]} numberOfLines={2}>
        {item.title}
      </Text>

      {(item.author || item.authors) && (
        <Text style={[styles.savedAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.author || (item.authors && item.authors.join(', '))}
        </Text>
      )}

      {item.summary && (
        <Text style={[styles.savedSummary, { color: colors.textSecondary }]} numberOfLines={3}>
          {removeHtmlTags(item.summary)}
        </Text>
      )}

      <Text style={[styles.savedDate, { color: colors.textSecondary }]}>
        Saved {new Date(item.saved_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Loading saved content...
          </Text>
        </View>
      );
    }

    if (searchQuery.trim() && filteredContent.length === 0 && savedContent.length > 0) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="search" size={24} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No saved content matches your search
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Feather name="bookmark" size={24} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No saved content yet
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          Save articles, papers, and books to access them here
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Saved Content</Text>
        {filteredContent.length > 0 && (
          <Text style={[styles.countText, { color: colors.textSecondary }]}>
            {filteredContent.length} item{filteredContent.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {filteredContent.length > 0 ? (
        <FlatList
          horizontal
          data={filteredContent}
          renderItem={renderSavedItem}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        />
      ) : (
        renderEmptyState()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  countText: {
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  savedCard: {
    width: 280,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  industryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
  },
  industryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  savedTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  savedAuthor: {
    fontSize: 14,
    marginBottom: 8,
  },
  savedSummary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  savedDate: {
    fontSize: 12,
    marginTop: 'auto',
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
});