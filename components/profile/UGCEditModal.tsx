import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, Image, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

interface UGCEditModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: () => void; // Callback to refresh grid
    item: any;
}

export const UGCEditModal: React.FC<UGCEditModalProps> = ({
    visible,
    onClose,
    onSave,
    item
}) => {
    const { colors, isDark } = useTheme();
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (item) {
            setContent(item.content || '');
        }
    }, [item]);

    const handleSave = async () => {
        if (!item) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('insights')
                .update({ content })
                .eq('id', item.id);

            if (error) throw error;

            onSave();
            onClose();
        } catch (e) {
            console.error('Error updating insight:', e);
            Alert.alert('Error', 'Failed to update insight.');
        } finally {
            setSaving(false);
        }
    };

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            padding: 20,
        },
        container: {
            backgroundColor: colors.card,
            borderRadius: 20,
            overflow: 'hidden',
            maxHeight: '80%',
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
        },
        title: {
            fontSize: 17,
            fontWeight: '600',
            color: colors.text,
        },
        body: {
            padding: 20,
        },
        imagePreview: {
            width: '100%',
            height: 200,
            borderRadius: 12,
            marginBottom: 20,
            backgroundColor: colors.background,
        },
        input: {
            fontSize: 16,
            color: colors.text,
            minHeight: 100,
            textAlignVertical: 'top',
        },
        footer: {
            flexDirection: 'row',
            padding: 16,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
        },
        button: {
            flex: 1,
            padding: 14,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
        },
        cancelButton: {
            marginRight: 8,
            backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
        },
        saveButton: {
            marginLeft: 8,
            backgroundColor: colors.primary,
        },
        cancelText: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
        },
        saveText: {
            fontSize: 16,
            fontWeight: '600',
            color: '#FFFFFF',
        },
    });

    if (!item) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Edit Insight</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Feather name="x" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.body}>
                        {item.image_url && (
                            <Image source={{ uri: item.image_url }} style={styles.imagePreview} resizeMode="cover" />
                        )}

                        <TextInput
                            style={styles.input}
                            multiline
                            placeholder="Write something..."
                            placeholderTextColor={colors.textSecondary}
                            value={content}
                            onChangeText={setContent}
                            autoFocus
                        />
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                            disabled={saving}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.saveButton]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.saveText}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};
