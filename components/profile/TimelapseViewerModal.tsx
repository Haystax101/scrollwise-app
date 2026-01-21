import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

interface TimelapseViewerModalProps {
    visible: boolean;
    videoUrl: string | null;
    onClose: () => void;
}

export const TimelapseViewerModal: React.FC<TimelapseViewerModalProps> = ({
    visible,
    videoUrl,
    onClose
}) => {
    const { colors } = useTheme();
    // Using a simpler dark check if theme prop is unavailable
    const isDark = true;

    const player = useVideoPlayer(videoUrl, player => {
        player.loop = true;
        player.play();
    });

    useEffect(() => {
        if (visible && videoUrl) {
            // Fix: Use replaceAsync to avoid main thread freeze warning
            if ((player as any).replaceAsync) {
                (player as any).replaceAsync(videoUrl);
            } else {
                player.replace(videoUrl);
            }
            player.play();
        } else {
            player.pause();
        }
    }, [visible, videoUrl, player]);

    const handleDownload = async () => {
        if (!videoUrl) return;

        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                alert('Permission to save to gallery is required');
                return;
            }

            const filename = videoUrl.split('/').pop() || 'timelapse.mp4';

            // Access directory constants, handling potential type mismatches
            const fs = FileSystem as any;
            const dir = fs.documentDirectory || fs.cacheDirectory;

            if (!dir) throw new Error('No storage directory available');

            const fileUri = `${dir}${filename}`;

            // Download the file
            const downloadRes = await FileSystem.downloadAsync(videoUrl, fileUri);

            // Save to gallery
            if (downloadRes.status === 200) {
                await MediaLibrary.saveToLibraryAsync(downloadRes.uri);
                alert('Timelapse saved to gallery!');
            } else {
                alert('Failed to download video');
            }
        } catch (error) {
            console.error('Download error:', error);
            alert('An error occurred while saving the video');
        }
    };

    if (!visible || !videoUrl) return null;

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
                            <VideoView
                                style={styles.video}
                                player={player}
                                allowsPictureInPicture
                            // removed deprecated allowsFullscreen
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.downloadButton, { backgroundColor: colors.primary }]}
                            onPress={handleDownload}
                        >
                            <Feather name="download" size={20} color="white" />
                            <Text style={styles.downloadText}>Save to Gallery</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
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
        backgroundColor: '#000',
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
