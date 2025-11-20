import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ReportModal } from './ReportModal';

interface ReportButtonProps {
  contentType: 'insight' | 'comment' | 'profile';
  contentId: string;
  authorId: string;
  authorName?: string;
  size?: number;
  color?: string;
  onReportSubmitted?: () => void;
}

export const ReportButton: React.FC<ReportButtonProps> = ({
  contentType,
  contentId,
  authorId,
  authorName,
  size = 20,
  color,
  onReportSubmitted,
}) => {
  const { colors } = useTheme();
  const [showReportModal, setShowReportModal] = useState(false);

  const handlePress = () => {
    setShowReportModal(true);
  };

  const handleReportSubmitted = () => {
    onReportSubmitted?.();
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Report content"
        accessibilityRole="button"
      >
        <Feather
          name="flag"
          size={size}
          color={color || colors.textTertiary}
        />
      </TouchableOpacity>

      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType={contentType}
        contentId={contentId}
        reportedUserId={authorId}
        reportedUserName={authorName}
        onReportSubmitted={handleReportSubmitted}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
});

export default ReportButton;
