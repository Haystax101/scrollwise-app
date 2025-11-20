import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  contentType: 'insight' | 'comment' | 'profile';
  contentId: string;
  reportedUserId: string;
  reportedUserName?: string;
  onReportSubmitted?: () => void;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: 'spam', label: 'Spam', description: 'Promotional or irrelevant content' },
  { value: 'harassment', label: 'Harassment', description: 'Bullying or threatening behavior' },
  { value: 'inappropriate', label: 'Inappropriate', description: 'Offensive or explicit content' },
  { value: 'misinformation', label: 'Misinformation', description: 'False or misleading information' },
  { value: 'other', label: 'Other', description: 'Other reason not listed above' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  contentType,
  contentId,
  reportedUserId,
  reportedUserName,
  onReportSubmitted,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Select Reason', 'Please select a reason for your report.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('report_user_content', {
        p_reported_user_id: reportedUserId,
        p_content_type: contentType,
        p_content_id: contentId,
        p_reason: selectedReason,
        p_details: details || null,
        p_also_block: alsoBlock,
      });

      if (error) {
        console.error('Error submitting report:', error);
        Alert.alert('Error', 'Failed to submit report. Please try again.');
        return;
      }

      if (data?.success) {
        const message = alsoBlock
          ? 'Thank you for your report. This user has been blocked and you will no longer see their content.'
          : 'Thank you for your report. We will review it shortly.';

        Alert.alert('Report Submitted', message);
        onReportSubmitted?.();
        handleClose();
      } else {
        Alert.alert('Error', data?.error || 'Failed to submit report.');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDetails('');
    setAlsoBlock(false);
    onClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: insets.bottom + 16,
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    reasonOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
    },
    reasonOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOuterSelected: {
      borderColor: colors.primary,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    reasonContent: {
      flex: 1,
    },
    reasonLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
    },
    reasonDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    detailsInput: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 15,
      color: colors.text,
      minHeight: 80,
      textAlignVertical: 'top',
      marginTop: 16,
    },
    blockOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      backgroundColor: colors.card,
      marginTop: 16,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.border,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    blockText: {
      flex: 1,
    },
    blockLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
    },
    blockDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    submitButton: {
      backgroundColor: '#dc2626',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 24,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      padding: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontSize: 15,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Report {contentType === 'profile' ? 'User' : 'Content'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Feather name="x" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Why are you reporting this?</Text>

            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                style={[
                  styles.reasonOption,
                  selectedReason === reason.value && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedReason(reason.value)}
              >
                <View
                  style={[
                    styles.radioOuter,
                    selectedReason === reason.value && styles.radioOuterSelected,
                  ]}
                >
                  {selectedReason === reason.value && <View style={styles.radioInner} />}
                </View>
                <View style={styles.reasonContent}>
                  <Text style={styles.reasonLabel}>{reason.label}</Text>
                  <Text style={styles.reasonDescription}>{reason.description}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <TextInput
              style={styles.detailsInput}
              placeholder="Additional details (optional)"
              placeholderTextColor={colors.textTertiary}
              value={details}
              onChangeText={setDetails}
              multiline
              maxLength={500}
            />

            <TouchableOpacity
              style={styles.blockOption}
              onPress={() => setAlsoBlock(!alsoBlock)}
            >
              <View style={[styles.checkbox, alsoBlock && styles.checkboxChecked]}>
                {alsoBlock && <Feather name="check" size={14} color="#fff" />}
              </View>
              <View style={styles.blockText}>
                <Text style={styles.blockLabel}>
                  Also block {reportedUserName || 'this user'}
                </Text>
                <Text style={styles.blockDescription}>
                  You won't see their content in your feed
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedReason || isSubmitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedReason || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Report</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ReportModal;
