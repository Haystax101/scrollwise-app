import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Article } from '../types';
import { SimpleWebViewPoC } from './SimpleWebViewPoC';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useResponsiveLayout } from '../utils/screenUtils'; // Using for totalHeight
import { ShareService } from '../lib/shareService';
// optimizeIndustryName removed
import { useIndustries } from '../context/IndustriesContext';
import { FlagButton } from './common/FlagButton';
import { FeedbackBoardModal } from './feedback/FeedbackBoardModal';
import { NativeStorySlide } from './NativeStorySlide';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate
} from 'react-native-reanimated';
import { useContentTracking } from '../hooks/useContentTracking';

interface SpecialArticleCardProps {
    article: Article;
    isActive: boolean; // Added isActive
    showBackButton?: boolean;
    backTo?: string | null;
    onOpenComments?: (articleId: number) => void;
    onUserInteraction?: (articleId: number, action: 'like' | 'save' | 'unlike' | 'unsave') => void;
    isInVault?: boolean;
    preload?: boolean;
}

const getTableNames = () => ({
    content: 'articles',
    likes: 'article_likes',
    saves: 'article_saves',
    idField: 'article_id'
});

const commonCss = `
    <style>
        /* Force layout to start from top */
        body {
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            height: 100vh !important;
        }
        
        /* Reset common GSAP container positioning */
        #container, .container, .wrapper, #wrapper {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            transform: none !important;
            width: 100% !important;
            height: auto !important;
        }

        /* Target Title/Headline */
        h1, .title, .headline, .big-text {
            position: relative !important;
            order: 1 !important; /* First */
            margin-bottom: 10px !important;
            top: auto !important;
            bottom: auto !important;
            text-align: left !important;
        }

        /* Target Badge/Breaking News */
        .badge, .tag, .red-box, .breaking-news {
            position: relative !important;
            order: 2 !important; /* Second */
            margin-top: 0 !important;
            top: auto !important;
            bottom: auto !important;
            align-self: flex-start !important;
        }
    </style>
`;

const getTypeIcon = (type: string): string => {
    switch (type) {
        case 'article': return 'file-text';
        case 'paper': return 'file';
        case 'video': return 'video';
        case 'podcast': return 'mic';
        case 'book': return 'book';
        case 'insight': return 'zap';
        default: return 'layers';
    }
};

export const SpecialArticleCard: React.FC<SpecialArticleCardProps> = ({
    article,
    // isActive, // Removed as it is now unused
    showBackButton,
    backTo,
    onOpenComments,
    onUserInteraction,
    isInVault = false,
    preload = false,
}) => {
    const { user } = useAuth();
    useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { totalHeight } = useResponsiveLayout();
    const { allIndustries } = useIndustries();

    // const { updateProgress, markComplete } = useContentTracking({
    //    contentId: article.id,
    //    contentType: 'article',
    //    isActive
    // });

    const [likes, setLikes] = useState(article.likes_count || 0);
    const [hasLiked, setHasLiked] = useState(false);
    const [saves, setSaves] = useState(article.saves_count || 0);
    const [hasSaved, setHasSaved] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);



    // ... (existing imports)

    // Narrative State
    const [activeIndex, setActiveIndex] = useState(0);

    // DEBUG LOGGING
    useEffect(() => {
        console.log('--- SpecialArticleCard Debug ---');
        console.log('Article ID:', article.id);
        console.log('Narrative Code Length:', article.narrative_code?.length);
        if (article.narrative_code?.[0]) console.log('First Slide Raw:', article.narrative_code[0]);
    }, [article]);

    const isJsonLike = (str: string) => typeof str === 'string' && (str.trim().startsWith('{') || str.trim().startsWith('['));

    // The user confirmed that `narrative_code` contains the JSON strings.
    // We prioritize checking `narrative_code` for this specific JSON format.
    const effectiveNativeSlides = useMemo(() => {
        // 1. Check if narrative_code exists and is an array
        if (article.narrative_code && Array.isArray(article.narrative_code) && article.narrative_code.length > 0) {
            // Check if the first item is a JSON-like string
            if (isJsonLike(article.narrative_code[0])) {
                return article.narrative_code;
            }
        }
        // 2. Fallback to narrative_text if it exists (future proofing)
        if (article.narrative_text && article.narrative_text.length > 0) {
            return article.narrative_text;
        }

        return [];
    }, [article.narrative_code, article.narrative_text]);

    const hasNativeSlides = effectiveNativeSlides.length > 0;

    // If we are NOT using native slides, we might be using legacy web slides (HTML code).
    // But `effectiveNativeSlides` captures the JSON format. 
    // If effectiveNativeSlides is empty, we check if narrative_code exists and is NOT JSON.
    const webSlides = useMemo(() => {
        if (hasNativeSlides) return [];
        return article.narrative_code || [];
    }, [article.narrative_code, hasNativeSlides]);

    const totalSlides = 1 + (hasNativeSlides ? effectiveNativeSlides.length : webSlides.length);

    // Menu State
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Preference Voting State
    const [hasVoted, setHasVoted] = useState<boolean | null>(null); // null = loading/unknown

    const flipRotation = useSharedValue(0);
    const tableNames = useMemo(() => getTableNames(), []);

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

            // Check if user has voted on the new format
            const { data: voteData } = await supabase
                .from('new_format_concensus')
                .select('preference')
                .eq('user_id', user.id)
                .maybeSingle();

            if (voteData) {
                setHasVoted(true);
            } else {
                setHasVoted(false);
            }
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
            if (isLiking) {
                await supabase.from(tableNames.likes).insert(interactionData);
            } else {
                await supabase.from(tableNames.likes).delete().match(interactionData);
            }
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
            if (isSaving) {
                await supabase.from(tableNames.saves).insert(interactionData);
            } else {
                await supabase.from(tableNames.saves).delete().match(interactionData);
            }
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

    const handleBackPress = () => backTo === 'vault' ? router.push('/vault') : router.back();
    const handleSharePress = () => ShareService.shareContent({
        type: 'article', id: String(article.id), title: article.title, summary: article.summary
    });

    // The new totalSlides calculation based on article.slides
    // const totalSlides = 1 + (article.slides?.length || 0); // Removed duplicate

    const { trackSlideView, markComplete } = useContentTracking({
        contentId: article.id,
        contentType: 'article',
        totalSlides
    });

    const handleVote = async (preference: boolean) => {
        if (!user) return;

        // Optimistic update
        setHasVoted(true);

        try {
            await supabase.from('new_format_concensus').insert({
                user_id: user.id,
                preference: preference
            });
        } catch (e) {
            console.error('Error saving preference:', e);
            // Revert if failed? For now, we assume success to avoid nagging
        }
    };

    const goToSlide = (index: number) => {
        if (index >= 0 && index < totalSlides) {
            setActiveIndex(index);
            // Switched to withTiming to prevent spring oscillation/glitching
            flipRotation.value = withTiming(index * 180, { duration: 600 });

            // Track Progress
            trackSlideView(index);

            if (index === totalSlides - 1) {
                markComplete();
            }
        }
    };

    const handleTapLeft = () => {
        if (activeIndex > 0) goToSlide(activeIndex - 1);
    };

    const handleTapRight = () => {
        if (activeIndex < totalSlides - 1) goToSlide(activeIndex + 1);
    };

    const renderSlideContent = (index: number) => {
        // Cover Slide (Always WebView for now, using front_cover_code or animation_code)
        if (index === 0) {
            const html = (article.front_cover_code || article.animation_code || '') + commonCss;
            return <SimpleWebViewPoC height={totalHeight} htmlContent={html} preload={preload} />;
        }

        // Narrative Slides
        const slideIndex = index - 1;

        if (hasNativeSlides) {
            const rawContent = effectiveNativeSlides[slideIndex] || '';

            let chapterTitle: string | undefined = undefined;
            let slideText = rawContent;

            // Try to parse if it's JSON
            if (isJsonLike(rawContent)) {
                try {
                    const parsed = JSON.parse(rawContent);
                    if (parsed.context) {
                        slideText = parsed.context;
                    }
                    if (parsed.title) {
                        chapterTitle = parsed.title;
                    }
                } catch (e) {
                    console.log('Failed to parse JSON slide:', e);
                }
            }

            return (
                <NativeStorySlide
                    title={article.title}
                    chapterTitle={chapterTitle}
                    text={slideText}
                    imageUrl={article.image_url}
                    colour={article.colour}
                />
            );
        } else {
            // Legacy Web Slides
            const html = (webSlides[slideIndex] || '') + commonCss;
            return <SimpleWebViewPoC height={totalHeight} htmlContent={html} preload={preload} />;
        }
    };

    const frontAnimatedStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(flipRotation.value, [0, 180, 360], [0, 180, 360]);
        return {
            transform: [
                { perspective: 1000 },
                { rotateY: `${rotateValue}deg` }
            ],
        };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(flipRotation.value, [0, 180, 360], [180, 360, 540]);
        return {
            transform: [
                { perspective: 1000 },
                { rotateY: `${rotateValue}deg` }
            ],
        };
    });

    const [renderedFrontIndex, setRenderedFrontIndex] = useState(0);
    const [renderedBackIndex, setRenderedBackIndex] = useState(1);

    // Optimized rendering logic to prevent premature content updates
    useEffect(() => {
        // Only update the face that is being flipped TO (the target).
        // Leave the OTHER face alone so it persists during the transition.
        if (activeIndex % 2 === 0) {
            // Target is Front (Even)
            setRenderedFrontIndex(activeIndex);
        } else {
            // Target is Back (Odd)
            setRenderedBackIndex(activeIndex);
        }
    }, [activeIndex]);

    const renderMetadata = () => {
        const containerStyle = styles.bottomContent;

        return (
            <Animated.View style={[containerStyle, { paddingBottom: insets.bottom + BOTTOM_NAV_HEIGHT + (isInVault ? 10 : 10) }]}>
                <View style={styles.compactRow}>

                    <TouchableOpacity style={styles.pill} onPress={toggleLike}>
                        <FontAwesome name={hasLiked ? "heart" : "heart-o"} size={16} color={hasLiked ? "#ff4081" : "white"} style={{ marginRight: 6 }} />
                        <Text style={styles.pillText}>{likes}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.pill} onPress={toggleSave}>
                        <Feather name="bookmark" size={16} color={hasSaved ? "#00e5ff" : "white"} style={{ marginRight: 6 }} />
                        <Text style={styles.pillText}>{saves}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.pill} onPress={() => onOpenComments?.(article.id)}>
                        <Feather name="message-circle" size={16} color="white" style={{ marginRight: 6 }} />
                        <Text style={styles.pillText}>{article.comments_count || 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.pill} onPress={handleSharePress}>
                        <Feather name="share" size={16} color="white" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.navigationHint}>
                    Tap the right of the screen to read more
                </Text>
            </Animated.View>
        );
    };

    const BOTTOM_NAV_HEIGHT = 60; // Approximate height for bottom navbar

    return (
        <View style={[styles.container, { height: totalHeight }]}>
            <View style={StyleSheet.absoluteFill}>
                <Animated.View
                    style={[styles.face, frontAnimatedStyle]}
                    shouldRasterizeIOS={true} // rasterize to prevent BlurView glitches during 3D transform
                    renderToHardwareTextureAndroid={true}
                >
                    {renderSlideContent(renderedFrontIndex)}
                    {renderedFrontIndex === 0 && (
                        <>
                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']} style={styles.gradientOverlay} pointerEvents="none" />
                            <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.topGradientOverlay} pointerEvents="none" />
                        </>
                    )}
                </Animated.View>
                <Animated.View
                    style={[styles.face, backAnimatedStyle]}
                    shouldRasterizeIOS={true} // rasterize to prevent BlurView glitches during 3D transform
                    renderToHardwareTextureAndroid={true}
                >
                    {renderSlideContent(renderedBackIndex)}
                    {renderedBackIndex === 0 && (
                        <>
                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']} style={styles.gradientOverlay} pointerEvents="none" />
                            <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.topGradientOverlay} pointerEvents="none" />
                        </>
                    )}
                </Animated.View>
            </View>

            {/* Preference Bar - Shows when top buttons are HIDDEN (!isMenuOpen) and user hasn't voted yet */}
            {(!isMenuOpen && hasVoted === false) && (
                <Animated.View style={[styles.preferenceBar, { top: insets.top + 10 }]}>
                    <Text style={styles.preferenceText}>Do you prefer this content?</Text>
                    <View style={styles.preferenceButtons}>
                        <TouchableOpacity style={[styles.prefButton, styles.prefButtonYes]} onPress={() => handleVote(true)}>
                            <Feather name="check" size={16} color="white" />
                            <Text style={styles.prefButtonText}>Yes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.prefButton, styles.prefButtonNo]} onPress={() => handleVote(false)}>
                            <Feather name="x" size={16} color="white" />
                            <Text style={styles.prefButtonText}>No</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}

            <View style={styles.touchOverlay} pointerEvents="box-none">
                <TouchableOpacity style={styles.touchZoneLeft} onPress={handleTapLeft} activeOpacity={1} />
                <TouchableOpacity style={styles.touchZoneRight} onPress={handleTapRight} activeOpacity={1} />
            </View>

            {(isMenuOpen) && (
                <Animated.View style={[styles.topControls, { top: insets.top + 10, gap: 8 }]}>
                    {showBackButton && (
                        <TouchableOpacity style={styles.iconButton} onPress={handleBackPress}>
                            <Feather name="arrow-left" size={24} color="white" />
                        </TouchableOpacity>
                    )}

                    {article.industry_id && (
                        <View style={styles.pill}>
                            <Feather name={((allIndustries.find(i => i.id === article.industry_id) as any)?.icon_name || 'briefcase')} size={16} color="white" />
                        </View>
                    )}

                    <View style={styles.pill}>
                        <Feather name={getTypeIcon(article.type) as any} size={16} color="white" />
                    </View>

                    {article.author && (
                        <View style={styles.pill}>
                            <Text style={styles.pillText}>
                                {article.author.length > 15
                                    ? article.author.substring(0, 15) + '...'
                                    : article.author}
                            </Text>
                        </View>
                    )}
                    <View style={{ flex: 1 }} />
                    <FlagButton contentId={article.id} contentType="article" size={20} style={{ marginRight: 10 }} iconColor="white" />
                    <TouchableOpacity style={styles.iconButton} onPress={() => setShowFeedbackModal(true)}>
                        <Feather name="message-square" size={20} color="white" />
                    </TouchableOpacity>
                </Animated.View>
            )}

            {renderMetadata()}

            <Animated.View style={[styles.menuButtonContainer, { bottom: insets.bottom + BOTTOM_NAV_HEIGHT + 20 }]}>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => setIsMenuOpen(!isMenuOpen)}
                    activeOpacity={0.8}
                >
                    <Feather name={isMenuOpen ? "x" : "more-horizontal"} size={24} color="white" />
                </TouchableOpacity>
            </Animated.View>

            <FeedbackBoardModal
                visible={showFeedbackModal}
                onClose={() => setShowFeedbackModal(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: '#000',
        position: 'relative',
        overflow: 'hidden',
    },
    touchOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 50, // Increased zIndex
        elevation: 50,
        flexDirection: 'row',
    },
    touchZoneLeft: {
        flex: 1,
        height: '100%',
    },
    touchZoneRight: {
        flex: 1,
        height: '100%',
    },
    face: {
        ...StyleSheet.absoluteFillObject,
        backfaceVisibility: 'hidden',
    },
    gradientOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '50%',
    },
    topGradientOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 180,
    },
    topControls: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        zIndex: 100,      // High zIndex to stay above 3D flip
        elevation: 100,   // High elevation for Android
        transform: [{ matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 200, 1] }], // Push forward in Z-space using matrix
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    bottomContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        zIndex: 100,     // High zIndex
        elevation: 100,  // High elevation
        transform: [{ matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 200, 1] }], // Push forward in Z-space
    },
    bottomContentBg: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderRadius: 20,
        marginHorizontal: 10,
        marginBottom: 10,
        padding: 16,
        paddingBottom: 22,
    },
    compactRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
    },
    pill: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 40,
        minHeight: 40,
    },
    pillText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
    menuButtonContainer: {
        position: 'absolute',
        right: 20,
        zIndex: 101, // Above everything
        elevation: 101,
        transform: [{ matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 200, 1] }], // Push forward in Z-space
    },
    menuButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    preferenceBar: {
        position: 'absolute',
        left: 20,
        right: 20, // Center it with margins
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        // backdropFilter removed as it is not supported in RN
        borderRadius: 30,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 200, // Higher than everything else
        elevation: 200,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        transform: [{ matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 200, 1] }],
    },
    preferenceText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginRight: 10,
        flex: 1,
    },
    preferenceButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    prefButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    prefButtonYes: {
        backgroundColor: 'rgba(34, 197, 94, 0.8)', // Green
    },
    prefButtonNo: {
        backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red
    },
    prefButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    navigationHint: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 8,
        marginLeft: 4,
    },
});
