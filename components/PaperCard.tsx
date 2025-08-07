import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Linking, ScrollView, Image } from 'react-native';
import { Feather, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import type { Paper } from '../types';
import { StaticVisual } from './StaticVisual';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIndustries } from '../context/IndustriesContext';
import { ExpandedTextModal } from './ExpandedTextModal';

const { height: screenHeight } = Dimensions.get('window');

interface PaperCardProps {
  paper: Paper;
  isActive: boolean;
  onOpenComments?: (paperId: number) => void;
  onUserInteraction?: (paperId: number, action: 'like' | 'save' | 'unlike' | 'unsave') => void;
}

const getTableNames = () => ({
  content: 'papers',
  likes: 'paper_likes',
  saves: 'paper_saves',
  idField: 'paper_id'
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

export const PaperCard: React.FC<PaperCardProps> = React.memo(({ paper, onOpenComments, onUserInteraction }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { allIndustries } = useIndustries();

  const [likes, setLikes] = useState(paper.likes_count || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [saves, setSaves] = useState(paper.saves_count || 0);
  const [hasSaved, setHasSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComplexContent, setShowComplexContent] = useState(false);

  const tableNames = useMemo(() => getTableNames(), []);

  const industryName = useMemo(() => {
    return allIndustries.find(ind => ind.id === paper.industry_id)?.name;
  }, [allIndustries, paper.industry_id]);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) return;
      
      const { data: likeData } = await supabase
        .from(tableNames.likes)
        .select('user_id')
        .eq('user_id', user.id)
        .eq(tableNames.idField, paper.id)
        .maybeSingle();
      if (likeData) setHasLiked(true);

      const { data: saveData } = await supabase
        .from(tableNames.saves)
        .select('user_id')
        .eq('user_id', user.id)
        .eq(tableNames.idField, paper.id)
        .maybeSingle();
      if (saveData) setHasSaved(true);
    };

    fetchStatus();
  }, [user, paper.id, tableNames]);

  const handleToggleExpand = () => setIsExpanded(!isExpanded);

  const handleDelveDeeper = () => setShowComplexContent(!showComplexContent);

  const toggleLike = useCallback(async (isLiking: boolean) => {
    if (!user) return;

    setHasLiked(isLiking);
    setLikes(prev => isLiking ? prev + 1 : Math.max(0, prev - 1));

    const interactionData = { user_id: user.id, [tableNames.idField]: paper.id };

    if (isLiking) {
      await supabase.from(tableNames.likes).insert(interactionData);
    } else {
      await supabase.from(tableNames.likes).delete().match(interactionData);
    }
    onUserInteraction?.(paper.id, isLiking ? 'like' : 'unlike');
  }, [user, paper.id, tableNames, onUserInteraction]);

  const toggleSave = useCallback(async (isSaving: boolean) => {
    if (!user) return;

    setHasSaved(isSaving);
    setSaves(prev => isSaving ? prev + 1 : Math.max(0, prev - 1));

    const interactionData = { user_id: user.id, [tableNames.idField]: paper.id };

    if (isSaving) {
      await supabase.from(tableNames.saves).insert(interactionData);
    } else {
      await supabase.from(tableNames.saves).delete().match(interactionData);
    }
    onUserInteraction?.(paper.id, isSaving ? 'save' : 'unsave');
  }, [user, paper.id, tableNames, onUserInteraction]);


  const handleLikePress = () => toggleLike(!hasLiked);
  const handleSavePress = () => toggleSave(!hasSaved);
  const handleCommentsPress = () => onOpenComments?.(paper.id);
  const handleReadMorePress = () => { if (paper.link) Linking.openURL(paper.link); };

  const expandedContent = useMemo(() => {
    const content = showComplexContent ? paper.content_complex : paper.content_simple;
    return (
      <View>
        <Text style={[{ fontSize: 18, lineHeight: 28 }, { color: colors.text }]}>{content}</Text>
        {paper.content_complex && (
          <TouchableOpacity 
            style={[
              { 
                marginTop: 20, 
                padding: 12, 
                backgroundColor: colors.primary, 
                borderRadius: 8, 
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center'
              }
            ]} 
            onPress={handleDelveDeeper}
          >
            {showComplexContent ? (
              <Text style={[{ fontSize: 16, fontWeight: '600' }, { color: colors.primaryText }]}>
                ❗ Woah, Too Deep!
              </Text>
            ) : (
              <>
                <Image 
                  source={require('../sparkles.png')} 
                  style={{ width: 16, height: 16, marginRight: 8 }}
                  resizeMode="contain"
                />
                <Text style={[{ fontSize: 16, fontWeight: '600' }, { color: colors.primaryText }]}>
                  Delve Deeper
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }, [showComplexContent, paper.content_simple, paper.content_complex, colors, handleDelveDeeper]);

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

  return (
    <>
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.visualSection}>
          <StaticVisual industry={paper.industry_id} postId={paper.id} />
        </View>
        <View style={dynamicStyles.contentSection}>
          <View style={dynamicStyles.contentBody}>
            <View style={dynamicStyles.mainContent}>
              <View style={dynamicStyles.metadata}>
                <View style={dynamicStyles.metadataRow}>
                  {paper.site_name && (
                    <View style={dynamicStyles.typeContainer}>
                      <Feather name="globe" size={12} color={colors.textSecondary} style={{marginRight: 4}}/>
                      <Text style={dynamicStyles.metadataText}>{getSiteName(paper.site_name)}</Text>
                    </View>
                  )}
                  {paper.site_name && industryName && <Text style={dynamicStyles.metadataDot}>•</Text>}
                  {industryName && (
                    <View style={dynamicStyles.typeContainer}>
                      <Feather name="briefcase" size={12} color={colors.textSecondary} style={{marginRight: 4}}/>
                      <Text style={dynamicStyles.metadataText}>{industryName}</Text>
                    </View>
                  )}
                </View>
                <View style={dynamicStyles.metadataRow}>
                  <View style={dynamicStyles.typeContainer}>
                    <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={dynamicStyles.typeText}>{paper.type}</Text>
                  </View>
                  {paper.created_at && <Text style={dynamicStyles.metadataDot}>•</Text>}
                  {paper.created_at && (
                    <View style={dynamicStyles.typeContainer}>
                       <Feather name="calendar" size={12} color={colors.textSecondary} style={{marginRight: 4}}/>
                       <Text style={dynamicStyles.metadataText}>{formatDate(paper.created_at)}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={dynamicStyles.title} numberOfLines={2}>{paper.title}</Text>
              {paper.authors && paper.authors.length > 0 && (
                <ScrollView 
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16 }}
                >
                  <View style={dynamicStyles.authorContainer}>
                    {paper.authors.map((author, index) => (
                      <View key={index} style={dynamicStyles.authorTag}>
                        <Text style={dynamicStyles.authorText}>{author}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
              <TouchableOpacity onPress={handleToggleExpand}>
                <Text style={dynamicStyles.contentText} numberOfLines={6}>{paper.content_simple}</Text>
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
                <Text style={dynamicStyles.actionText}>{paper.comments_count || 0}</Text>
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
        title={paper.title}
        content={expandedContent}
        externalLink={paper.link}
        contentType="paper"
      />
    </>
  );
}); 