import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Article } from '../types';
import { StaticVisual } from './StaticVisual';
import { WebViewVisual } from './WebViewVisual';
import { SimpleWebViewPoC } from './SimpleWebViewPoC';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIndustries } from '../context/IndustriesContext';
import { ExpandedTextModal } from './ExpandedTextModal';
import { FlagButton } from './common/FlagButton';
import { optimizeIndustryName, removeHtmlTags } from '../utils/textUtils';
import { useResponsiveLayout } from '../utils/screenUtils';
import { useDeviceOrientation, getResponsiveFontSize } from '../utils/deviceDetection';
import { useDeviceInfo, getStaticVisualHeightMultiplier, getContentBottomPadding } from '../utils/deviceUtils';
import { FeedbackBoardModal } from './feedback/FeedbackBoardModal';
import { profileImageService } from '../services/profileImageService';
import { ShareSheet } from './share/ShareSheet';

interface ArticleCardProps {
  article: Article;
  isActive: boolean; // Kept for potential future use (e.g., animations)
  showBackButton?: boolean;
  backTo?: string | null;
  onOpenComments?: (articleId: number) => void;
  onUserInteraction?: (articleId: number, action: 'like' | 'save' | 'unlike' | 'unsave') => void;
  isInVault?: boolean; // When true, reduces bottom padding for vault context
  preload?: boolean;
}

const getTableNames = () => ({
  content: 'articles',
  likes: 'article_likes',
  saves: 'article_saves',
  idField: 'article_id'
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

import { SpecialArticleCard } from './SpecialArticleCard';
import { useContentTracking } from '../hooks/useContentTracking';

export const ArticleCard: React.FC<ArticleCardProps> = React.memo(({ article, isActive, showBackButton, backTo, onOpenComments, onUserInteraction, isInVault = false, preload = false }) => {
  // console.log(`ArticleCard ${article.id} rendering`);
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { allIndustries } = useIndustries();
  const router = useRouter();
  const { visualHeight, totalHeight, fontSizes } = useResponsiveLayout();

  if (article.special) {
    return (
      <SpecialArticleCard
        article={article}
        isActive={isActive}
        showBackButton={showBackButton}
        backTo={backTo}
        onOpenComments={onOpenComments}
        onUserInteraction={onUserInteraction}
        isInVault={isInVault}
        preload={preload}
      />
    );
  }

  // Debug logging for article received by ArticleCard
  console.log(`🎯 ArticleCard: Received article ${article.id}:`, {
    id: article.id,
    title: article.title?.substring(0, 30),
    summary_length: article.summary?.length || 0,
    longer_summary_length: article.longer_summary?.length || 0,
    hasLongerSummary: !!article.longer_summary,
    longer_summary_preview: article.longer_summary ? `${article.longer_summary.substring(0, 50)}...` : 'NOT PRESENT',
    special: article.special
  });

  const [likes, setLikes] = useState(article.likes_count || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [saves, setSaves] = useState(article.saves_count || 0);
  const [hasSaved, setHasSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [webViewError, setWebViewError] = useState(false);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);

  const tableNames = useMemo(() => getTableNames(), []);

  const industryName = useMemo(() => {
    const rawName = allIndustries.find(ind => ind.id === article.industry_id)?.name;
    return rawName ? optimizeIndustryName(rawName) : undefined;
  }, [allIndustries, article.industry_id]);

  const { isTablet, isLandscape } = useDeviceOrientation();
  const deviceInfo = useDeviceInfo();

  const dynamicTextLines = useMemo(() => {
    if (isTablet) {
      // On tablets, show more lines to ensure summary is visible
      return isLandscape ? 4 : 3;
    }
    // Original mobile behavior
    return article.author ? 7 : 8;
  }, [isTablet, isLandscape, article.author]);

  const shouldUseWebView = useMemo(() => {
    const result = !!(article.animation_code && !webViewError);
    // console.log(`🎬 ArticleCard ${article.id} - shouldUseWebView:`, { ... });
    return result;
  }, [article.animation_code, webViewError, article.id]);

  const { updateScrollDepth } = useContentTracking({
    contentId: article.id,
    contentType: 'article'
  });

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) return;

      const { data: likeData } = await supabase
        .from(tableNames.likes)
        .select('user_id')
        .eq('user_id', user.id)
        .eq(tableNames.idField, article.id)
        .maybeSingle();
      if (likeData) setHasLiked(true);

      const { data: saveData } = await supabase
        .from(tableNames.saves)
        .select('user_id')
        .eq('user_id', user.id)
        .eq(tableNames.idField, article.id)
        .maybeSingle();
      if (saveData) setHasSaved(true);
    };

    fetchStatus();
  }, [user, article.id, tableNames]);

  const handleToggleExpand = () => {
    // if (!isExpanded) markComplete(); // markComplete is undefined
    setIsExpanded(!isExpanded);
  };

  const toggleLike = useCallback(async (isLiking: boolean) => {
    if (!user) return;

    setHasLiked(isLiking);
    const originalLikes = likes;
    setLikes(prev => isLiking ? prev + 1 : Math.max(0, prev - 1));

    const interactionData = { user_id: user.id, [tableNames.idField]: article.id };

    try {
      if (isLiking) {
        const { error } = await supabase.from(tableNames.likes).insert(interactionData);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(tableNames.likes).delete().match(interactionData);
        if (error) throw error;
      }

      onUserInteraction?.(article.id, isLiking ? 'like' : 'unlike');

      // Sync likes_count in articles table using authoritative count
      const { count, error: countError } = await supabase
        .from(tableNames.likes)
        .select('*', { count: 'exact', head: true })
        .eq(tableNames.idField, article.id);

      if (countError) throw countError;

      if (typeof count === 'number') {
        setLikes(count);
        await supabase
          .from(tableNames.content)
          .update({ likes_count: count })
          .eq('id', article.id);
      }
    } catch (error) {
      console.error(`Error toggling like for article ${article.id}:`, error);
      // Revert optimistic UI update on error
      setHasLiked(!isLiking);
      setLikes(originalLikes);
    }
  }, [user, article.id, tableNames, onUserInteraction, likes]);

  const toggleSave = useCallback(async (isSaving: boolean) => {
    if (!user) return;

    setHasSaved(isSaving);
    setSaves(prev => isSaving ? prev + 1 : Math.max(0, prev - 1));

    const interactionData = { user_id: user.id, [tableNames.idField]: article.id };

    if (isSaving) {
      await supabase.from(tableNames.saves).insert(interactionData);
    } else {
      await supabase.from(tableNames.saves).delete().match(interactionData);
    }
    onUserInteraction?.(article.id, isSaving ? 'save' : 'unsave');

    // Sync saves_count in articles table to ensure future loads show correct count
    try {
      const { count, error: countError } = await supabase
        .from(tableNames.saves)
        .select('*', { count: 'exact', head: true })
        .eq(tableNames.idField, article.id);
      if (!countError) {
        await supabase
          .from(tableNames.content)
          .update({ saves_count: count ?? 0 })
          .eq('id', article.id);
        if (typeof count === 'number') setSaves(count);
      }
    } catch {
      // ignore
    }
  }, [user, article.id, tableNames, onUserInteraction]);

  const handleLikePress = () => toggleLike(!hasLiked);
  const handleSavePress = () => toggleSave(!hasSaved);
  const handleCommentsPress = () => onOpenComments?.(article.id);
  const handleBackPress = () => {
    if (backTo === 'vault') {
      router.push('/vault');
    } else {
      router.back();
    }
  };

  const handleSharePress = () => {
    setShareSheetVisible(true);
  };

  // When modal updates comment count, also persist to articles table so future loads are correct
  useEffect(() => {
    // We do not have direct hook into modal here; MainFeed already updates item state when count changes.
    // This helper ensures that if comments_count changes on the item prop, we mirror it to DB once.
    // If you prefer, wire a direct callback from CommentsModal to update DB; keeping it simple here.
    (async () => {
      try {
        if (typeof article.comments_count === 'number') {
          await supabase
            .from(tableNames.content)
            .update({ comments_count: article.comments_count })
            .eq('id', article.id);
        }
      } catch { }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article.comments_count]);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      height: totalHeight,
      width: '100%',
    },
    visualSection: {
      height: article.special
        ? totalHeight * 0.7 // Special mode: 65% of total card height
        : visualHeight * getStaticVisualHeightMultiplier(deviceInfo), // Normal mode
      width: '100%',
      position: 'relative',
    },
    flagButton: {
      position: 'absolute',
      top: 52, // Increased to avoid iPhone status bar/notch
      right: 12,
      zIndex: 10,
    },
    feedbackButton: {
      position: 'absolute',
      top: 52,
      left: 12,
      zIndex: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButton: {
      position: 'absolute',
      top: 52, // Same as flag button
      left: 12, // Left side instead of right
      zIndex: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    contentSection: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingTop: article.special ? 24 : (deviceInfo.isSmallScreenWithHomeButton ? 56 : 40), // Reduced top padding for special mode
      paddingBottom: isInVault ? 60 : insets.bottom + 60 + getContentBottomPadding(deviceInfo),
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      marginTop: article.special ? -20 : (deviceInfo.isSmallScreenWithHomeButton ? 0 : -60), // Less negative margin for special
      // Remove shadow and border to keep a clean aesthetic
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    contentBody: {
      flex: 1,
      justifyContent: 'space-between',
    },
    mainContent: {
      flexShrink: 1,
      flex: isTablet ? 1 : undefined, // Take up available space on iPad
      justifyContent: isTablet ? 'center' : undefined, // Center content vertically on iPad
      paddingVertical: isTablet ? 20 : 0, // Add vertical padding on iPad for better spacing
    },
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
    contentScrollView: { flex: 1 },
    contentContainer: { flexGrow: 1, paddingBottom: 16 },
    metadataText: { color: colors.textSecondary, fontSize: fontSizes.metadata },
    metadataDot: { color: colors.textSecondary, fontSize: fontSizes.metadata, marginHorizontal: 4 },
    typeContainer: { flexDirection: 'row', alignItems: 'center' },
    typeText: {
      color: colors.textSecondary,
      fontSize: fontSizes.metadata,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    title: {
      color: colors.text,
      fontSize: fontSizes.title,
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
      fontSize: fontSizes.author,
      fontWeight: '500',
    },
    contentText: {
      color: colors.text,
      fontSize: isTablet ? getResponsiveFontSize(fontSizes.content) : fontSizes.content,
      lineHeight: (isTablet ? getResponsiveFontSize(fontSizes.content) : fontSizes.content) * 1.4,
      marginBottom: 12,
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
      paddingBottom: isTablet ? 24 : getContentBottomPadding(deviceInfo), // Extra bottom padding on iPad and iPhone SE
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionGroup: { flexDirection: 'row', alignItems: 'center' },
    actionButton: { padding: 8 },
    actionText: { color: colors.textSecondary, fontSize: fontSizes.action, marginLeft: 4, fontWeight: '500' },
    readMoreButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
    },
    readMoreButtonText: { color: colors.readButtonText, fontSize: fontSizes.action, fontWeight: '600' },
  });

  return (
    <>
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.visualSection}>
          {shouldUseWebView ? (
            <SimpleWebViewPoC
              height={article.special
                ? totalHeight * 0.65
                : visualHeight * getStaticVisualHeightMultiplier(deviceInfo)
              }
              htmlContent={article.animation_code || ''}
              preload={preload}
            />
          ) : (
            <StaticVisual
              industry={article.industry_id}
              postId={article.id}
            // StaticVisual might interpret height differently, so for now we leave it alone or pass a prop if needed.
            // Assuming StaticVisual adjusts to container or passed height if updated. 
            // For safety, let's keep StaticVisual logic mostly intact unless requested, 
            // BUT the container height (style.visualSection) is already forcing it.
            />
          )}
          {showBackButton && (
            <TouchableOpacity
              style={dynamicStyles.backButton}
              onPress={handleBackPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <FlagButton
            contentId={article.id}
            contentType="article"
            size={20}
            style={dynamicStyles.flagButton}
          />
          <TouchableOpacity
            style={dynamicStyles.feedbackButton}
            onPress={() => setShowFeedbackModal(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="message-square" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={dynamicStyles.contentSection}>
          <View style={dynamicStyles.contentBody}>
            <View style={dynamicStyles.mainContent}>
              {article.social_context && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  {article.social_context.friend_avatar ? (
                    <Image
                      source={{ uri: profileImageService.getProfileImageUrl(article.social_context.friend_avatar) || undefined }}
                      style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }}
                    />
                  ) : (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.border, marginRight: 8 }} />
                  )}
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                    <Text style={{ fontWeight: '600', color: colors.text }}>{article.social_context.friend_name}</Text>
                    {article.social_context.action === 'liked' ? ' liked this' : ' saved this'}
                  </Text>
                </View>
              )}
              <View style={dynamicStyles.metadata}>
                <View style={dynamicStyles.metadataRow}>
                  {article.site_name && (
                    <View style={dynamicStyles.typeContainer}>
                      <Feather name="globe" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={dynamicStyles.metadataText}>{getSiteName(article.site_name)}</Text>
                    </View>
                  )}
                  {article.site_name && industryName && <Text style={dynamicStyles.metadataDot}>•</Text>}
                  {industryName && (
                    <View style={dynamicStyles.typeContainer}>
                      <Feather name="briefcase" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={dynamicStyles.metadataText}>{industryName}</Text>
                    </View>
                  )}
                </View>
                <View style={dynamicStyles.metadataRow}>
                  <View style={dynamicStyles.typeContainer}>
                    <Feather name="file-text" size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={dynamicStyles.typeText}>{article.type}</Text>
                  </View>
                  {article.created_at && <Text style={dynamicStyles.metadataDot}>•</Text>}
                  {(article.date || article.created_at) && (
                    <View style={dynamicStyles.typeContainer}>
                      <Feather name="calendar" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={dynamicStyles.metadataText}>{formatDate(article.date || article.created_at)}</Text>
                    </View>
                  )}
                </View>
              </View>
              {!article.special && (
                <TouchableOpacity onPress={handleToggleExpand} activeOpacity={0.7}>
                  <Text style={dynamicStyles.title} numberOfLines={2}>
                    {removeHtmlTags(article.title)}
                  </Text>
                </TouchableOpacity>
              )}
              {article.author && (
                <View style={dynamicStyles.authorContainer}>
                  <View style={dynamicStyles.authorTag}>
                    <Text style={dynamicStyles.authorText}>{article.author}</Text>
                  </View>
                </View>
              )}
              {!article.special && (
                <TouchableOpacity onPress={handleToggleExpand}>
                  <Text style={dynamicStyles.contentText} numberOfLines={dynamicTextLines}>
                    {article.summary}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={dynamicStyles.actionsRow}>
              <View style={dynamicStyles.actionGroup}>
                <TouchableOpacity style={dynamicStyles.actionButton} onPress={handleLikePress}>
                  <FontAwesome name={hasLiked ? "heart" : "heart-o"} size={20} color={hasLiked ? colors.likeColor : colors.text} />
                </TouchableOpacity>
                <Text style={dynamicStyles.actionText}>{likes}</Text>
              </View>
              <View style={dynamicStyles.actionGroup}>
                <TouchableOpacity style={dynamicStyles.actionButton} onPress={handleCommentsPress}>
                  <Feather name="message-circle" size={20} color={colors.text} />
                </TouchableOpacity>
                <Text style={dynamicStyles.actionText}>{article.comments_count || 0}</Text>
              </View>
              <View style={dynamicStyles.actionGroup}>
                <TouchableOpacity style={dynamicStyles.actionButton} onPress={handleSavePress}>
                  <Feather name="bookmark" size={20} color={hasSaved ? colors.accent : colors.text} />
                </TouchableOpacity>
                <Text style={dynamicStyles.actionText}>{saves}</Text>
              </View>
              <View style={dynamicStyles.actionGroup}>
                <TouchableOpacity style={dynamicStyles.actionButton} onPress={handleSharePress}>
                  <Feather name="share" size={20} color={colors.text} />
                </TouchableOpacity>
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
        title={article.title}
        content={article.longer_summary || article.summary}
        externalLink={article.link}
        contentType="article"
        onScrollDepthChange={updateScrollDepth}
      />
      <FeedbackBoardModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
      <ShareSheet
        visible={shareSheetVisible}
        onClose={() => setShareSheetVisible(false)}
        content={{
          id: String(article.id),
          type: 'article',
          title: article.title,
          summary: article.summary,
          image: article.image_url || undefined,
          author: article.author ? { name: article.author } : undefined
        }}
      />
    </>
  );
});