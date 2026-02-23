import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import { ShareSheet } from '../share/ShareSheet';
import { useTheme } from '../../context/ThemeContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { supabase } from '../../lib/supabase';
import { communityService } from '../../lib/communityService';
import { PaperAirplaneIcon } from 'react-native-heroicons/outline';
import { profileImageService } from '../../services/profileImageService';

const { width } = Dimensions.get('window');
const defaultProfileImage = require('../../assets/profileIconDefault.png');

interface TimelapseFeedCardProps {
    item: any;
    currentUserId: string;
    isVisible: boolean; // For autoplay
    onCommentPress?: () => void;
    onProfilePress?: () => void;
    onDelete?: () => void; // Triggered after successful delete
}

export const TimelapseFeedCard = React.memo<TimelapseFeedCardProps>(({ item, currentUserId, isVisible, onCommentPress, onProfilePress, onDelete }) => {
    const { colors } = useTheme();
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [likeCount, setLikeCount] = useState(item.likes_count || 0);

    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [shareSheetVisible, setShareSheetVisible] = useState(false);

    // Loop Control
    const loopCount = useRef(0);
    const SHORT_VIDEO_THRESHOLD = 300;
    const isShort = (item.duration || 0) < SHORT_VIDEO_THRESHOLD;

    // Prepare Player
    useEffect(() => {
        if (item.video_url) {
            if (item.video_url.startsWith('http')) {
                setVideoUrl(item.video_url);
            } else {
                const { data } = supabase.storage.from('timelapses').getPublicUrl(item.video_url);
                setVideoUrl(data.publicUrl);
            }
        }
    }, [item.video_url]);

    const player = useVideoPlayer(videoUrl, player => {
        player.loop = !isShort;
        player.muted = true;
    });

    // Handle visible state & resetting
    useEffect(() => {
        if (!player) return;

        if (isVisible) {
            if (isShort) {
                loopCount.current = 0;
            }
            player.play();
        } else {
            player.pause();
        }
    }, [isVisible, player, isShort]);

    // Manual Loop Logic for Short Videos
    useEffect(() => {
        if (!isShort || !player) return;

        const subscription = player.addListener('playToEnd', () => {
            if (loopCount.current < 2) {
                loopCount.current += 1;
                player.replay();
            } else {
                player.pause();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [player, isShort]);

    useEffect(() => { checkStatus(); }, []);

    const checkStatus = async () => {
        if (!currentUserId) return;

        const { data: likeData } = await supabase.from('timelapse_likes').select('id').eq('timelapse_id', item.id).eq('user_id', currentUserId).maybeSingle();
        if (likeData) setLiked(true);

        const { data: saveData } = await supabase.from('timelapse_saves').select('id').eq('timelapse_id', item.id).eq('user_id', currentUserId).maybeSingle();
        if (saveData) setSaved(true);
    };

    const handleLike = async () => {
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
        await communityService.toggleLike(item.id, 'timelapse', currentUserId);
    };

    const handleSave = async () => {
        setSaved(!saved);
        await communityService.toggleSave(item.id, 'timelapse', currentUserId);
    };

    const handleShare = () => {
        setShareSheetVisible(true);
    };

    const handleOptionsPress = () => {
        if (item.user_id !== currentUserId) return;
        const options = [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete Timelapse',
                style: 'destructive',
                onPress: handleDelete
            }
        ];
        // @ts-ignore
        Alert.alert('Options', undefined, options);
    };

    const handleDelete = () => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this timelapse?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const { error } = await supabase.from('timelapse_sessions').delete().eq('id', item.id);
                        if (error) throw error;
                        if (item.video_url) {
                            await supabase.storage.from('timelapses').remove([item.video_url]);
                        }
                        if (onDelete) onDelete();
                    } catch (e) {
                        Alert.alert('Error', 'Failed to delete timelapse');
                    }
                }
            }
        ]);
    };

    // Determine Avatar Source:
    // Consistent with InsightCard
    const avatarSource = item.author_avatar || item.author?.avatar
        ? { uri: profileImageService.getProfileImageUrl(item.author_avatar || item.author?.avatar) }
        : defaultProfileImage;

    return (
        <View style={[styles.card, { backgroundColor: 'rgba(30, 30, 30, 0.85)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.authorRow} onPress={onProfilePress}>
                    <Image
                        source={avatarSource}
                        style={styles.avatar}
                    />
                    <View>
                        <Text style={[styles.authorName, { color: colors.text }]}>{item.author_name || item.author?.name || 'Unknown'}</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                            {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* 3 Dots: ONLY if current user is owner */}
                {item.user_id === currentUserId && (
                    <TouchableOpacity onPress={handleOptionsPress}>
                        <Feather name="more-horizontal" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Content (Caption) */}
            {item.content ? (
                <Text style={[styles.content, { color: colors.text }]} numberOfLines={3} ellipsizeMode="tail">
                    {item.content}
                </Text>
            ) : null}

            {/* Video Player */}
            {/* Aspect Ratio Change: From 1 (Square) to 4/5 (0.8) for better vertical timelapse visibility */}
            <View style={[styles.videoContainer, { aspectRatio: 3 / 4 }]}>
                {videoUrl ? (
                    <VideoView
                        style={styles.video}
                        player={player}
                        contentFit="cover" // Keep cover to fill space, but new AR shows more
                        nativeControls={false}
                    />
                ) : (
                    <View style={[styles.videoPlaceholder, { backgroundColor: '#000' }]} />
                )}
                {/* Duration Badge */}
                <View style={styles.durationBadge}>
                    <Feather name="clock" size={10} color="white" style={{ marginRight: 4 }} />
                    <Text style={styles.durationText}>{Math.floor((item.duration || 0) / 60)}m</Text>
                </View>
            </View>

            {/* Actions */}
            <View style={[styles.actions, { borderTopColor: colors.border }]}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                    <Ionicons
                        name={liked ? "heart" : "heart-outline"}
                        size={24}
                        color={liked ? "#EF4444" : colors.textSecondary}
                    />
                    <Text style={[styles.actionText, { color: colors.textSecondary }]}>{likeCount}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={onCommentPress}>
                    <Feather name="message-circle" size={24} color={colors.textSecondary} />
                    <Text style={[styles.actionText, { color: colors.textSecondary }]}>{item.comments_count || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                    <PaperAirplaneIcon color={colors.textSecondary} size={24} style={{ transform: [{ rotate: '-30deg' }, { translateY: -2 }] }} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
                    <Feather name="bookmark" size={24} color={saved ? colors.primary : colors.textSecondary} fill={saved ? colors.primary : "none"} />
                </TouchableOpacity>
            </View>

            {/* Social Proof (Friend Likes) */}
            {item.friend_likes && item.friend_likes.length > 0 && (
                <View style={styles.likedByContainer}>
                    <Text style={[styles.likedByText, { color: colors.text }]}>
                        Liked by <Text style={styles.likedByBold}>{item.friend_likes[0].name}</Text>
                        {likeCount > 1 && (
                            <Text> and {formatLikeCount(likeCount - 1)} others</Text>
                        )}
                    </Text>
                </View>
            )}

            {/* Share Sheet */}
            <ShareSheet
                visible={shareSheetVisible}
                onClose={() => setShareSheetVisible(false)}
                content={{
                    id: item.id,
                    type: 'timelapse',
                    title: `Timelapse by ${item.author_name}`,
                    summary: item.content,
                    url: videoUrl || undefined,
                    author: {
                        name: item.author_name,
                        avatar: item.author_avatar
                    }
                }}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        marginBottom: 20,
        borderWidth: 1,
        borderRadius: 24,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        alignItems: 'center',
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 10,
        backgroundColor: '#333' // Fallback bg if image loads slow
    },
    authorName: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    content: {
        paddingHorizontal: 12,
        paddingBottom: 12,
        fontSize: 14,
        lineHeight: 20,
    },
    videoContainer: {
        width: '100%',
        // Aspect ratio handled inline
        backgroundColor: 'black',
        position: 'relative',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    videoPlaceholder: {
        width: '100%',
        height: '100%',
    },
    durationBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    durationText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
        padding: 12,
        justifyContent: 'space-between', // Distribute evenly
        // Or 'flex-start' with gap
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minWidth: 40,
    },
    actionText: {
        fontSize: 14,
    },
    likedByContainer: {
        paddingHorizontal: 12,
        paddingBottom: 12,
    },
    likedByText: {
        fontSize: 13,
    },
    likedByBold: {
        fontWeight: 'bold',
    }
});

const formatLikeCount = (count: number) => {
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
};
