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
  Alert,
  Linking
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDeviceInfo, getContentBottomPadding } from '../utils/deviceUtils';
import { useIndustries } from '../context/IndustriesContext';
import { optimizeIndustryName } from '../utils/textUtils';
import { FeedbackBoardModal } from './feedback/FeedbackBoardModal';
import { ShareService } from '../lib/shareService';

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
  link?: string;
}

interface VictoryChartConfig {
  chartType: 'Bar' | 'Line' | 'Area' | 'Pie' | 'Scatter';
  data: Array<{x: number; y: number; label?: string}>;
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
  authors?: string[];
  likesCount?: number;
  commentsCount?: number;
  savesCount?: number;
  isInVault?: boolean;
  onOpenComments?: (contentId: number, source?: 'content_slides' | 'legacy') => void;
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
  authors,
  likesCount = 0,
  commentsCount = 0,
  savesCount = 0,
  isInVault = false,
  onOpenComments,
  onUserInteraction,
}) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const deviceInfo = useDeviceInfo();
  const { allIndustries } = useIndustries();

  const [slides, setSlides] = useState<ContentSlides | null>(null);
  const [industryName, setIndustryName] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(likesCount);
  const [hasLiked, setHasLiked] = useState(false);
  const [saves, setSaves] = useState(savesCount);
  const [hasSaved, setHasSaved] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Randomly determine layout variant based on contentId (consistent per content)
  const layoutVariant = useMemo(() => {
    // Use contentId as seed for consistent but varied layout
    return contentId % 2 === 0 ? 'below' : 'above';
  }, [contentId]);

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
        console.error('ContentCard: Error fetching slides:', error);
        setLoading(false);
        return;
      }

      console.log(`📊 ContentCard ${contentId}: Slides data:`, {
        hasChartOnCover: !!data.slides_chart_configs?.[0],
        coverChartType: data.slides_chart_configs?.[0]?.chartType,
        totalSlides: data.slides_text?.length,
        chartsInSlides: data.slides_chart_configs?.filter((c: any) => c !== null).length
      });

      setSlides(data);

      // Resolve industry name from industry_id
      if (data.industry_id) {
        const industry = allIndustries.find(ind => ind.id === data.industry_id);
        if (industry) {
          setIndustryName(optimizeIndustryName(industry.name));
        }
      }
    } catch (err) {
      console.error('ContentCard: Fetch slides error:', err);
    } finally {
      setLoading(false);
    }
  };

  const slideItems: SlideItem[] = useMemo(() => {
    if (!slides) return [{ type: 'title' }];
    // Use slides_text.length to determine actual number of content slides
    const numContentSlides = slides.slides_text?.length || 0;
    const contentSlides = Array.from({ length: numContentSlides - 1 }).map((_, index) => ({
      type: 'content' as const,
      index,
    }));
    return [{ type: 'title' }, ...contentSlides];
  }, [slides]);

  // Fetch like/save status from unified content_* tables
  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) return;

      const { data: likeData } = await supabase
        .from('content_likes')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .maybeSingle();
      if (likeData) setHasLiked(true);

      const { data: saveData } = await supabase
        .from('content_saves')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .maybeSingle();
      if (saveData) setHasSaved(true);
    };
    fetchStatus();
  }, [user, contentId, contentType]);

  const toggleInteraction = useCallback(async (action: 'like' | 'save' | 'unlike' | 'unsave') => {
    if (!user) return;

    const isLikeAction = action === 'like' || action === 'unlike';
    const isAdding = action === 'like' || action === 'save';

    const table = isLikeAction ? 'content_likes' : 'content_saves';
    const stateSetter = isLikeAction ? setHasLiked : setHasSaved;
    const countSetter = isLikeAction ? setLikes : setSaves;

    // Optimistic update
    stateSetter(isAdding);
    countSetter(prev => isAdding ? prev + 1 : prev - 1);

    if (isAdding) {
      const { error } = await supabase.from(table).insert({
        user_id: user.id,
        content_id: contentId,
        content_type: contentType
      });
      if (error) {
        console.error(`ContentCard: Error adding ${action}:`, error);
        stateSetter(!isAdding);
        countSetter(prev => isAdding ? prev - 1 : prev + 1);
      }
    } else {
      const { error } = await supabase.from(table).delete()
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .eq('content_type', contentType);
      if (error) {
        console.error(`ContentCard: Error removing ${action}:`, error);
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

  const handleMenuAction = (action: 'flag' | 'feedback') => {
    setMenuVisible(false);
    switch (action) {
      case 'flag':
        // TODO: Implement flag functionality
        Alert.alert('Flag Content', 'Content flagging will be implemented');
        break;
      case 'feedback':
        setShowFeedbackModal(true);
        break;
    }
  };

  const handleSharePress = useCallback(async () => {
    try {
      // Use the first slide's text as summary for sharing
      const summary = slides?.slides_text?.[0] || '';

      await ShareService.shareContent({
        type: contentType,
        id: String(contentId),
        title: title,
        summary: summary
      });
    } catch (error) {
      console.error('Error sharing content:', error);
    }
  }, [contentId, contentType, title, slides?.slides_text]);

  const handleReadMore = useCallback(async () => {
    if (!slides?.link) {
      Alert.alert('No Link', 'This content does not have an external link available.');
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(slides.link);
      if (canOpen) {
        await Linking.openURL(slides.link);
      } else {
        Alert.alert('Invalid Link', 'Unable to open this link.');
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Error', 'Failed to open the link.');
    }
  }, [slides?.link]);

  // Placeholder for future chart rendering - Victory Native not yet implemented
  // Charts will be added in a future native build
  const renderVictoryChart = useCallback((chartConfig: VictoryChartConfig) => {
    // For now, just show a placeholder
    // TODO: Implement Victory Native charts in next native build
    return null; // Don't show anything for charts yet
  }, []);

  const renderSlide = useCallback(({ item }: { item: SlideItem }) => {
    if (item.type === 'title') {
      // Title slide with image or chart from slides_images[0] / slides_chart_configs[0]
      const titleParts = splitTitleForHighlight(title);
      const coverImage = slides?.slides_images?.[0];
      const coverChart = slides?.slides_chart_configs?.[0];

      // Render title and industry content
      const titleContent = (
        <>
          {/* Industry name */}
          {industryName && (
            <Text style={styles.category}>{industryName}</Text>
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
        </>
      );

      // Render image or chart
      const imageContent = coverChart && typeof coverChart === 'object' ? (
        <View style={layoutVariant === 'above' ? styles.imageContainerSmall : styles.imageContainer}>
          {renderVictoryChart(coverChart)}
        </View>
      ) : coverImage && typeof coverImage === 'string' && coverImage.length > 0 ? (
        <View style={layoutVariant === 'above' ? styles.imageContainerSmall : styles.imageContainer}>
          <Image
            source={{ uri: coverImage }}
            style={layoutVariant === 'above' ? styles.heroImageSmall : styles.heroImage}
            resizeMode="cover"
            onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
          />
        </View>
      ) : null;

      return (
        <View style={[styles.slide, { width: screenWidth, backgroundColor: isDark ? colors.background : '#000' }]}>
          {layoutVariant === 'above' ? (
            // Layout: Title/Industry ABOVE image
            <>
              <View style={styles.titleContentTop}>
                {titleContent}
              </View>
              {imageContent}
            </>
          ) : (
            // Layout: Title/Industry BELOW image (original)
            <>
              {imageContent}
              <View style={styles.titleContent}>
                {titleContent}
              </View>
            </>
          )}
        </View>
      );
    }

    // Content slide
    if (!slides) return null;

    const slideIndex = item.index;
    // Offset by +1 since index 0 is used for cover slide
    const slideTitle = slides.slides_titles?.[slideIndex + 1];
    const slideText = slides.slides_text?.[slideIndex + 1];
    const slideImage = slides.slides_images?.[slideIndex + 1];
    const chartConfig = slides.slides_chart_configs?.[slideIndex + 1];

    return (
      <View style={[styles.slide, { width: screenWidth, backgroundColor: isDark ? colors.background : '#000' }]}>
        <View style={styles.contentSlide}>
          {/* Slide title */}
          {slideTitle && (
            <Text style={styles.slideTitle}>{slideTitle}</Text>
          )}

          {/* Visual content (chart or image) */}
          {chartConfig && typeof chartConfig === 'object' ? (
            <View style={styles.chartContainer}>
              {renderVictoryChart(chartConfig)}
            </View>
          ) : slideImage && typeof slideImage === 'string' && slideImage.length > 0 ? (
            <Image
              source={{ uri: slideImage }}
              style={styles.slideImage}
              resizeMode="contain"
              onError={(e) => console.log('Slide image load error:', e.nativeEvent.error)}
            />
          ) : null}

          {/* Slide text */}
          {slideText && <Text style={styles.slideText}>{slideText}</Text>}
        </View>
      </View>
    );
  }, [title, category, slides, industryName, renderVictoryChart, layoutVariant, isDark, colors.background]);

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
      <View style={[styles.metadataBar, { paddingTop: insets.top + 12, backgroundColor: colors.background }]}>
        <View style={styles.metadataLeft}>
          <Feather name="globe" size={20} color="#999" style={styles.globeIcon} />
          <View style={styles.metadataColumn}>
            <Text style={[styles.sourceText, { color: colors.text }]}>{source || 'Unknown Source'}</Text>
            <Text style={styles.dateText}>{formatDate(date)}</Text>
          </View>
        </View>

        <View style={styles.metadataRight}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{contentType === 'article' ? 'Article' : 'Paper'}</Text>
          </View>

          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
            <Feather name="more-horizontal" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Slides */}
      <View style={[styles.slidesContainer, { backgroundColor: isDark ? colors.background : '#000' }]}>
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
      </View>

      {/* Slide indicators - positioned above actions row */}
      {slideItems.length > 1 && (
        <View style={[styles.slideIndicators, { backgroundColor: isDark ? colors.background : '#000' }]}>
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

      {/* Bottom actions row */}
      <View style={[
        styles.actionsRow,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: isInVault ? 60 : insets.bottom + 60 + getContentBottomPadding(deviceInfo)
        }
      ]}>
        <View style={styles.actionGroup}>
          <TouchableOpacity onPress={() => toggleInteraction(hasLiked ? 'unlike' : 'like')} style={styles.actionButton}>
            <Feather name="heart" size={20} color={hasLiked ? '#ff4d4d' : '#999'} fill={hasLiked ? '#ff4d4d' : 'none'} />
            <Text style={styles.actionText}>{likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onOpenComments?.(contentId, 'content_slides')} style={styles.actionButton}>
            <Feather name="message-circle" size={20} color="#999" />
            <Text style={styles.actionText}>{commentsCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => toggleInteraction(hasSaved ? 'unsave' : 'save')} style={styles.actionButton}>
            <Feather name="bookmark" size={20} color={hasSaved ? '#FFC107' : '#999'} fill={hasSaved ? '#FFC107' : 'none'} />
            <Text style={styles.actionText}>{saves}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSharePress} style={styles.actionButton}>
            <Feather name="share" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleReadMore} style={styles.readMoreButton}>
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
            {/* Authors Section - Display directly if available */}
            {authors && authors.length > 0 && (
              <>
                <View style={styles.authorsSection}>
                  <View style={styles.authorsSectionHeader}>
                    <Feather name="user" size={18} color="#999" />
                    <Text style={styles.authorsSectionTitle}>
                      {authors.length === 1 ? 'Author' : 'Authors'}
                    </Text>
                  </View>
                  {authors.map((author, index) => (
                    <Text key={index} style={styles.authorName}>
                      {author}
                    </Text>
                  ))}
                </View>
                <View style={styles.menuDivider} />
              </>
            )}

            {/* Action Items */}
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

      {/* Feedback Modal */}
      <FeedbackBoardModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </View>
  );
});

// Helper function to split title for highlighting
// Always highlights the last 4 words in yellow
function splitTitleForHighlight(title: string): { normal: string; highlight?: string } {
  const words = title.split(' ');
  if (words.length > 4) {
    const normalWords = words.slice(0, -4);
    const highlightWords = words.slice(-4);
    return {
      normal: normalWords.join(' '),
      highlight: highlightWords.join(' ')
    };
  }
  // If 4 words or less, highlight the entire title
  return { normal: '', highlight: title };
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
  },
  metadataLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  metadataColumn: {
    flexDirection: 'column',
    gap: 2,
  },
  metadataSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  globeIcon: {
    marginTop: -2,
  },
  sourceText: {
    fontSize: 13,
    fontFamily: 'Oswald',
    fontWeight: '600',
  },
  dateText: {
    color: '#999',
    fontSize: 11,
    fontFamily: 'Oswald',
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
    fontFamily: 'Oswald',
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
  imageContainerSmall: {
    width: '80%',
    height: '50%',
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 24,
  },
  heroImageSmall: {
    width: '100%',
    height: '100%',
  },
  titleContent: {
    position: 'absolute',
    top: '60%', // Starts right after the image (which is 60% height)
    left: 0,
    right: 0,
    paddingTop: 24, // Fixed gap from bottom of image
    paddingHorizontal: 24,
  },
  titleContentTop: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  category: {
    color: '#5ED549',
    fontSize: 16,
    fontFamily: 'Oswald',
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
    fontFamily: 'Oswald',
    fontWeight: '700',
    lineHeight: 36,
    textAlign: 'left',
  },
  titleHighlight: {
    color: '#ECDA19',
  },
  contentSlide: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  slideTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Oswald',
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'left',
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
    fontFamily: 'Oswald',
    lineHeight: 26,
    textAlign: 'left',
    flexWrap: 'wrap',
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Oswald',
  },
  slideIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#000',
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
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
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
    fontFamily: 'Oswald',
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
    fontFamily: 'Oswald',
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
    fontFamily: 'Oswald',
    fontWeight: '500',
  },
  authorsSection: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  authorsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  authorsSectionTitle: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'Oswald',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  authorName: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Oswald',
    fontWeight: '400',
    paddingLeft: 30,
    paddingVertical: 4,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 8,
  },
});
