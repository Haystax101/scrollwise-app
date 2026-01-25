import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { XMarkIcon, PlayIcon, StopIcon, ArrowPathIcon } from 'react-native-heroicons/outline';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';

import { decode } from 'base64-arraybuffer';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { timelapseService } from '../lib/timelapseService';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

// Keep specific frames based on logic
// 0-20 mins: 1 frame/sec (keep all)
// 20-60 mins: 1 frame every 4 seconds
// >60 mins: 1 frame every 8 seconds
// NOTE: With hybrid batch (3s interval), we are capturing ~20/min always. 
// Server side can decimate if needed, but 3s is already sparse.
const getKeepInterval = (durationSeconds: number) => {
    if (durationSeconds <= 1200) return 1; // 20 mins
    if (durationSeconds <= 3600) return 4; // 60 mins
    return 8;
};

export default function TimelapseScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const router = useRouter();
    const { colors } = useTheme();

    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [photosCaptured, setPhotosCaptured] = useState(0);
    const [photosKept, setPhotosKept] = useState(0); // For progress UI
    const [facing, setFacing] = useState<'front' | 'back'>('front');
    const [sessionId, setSessionId] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Store frames locally: { uri: string, timestamp: number }
    const framesRef = useRef<{ uri: string; timestamp: number }[]>([]);

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

            // Capture photo every 3 seconds (3000ms)
            captureIntervalRef.current = setInterval(captureFrame, 3000);
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
                    storage_path: `${user.id}/temp_session`
                })
                .select()
                .single();

            if (error) throw error;

            setSessionId(data.id);
            setSeconds(0);
            setPhotosCaptured(0);
            framesRef.current = []; // Reset frames
            setIsRecording(true);

            // Capture first frame immediately
            setTimeout(captureFrame, 200);

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
                    shutterSound: false,
                });

                if (!photo) return;

                // 2. Buffer locally using Service (which handles batching & zipping)
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await timelapseService.addToBuffer(photo.uri, sessionId, user.id);
                    setPhotosCaptured(prev => prev + 1);
                }

            } catch (e) {
                console.log('Frame capture failed', e);
            }
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
        // Stop recording immediately
        clearTimers();
        setIsRecording(false);
        setIsProcessing(true); // Show loading UI

        const totalSeconds = seconds;
        const earnedVoltz = Math.floor(totalSeconds / 60) * 10;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !sessionId) throw new Error("No user or session");

            // 1. Flush any remaining frames in buffer
            await timelapseService.flushBuffer(sessionId, user.id);

            // 2. Wait for upload queue to drain? 
            // In a real app we might background this or show a progress bar. 
            // For now, we update the session status and let the user leave. 
            // The service continues uploading in background (as long as app is open).

            // 3. Update Session Record
            await supabase.from('timelapse_sessions')
                .update({
                    end_time: new Date().toISOString(),
                    duration_seconds: totalSeconds,
                    photos_count: photosCaptured, // Total captured
                    voltz_earned: earnedVoltz,
                    status: 'processing' // New status field?
                })
                .eq('id', sessionId);

            setIsProcessing(false);

            Alert.alert(
                "Focus Session Complete!",
                `Time: ${formatTime(totalSeconds)}\nVoltz Earned: ${earnedVoltz}\n\nYour timelapse is processing in the cloud.`,
                [{ text: "OK", onPress: () => router.back() }]
            );

            // Trigger finalize (this should technically happen after uploads finish)
            // Ideally the service tracks this. For MVP, we assume uploads eventual consistency 
            // or the Edge Function can just wait/poll.

        } catch (e) {
            console.error("Stop session error:", e);
            setIsProcessing(false);
            Alert.alert("Error", "Failed to save session properly. Some data may be lost.");
        }
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

            {!isRecording && !isProcessing && (
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

            {(isRecording || isProcessing) && (
                <View style={[styles.focusOverlay, { backgroundColor: '#000000' }]}>
                    <SafeAreaView style={styles.focusContent}>
                        <View style={styles.timerContainer}>
                            <Text style={styles.focusLabel}>{isProcessing ? 'PROCESSING...' : 'FOCUS MODE'}</Text>
                            <Text style={styles.timerText}>{formatTime(seconds)}</Text>
                            <Text style={styles.statsText}>
                                {isProcessing
                                    ? `Saving frames: ${photosKept}...`
                                    : `${photosCaptured} frames buffer`}
                            </Text>
                        </View>

                        {isProcessing ? (
                            <ActivityIndicator size="large" color="#E11D48" style={{ marginBottom: 50 }} />
                        ) : (
                            <>
                                <View style={styles.breathingLight} />
                                <TouchableOpacity onPress={handleStop} style={styles.stopButton}>
                                    <View style={styles.stopInner} />
                                </TouchableOpacity>
                            </>
                        )}
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
