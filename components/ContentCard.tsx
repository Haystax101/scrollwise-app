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
import { ShareSheet } from './share/ShareSheet';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// Responsive font sizes for small screens with home button (iPhone SE)
const getResponsiveTitleSize = (isSmallScreen: boolean) => ({
  titleText: isSmallScreen ? 20 : 28,
  titleLineHeight: isSmallScreen ? 26 : 36,
  category: isSmallScreen ? 14 : 16,
  quoteMarks: isSmallScreen ? 120 : 180,
  quoteMarksMarginTop: isSmallScreen ? -40 : -60,
  quoteMarksMarginBottom: isSmallScreen ? -80 : -120,
  quoteAuthor: isSmallScreen ? 15 : 18,
  quoteJobTitle: isSmallScreen ? 12 : 14,
});

interface ContentSlides {
  id: string;
  content_id: number;
  content_type: 'article' | 'paper' | 'video' | 'podcast';
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
  data: Array<{ x: number; y: number; label?: string }>;
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
  contentType: 'article' | 'paper' | 'video' | 'podcast';
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
  const [shareSheetVisible, setShareSheetVisible] = useState(false);

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

  const handleSharePress = () => {
    setShareSheetVisible(true);
  };

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
      const quoteData = parseQuoteTitle(title);
      const titleParts = splitTitleForHighlight(quoteData.isQuote ? quoteData.quote! : title);
      const coverImage = slides?.slides_images?.[0];
      const coverChart = slides?.slides_chart_configs?.[0];

      // Get responsive sizes for small screens
      const responsiveSizes = getResponsiveTitleSize(deviceInfo.isSmallScreenWithHomeButton);
      const isSmallScreen = deviceInfo.isSmallScreenWithHomeButton;

      // Render title and industry content
      const titleContent = quoteData.isQuote ? (
        <>
          {/* Quote with opening and closing marks */}
          <View style={styles.titleContainer}>
            <View style={[styles.quoteMarksContainer, { marginTop: responsiveSizes.quoteMarksMarginTop, marginBottom: responsiveSizes.quoteMarksMarginBottom }]}>
              <Text style={[styles.quoteMarks, { fontSize: responsiveSizes.quoteMarks }]}>""</Text>
            </View>

            {/* Industry name below quote marks */}
            {industryName && (
              <Text style={[styles.category, { fontSize: responsiveSizes.category }]}>{industryName}</Text>
            )}

            <Text style={[styles.titleText, { fontSize: responsiveSizes.titleText, lineHeight: responsiveSizes.titleLineHeight }]}>
              {titleParts.normal}
              {titleParts.highlight && (
                <Text style={styles.titleHighlight}> {titleParts.highlight}</Text>
              )}
            </Text>
            <View style={[styles.quoteAuthorContainer, isSmallScreen && { marginTop: 16 }]}>
              <Text style={[styles.quoteAuthor, { fontSize: responsiveSizes.quoteAuthor }]}>{quoteData.author}</Text>
              {quoteData.jobTitle && (
                <Text style={[styles.quoteJobTitle, { fontSize: responsiveSizes.quoteJobTitle }]}>{quoteData.jobTitle}</Text>
              )}
            </View>
          </View>
        </>
      ) : (
        <>
          {/* Industry name */}
          {industryName && (
            <Text style={[styles.category, { fontSize: responsiveSizes.category }]}>{industryName}</Text>
          )}

          {/* Regular Title */}
          <View style={styles.titleContainer}>
            <Text style={[styles.titleText, { fontSize: responsiveSizes.titleText, lineHeight: responsiveSizes.titleLineHeight }]}>
              {titleParts.normal}
              {titleParts.highlight && (
                <Text style={styles.titleHighlight}> {titleParts.highlight}</Text>
              )}
            </Text>
          </View>
        </>
      );

      // Render image or chart
      // Determine image container style based on quote and layout variant
      const getImageContainerStyle = () => {
        if (layoutVariant === 'above') {
          return isSmallScreen ? styles.imageContainerSmallSE : styles.imageContainerSmall;
        }
        // For 'below' layout, use smaller container if there's a quote
        if (isSmallScreen) {
          return quoteData.isQuote ? styles.imageContainerQuoteSE : styles.imageContainerSE;
        }
        return quoteData.isQuote ? styles.imageContainerQuote : styles.imageContainer;
      };

      const imageContent = coverChart && typeof coverChart === 'object' ? (
        <View style={getImageContainerStyle()}>
          {renderVictoryChart(coverChart)}
        </View>
      ) : coverImage && typeof coverImage === 'string' && coverImage.length > 0 ? (
        <View style={getImageContainerStyle()}>
          <Image
            source={{ uri: coverImage }}
            style={layoutVariant === 'above' ? styles.heroImageSmall : styles.heroImage}
            resizeMode="contain"
            onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
          />
        </View>
      ) : null;

      return (
        <View style={[styles.slide, { width: screenWidth, backgroundColor: isDark ? colors.background : '#000' }]}>
          {layoutVariant === 'above' ? (
            // Layout: Title/Industry ABOVE image
            <>
              <View style={isSmallScreen ? styles.titleContentTopSE : styles.titleContentTop}>
                {titleContent}
              </View>
              {imageContent}
            </>
          ) : (
            // Layout: Title/Industry BELOW image (original)
            <>
              {imageContent}
              <View style={
                isSmallScreen
                  ? (quoteData.isQuote ? styles.titleContentQuoteSE : styles.titleContentSE)
                  : (quoteData.isQuote ? styles.titleContentQuote : styles.titleContent)
              }>
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
  }, [title, category, slides, industryName, renderVictoryChart, layoutVariant, isDark, colors.background, deviceInfo.isSmallScreenWithHomeButton]);

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
            <Text style={styles.typeBadgeText}>
              {contentType === 'article' ? 'Article' :
                contentType === 'paper' ? 'Paper' :
                  contentType === 'video' ? 'Video' : 'Podcast'}
            </Text>
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
          paddingBottom: isInVault ? 60 : insets.bottom + 60 + getContentBottomPadding(deviceInfo) + (deviceInfo.isSmallScreenWithHomeButton ? 12 : 0)
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

      <ShareSheet
        visible={shareSheetVisible}
        onClose={() => setShareSheetVisible(false)}
        content={{
          id: String(contentId),
          type: contentType,
          title: title,
          summary: slides?.slides_text?.[0], // First slide as summary
          image: slides?.slides_images?.[0] || undefined,
          author: authors && authors.length > 0 ? { name: authors[0] } : undefined
        }}
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

// Helper function to parse quote titles
// Format: "Author Name, Job Title: 'Quote text'"
function parseQuoteTitle(title: string): { isQuote: boolean; author?: string; jobTitle?: string; quote?: string } {
  // Check if title ends with a single quote
  if (!title.endsWith("'")) {
    return { isQuote: false };
  }

  // Pattern: "Author, Job Title: 'Quote'"
  const quotePattern = /^([^:]+?):\s*'(.+)'$/;
  const match = title.match(quotePattern);

  if (!match) {
    return { isQuote: false };
  }

  const authorAndJob = match[1].trim();
  const quote = match[2].trim();

  // Split author and job title by comma
  const parts = authorAndJob.split(',').map(p => p.trim());

  if (parts.length >= 2) {
    return {
      isQuote: true,
      author: parts[0],
      jobTitle: parts.slice(1).join(', '), // Handle multiple commas
      quote: quote
    };
  }

  // If no comma, treat entire part before colon as author
  return {
    isQuote: true,
    author: authorAndJob,
    quote: quote
  };
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
    fontFamily: 'Montserrat_600SemiBold',
  },
  dateText: {
    color: '#999',
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
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
    fontFamily: 'Montserrat_600SemiBold',
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
    overflow: 'visible',
    zIndex: 1,
  },
  imageContainerSE: {
    width: '100%',
    height: '45%',
    overflow: 'visible',
    zIndex: 1,
  },
  imageContainerQuote: {
    width: '100%',
    height: '40%',
    overflow: 'visible',
    zIndex: 1,
  },
  imageContainerQuoteSE: {
    width: '100%',
    height: '30%',
    overflow: 'visible',
    zIndex: 1,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  imageContainerSmall: {
    width: '80%',
    height: '50%',
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 24,
    zIndex: 1,
  },
  imageContainerSmallSE: {
    width: '75%',
    height: '40%',
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 16,
    zIndex: 1,
  },
  heroImageSmall: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  titleContent: {
    position: 'absolute',
    top: '60%', // Starts right after the image (which is 60% height)
    left: 0,
    right: 0,
    paddingTop: 24, // Fixed gap from bottom of image
    paddingHorizontal: 24,
    zIndex: 10,
  },
  titleContentSE: {
    position: 'absolute',
    top: '45%', // Starts right after the smaller SE image (which is 45% height)
    left: 0,
    right: 0,
    paddingTop: 16, // Reduced gap from bottom of image
    paddingHorizontal: 20,
    zIndex: 10,
  },
  titleContentQuote: {
    position: 'absolute',
    top: '40%', // Starts right after the quote image (which is 40% height)
    left: 0,
    right: 0,
    paddingTop: 24, // Fixed gap from bottom of image
    paddingHorizontal: 24,
    zIndex: 10,
  },
  titleContentQuoteSE: {
    position: 'absolute',
    top: '30%', // Starts right after the smaller SE quote image (which is 30% height)
    left: 0,
    right: 0,
    paddingTop: 12, // Reduced gap from bottom of image
    paddingHorizontal: 20,
    zIndex: 10,
  },
  titleContentTop: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    zIndex: 10,
  },
  titleContentTopSE: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  category: {
    color: '#5ED549',
    fontSize: 16,
    fontFamily: 'Oswald_600SemiBold',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    marginBottom: 12,
    zIndex: 10,
  },
  titleContainer: {
    marginBottom: 16,
    zIndex: 10,
  },
  titleText: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'Oswald_700Bold',
    letterSpacing: 0.5,
    lineHeight: 36,
    textAlign: 'left',
    textTransform: 'uppercase',
    zIndex: 10,
  },
  titleHighlight: {
    color: '#ECDA19',
  },
  quoteMarksContainer: {
    marginTop: -60,
    marginBottom: -120,
    zIndex: 10,
  },
  quoteMarks: {
    fontSize: 180,
    color: '#ECDA19',
    fontFamily: 'Oswald_700Bold',
    opacity: 0.9,
    zIndex: 10,
  },
  quoteAuthorContainer: {
    marginTop: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#ECDA19',
    paddingLeft: 16,
    zIndex: 10,
  },
  quoteAuthor: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Oswald_600SemiBold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  quoteJobTitle: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'Oswald_400Regular',
    letterSpacing: 0.5,
  },
  contentSlide: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  slideTitle: {
    color: '#5ED549',
    fontSize: 24,
    fontFamily: 'Oswald_700Bold',
    letterSpacing: 0.5,
    marginBottom: 20,
    textAlign: 'left',
    textTransform: 'uppercase',
    flexWrap: 'wrap',
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
    fontFamily: 'Montserrat_500Medium',
    lineHeight: 26,
    textAlign: 'left',
    flexWrap: 'wrap',
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Oswald_400Regular',
    letterSpacing: 0.5,
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
    fontFamily: 'Montserrat_500Medium',
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
    fontFamily: 'Montserrat_700Bold',
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
    fontFamily: 'Oswald_500Medium',
    letterSpacing: 0.5,
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
    fontFamily: 'Oswald_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  authorName: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Oswald_400Regular',
    letterSpacing: 0.5,
    paddingLeft: 30,
    paddingVertical: 4,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 8,
  },
});
