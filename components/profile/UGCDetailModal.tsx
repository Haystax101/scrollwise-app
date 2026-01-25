import React from 'react';
import { Modal, View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UGCDetailModalProps {
    visible: boolean;
    onClose: () => void;
    item: any;
}

const { width } = Dimensions.get('window');

import { useVideoPlayer, VideoView } from 'expo-video';
import { supabase } from '../../lib/supabase';

// ... imports

export const UGCDetailModal: React.FC<UGCDetailModalProps> = ({
    visible,
    onClose,
    item
}) => {
    const { colors } = useTheme();

    // Video Player Support
    const videoSource = item?.video_url
        ? (item.video_url.startsWith('http')
            ? item.video_url
            : supabase.storage.from('timelapses').getPublicUrl(item.video_url).data.publicUrl)
        : null;

    const player = useVideoPlayer(videoSource, player => {
        if (item?.video_url) {
            player.loop = true;
            player.play();
        }
    });

    React.useEffect(() => {
        if (item) {
            console.log('🖼️ UGCDetailModal mounting with item:', {
                id: item.id,
                has_image: !!item.image_url,
                has_video: !!item.video_url
            });
        }
    }, [item]);

    if (!item || !visible) return null;

    // ... styles ...
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 15,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
        },
        headerTitle: {
            fontSize: 17,
            fontWeight: '600',
            color: colors.text,
        },
        contentContainer: {
            flex: 1,
        },
        mediaContainer: {
            width: width,
            height: width, // Square
            backgroundColor: 'black',
            justifyContent: 'center',
            alignItems: 'center',
        },
        image: {
            width: '100%',
            height: '100%',
        },
        video: {
            width: '100%',
            height: '100%',
        },
        textOnlyContainer: {
            padding: 30,
            minHeight: 300,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.card,
            margin: 20,
            borderRadius: 12,
        },
        textContent: {
            fontSize: 18,
            lineHeight: 28,
            color: colors.text,
            textAlign: 'center',
        },
        metaContainer: {
            padding: 20,
        },
        dateText: {
            fontSize: 13,
            color: colors.textSecondary,
            marginBottom: 8,
        },
        caption: {
            fontSize: 15,
            lineHeight: 22,
            color: colors.text,
        }
    });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Feather name="x" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Details</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 40 }}>
                    {item.video_url ? (
                        <View style={styles.mediaContainer}>
                            <VideoView
                                player={player}
                                style={styles.video}
                                contentFit="contain"
                                nativeControls={true}
                            />
                        </View>
                    ) : item.image_url ? (
                        <View style={styles.mediaContainer}>
                            <Image
                                source={{ uri: item.image_url }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                        </View>
                    ) : (
                        <View style={styles.textOnlyContainer}>
                            <Text style={styles.textContent}>{item.content}</Text>
                        </View>
                    )}

                    <View style={styles.metaContainer}>
                        <Text style={styles.dateText}>
                            {new Date(item.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Text>

                        {(item.content) && (
                            <Text style={styles.caption}>{item.content}</Text>
                        )}
                        {/* Show earned voltz if available (for timelapses) */}
                        {item.voltz_earned !== undefined && (
                            <Text style={[styles.caption, { fontWeight: 'bold', color: colors.primary, marginTop: 10 }]}>
                                +{item.voltz_earned} Voltz
                            </Text>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};
