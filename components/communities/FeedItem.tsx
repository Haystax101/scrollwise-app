import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FeedItem as FeedItemType } from '../../lib/communityService';
import { profileImageService } from '../../services/profileImageService';
import { formatDistanceToNow } from 'date-fns';

const { width } = Dimensions.get('window');

interface FeedItemProps {
    item: FeedItemType;
    currentUserId: string;
    onPressImage?: (url: string) => void;
}

export const FeedItem = React.memo<FeedItemProps>(({ item, currentUserId, onPressImage }) => {
    const { colors } = useTheme();
    const isOwner = item.user_id === currentUserId;

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
            <View style={styles.postHeader}>
                <Image source={avatarSource} style={styles.postAvatar} />
                <View>
                    <Text style={[styles.postAuthor, { color: colors.text }]}>{item.author_name}</Text>
                    <Text style={[styles.postTime, { color: colors.textSecondary }]}>{timeAgo}</Text>
                </View>
            </View>

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

            {/* Footer decoration */}
            <View style={[styles.postFooter, { borderTopColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    Read more ...
                </Text>
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
    }
});
