import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Linking, ScrollView } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import type { Book } from '../types';
import { StaticVisual } from './StaticVisual';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIndustries } from '../context/IndustriesContext';
import { ExpandedTextModal } from './ExpandedTextModal';

const { height: screenHeight } = Dimensions.get('window');

interface BookCardProps {
  book: Book;
  isActive: boolean;
  onOpenComments?: (bookId: number) => void;
  onUserInteraction?: (bookId: number, action: 'like' | 'save' | 'unlike' | 'unsave') => void;
}

const getTableNames = () => ({
  content: 'books',
  likes: 'book_likes',
  saves: 'book_saves',
  idField: 'book_id'
});

const getSiteName = (url: string): string => {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  } catch {
    return 'Unknown date';
  }
};

export const BookCard: React.FC<BookCardProps> = React.memo(({ book, onOpenComments, onUserInteraction }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { allIndustries } = useIndustries();

  const [likes, setLikes] = useState(book.likes_count || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [saves, setSaves] = useState(book.saves_count || 0);
  const [hasSaved, setHasSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const tableNames = useMemo(() => getTableNames(), []);

  const industryName = useMemo(() => {
    return allIndustries.find(ind => ind.id === book.industry_id)?.name;
  }, [allIndustries, book.industry_id]);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) return;
      
      const { data: likeData } = await supabase
        .from(tableNames.likes)
        .select('user_id')
        .eq('user_id', user.id)
        .eq(tableNames.idField, book.id)
        .maybeSingle();
      if (likeData) setHasLiked(true);

      const { data: saveData } = await supabase
        .from(tableNames.saves)
        .select('user_id')
        .eq('user_id', user.id)
        .eq(tableNames.idField, book.id)
        .maybeSingle();
      if (saveData) setHasSaved(true);
    };

    fetchStatus();
  }, [user, book.id, tableNames]);

  const handleToggleExpand = () => setIsExpanded(!isExpanded);

  const toggleLike = useCallback(async (isLiking: boolean) => {
    if (!user) return;

    setHasLiked(isLiking);
    setLikes(prev => isLiking ? prev + 1 : Math.max(0, prev - 1));

    const interactionData = { user_id: user.id, [tableNames.idField]: book.id };

    if (isLiking) {
      await supabase.from(tableNames.likes).insert(interactionData);
    } else {
      await supabase.from(tableNames.likes).delete().match(interactionData);
    }
    onUserInteraction?.(book.id, isLiking ? 'like' : 'unlike');
  }, [user, book.id, tableNames, onUserInteraction]);

  const toggleSave = useCallback(async (isSaving: boolean) => {
    if (!user) return;

    setHasSaved(isSaving);
    setSaves(prev => isSaving ? prev + 1 : Math.max(0, prev - 1));

    const interactionData = { user_id: user.id, [tableNames.idField]: book.id };

    if (isSaving) {
      await supabase.from(tableNames.saves).insert(interactionData);
    } else {
      await supabase.from(tableNames.saves).delete().match(interactionData);
    }
    onUserInteraction?.(book.id, isSaving ? 'save' : 'unsave');
  }, [user, book.id, tableNames, onUserInteraction]);

  const handleLikePress = () => toggleLike(!hasLiked);
  const handleSavePress = () => toggleSave(!hasSaved);
  const handleCommentsPress = () => onOpenComments?.(book.id);
  const handleReadMorePress = () => { if (book.link) Linking.openURL(book.link); };
  
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      height: screenHeight,
      width: '100%',
    },
    visualSection: {
      height: screenHeight * 0.45,
      width: '100%',
    },
    contentSection: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingTop: 0,
      paddingBottom: insets.bottom + 60,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      marginTop: -20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    contentBody: {
      flex: 1,
      justifyContent: 'space-between',
    },
    mainContent: {
      flexShrink: 1,
    },
    contentScrollView: { flex: 1 },
    contentContainer: { flexGrow: 1, paddingBottom: 16 },
    metadata: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    metadataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    metadataText: { color: colors.textSecondary, fontSize: 12 },
    metadataDot: { color: colors.textSecondary, fontSize: 12, marginHorizontal: 4 },
    typeContainer: { flexDirection: 'row', alignItems: 'center' },
    typeText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 12,
      lineHeight: 26,
    },
    authorContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    authorTag: {
      backgroundColor: colors.accent + '20',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginRight: 8,
      marginBottom: 4,
    },
    authorText: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: '500',
    },
    contentText: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 16,
    },
    keyInsightContainer: {
      marginBottom: 16,
    },
    keyInsight: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    keyInsightBullet: {
      color: colors.primary,
      fontSize: 16,
      lineHeight: 24,
      marginRight: 8,
    },
    keyInsightText: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 24,
      flex: 1,
    },
    readMoreText: {
      color: colors.primary,
      fontWeight: '600',
      marginTop: 4,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionGroup: { flexDirection: 'row', alignItems: 'center' },
    actionButton: { padding: 8 },
    actionText: { color: colors.textSecondary, fontSize: 12, marginLeft: 4, fontWeight: '500' },
    readMoreButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
    },
    readMoreButtonText: { color: colors.primaryText, fontSize: 14, fontWeight: '600' },
  });

  const expandedContent = useMemo(() => (
    <View style={dynamicStyles.keyInsightContainer}>
      {book.key_insights?.map((insight, index) => (
        <View key={index} style={dynamicStyles.keyInsight}>
          <Text style={dynamicStyles.keyInsightBullet}>•</Text>
          <Text style={dynamicStyles.keyInsightText}>{insight}</Text>
        </View>
      ))}
    </View>
  ), [book.key_insights, dynamicStyles]);

  return (
    <>
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.visualSection}>
          <StaticVisual industry={book.industry_id} postId={book.id} />
        </View>
        <View style={dynamicStyles.contentSection}>
          <View style={dynamicStyles.contentBody}>
            <View style={dynamicStyles.mainContent}>
              <View style={dynamicStyles.metadata}>
                <View style={dynamicStyles.metadataRow}>
                  {industryName && (
                    <>
                      <View style={dynamicStyles.typeContainer}>
                        <Feather name="briefcase" size={12} color={colors.textSecondary} style={{marginRight: 4}}/>
                        <Text style={dynamicStyles.metadataText}>{industryName}</Text>
                      </View>
                      <Text style={dynamicStyles.metadataDot}>•</Text>
                    </>
                  )}
                  <View style={dynamicStyles.typeContainer}>
                    <Feather name="book-open" size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={dynamicStyles.typeText}>{book.type}</Text>
                  </View>
                  {book.year && <Text style={dynamicStyles.metadataDot}>•</Text>}
                  {book.year && (
                    <View style={dynamicStyles.typeContainer}>
                       <Feather name="calendar" size={12} color={colors.textSecondary} style={{marginRight: 4}}/>
                       <Text style={dynamicStyles.metadataText}>{book.year}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={dynamicStyles.title} numberOfLines={2}>{book.title}</Text>
              {book.author && (
                <View style={dynamicStyles.authorContainer}>
                  <View style={dynamicStyles.authorTag}>
                    <Text style={dynamicStyles.authorText}>{book.author}</Text>
                  </View>
                </View>
              )}
              <TouchableOpacity onPress={handleToggleExpand}>
                {book.key_insights && book.key_insights.length > 0 ? (
                  <View style={dynamicStyles.keyInsightContainer}>
                    {book.key_insights.slice(0, 2).map((insight, index) => (
                      <View key={index} style={dynamicStyles.keyInsight}>
                        <Text style={dynamicStyles.keyInsightBullet}>•</Text>
                        <Text style={dynamicStyles.keyInsightText}>{insight}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={dynamicStyles.contentText} numberOfLines={6}>{book.short_summary}</Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={dynamicStyles.actionsRow}>
              <View style={dynamicStyles.actionGroup}>
                <TouchableOpacity style={dynamicStyles.actionButton} onPress={handleLikePress}>
                  <FontAwesome name={hasLiked ? "heart" : "heart-o"} size={20} color={hasLiked ? colors.accent : colors.text} />
                </TouchableOpacity>
                <Text style={dynamicStyles.actionText}>{likes}</Text>
              </View>
              <View style={dynamicStyles.actionGroup}>
                <TouchableOpacity style={dynamicStyles.actionButton} onPress={handleSavePress}>
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
              <TouchableOpacity style={dynamicStyles.readMoreButton} onPress={handleToggleExpand}>
                <Text style={dynamicStyles.readMoreButtonText}>Read More</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      <ExpandedTextModal
        visible={isExpanded}
        onClose={handleToggleExpand}
        title={book.title}
        content={book.key_insights && book.key_insights.length > 0 ? expandedContent : book.short_summary}
        externalLink={book.link}
        contentType="book"
      />
    </>
  );
}); 