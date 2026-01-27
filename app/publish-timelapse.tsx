import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { Feather } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function PublishTimelapseScreen() {
    const params = useLocalSearchParams();
    const sessionId = params.sessionId as string;
    const router = useRouter();
    const { colors } = useTheme();

    const [description, setDescription] = useState('');
    const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
    const [publishing, setPublishing] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        if (sessionId) {
            fetchSession();
        }
    }, [sessionId]);

    const fetchSession = async () => {
        try {
            const { data, error } = await supabase
                .from('timelapse_sessions') // This is the single source of truth
                .select('*')
                .eq('id', sessionId)
                .single();

            if (data?.video_url) {
                // Get Public URL for preview
                const { data: urlData } = supabase.storage
                    .from('timelapses')
                    .getPublicUrl(data.video_url);
                setVideoUrl(urlData.publicUrl);
            }
        } catch (e) {
            console.error("Error fetching session:", e);
        }
    };

    const player = useVideoPlayer(videoUrl, player => {
        player.loop = true;
        // player.play(); // Auto-play preview?
    });

    const handlePublish = async () => {
        if (!sessionId) return;
        setPublishing(true);

        try {
            const { error } = await supabase
                .from('timelapse_sessions')
                .update({
                    description: description.trim(),
                    privacy_level: privacy,
                    // Optionally mark as 'published' if we had such a flag, 
                    // but presence of description/privacy usually implies intent.
                    // Depending on schema, we might want a 'published_at' timestamp.
                })
                .eq('id', sessionId);

            if (error) throw error;

            Alert.alert("Success", "Your timelapse has been published!", [
                { text: "OK", onPress: () => router.replace('/(tabs)/community') }
            ]);

        } catch (e) {
            console.error("Publish error:", e);
            Alert.alert("Error", "Failed to publish timelapse.");
            setPublishing(false);
        }
    };

    const PrivacyOption = ({ value, label, icon }: { value: string, label: string, icon: any }) => (
        <TouchableOpacity
            style={[
                styles.privacyOption,
                { borderColor: privacy === value ? colors.primary : colors.border, backgroundColor: privacy === value ? (colors.primary + '20') : 'transparent' }
            ]}
            onPress={() => setPrivacy(value as any)}
        >
            <Feather name={icon} size={20} color={privacy === value ? colors.primary : colors.textSecondary} />
            <Text style={[styles.privacyLabel, { color: privacy === value ? colors.primary : colors.textSecondary }]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Publish Timelapse</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Preview */}
                <View style={styles.previewContainer}>
                    {videoUrl ? (
                        <VideoView
                            style={styles.video}
                            player={player}
                            contentFit="contain"
                            nativeControls={false} // Clean look
                        />
                    ) : (
                        <View style={[styles.placeholder, { backgroundColor: colors.card }]}>
                            <Text style={{ color: colors.textSecondary }}>Loading Preview...</Text>
                        </View>
                    )}
                </View>

                {/* Caption */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.text }]}>Caption</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                        placeholder="Describe your focus session..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        numberOfLines={3}
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                {/* Privacy */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.text }]}>Who can see this?</Text>
                    <View style={styles.privacyRow}>
                        <PrivacyOption value="public" label="Public" icon="globe" />
                        <PrivacyOption value="friends" label="Friends" icon="users" />
                        <PrivacyOption value="private" label="Only Me" icon="lock" />
                    </View>
                </View>

            </ScrollView>

            <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.publishButton, { backgroundColor: colors.primary, opacity: publishing ? 0.7 : 1 }]}
                    onPress={handlePublish}
                    disabled={publishing}
                >
                    <Text style={styles.publishText}>{publishing ? "Publishing..." : "Share to Community"}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    previewContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: '#000',
    },
    video: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    input: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    privacyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    privacyOption: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    privacyLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
    },
    publishButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    publishText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
