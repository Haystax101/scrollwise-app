import { Modal, View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface UGCOptionsModalProps {
    visible: boolean;
    onClose: () => void;
    onEdit?: () => void;
    onDelete: () => void;
    onView: () => void;
    itemType: 'image' | 'text' | 'timelapse' | 'article' | 'paper' | 'book';
}

export const UGCOptionsModal: React.FC<UGCOptionsModalProps> = ({
    visible,
    onClose,
    onEdit,
    onDelete,
    onView,
    itemType
}) => {
    const { colors, isDark } = useTheme();

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        modalContainer: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            overflow: 'hidden',
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
        },
        header: {
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#2C2C2E' : '#F2F2F7',
        },
        dragIndicator: {
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: isDark ? '#3A3A3C' : '#C7C7CC',
            marginBottom: 8,
        },
        title: {
            fontSize: 13,
            fontWeight: '600',
            color: isDark ? '#8E8E93' : '#8E8E93',
        },
        option: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: isDark ? '#2C2C2E' : '#E5E5EA',
        },
        optionText: {
            fontSize: 17,
            marginLeft: 12,
            color: colors.text,
        },
        destructiveText: {
            color: '#FF3B30',
        },
        cancelButton: {
            padding: 16,
            alignItems: 'center',
            backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
        },
        cancelText: {
            fontSize: 17,
            fontWeight: '600',
            color: colors.text,
        },
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContainer}>
                            <View style={styles.header}>
                                <View style={styles.dragIndicator} />
                                <Text style={styles.title}>
                                    {itemType.charAt(0).toUpperCase() + itemType.slice(1)} Options
                                </Text>
                            </View>

                            <TouchableOpacity style={styles.option} onPress={onView}>
                                <Feather name="arrow-right-circle" size={20} color={colors.text} />
                                <Text style={styles.optionText}>Go to Post</Text>
                            </TouchableOpacity>

                            {onEdit && (
                                <TouchableOpacity style={styles.option} onPress={onEdit}>
                                    <Feather name="edit-2" size={20} color={colors.text} />
                                    <Text style={styles.optionText}>Edit</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.option} onPress={onDelete}>
                                <Feather name="trash-2" size={20} color="#FF3B30" />
                                <Text style={[styles.optionText, styles.destructiveText]}>Delete</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback >
        </Modal >
    );
};
