import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Share } from 'react-native'; // Added Share
import { useTheme } from '../../context/ThemeContext';
import { FeedItem as FeedItemType, communityService } from '../../lib/communityService';
import { profileImageService } from '../../services/profileImageService';
import { formatDistanceToNow } from 'date-fns';
import { Feather } from '@expo/vector-icons';
import { PaperAirplaneIcon } from 'react-native-heroicons/outline';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

interface FeedItemProps {
    item: FeedItemType;
    currentUserId: string;
    onPressImage?: (url: string) => void;
    onCommentPress?: () => void; // Added prop
    onProfilePress?: () => void;
}

export const FeedItem = React.memo<FeedItemProps>(({ item, currentUserId, onPressImage, onCommentPress, onProfilePress }) => {
    const { colors } = useTheme();
    const isOwner = item.user_id === currentUserId;

    // Interaction State
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [likeCount, setLikeCount] = useState(item.likes_count || 0);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        if (!currentUserId) return;
        // Check Like
        // Assuming 'post_likes' table exists and follows standard pattern
        const { data: likeData } = await supabase.from('post_likes').select('id').eq('post_id', item.id).eq('user_id', currentUserId).maybeSingle();
        if (likeData) setLiked(true);

        // Check Save
        const { data: saveData } = await supabase.from('post_saves').select('id').eq('post_id', item.id).eq('user_id', currentUserId).maybeSingle();
        if (saveData) setSaved(true);
    };

    const handleLike = async () => {
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
        await communityService.toggleLike(item.id, 'post' as any, currentUserId);
    };

    const handleSave = async () => {
        setSaved(!saved);
        await communityService.toggleSave(item.id, 'post' as any, currentUserId);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this post by ${item.author_name} on Supercharged!`,
                // URL if applicable
            });
        } catch (error) { console.log(error); }
    };

    // Resolve Avatar URL safely
    const avatarSource = profileImageService.getProfileImageUrl(item.author_avatar)
        ? { uri: profileImageService.getProfileImageUrl(item.author_avatar)! }
        : require('../../assets/profileIconDefault.png');

    const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

    // RENDER MESSAGE (Chat Bubble)
    if (item.type === 'message') {
        const bubbleStyle = isOwner
            ? {
                backgroundColor: 'rgba(255, 215, 0, 0.1)', // Gold accent glass
                borderColor: 'rgba(255, 215, 0, 0.3)',
                borderWidth: 1,
                borderBottomRightRadius: 2,
            }
            : {
                backgroundColor: 'rgba(255, 255, 255, 0.05)', // Glassy dark
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                borderTopLeftRadius: 2,
            };

        return (
            <View style={[
                styles.messageContainer,
                isOwner ? styles.messageContainerRight : styles.messageContainerLeft
            ]}>
                {!isOwner && (
                    <Image source={avatarSource} style={styles.messageAvatar} />
                )}

                <View style={[
                    styles.messageBubble,
                    bubbleStyle
                ]}>
                    {!isOwner && <Text style={[styles.messageAuthor, { color: colors.text }]}>{item.author_name}</Text>}
                    <Text style={[
                        styles.messageText,
                        { color: colors.text } // Text always light/default
                    ]}>
                        {item.content}
                    </Text>
                    <Text style={[
                        styles.messageTime,
                        { color: colors.textSecondary }
                    ]}>
                        {timeAgo}
                    </Text>
                </View>
            </View>
        );
    }

    // RENDER POST (Rich Card)
    return (
        <View style={[styles.postContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Header */}
            <TouchableOpacity style={styles.postHeader} onPress={onProfilePress}>
                <Image source={avatarSource} style={styles.postAvatar} />
                <View>
                    <Text style={[styles.postAuthor, { color: colors.text }]}>{item.author_name}</Text>
                    <Text style={[styles.postTime, { color: colors.textSecondary }]}>{timeAgo}</Text>
                </View>
            </TouchableOpacity>

            {/* Content */}
            {item.title && (
                <Text style={[styles.postTitle, { color: colors.text }]}>{item.title}</Text>
            )}
            <Text style={[styles.postContent, { color: colors.text }]}>{item.content}</Text>

            {/* Media */}
            {item.media_urls && item.media_urls.length > 0 && (
                <View style={styles.mediaContainer}>
                    {item.media_urls.map((url, index) => (
                        <TouchableOpacity key={index} activeOpacity={0.9} onPress={() => onPressImage?.(url)}>
                            <Image source={{ uri: url }} style={styles.postImage} resizeMode="cover" />
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Interaction Row */}
            <View style={[styles.postFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                    <Feather name="heart" size={24} color={liked ? "#E11D48" : colors.textSecondary} fill={liked ? "#E11D48" : "none"} />
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
        </View>
    );
});

const styles = StyleSheet.create({
    // Message Styles
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 12,
        paddingHorizontal: 12,
        maxWidth: '100%',
    },
    messageContainerLeft: {
        justifyContent: 'flex-start',
    },
    messageContainerRight: {
        justifyContent: 'flex-end',
    },
    messageAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        marginTop: 4, // Align top
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
        maxWidth: '75%',
        borderTopLeftRadius: 4, // Chat style
    },
    messageAuthor: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },

    // Post Styles
    postContainer: {
        marginHorizontal: 16,
        marginBottom: 24,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        padding: 16,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    postAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    postAuthor: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    postTime: {
        fontSize: 12,
    },
    postTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 8,
    },
    postContent: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 12,
    },
    mediaContainer: {
        marginHorizontal: -16, // Bleed
        marginBottom: -8,
        marginTop: 8,
    },
    postImage: {
        width: '100%',
        height: 200,
    },
    postFooter: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minWidth: 40,
    },
    actionText: {
        fontSize: 14,
    }
});
