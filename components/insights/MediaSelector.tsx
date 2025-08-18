import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useInsightsTheme } from '../../lib/insightsTheme';

interface MediaType {
  type: 'photo' | 'reel';
  source: string;
}

interface Props {
  selectedMedia: MediaType | null;
  setSelectedMedia: (media: MediaType | null) => void;
}

export const MediaSelector: React.FC<Props> = ({
  selectedMedia,
  setSelectedMedia,
}) => {
  const { colors, spacing, borderRadius } = useInsightsTheme();
  const [activeTab, setActiveTab] = useState<'photo' | 'reel'>('photo');

  // Mock photos - in production these would come from the user's gallery or cloud storage
  const mockPhotos = [
    'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  ];

  const mockReels = [
    {
      id: 1,
      thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      title: 'Industry Trends 2023',
    },
    {
      id: 2,
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      title: 'Tech Innovations',
    },
  ];

  const handleSelectPhoto = (url: string) => {
    setSelectedMedia({ type: 'photo', source: url });
  };

  const handleSelectReel = (reel: typeof mockReels[0]) => {
    setSelectedMedia({ type: 'reel', source: reel.thumbnail });
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.insightsCard,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.insightsBorder,
      overflow: 'hidden',
    },
    selectedContainer: {
      backgroundColor: colors.insightsCard,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.insightsBorder,
      overflow: 'hidden',
    },
    selectedImageContainer: {
      position: 'relative',
    },
    selectedImage: {
      width: '100%',
      height: 192,
      resizeMode: 'cover',
    },
    removeButton: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: borderRadius.full,
      padding: spacing.xs,
    },
    selectedLabel: {
      padding: spacing.sm,
      fontSize: 12,
      color: colors.insightsTextSecondary,
    },
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.insightsBorder,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.sm,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
    },
    activeTab: {
      backgroundColor: colors.gray[800],
    },
    tabText: {
      color: colors.insightsTextPrimary,
      fontSize: 14,
    },
    content: {
      padding: spacing.md,
      maxHeight: 200,
    },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    photoItem: {
      width: '48%',
      aspectRatio: 1,
    },
    photoImage: {
      width: '100%',
      height: '100%',
      borderRadius: borderRadius.sm,
    },
    addPhotoButton: {
      width: '48%',
      aspectRatio: 1,
      backgroundColor: colors.gray[800],
      borderRadius: borderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    reelsList: {
      gap: spacing.sm,
    },
    reelItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm,
      backgroundColor: colors.gray[800],
      borderRadius: borderRadius.sm,
    },
    reelThumbnail: {
      width: 64,
      height: 64,
      borderRadius: borderRadius.sm,
    },
    reelInfo: {
      flex: 1,
    },
    reelTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.insightsTextPrimary,
    },
    reelSubtitle: {
      fontSize: 12,
      color: colors.insightsTextSecondary,
    },
  });

  if (selectedMedia) {
    return (
      <View style={styles.selectedContainer}>
        <View style={styles.selectedImageContainer}>
          <Image source={{ uri: selectedMedia.source }} style={styles.selectedImage} />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => setSelectedMedia(null)}
          >
            <Feather name="x" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.selectedLabel}>
          {selectedMedia.type === 'reel' ? 'Selected Reel' : 'Selected Photo'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'photo' && styles.activeTab]}
          onPress={() => setActiveTab('photo')}
        >
          <Feather name="image" size={16} color={colors.insightsTextPrimary} />
          <Text style={styles.tabText}>Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reel' && styles.activeTab]}
          onPress={() => setActiveTab('reel')}
        >
          <Feather name="film" size={16} color={colors.insightsTextPrimary} />
          <Text style={styles.tabText}>Saved Reels</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'photo' ? (
          <View style={styles.photoGrid}>
            {mockPhotos.map((photo, index) => (
              <TouchableOpacity
                key={index}
                style={styles.photoItem}
                onPress={() => handleSelectPhoto(photo)}
              >
                <Image source={{ uri: photo }} style={styles.photoImage} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addPhotoButton}>
              <Feather name="image" size={32} color={colors.insightsTextSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.reelsList}>
            {mockReels.map((reel) => (
              <TouchableOpacity
                key={reel.id}
                style={styles.reelItem}
                onPress={() => handleSelectReel(reel)}
              >
                <Image source={{ uri: reel.thumbnail }} style={styles.reelThumbnail} />
                <View style={styles.reelInfo}>
                  <Text style={styles.reelTitle}>{reel.title}</Text>
                  <Text style={styles.reelSubtitle}>Saved Reel</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};