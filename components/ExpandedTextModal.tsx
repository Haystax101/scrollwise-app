import React from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ExpandedTextModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  content: string | React.ReactNode;
  externalLink?: string;
  contentType: 'article' | 'paper' | 'book' | 'insight';
  onScrollDepthChange?: (depthPercentage: number) => void;
}

export const ExpandedTextModal: React.FC<ExpandedTextModalProps> = ({ visible, onClose, title, content, externalLink, contentType, onScrollDepthChange }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleReadFull = () => {
    if (externalLink) {
      Linking.openURL(externalLink);
    }
  };

  const handleScroll = (event: any) => {
    if (!onScrollDepthChange) return;

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollDepth = contentOffset.y + layoutMeasurement.height;
    const totalHeight = contentSize.height;

    if (totalHeight > 0) {
      const percentage = Math.round((scrollDepth / totalHeight) * 100);
      // Ensure we don't send > 100 due to overscroll or bounce
      onScrollDepthChange(Math.min(percentage, 100));
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={100} // Fire every 100ms
        >
          {typeof content === 'string' ? (
            <Text style={[styles.contentText, { color: colors.text }]}>{content}</Text>
          ) : (
            content
          )}
        </ScrollView>
        {externalLink && (
          <View style={styles.footer}>
            <TouchableOpacity style={[styles.readFullButton, {
              backgroundColor: 'transparent',
              borderColor: colors.primary,
              borderWidth: 1
            }]} onPress={handleReadFull}>
              <Text style={[styles.readFullButtonText, { color: colors.primary }]}>
                Read full {contentType}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
  },
  contentText: {
    fontSize: 18,
    lineHeight: 28,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  readFullButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readFullButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 