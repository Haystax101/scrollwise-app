import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Linking, FlatList, ViewabilityConfig, ViewToken } from 'react-native';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import type { Book } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlagButton } from './common/FlagButton';
import { processInsightText, removeHtmlTags } from '../utils/textUtils';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// Industry-based color mapping for books
const getIndustryColor = (industryId: string): string => {
  // Array of vibrant colors for random selection
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
  
  // Use industryId as seed for consistent randomness per book
  const hash = industryId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

interface BookCardProps {
  book: Book;
  onOpenComments?: (bookId: number) => void;
  onUserInteraction?: (bookId: number, action: 'like' | 'save' | 'unlike' | 'unsave') => void;
  isInVault?: boolean; // When true, reduces bottom padding for vault context
}

type SlideItem = { type: 'cover' } | { type: 'insight'; insight: string; index: number };

export const BookCard: React.FC<BookCardProps> = React.memo(({ book, onOpenComments, onUserInteraction, isInVault = false }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [likes, setLikes] = useState(book.likes_count || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [saves, setSaves] = useState(book.saves_count || 0);
  const [hasSaved, setHasSaved] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const flatListRef = useRef<FlatList>(null);

  const slides: SlideItem[] = useMemo(() => {
    const insightSlides = (book.key_insights || []).map((insight, index) => ({
      type: 'insight' as const,
      insight,
      index: index + 1,
    }));
    return [{ type: 'cover' }, ...insightSlides];
  }, [book.key_insights]);

  const industryColor = useMemo(() => 
    getIndustryColor(book.industry_id), 
    [book.industry_id]
  );

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) return;
      const tableNames = { likes: 'book_likes', saves: 'book_saves', idField: 'book_id' };
      
      const { data: likeData } = await supabase.from(tableNames.likes).select('user_id').eq('user_id', user.id).eq(tableNames.idField, book.id).maybeSingle();
      if (likeData) setHasLiked(true);

      const { data: saveData } = await supabase.from(tableNames.saves).select('user_id').eq('user_id', user.id).eq(tableNames.idField, book.id).maybeSingle();
      if (saveData) setHasSaved(true);
    };
    fetchStatus();
  }, [user, book.id]);

  const toggleInteraction = useCallback(async (action: 'like' | 'save' | 'unlike' | 'unsave') => {
    if (!user) return;
    
    const isLikeAction = action === 'like' || action === 'unlike';
    const isAdding = action === 'like' || action === 'save';
    
    const table = isLikeAction ? 'book_likes' : 'book_saves';
    const stateSetter = isLikeAction ? setHasLiked : setHasSaved;
    const countSetter = isLikeAction ? setLikes : setSaves;
    const originalState = isLikeAction ? hasLiked : hasSaved;
    const originalCount = isLikeAction ? likes : saves;

    stateSetter(isAdding);
    countSetter(prev => isAdding ? prev + 1 : Math.max(0, prev - 1));

    const interactionData = { user_id: user.id, book_id: book.id };

    try {
      if (isAdding) {
        const { error } = await supabase.from(table).insert(interactionData);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).delete().match(interactionData);
        if (error) throw error;
      }
      onUserInteraction?.(book.id, action);

      // Sync count in the main 'books' table
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('book_id', book.id);

      if (countError) throw countError;

      if (typeof count === 'number') {
        const updateField = isLikeAction ? { likes_count: count } : { saves_count: count };
        await supabase
          .from('books')
          .update(updateField)
          .eq('id', book.id);
        countSetter(count);
      }
    } catch (error) {
      console.error(`Error toggling ${action} for book ${book.id}:`, error);
      // Revert optimistic UI update on error
      stateSetter(originalState);
      countSetter(originalCount);
    }
  }, [user, book.id, onUserInteraction, hasLiked, hasSaved, likes, saves]);

  const handleCommentsPress = () => onOpenComments?.(book.id);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentSlide(viewableItems[0].index);
    }
  }).current;


  const viewabilityConfig: ViewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 200,
  }), []);

  const renderSlide = useCallback(({ item }: { item: SlideItem }) => {
    if (item.type === 'cover') {
      return (
        <View style={[styles.slide, { width: screenWidth, backgroundColor: industryColor }]}>
          <View style={[styles.bookContentSimple, { backgroundColor: industryColor }]}>
            <Text style={[styles.bookTitle, { color: colors.bookTitle }]}>{removeHtmlTags(book.title)}</Text>
            {book.author && <Text style={[styles.bookAuthor, { color: colors.bookMeta }]}>{book.author}</Text>}
            {book.year && <Text style={[styles.bookYear, { color: colors.bookMeta }]}>{book.year}</Text>}
            <Text style={[styles.bookSummary, { color: colors.bookSummary }]}>{book.short_summary}</Text>
          </View>
          {slides.length > 1 && (
            <Text style={[styles.swipeHint, { color: colors.bookSwipeHint }]}>Swipe for insights →</Text>
          )}
        </View>
      );
    }
    
    const processedText = processInsightText(item.insight, industryColor);
    
    return (
      <View style={[styles.slide, { width: screenWidth }]}>
        <View style={styles.insightContainer}>
          <View style={[styles.lightbulbBox, { backgroundColor: industryColor }]}>
            <Ionicons name="bulb" size={24} color="white" />
          </View>
          <View style={styles.insightTextContainer}>
            {processedText.map((part, index) => (
              <Text key={index} style={[styles.insightText, { color: colors.text }, part.style]}>
                {part.text}
              </Text>
            ))}
          </View>
        </View>
      </View>
    );
  }, [book, colors, slides.length, industryColor]);

  const dynamicStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, height: screenHeight, position: 'relative' },
    flagButton: {
      position: 'absolute',
      top: 52, // Increased to avoid iPhone status bar/notch
      right: 12,
      zIndex: 10,
    },
    contentSection: { flex: 1, backgroundColor: colors.background, paddingTop: 0, paddingBottom: isInVault ? 60 : insets.bottom + 60 },
    slidesContainer: { flex: 1, position: 'relative' },
    slideIndicators: { 
      flexDirection: 'row', 
      justifyContent: 'center', 
      alignItems: 'center', 
      paddingVertical: 12,
      backgroundColor: 'transparent',
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
      zIndex: 10
    },
    indicator: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colors.border },
    actionGroup: { flexDirection: 'row', alignItems: 'center' },
    actionButton: { padding: 8 },
    actionText: { color: colors.textSecondary, fontSize: 12, marginLeft: 4, fontWeight: '500' },
  });

  return (
    <View style={dynamicStyles.container}>
      <FlagButton
        contentId={book.id}
        contentType="book"
        size={20}
        style={dynamicStyles.flagButton}
      />
      <View style={dynamicStyles.contentSection}>
        <View style={dynamicStyles.slidesContainer}>
          <FlatList
            ref={flatListRef}
            data={slides}
            renderItem={renderSlide}
            keyExtractor={(item, index) => item.type + index}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            bounces={false}
          />
          
          {slides.length > 1 && (
            <View style={dynamicStyles.slideIndicators}>
              {slides.map((_, index) => (
                <View 
                  key={index}
                  style={[
                    dynamicStyles.indicator,
                    { backgroundColor: index === currentSlide 
                      ? (currentSlide === 0 ? 'white' : industryColor)
                      : (currentSlide === 0 ? 'rgba(255,255,255,0.4)' : colors.textSecondary + '40')
                    }
                  ]} 
                />
              ))}
            </View>
          )}
        </View>

        <View style={dynamicStyles.actionsRow}>
          <View style={dynamicStyles.actionGroup}>
            <TouchableOpacity style={dynamicStyles.actionButton} onPress={() => toggleInteraction(hasLiked ? 'unlike' : 'like')}>
              <FontAwesome name={hasLiked ? "heart" : "heart-o"} size={20} color={hasLiked ? colors.likeColor : colors.text} />
            </TouchableOpacity>
            <Text style={dynamicStyles.actionText}>{likes}</Text>
          </View>
          <View style={dynamicStyles.actionGroup}>
            <TouchableOpacity style={dynamicStyles.actionButton} onPress={handleCommentsPress}>
              <Feather name="message-circle" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={dynamicStyles.actionText}>{book.comments_count || 0}</Text>
          </View>
          <View style={dynamicStyles.actionGroup}>
            <TouchableOpacity style={dynamicStyles.actionButton} onPress={() => toggleInteraction(hasSaved ? 'unsave' : 'save')}>
              <Feather name="bookmark" size={20} color={hasSaved ? colors.accent : colors.text} />
            </TouchableOpacity>
            <Text style={dynamicStyles.actionText}>{saves}</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bookCover: {
    width: screenWidth * 0.75,
    height: '75%',
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  bookSpine: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  bookContent: {
    flex: 1,
    width: '100%',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  bookContentSimple: {
    flex: 1,
    width: '100%',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  bookAuthor: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  bookYear: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  bookSummary: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    opacity: 0.9,
  },
  swipeHint: {
    position: 'absolute',
    bottom: 60,
    fontSize: 14,
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  insightContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginTop: 40,
  },
  lightbulbBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  insightTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  insightText: {
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'left',
    fontWeight: '500',
  },
}); 