import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Linking, FlatList, ViewabilityConfig, ViewToken } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import type { Book } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

interface BookCardProps {
  book: Book;
  onOpenComments?: (bookId: number) => void;
  onUserInteraction?: (bookId: number, action: 'like' | 'save' | 'unlike' | 'unsave') => void;
}

type SlideItem = { type: 'cover' } | { type: 'insight'; insight: string; index: number };

export const BookCard: React.FC<BookCardProps> = React.memo(({ book, onOpenComments, onUserInteraction }) => {
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
    
    stateSetter(isAdding);
    countSetter(prev => isAdding ? prev + 1 : Math.max(0, prev - 1));

    const interactionData = { user_id: user.id, book_id: book.id };
    if (isAdding) {
      await supabase.from(table).insert(interactionData);
    } else {
      await supabase.from(table).delete().match(interactionData);
    }
    onUserInteraction?.(book.id, action);
  }, [user, book.id, onUserInteraction]);

  const handleCommentsPress = () => onOpenComments?.(book.id);
  const handleReadMorePress = () => { if (book.link) Linking.openURL(book.link); };

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
        <View style={[styles.slide, { width: screenWidth }]}>
          <View style={[styles.bookCover, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}>
            <View style={styles.bookSpine} />
            <View style={[styles.bookContent, { backgroundColor: colors.accent + '10' }]}>
              <Text style={[styles.bookTitle, { color: colors.text }]}>{book.title}</Text>
              {book.author && <Text style={[styles.bookAuthor, { color: colors.textSecondary }]}>{book.author}</Text>}
              {book.year && <Text style={[styles.bookYear, { color: colors.textSecondary }]}>{book.year}</Text>}
              <Text style={[styles.bookSummary, { color: colors.text }]}>{book.short_summary}</Text>
            </View>
          </View>
          {slides.length > 1 && (
            <Text style={[styles.swipeHint, { color: colors.textSecondary }]}>Swipe for insights →</Text>
          )}
        </View>
      );
    }
    
    return (
      <View style={[styles.slide, { width: screenWidth }]}>
        <View style={styles.insightContainer}>
          <Text style={[styles.insightNumber, { color: colors.primary }]}>Insight {item.index}</Text>
          <Text style={[styles.insightText, { color: colors.text }]}>{item.insight}</Text>
        </View>
      </View>
    );
  }, [book, colors, slides.length]);

  const dynamicStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, height: screenHeight },
    contentSection: { flex: 1, backgroundColor: colors.background, paddingTop: 0, paddingBottom: insets.bottom + 60 },
    slidesContainer: { flex: 1 },
    slideIndicators: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12 },
    indicator: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colors.border },
    actionGroup: { flexDirection: 'row', alignItems: 'center' },
    actionButton: { padding: 8 },
    actionText: { color: colors.textSecondary, fontSize: 12, marginLeft: 4, fontWeight: '500' },
    readMoreButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
    readMoreButtonText: { color: colors.primaryText, fontSize: 14, fontWeight: '600' },
  });

  return (
    <View style={dynamicStyles.container}>
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
        </View>
        
        {slides.length > 1 && (
          <View style={dynamicStyles.slideIndicators}>
            {slides.map((_, index) => (
              <View 
                key={index}
                style={[
                  dynamicStyles.indicator,
                  { backgroundColor: index === currentSlide ? colors.primary : colors.textSecondary + '40' }
                ]} 
              />
            ))}
          </View>
        )}

        <View style={dynamicStyles.actionsRow}>
          <View style={dynamicStyles.actionGroup}>
            <TouchableOpacity style={dynamicStyles.actionButton} onPress={() => toggleInteraction(hasLiked ? 'unlike' : 'like')}>
              <FontAwesome name={hasLiked ? "heart" : "heart-o"} size={20} color={hasLiked ? colors.accent : colors.text} />
            </TouchableOpacity>
            <Text style={dynamicStyles.actionText}>{likes}</Text>
          </View>
          <View style={dynamicStyles.actionGroup}>
            <TouchableOpacity style={dynamicStyles.actionButton} onPress={() => toggleInteraction(hasSaved ? 'unsave' : 'save')}>
              <Feather name="bookmark" size={20} color={hasSaved ? colors.accent : colors.text} />
            </TouchableOpacity>
            <Text style={dynamicStyles.actionText}>{saves}</Text>
          </View>
          <View style={dynamicStyles.actionGroup}>
            <TouchableOpacity style={dynamicStyles.actionButton} onPress={handleCommentsPress}>
              <Feather name="message-circle" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={dynamicStyles.actionText}>{book.comments_count || 0}</Text>
          </View>
          {book.link && (
            <TouchableOpacity style={dynamicStyles.readMoreButton} onPress={handleReadMorePress}>
              <Text style={dynamicStyles.readMoreButtonText}>Read More</Text>
            </TouchableOpacity>
          )}
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
    bottom: 20,
    fontSize: 14,
    fontStyle: 'italic',
  },
  insightContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  insightNumber: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  insightText: {
    fontSize: 22,
    lineHeight: 32,
    textAlign: 'center',
    fontWeight: '400',
  },
}); 