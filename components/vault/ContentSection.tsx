import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { SearchResult } from '../../lib/smartSearchService';
import { IndustryColorBadge } from '../discover/IndustryColorBadge';
import { removeHtmlTags } from '../../utils/textUtils';
import { useIndustries } from '../../context/IndustriesContext';

interface ContentSectionProps {
  title: string;
  data: SearchResult[];
  loading: boolean;
  emptyState?: 'create' | 'none';
  onCreatePress?: () => void;
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  data,
  loading,
  emptyState = 'none',
  onCreatePress
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const { allIndustries } = useIndustries();

  const getIndustryName = (industryId?: string): string => {
    if (!industryId) return 'General';
    const industry = allIndustries.find(ind => ind.id === industryId);
    return industry ? industry.name : 'Unknown';
  };

  const handleItemPress = (item: SearchResult) => {
    router.push({
      pathname: '/feed',
      params: {
        contentType: item.type,
        contentId: item.id,
        animationDirection: 'left'
      }
    });
  };

  const renderContentCard = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={[styles.contentCard, { backgroundColor: colors.background, borderColor: colors.border }]}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.cardHeader}>
        <IndustryColorBadge
          industryId={item.industry_id}
          industryName={getIndustryName(item.industry_id)}
        />
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>

        {item.author && (
          <Text style={[styles.cardAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.author}
          </Text>
        )}

        {item.summary && (
          <Text style={[styles.cardSummary, { color: colors.textSecondary }]} numberOfLines={3}>
            {removeHtmlTags(item.summary)}
          </Text>
        )}
      </View>

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
        {data.length > 0 && (
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
    marginRight: 12,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
    marginBottom: 12,
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
  },
  cardFooter: {
    marginTop: 'auto',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
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