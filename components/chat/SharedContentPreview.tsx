import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SharedContent } from '../../lib/chatService';
import { profileImageService } from '../../services/profileImageService';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface SharedContentPreviewProps {
    content: SharedContent;
}

export const SharedContentPreview: React.FC<SharedContentPreviewProps> = ({ content }) => {
    const { colors } = useTheme();
    const router = useRouter();

    const handlePress = () => {
        // Navigate to Feed with content params
        router.push({
            pathname: '/(tabs)/',
            params: {
                contentId: content.id,
                contentType: content.type,
                showBackButton: 'true',
                backTo: 'chat'
            }
        });
    };

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handlePress}
            activeOpacity={0.9}
        >
            {/* Header: Author */}
            {content.author && (
                <View style={styles.header}>
                    <Image
                        source={
                            content.author.avatar
                                ? { uri: profileImageService.getProfileImageUrl(content.author.avatar) }
                                : require('../../assets/profileIconDefault.png')
                        }
                        style={styles.avatar}
                    />
                    <Text style={[styles.authorName, { color: colors.text }]}>
                        {content.author.name}
                    </Text>
                </View>
            )}

            {/* Media / Visual */}
            {content.image && (
                <Image
                    source={{ uri: content.image }}
                    style={styles.media}
                    resizeMode="cover"
                />
            )}

            {/* Content Body */}
            <View style={styles.body}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                    {content.title}
                </Text>
                {content.summary && (
                    <Text style={[styles.summary, { color: colors.textSecondary }]} numberOfLines={3}>
                        {content.summary}
                    </Text>
                )}
            </View>

            {/* Footer / Badge */}
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <Text style={[styles.typeBadge, { color: colors.primary }]}>{content.type.toUpperCase()}</Text>
                <Feather name="chevron-right" size={16} color={colors.textSecondary} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        marginTop: 8,
        maxWidth: 280, // Limit width inside bubble
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        paddingBottom: 4,
    },
    avatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 8,
    },
    authorName: {
        fontSize: 12,
        fontWeight: '600',
    },
    media: {
        width: '100%',
        height: 140, // Mini height
        backgroundColor: '#1a1a1a', // placeholder bg
    },
    body: {
        padding: 10,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    summary: {
        fontSize: 12,
        lineHeight: 16,
    },
    footer: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    typeBadge: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    }
});
