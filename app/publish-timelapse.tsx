import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { Feather } from '@expo/vector-icons';

export default function PublishTimelapseScreen() {
    const params = useLocalSearchParams();
    const sessionId = params.sessionId as string;
    const router = useRouter();
    const { colors } = useTheme();

    const [description, setDescription] = useState('');
    const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
    const [publishing, setPublishing] = useState(false);


    // Preview disabled
    // const player = useVideoPlayer(videoUrl, player => {
    //     player.loop = true;
    // });

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
                {
                    text: "OK",
                    onPress: () => router.replace({
                        pathname: '/(tabs)/',
                        params: { contentType: 'timelapse', refresh: 'true' }
                    })
                }
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
