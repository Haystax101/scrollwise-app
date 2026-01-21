import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { XMarkIcon, PhotoIcon } from 'react-native-heroicons/outline';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { BlurView } from 'expo-blur';
import { File as ExpoFile } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export default function CreateInsightScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams();

    const [title, setTitle] = useState((params.initialTitle as string) || '');
    const [content, setContent] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            // FIXED: Using string literal to avoid Enum availability issues at runtime
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string): Promise<string | null> => {
        try {
            // Compress and Resize Image
            const manipResult = await manipulateAsync(
                uri,
                [{ resize: { width: 1080 } }],
                { compress: 0.5, format: SaveFormat.JPEG }
            );

            // Read file using new File API
            const file = new ExpoFile(manipResult.uri);
            const arrayBuffer = await file.arrayBuffer();
            // No need to decode base64, we have the buffer directly
            const uploadBody = arrayBuffer;

            const filename = `insight-${Date.now()}.jpg`;
            const contentType = 'image/jpeg';

            const { error } = await supabase.storage
                .from('content-images')
                .upload(filename, uploadBody, {
                    contentType: contentType,
                    upsert: true
                });

            if (error) {
                console.error('Upload error:', error);
                return null;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('content-images')
                .getPublicUrl(filename);

            return publicUrl;
        } catch (e) {
            console.error('Image upload exception:', e);
            return null;
        }
    };

    const handleSubmit = async () => {
        if (!content.trim()) return;

        setIsSubmitting(true);
        let uploadedImageUrl = null;

        if (image) {
            uploadedImageUrl = await uploadImage(image);
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase.from('insights').insert({
                author_id: user.id,
                title: title.trim() || 'Untitled Insight',
                content: content.trim(),
                image_url: uploadedImageUrl,
                created_at: new Date().toISOString(),
                // Default stats
                likes_count: 0,
                saves_count: 0,
                comments_count: 0,
                flag: 0,
            });

            if (error) throw error;

            router.back();
        } catch (error) {
            console.error('Error creating insight:', error);
            alert('Failed to post insight. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <XMarkIcon size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>New Insight</Text>
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isSubmitting || !content.trim()}
                        style={[styles.postButton, { opacity: !content.trim() ? 0.5 : 1 }]}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Text style={[styles.postButtonText, { color: colors.primary }]}>Post</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.content}>
                        <TextInput
                            style={[styles.titleInput, { color: colors.text }]}
                            placeholder="Title (Optional)"
                            placeholderTextColor={colors.text + '50'}
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />

                        <TextInput
                            style={[styles.bodyInput, { color: colors.text }]}
                            placeholder="Share your knowledge..."
                            placeholderTextColor={colors.text + '50'}
                            value={content}
                            onChangeText={setContent}
                            multiline
                            textAlignVertical="top"
                        />

                        {image && (
                            <View style={styles.imagePreviewContainer}>
                                <Image source={{ uri: image }} style={styles.imagePreview} />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => setImage(null)}
                                >
                                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                                    <XMarkIcon size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>

                    <View style={[styles.toolbar, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
                        <TouchableOpacity onPress={pickImage} style={styles.toolbarButton}>
                            <PhotoIcon size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
    },
    closeButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Montserrat_600SemiBold',
    },
    postButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    postButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    titleInput: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Oswald_700Bold',
        marginBottom: 16,
    },
    bodyInput: {
        fontSize: 16,
        fontFamily: 'Montserrat_400Regular',
        lineHeight: 24,
        minHeight: 150,
    },
    imagePreviewContainer: {
        marginTop: 20,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        backgroundColor: '#f0f0f0',
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    toolbar: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 0.5,
        justifyContent: 'flex-start',
        gap: 16,
    },
    toolbarButton: {
        padding: 8,
    },
});
