import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface InsightOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUnsave: () => void;
  isOwner: boolean;
}

export const InsightOptionsModal: React.FC<InsightOptionsModalProps> = ({
  visible,
  onClose,
  onEdit,
  onDelete,
  onUnsave,
  isOwner
}) => {
  const { colors } = useTheme();

  const handleDelete = () => {
    Alert.alert(
      'Delete Insight',
      'Are you sure you want to delete this insight? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: onDelete
        }
      ]
    );
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 16,
      margin: 20,
      width: '80%',
      maxWidth: 300,
    },
    modalHeader: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
    },
    optionsContainer: {
      paddingVertical: 8,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    optionIcon: {
      marginRight: 12,
      width: 20,
      alignItems: 'center',
    },
    optionText: {
      fontSize: 16,
      color: colors.text,
    },
    deleteOption: {
      color: colors.error,
    },
    cancelButton: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 20,
      paddingVertical: 16,
      alignItems: 'center',
    },
    cancelText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '500',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose}>
        <TouchableOpacity 
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Insight Options</Text>
          </View>

          <View style={styles.optionsContainer}>
            {isOwner && (
              <>
                <TouchableOpacity style={styles.option} onPress={onEdit}>
                  <View style={styles.optionIcon}>
                    <Feather name="edit-2" size={20} color={colors.text} />
                  </View>
                  <Text style={styles.optionText}>Edit Insight</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option} onPress={handleDelete}>
                  <View style={styles.optionIcon}>
                    <Feather name="trash-2" size={20} color={colors.error} />
                  </View>
                  <Text style={[styles.optionText, styles.deleteOption]}>Delete Insight</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.option} onPress={onUnsave}>
              <View style={styles.optionIcon}>
                <Feather name="bookmark" size={20} color={colors.text} />
              </View>
              <Text style={styles.optionText}>Unsave Insight</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};