import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { SearchResult } from '../../lib/smartSearchService';
import { removeHtmlTags } from '../../utils/textUtils';
import { useIndustries } from '../../context/IndustriesContext';
import { optimizeIndustryName } from '../../utils/textUtils';

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

interface ContentSectionProps {
  title: string;
  data: SearchResult[];
  loading: boolean;
  emptyState?: 'create' | 'none';
  onCreatePress?: () => void;
  showSeeAll?: boolean;
  onItemPress?: (item: SearchResult) => void;
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  data,
  loading,
  emptyState = 'none',
  onCreatePress,
  showSeeAll = false,
  onItemPress
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const { allIndustries } = useIndustries();

  const getIndustryName = (industryId?: string): string => {
    if (!industryId) return 'General';
    const industry = allIndustries.find(ind => ind.id === industryId);
    return industry ? optimizeIndustryName(industry.name) : 'Unknown';
  };

  const handleItemPress = (item: SearchResult) => {
    if (onItemPress) {
      // Use vault internal viewer
      onItemPress(item);
    } else {
      // Fallback to feed navigation (for other uses of this component)
      router.push({
        pathname: '/feed',
        params: {
          contentType: item.type,
          contentId: item.id,
          animationDirection: 'left',
          showBackButton: 'true',
          backTo: 'vault'
        }
      });
    }
  };

  const renderContentCard = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={[styles.contentCard, { backgroundColor: colors.background, borderColor: colors.border }]}
      onPress={() => handleItemPress(item)}
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
          {item.type === 'article' ? (
            <Feather name="file-text" size={16} color={colors.textSecondary} />
          ) : item.type === 'paper' ? (
            <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.textSecondary} />
          ) : (
            <Feather name="book" size={16} color={colors.textSecondary} />
          )}
          <Text style={[styles.typeText, { color: colors.textSecondary }]}>
            {item.type}
          </Text>
        </View>
      </View>

      <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
        {item.title}
      </Text>

      {(item.author || item.authors) && (
        <Text style={[styles.cardAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.author || (item.authors && Array.isArray(item.authors) ? item.authors.join(', ') : item.authors)}
        </Text>
      )}

      {(item.summary || item.content_simple || item.short_summary) && (
        <Text style={[styles.cardSummary, { color: colors.textSecondary }]} numberOfLines={3}>
          {removeHtmlTags(item.summary || item.content_simple || item.short_summary || '')}
        </Text>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Feather name="heart" size={12} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {item.likes_count || 0}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="bookmark" size={12} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {item.saves_count || 0}
            </Text>
          </View>
        </View>
        {item.date && (
          <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Loading {title.toLowerCase()}...
          </Text>
        </View>
      );
    }

    switch (emptyState) {
      case 'create':
        return (
          <TouchableOpacity
            style={[styles.emptyContainer, styles.createButton, { borderColor: colors.primary }]}
            onPress={onCreatePress}
          >
            <Feather name="plus" size={24} color={colors.primary} />
            <Text style={[styles.createText, { color: colors.primary }]}>Create Your Own</Text>
          </TouchableOpacity>
        );


      default:
        return (
          <View style={styles.emptyContainer}>
            <Feather name="search" size={24} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No {title.toLowerCase()} found
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        {data.length > 0 && showSeeAll && (
          <TouchableOpacity onPress={() => {/* TODO: Navigate to full section */}}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {data.length > 0 ? (
        <FlatList
          horizontal
          data={data}
          renderItem={renderContentCard}
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
  seeAllText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  contentCard: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  cardAuthor: {
    fontSize: 14,
    marginBottom: 8,
  },
  cardSummary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
  cardDate: {
    fontSize: 12,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  createButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  createText: {
    fontSize: 16,
    fontWeight: '600',
  },
});