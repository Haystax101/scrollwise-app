import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, FlatList, ViewToken } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { PaperAirplaneIcon } from 'react-native-heroicons/outline';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Article } from '../types';
import { SimpleWebViewPoC } from './SimpleWebViewPoC';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useResponsiveLayout } from '../utils/screenUtils';
import { ShareService } from '../lib/shareService';
import { NativeStorySlide } from './NativeStorySlide';
import { useContentTracking } from '../hooks/useContentTracking';

interface SpecialArticleCardProps {
    article: Article;
    isActive: boolean;
    showBackButton?: boolean;
    backTo?: string | null;
    onOpenComments?: (articleId: number) => void;
    onUserInteraction?: (articleId: number, action: 'like' | 'save' | 'unlike' | 'unsave') => void;
    isInVault?: boolean;
    preload?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const getTableNames = () => ({
    content: 'articles',
    likes: 'article_likes',
    saves: 'article_saves',
    idField: 'article_id'
});

const commonCss = `
    <style>
        body {
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            height: 100vh !important;
            overflow: hidden !important; /* Prevent scroll within webview */
        }
        #container, .container, .wrapper, #wrapper {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            transform: none !important;
            width: 100% !important;
            height: auto !important;
        }
        h1, .title, .headline, .big-text {
            position: relative !important;
            order: 1 !important;
            margin-bottom: 10px !important;
            top: auto !important;
            bottom: auto !important;
            text-align: left !important;
        }
        .badge, .tag, .red-box, .breaking-news {
            position: relative !important;
            order: 2 !important;
            margin-top: 0 !important;
            top: auto !important;
            bottom: auto !important;
            align-self: flex-start !important;
        }
    </style>
`;

export const SpecialArticleCard: React.FC<SpecialArticleCardProps> = ({
    article,
    onOpenComments,
    onUserInteraction,
    preload = false,
}) => {
    const { user } = useAuth();
    const { colors } = useTheme();
    // insets removed
    const { totalHeight } = useResponsiveLayout();

    // Card Dimensions Calculation
    // We want a centered card. Let's make it look strictly like a card.
    const CARD_MARGIN_H = 16;
    const CARD_WIDTH = SCREEN_WIDTH - (CARD_MARGIN_H * 2);
    // Height: Top inset + Navbar space + Bottom Inset + Margins
    // Fitting exactly one "screen" of scroll means shorter card
    const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;

    const [likes, setLikes] = useState(article.likes_count || 0);
    const [hasLiked, setHasLiked] = useState(false);
    const [saves, setSaves] = useState(article.saves_count || 0);
    const [hasSaved, setHasSaved] = useState(false);

    // Slide State
    // activeIndex is used for tracking progress, even if not used in render directly
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    // Prepare Slides
    const isJsonLike = (str: string) => typeof str === 'string' && (str.trim().startsWith('{') || str.trim().startsWith('['));

    const effectiveNativeSlides = useMemo(() => {
        if (article.narrative_code && Array.isArray(article.narrative_code) && article.narrative_code.length > 0) {
            if (isJsonLike(article.narrative_code[0])) return article.narrative_code;
        }
        if (article.narrative_text && article.narrative_text.length > 0) return article.narrative_text;
        return [];
    }, [article]);

    const hasNativeSlides = effectiveNativeSlides.length > 0;
    const webSlides = useMemo(() => {
        if (hasNativeSlides) return [];
        return article.narrative_code || [];
    }, [article.narrative_code, hasNativeSlides]);

    const slides = useMemo(() => {
        // Explicitly type the array items
        type SlideItem = { type: 'cover' | 'native' | 'web'; content?: string; index?: number };
        const items: SlideItem[] = [{ type: 'cover' }];

        if (hasNativeSlides) {
            effectiveNativeSlides.forEach((content, index) => {
                items.push({ type: 'native', content, index });
            });
        } else {
            webSlides.forEach((content, index) => {
                items.push({ type: 'web', content, index });
            });
        }
        return items;
    }, [effectiveNativeSlides, webSlides, hasNativeSlides]);

    const totalSlides = slides.length;

    const { trackSlideView, markComplete } = useContentTracking({
        contentId: article.id,
        contentType: 'article',
        totalSlides
    });

    // Tracking Viewable Items
    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
            const index = viewableItems[0].index;
            setActiveIndex(index);
            trackSlideView(index);
            if (index === totalSlides - 1) markComplete();
        }
    }).current;

    const tableNames = useMemo(() => getTableNames(), []);

    useEffect(() => {
        const fetchStatus = async () => {
            if (!user) return;
            const { data: likeData } = await supabase.from(tableNames.likes).select('user_id').eq('user_id', user.id).eq(tableNames.idField, article.id).maybeSingle();
            if (likeData) setHasLiked(true);

            const { data: saveData } = await supabase.from(tableNames.saves).select('user_id').eq('user_id', user.id).eq(tableNames.idField, article.id).maybeSingle();
            if (saveData) setHasSaved(true);
        };
        fetchStatus();
    }, [user, article.id, tableNames]);

    const toggleLike = async () => {
        if (!user) return;
        const isLiking = !hasLiked;
        setHasLiked(isLiking);
        setLikes(prev => isLiking ? prev + 1 : Math.max(0, prev - 1));

        const interactionData = { user_id: user.id, [tableNames.idField]: article.id };
        try {
            if (isLiking) await supabase.from(tableNames.likes).insert(interactionData);
            else await supabase.from(tableNames.likes).delete().match(interactionData);

            onUserInteraction?.(article.id, isLiking ? 'like' : 'unlike');
            const { count } = await supabase.from(tableNames.likes).select('*', { count: 'exact', head: true }).eq(tableNames.idField, article.id);
            if (typeof count === 'number') {
                setLikes(count);
                await supabase.from(tableNames.content).update({ likes_count: count }).eq('id', article.id);
            }
        } catch (e) {
            console.error(e);
            setHasLiked(!isLiking);
        }
    };

    const toggleSave = async () => {
        if (!user) return;
        const isSaving = !hasSaved;
        setHasSaved(isSaving);
        setSaves(prev => isSaving ? prev + 1 : Math.max(0, prev - 1));

        const interactionData = { user_id: user.id, [tableNames.idField]: article.id };
        try {
            if (isSaving) await supabase.from(tableNames.saves).insert(interactionData);
            else await supabase.from(tableNames.saves).delete().match(interactionData);

            onUserInteraction?.(article.id, isSaving ? 'save' : 'unsave');
            const { count } = await supabase.from(tableNames.saves).select('*', { count: 'exact', head: true }).eq(tableNames.idField, article.id);
            if (typeof count === 'number') {
                setSaves(count);
                await supabase.from(tableNames.content).update({ saves_count: count }).eq('id', article.id);
            }
        } catch (e) {
            console.error(e);
            setHasSaved(!isSaving);
        }
    };

    const handleSharePress = () => ShareService.shareContent({
        type: 'article', id: String(article.id), title: article.title, summary: article.summary
    });

    const renderItem = useCallback(({ item }: { item: any }) => {
        // Container styles for the card
        const cardStyle = {
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            marginHorizontal: 6, // Gap between cards
            backgroundColor: colors.glassBg,
            borderColor: colors.glassBorder,
            borderWidth: 1,
            borderRadius: 32, // More rounded
            overflow: 'hidden' as const,
        };

        if (item.type === 'cover') {
            const html = (article.front_cover_code || article.animation_code || '') + commonCss;
            return (
                <View style={cardStyle}>
                    {/* Content */}
                    <View style={{ flex: 1, position: 'relative' }}>
                        <SimpleWebViewPoC height={CARD_HEIGHT} htmlContent={html} preload={preload} />

                        {/* Overlay Gradient for readability at bottom */}
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.6)']}
                            style={styles.gradientOverlay}
                            pointerEvents="none"
                        />

                        {/* Embedded Interactions Row - Individual Glass Capsules */}
                        <View style={styles.floatingActionsContainer}>
                            <TouchableOpacity style={styles.glassCapsule} onPress={toggleLike}>
                                <FontAwesome name={hasLiked ? "heart" : "heart-o"} size={18} color={hasLiked ? "#ff4081" : "white"} />
                                <Text style={styles.actionText}>{likes}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.glassCapsule} onPress={() => onOpenComments?.(article.id)}>
                                <Feather name="message-circle" size={18} color="white" />
                                <Text style={styles.actionText}>{article.comments_count || 0}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.glassCapsule} onPress={toggleSave}>
                                <Feather name="bookmark" size={18} color={hasSaved ? "#00e5ff" : "white"} />
                                <Text style={styles.actionText}>{saves}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.glassCapsule} onPress={handleSharePress}>
                                <PaperAirplaneIcon color="white" size={18} style={{ transform: [{ rotate: '-30deg' }, { translateY: -2 }] }} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            );
        }

        // Native Story Slide
        if (item.type === 'native') {
            let chapterTitle: string | undefined = undefined;
            let slideText = item.content;

            if (isJsonLike(item.content)) {
                try {
                    const parsed = JSON.parse(item.content);
                    if (parsed.context) slideText = parsed.context;
                    if (parsed.title) chapterTitle = parsed.title;
                } catch (e) { console.log('Parsed Fail', e); }
            }

            return (
                <View style={cardStyle}>
                    <NativeStorySlide
                        title={article.title}
                        chapterTitle={chapterTitle}
                        text={slideText}
                        imageUrl={article.image_url}
                        colour={article.colour}
                        // We need to pass dimensions to NativeStorySlide now that it's constrained
                        width={CARD_WIDTH}
                        height={CARD_HEIGHT}
                    />
                </View>
            );
        }

        // Legacy Web Slide
        const html = (item.content || '') + commonCss;
        return (
            <View style={cardStyle}>
                <SimpleWebViewPoC height={CARD_HEIGHT} htmlContent={html} preload={preload} />
            </View>
        );
    }, [article, likes, hasLiked, saves, hasSaved, colors, onOpenComments, preload, toggleLike, toggleSave, handleSharePress, CARD_WIDTH, CARD_HEIGHT]);

    return (
        <View style={[styles.container, { height: totalHeight }]}>
            {/* Main Carousel */}
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.type}-${index}`}
                horizontal
                pagingEnabled // This gives the swipe snap effect
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                contentContainerStyle={{
                    paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2 - 6, // Center the first card
                    alignItems: 'center',
                }}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + 12} // Card width + margins
                snapToAlignment="center"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    gradientOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 120, // Taller gradient for better contrast
    },
    floatingActionsContainer: {
        position: 'absolute',
        bottom: 24,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12, // Space between capsules
        paddingHorizontal: 20,
    },
    glassCapsule: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(20, 20, 20, 0.6)', // Semi-transparent dark bg
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        minWidth: 50,
        height: 44,
    },
    actionText: {
        color: 'white',
        fontWeight: '700',
        marginLeft: 6,
        fontSize: 13,
        fontFamily: 'Montserrat_700Bold',
    }
});
