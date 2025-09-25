import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SearchResult } from '../../lib/smartSearchService';
import { ArticleCard } from '../ArticleCard';
import { PaperCard } from '../PaperCard';
import { BookCard } from '../BookCard';

interface VaultContentViewerProps {
  content: SearchResult | null;
  onClose: () => void;
}

export const VaultContentViewer: React.FC<VaultContentViewerProps> = ({ content, onClose }) => {
  const { colors } = useTheme();

  if (!content) return null;

  const renderContentCard = () => {
    switch (content.type) {
      case 'article':
        return (
          <ArticleCard
            article={content as any}
            isActive={true}
            showBackButton={false}
            backTo={null}
          />
        );
      case 'paper':
        return (
          <PaperCard
            paper={content as any}
            isActive={true}
            showBackButton={false}
            backTo={null}
          />
        );
      case 'book':
        return (
          <BookCard
            book={content as any}
            isActive={true}
            showBackButton={false}
            backTo={null}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Content takes full screen */}
      <View style={styles.content}>
        {renderContentCard()}
      </View>

      {/* Overlay back button */}
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: colors.background + 'E6' }]}
        onPress={onClose}
      >
        <Feather name="arrow-left" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 60, // Account for status bar
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});