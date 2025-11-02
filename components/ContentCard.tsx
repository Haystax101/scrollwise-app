import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  FlatList,
  Image,
  ViewToken,
  Modal,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

interface ContentSlides {
  id: string;
  content_id: number;
  content_type: 'article' | 'paper';
  slides_text: string[];
  slides_titles: string[];
  slides_images: (string | null)[];
  slides_chart_configs: (VictoryChartConfig | null)[];
  total_slides: number;
  generated_at: string;
}

interface VictoryChartConfig {
  chartType: 'VictoryBar' | 'VictoryLine' | 'VictoryArea' | 'VictoryPie' | 'VictoryScatter';
  data: Array<{x: string | number; y: number}>;
  style?: {
    data?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
    };
  };
  options?: {
    theme?: 'dark' | 'light';
    domainPadding?: number;
    [key: string]: any;
  };
}

interface ContentCardProps {
  contentId: number;
  contentType: 'article' | 'paper';
  title: string;
  source?: string;
  date?: string;
  category?: string;
  imageUrl?: string;
  authors?: string[];
  likesCount?: number;
  commentsCount?: number;
  savesCount?: number;
  onOpenComments?: (contentId: number) => void;
  onUserInteraction?: (contentId: number, action: 'like' | 'save' | 'unlike' | 'unsave') => void;
}

type SlideItem = { type: 'title' } | { type: 'content'; index: number };

export const ContentCard: React.FC<ContentCardProps> = React.memo(({
  contentId,
  contentType,
  title,
  source,
  date,
  category,
  imageUrl,
  authors,
  likesCount = 0,
  commentsCount = 0,
  savesCount = 0,
  onOpenComments,
  onUserInteraction,
}) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [slides, setSlides] = useState<ContentSlides | null>(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(likesCount);
  const [hasLiked, setHasLiked] = useState(false);
  const [saves, setSaves] = useState(savesCount);
  const [hasSaved, setHasSaved] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Fetch slides from content_slides table
  useEffect(() => {
    fetchSlides();
  }, [contentId, contentType]);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('content_slides')
        .select('*')
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .single();

      if (error) {
        console.error('Error fetching slides:', error);
        setLoading(false);
        return;
      }

      setSlides(data);
    } catch (err) {
      console.error('Fetch slides error:', err);
    } finally {
      setLoading(false);
    }
  };

  const slideItems: SlideItem[] = useMemo(() => {
    if (!slides) return [{ type: 'title' }];
    const contentSlides = Array.from({ length: slides.total_slides }).map((_, index) => ({
      type: 'content' as const,
      index,
    }));
    return [{ type: 'title' }, ...contentSlides];
  }, [slides]);

  // Fetch like/save status
  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) return;

      const tablePrefix = contentType === 'article' ? 'article' : 'paper';
      const likesTable = `${tablePrefix}_likes`;
      const savesTable = `${tablePrefix}_saves`;
      const idField = `${tablePrefix}_id`;

      const { data: likeData } = await supabase
        .from(likesTable)
        .select('user_id')
        .eq('user_id', user.id)
        .eq(idField, contentId)
        .maybeSingle();
      if (likeData) setHasLiked(true);

      const { data: saveData } = await supabase
        .from(savesTable)
        .select('user_id')
        .eq('user_id', user.id)
        .eq(idField, contentId)
        .maybeSingle();
      if (saveData) setHasSaved(true);
    };
    fetchStatus();
  }, [user, contentId, contentType]);

  const toggleInteraction = useCallback(async (action: 'like' | 'save' | 'unlike' | 'unsave') => {
    if (!user) return;

    const isLikeAction = action === 'like' || action === 'unlike';
    const isAdding = action === 'like' || action === 'save';

    const tablePrefix = contentType === 'article' ? 'article' : 'paper';
    const table = isLikeAction ? `${tablePrefix}_likes` : `${tablePrefix}_saves`;
    const idField = `${tablePrefix}_id`;
    const stateSetter = isLikeAction ? setHasLiked : setHasSaved;
    const countSetter = isLikeAction ? setLikes : setSaves;

    // Optimistic update
    stateSetter(isAdding);
    countSetter(prev => isAdding ? prev + 1 : prev - 1);

    if (isAdding) {
      const { error } = await supabase.from(table).insert({ user_id: user.id, [idField]: contentId });
      if (error) {
        stateSetter(!isAdding);
        countSetter(prev => isAdding ? prev - 1 : prev + 1);
      }
    } else {
      const { error } = await supabase.from(table).delete().eq('user_id', user.id).eq(idField, contentId);
      if (error) {
        stateSetter(!isAdding);
        countSetter(prev => isAdding ? prev - 1 : prev + 1);
      }
    }

    onUserInteraction?.(contentId, action);
  }, [user, contentId, contentType, onUserInteraction]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setCurrentSlide(viewableItems[0].index || 0);
    }
  }, []);

  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 200,
  }), []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const handleMenuAction = (action: 'authors' | 'flag' | 'feedback') => {
    setMenuVisible(false);
    switch (action) {
      case 'authors':
        if (authors && authors.length > 0) {
          Alert.alert('Authors', authors.join(', '));
        }
        break;
      case 'flag':
        // TODO: Implement flag functionality
        Alert.alert('Flag Content', 'Content flagging will be implemented');
        break;
      case 'feedback':
        router.push('/feedback');
        break;
    }
  };

  const renderSlide = useCallback(({ item }: { item: SlideItem }) => {
    if (item.type === 'title') {
      // Title slide with image
      const titleParts = splitTitleForHighlight(title);

      return (
        <View style={[styles.slide, { width: screenWidth }]}>
          {/* Image */}
          {imageUrl && typeof imageUrl === 'string' && imageUrl.length > 0 && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.heroImage}
                resizeMode="cover"
                onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
              />
            </View>
          )}

          {/* Content overlay */}
          <View style={styles.titleContent}>
            {/* Category */}
            {category && (
              <Text style={styles.category}>{category}</Text>
            )}

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>
                {titleParts.normal}
                {titleParts.highlight && (
                  <Text style={styles.titleHighlight}> {titleParts.highlight}</Text>
                )}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // Content slide
    if (!slides) return null;

    const slideIndex = item.index;
    const slideTitle = slides.slides_titles?.[slideIndex];
    const slideText = slides.slides_text?.[slideIndex];
    const slideImage = slides.slides_images?.[slideIndex];
    const chartConfig = slides.slides_chart_configs?.[slideIndex];

    return (
      <View style={[styles.slide, { width: screenWidth }]}>
        <View style={styles.contentSlide}>
          {/* Slide title */}
          {slideTitle && (
            <Text style={styles.slideTitle}>{slideTitle}</Text>
          )}

          {/* Visual content (chart or image) */}
          {chartConfig && typeof chartConfig === 'object' && (
            <View style={styles.chartContainer}>
              {/* TODO: Render Victory chart */}
              <Text style={styles.placeholderText}>Chart rendering coming soon</Text>
            </View>
          )}
          {!chartConfig && slideImage && typeof slideImage === 'string' && slideImage.length > 0 && (
            <Image
              source={{ uri: slideImage }}
              style={styles.slideImage}
              resizeMode="contain"
              onError={(e) => console.log('Slide image load error:', e.nativeEvent.error)}
            />
          )}

          {/* Slide text */}
          {slideText && <Text style={styles.slideText}>{slideText}</Text>}
        </View>
      </View>
    );
  }, [title, category, imageUrl, slides]);

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Loading slides...</Text>
      </View>
    );
  }

  // Show error state if no slides found
  if (!slides) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>No slides available</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top metadata bar */}
      <View style={styles.metadataBar}>
        <View style={styles.metadataLeft}>
          <Feather name="globe" size={16} color="#999" style={styles.globeIcon} />
          <Text style={styles.sourceText}>{source || 'Unknown Source'}</Text>
          <Text style={styles.dateText}>{formatDate(date)}</Text>
        </View>

        <View style={styles.metadataRight}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{contentType === 'article' ? 'Article' : 'Paper'}</Text>
          </View>

          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
            <Feather name="more-horizontal" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Slides */}
      <View style={styles.slidesContainer}>
        <FlatList
          ref={flatListRef}
          data={slideItems}
          renderItem={renderSlide}
          keyExtractor={(item, index) => `${item.type}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          bounces={false}
        />

        {/* Slide indicators */}
        {slideItems.length > 1 && (
          <View style={styles.slideIndicators}>
            {slideItems.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  {
                    backgroundColor: index === currentSlide ? '#fff' : '#444',
                    width: index === currentSlide ? 20 : 6,
                  }
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Bottom actions row */}
      <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
        <View style={styles.actionGroup}>
          <TouchableOpacity onPress={() => toggleInteraction(hasLiked ? 'unlike' : 'like')} style={styles.actionButton}>
            <Feather name="heart" size={20} color={hasLiked ? '#ff4d4d' : '#999'} fill={hasLiked ? '#ff4d4d' : 'none'} />
            <Text style={styles.actionText}>{likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onOpenComments?.(contentId)} style={styles.actionButton}>
            <Feather name="message-circle" size={20} color="#999" />
            <Text style={styles.actionText}>{commentsCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => toggleInteraction(hasSaved ? 'unsave' : 'save')} style={styles.actionButton}>
            <Feather name="bookmark" size={20} color={hasSaved ? '#FFC107' : '#999'} fill={hasSaved ? '#FFC107' : 'none'} />
            <Text style={styles.actionText}>{saves}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Feather name="share" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.readMoreButton}>
          <Text style={styles.readMoreText}>Read More</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuAction('authors')}
            >
              <Feather name="user" size={18} color="#fff" />
              <Text style={styles.menuItemText}>View Author(s)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuAction('flag')}
            >
              <Feather name="flag" size={18} color="#fff" />
              <Text style={styles.menuItemText}>Flag Content</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuAction('feedback')}
            >
              <Feather name="message-square" size={18} color="#fff" />
              <Text style={styles.menuItemText}>Leave Feedback</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
});

// Helper function to split title for highlighting
// Looks for common patterns like "One Thing in Common" in the title
function splitTitleForHighlight(title: string): { normal: string; highlight?: string } {
  // Simple heuristic: highlight last 3-5 words if title is long enough
  const words = title.split(' ');
  if (words.length > 8) {
    const highlightCount = Math.min(5, Math.floor(words.length / 3));
    const normalWords = words.slice(0, -highlightCount);
    const highlightWords = words.slice(-highlightCount);
    return {
      normal: normalWords.join(' '),
      highlight: highlightWords.join(' ')
    };
  }
  return { normal: title };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: screenHeight,
    position: 'relative',
  },
  metadataBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  metadataLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  globeIcon: {
    marginRight: 8,
  },
  sourceText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Montserrat',
    fontWeight: '600',
    marginRight: 8,
  },
  dateText: {
    color: '#999',
    fontSize: 13,
    fontFamily: 'Montserrat',
  },
  metadataRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeBadge: {
    backgroundColor: '#4A148C',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Montserrat',
    fontWeight: '600',
  },
  menuButton: {
    padding: 4,
  },
  slidesContainer: {
    flex: 1,
    position: 'relative',
  },
  slide: {
    height: '100%',
    backgroundColor: '#000',
  },
  imageContainer: {
    width: '100%',
    height: '60%',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  titleContent: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  category: {
    color: '#4ADE80',
    fontSize: 16,
    fontFamily: 'Montserrat',
    fontWeight: '600',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  titleContainer: {
    marginBottom: 16,
  },
  titleText: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'Montserrat',
    fontWeight: '700',
    lineHeight: 36,
  },
  titleHighlight: {
    color: '#FFC107',
  },
  contentSlide: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  slideTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Montserrat',
    fontWeight: '700',
    marginBottom: 20,
  },
  chartContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  slideImage: {
    width: '100%',
    height: 250,
    marginBottom: 20,
  },
  slideText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Montserrat',
    lineHeight: 26,
    textAlign: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  slideIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  indicator: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    backgroundColor: '#0A0A0A',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'Montserrat',
    fontWeight: '500',
  },
  readMoreButton: {
    backgroundColor: '#FFC107',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  readMoreText: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'Montserrat',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 16,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Montserrat',
    fontWeight: '500',
  },
});
