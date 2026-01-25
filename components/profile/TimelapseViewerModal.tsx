import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Text, ActivityIndicator, Alert, Share } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useVideoPlayer, VideoView } from 'expo-video';
import { File, Paths } from 'expo-file-system';
import { supabase } from '../../lib/supabase';

interface TimelapseViewerModalProps {
    visible: boolean;
    session: {
        id: string;
        user_id: string;
        video_url?: string;
        status?: string;
        photos_count?: number;
    } | null;
    onClose: () => void;
}

export const TimelapseViewerModal: React.FC<TimelapseViewerModalProps> = ({
    visible,
    session,
    onClose
}) => {
    const { colors } = useTheme();
    const isDark = true;

    // Resolve public URL if video_url is a path
    const [videoSource, setVideoSource] = React.useState<string | null>(null);

    useEffect(() => {
        if (session?.video_url) {
            if (session.video_url.startsWith('http')) {
                setVideoSource(session.video_url);
            } else {
                // It's a storage path, get public URL
                const { data } = supabase.storage
                    .from('timelapses')
                    .getPublicUrl(session.video_url);
                setVideoSource(data.publicUrl);
            }
        } else {
            setVideoSource(null);
        }
    }, [session]);

    // Debug Log
    useEffect(() => {
        if (videoSource) console.log("📺 Video Source URL:", videoSource);
    }, [videoSource]);

    const player = useVideoPlayer(videoSource, player => {
        player.loop = true;
        player.play();
    });

    const handleDownload = async () => {
        if (!videoSource) return;

        try {
            const filename = `supercharged_${session?.id}.mp4`;

            // Use new File API (Paths.document is the standard directory)
            const file = new File(Paths.document, filename);

            // Download content to the file
            await File.downloadFileAsync(videoSource, file);

            if (file.exists) {
                const canShare = await Share.share({
                    url: file.uri,
                    title: 'My Focus Timelapse'
                });
                if (canShare.action === Share.dismissedAction) {
                    // Cleanup
                    if (file.exists) file.delete();
                }
            }
        } catch (e) {
            console.error("Download failed", e);
            Alert.alert("Error", "Could not download video.");
        }
    };

    if (!visible || !session) return null;

    const isProcessing = !session.video_url || session.status === 'processing';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

                <SafeAreaView style={styles.safeArea}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Feather name="x" size={24} color={colors.text} />
                    </TouchableOpacity>

                    <View style={styles.contentContainer}>
                        <View style={styles.videoWrapper}>
                            {isProcessing ? (
                                <View style={styles.processingContainer}>
                                    <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 20 }} />
                                    <Text style={styles.processingText}>Processing Timelapse...</Text>
                                    <Text style={styles.processingSubtext}>
                                        We are stitching your {session.photos_count || 0} frames into a video.
                                        Check back shortly.
                                    </Text>
                                </View>
                            ) : videoSource ? (
                                <VideoView
                                    player={player}
                                    style={styles.video}
                                    contentFit="contain"
                                    nativeControls={false}
                                />
                            ) : (
                                <View style={styles.errorContainer}>
                                    <Text style={{ color: 'white' }}>Video not available.</Text>
                                </View>
                            )}
                        </View>

                        {!isProcessing && videoSource && (
                            <TouchableOpacity
                                style={[styles.downloadButton, { backgroundColor: colors.primary }]}
                                onPress={handleDownload}
                            >
                                <Feather name="share" size={20} color="white" />
                                <Text style={styles.downloadText}>Share / Save</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
    },
    safeArea: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        padding: 10,
        zIndex: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    contentContainer: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 24,
    },
    videoWrapper: {
        width: '100%',
        aspectRatio: 9 / 16,
        maxHeight: '70%',
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    video: {
        width: '100%',
        height: '100%',
    },
    processingContainer: {
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    processingText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    processingSubtext: {
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        lineHeight: 20,
    },
    errorContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        gap: 8,
    },
    downloadText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    }
});
