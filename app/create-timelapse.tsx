import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, StatusBar, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { XMarkIcon, PlayIcon, StopIcon, ArrowPathIcon } from 'react-native-heroicons/outline';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';
import { File } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

export default function TimelapseScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const router = useRouter();
    const { colors } = useTheme();

    const [isRecording, setIsRecording] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [photosTaken, setPhotosTaken] = useState(0);
    const [facing, setFacing] = useState<'front' | 'back'>('front');
    const [sessionId, setSessionId] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initial permission request
    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission]);

    // Timer Logic
    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setSeconds(s => s + 1);
            }, 1000);

            // Capture photo every 30 seconds
            captureIntervalRef.current = setInterval(captureFrame, 30000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
        }

        return () => {
            clearTimers();
        };
    }, [isRecording]);

    const clearTimers = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    };

    const startSession = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert("Error", "You must be logged in.");
                return;
            }

            const { data, error } = await supabase
                .from('timelapse_sessions')
                .insert({
                    user_id: user.id,
                    start_time: new Date().toISOString(),
                    storage_path: `${user.id}/temp_session` // Will update with real ID if needed, or just use ID
                })
                .select()
                .single();

            if (error) throw error;

            setSessionId(data.id);
            setSeconds(0);
            setPhotosTaken(0);
            setIsRecording(true);

            // Capture first frame immediately
            setTimeout(captureFrame, 500);

        } catch (e) {
            console.error("Failed to start session:", e);
            Alert.alert("Error", "Could not start session.");
        }
    };

    const captureFrame = async () => {
        if (cameraRef.current && isRecording && sessionId) {
            try {
                // 1. Take Picture
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.5,
                    skipProcessing: true,
                });

                if (!photo) return;
                setPhotosTaken(prev => prev + 1);

                // 2. Process (Compress/Resize) - Background-ish
                const manipResult = await manipulateAsync(
                    photo.uri,
                    [{ resize: { width: 1080 } }],
                    { compress: 0.5, format: SaveFormat.JPEG }
                );

                // 3. Upload to Supabase (Fire and forget promise for MVP to avoid lag)
                uploadFrame(manipResult.uri);

            } catch (e) {
                console.log('Frame capture failed', e);
            }
        }
    };

    const uploadFrame = async (uri: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !sessionId) return;

            const file = new File(uri);
            const base64 = await file.base64();
            const timestamp = Date.now();
            const filename = `${user.id}/${sessionId}/${timestamp}.jpg`;

            await supabase.storage
                .from('timelapse-images')
                .upload(filename, decode(base64), {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            // Optional: Delete local temp file to save space?
            // FileSystem.deleteAsync(uri, { idempotent: true });
        } catch (e) {
            console.error("Frame upload failed:", e);
        }
    };

    const toggleCamera = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStop = async () => {
        clearTimers();
        setIsRecording(false);
        const earnedVoltz = Math.floor(seconds / 60) * 10;

        // Update Session record
        if (sessionId) {
            await supabase.from('timelapse_sessions')
                .update({
                    end_time: new Date().toISOString(),
                    duration_seconds: seconds,
                    photos_count: photosTaken,
                    voltz_earned: earnedVoltz
                })
                .eq('id', sessionId);
        }

        Alert.alert(
            "Focus Session Complete!",
            `Time: ${formatTime(seconds)}\nPhotos: ${photosTaken}\nVoltz Earned: ${earnedVoltz}`,
            [{ text: "OK", onPress: () => router.back() }]
        );
    };

    if (!permission) return <View />;
    if (!permission.granted) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: 'white', marginBottom: 20 }}>We need camera access for timelapses.</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permButton}>
                    <Text style={styles.permText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <CameraView
                style={StyleSheet.absoluteFill}
                facing={facing}
                ref={cameraRef}
            />

            {!isRecording && (
                <SafeAreaView style={styles.overlay}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={router.back} style={styles.iconButton}>
                            <XMarkIcon color="white" size={28} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={toggleCamera} style={styles.iconButton}>
                            <ArrowPathIcon color="white" size={28} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.controls}>
                        <Text style={styles.instruction}>Frame your shot</Text>
                        <TouchableOpacity onPress={startSession} style={styles.recordButton}>
                            <View style={styles.recordInner} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            )}

            {isRecording && (
                <View style={[styles.focusOverlay, { backgroundColor: '#000000' }]}>
                    <SafeAreaView style={styles.focusContent}>
                        <View style={styles.timerContainer}>
                            <Text style={styles.focusLabel}>FOCUS MODE</Text>
                            <Text style={styles.timerText}>{formatTime(seconds)}</Text>
                            <Text style={styles.statsText}>{photosTaken} frames captured</Text>
                        </View>

                        <View style={styles.breathingLight} />

                        <TouchableOpacity onPress={handleStop} style={styles.stopButton}>
                            <View style={styles.stopInner} />
                        </TouchableOpacity>
                    </SafeAreaView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
    },
    iconButton: {
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 30,
    },
    permButton: {
        backgroundColor: '#4F46E5',
        padding: 15,
        borderRadius: 10,
    },
    permText: {
        color: 'white',
        fontWeight: 'bold',
    },
    controls: {
        alignItems: 'center',
        paddingBottom: 50,
    },
    instruction: {
        color: 'white',
        marginBottom: 30,
        fontSize: 16,
        fontWeight: '500',
    },
    recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 6,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E11D48',
    },

    // Focus Mode
    focusOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    focusContent: {
        flex: 1,
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 60,
    },
    timerContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    focusLabel: {
        color: '#4F46E5',
        fontSize: 14,
        letterSpacing: 4,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    timerText: {
        color: 'white',
        fontSize: 80,
        fontWeight: '200',
        fontFamily: 'Oswald_300Light',
        fontVariant: ['tabular-nums'],
    },
    statsText: {
        color: 'rgba(255,255,255,0.4)',
        marginTop: 10,
    },
    stopButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    stopInner: {
        width: 30,
        height: 30,
        borderRadius: 4,
        backgroundColor: '#E11D48',
    },
    breathingLight: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E11D48',
        opacity: 0.8,
    }
});
