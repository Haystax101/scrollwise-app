import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

interface BioEditModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (bio: string | null) => void;
    userId: string;
    currentBio: string | null;
}

export const BioEditModal: React.FC<BioEditModalProps> = ({
    visible,
    onClose,
    onSave,
    userId,
    currentBio,
}) => {
    const { colors } = useTheme();
    const [bio, setBio] = useState('');
    const [saving, setSaving] = useState(false);

    // Character limit
    const MAX_LENGTH = 300;

    useEffect(() => {
        if (visible) {
            setBio(currentBio || '');
        }
    }, [visible, currentBio]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const trimmedBio = bio.trim();
            const finalBio = trimmedBio || null;

            const { error } = await supabase
                .from('profiles')
                .update({ bio: finalBio })
                .eq('id', userId);

            if (error) {
                throw error;
            }

            console.log('Bio saved successfully');
            onSave(finalBio);
        } catch (error) {
            console.error('Error saving bio:', error);
            Alert.alert(
                'Error',
                'Failed to save your bio. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setSaving(false);
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 60,
            paddingHorizontal: 20,
            paddingBottom: 20,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        title: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
            flex: 1,
            textAlign: 'center',
            marginHorizontal: 40,
        },
        closeButton: {
            padding: 8,
        },
        saveButton: {
            padding: 8,
        },
        saveText: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.primary,
        },
        saveTextDisabled: {
            color: colors.textSecondary,
        },
        content: {
            flex: 1,
            paddingHorizontal: 20,
            paddingVertical: 20,
        },
        section: {
            marginBottom: 24,
        },
        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
        },
        characterCount: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        characterCountWarning: {
            color: colors.error || '#FF6B6B',
        },
        description: {
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
            marginBottom: 16,
        },
        input: {
            backgroundColor: colors.inputBackground || colors.surface || 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            padding: 16,
            fontSize: 16,
            color: colors.text,
            minHeight: 120,
            borderWidth: 1,
            borderColor: colors.border,
            textAlignVertical: 'top',
        },
        loadingOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
    });

    const characterCount = bio.length;
    const canSave = !saving;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Feather name="x" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Edit Bio</Text>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={!canSave}
                    >
                        <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>
                            Save
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>About you</Text>
                            <Text
                                style={[
                                    styles.characterCount,
                                    characterCount > MAX_LENGTH && styles.characterCountWarning,
                                ]}
                            >
                                {characterCount}/{MAX_LENGTH}
                            </Text>
                        </View>
                        <Text style={styles.description}>
                            Share a little about yourself, your interests, or what you're working on.
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Tell us about yourself..."
                            placeholderTextColor={colors.textSecondary}
                            value={bio}
                            onChangeText={setBio}
                            maxLength={MAX_LENGTH + 20}
                            multiline={true}
                        />
                    </View>
                </View>

                {saving && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                )}
            </View>
        </Modal>
    );
};
