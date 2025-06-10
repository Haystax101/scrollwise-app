import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Video } from '../types';


const { height: windowHeight } = Dimensions.get('window');
// Height of the bottom navbar (Header) in px, must match styles.navRow height in Header.tsx
const NAVBAR_HEIGHT = 84;
const screenHeight = windowHeight - NAVBAR_HEIGHT;

interface VideoCardProps {
  video: Video;
  isActive: boolean; // Can be used for optimizations or specific active state visuals
}

export const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const getTypeIcon = () => {
    const iconProps = { size: 16, color: "white", style: { marginRight: 4 } };
    switch (video.type) {
      case 'research':
        return <MaterialCommunityIcons name="microscope" {...iconProps} />;
      case 'book':
        return <Feather name="book-open" {...iconProps} />;
      case 'news':
        return <MaterialCommunityIcons name="newspaper" {...iconProps} />;
      default:
        return null;
    }
  };

  return (
    <View style={[{ height: screenHeight }, styles.root]}>
      <ImageBackground
        source={{ uri: video.thumbnail }}
        style={styles.bgImage}
        resizeMode="cover"
        accessibilityLabel={`Background image for ${video.title}`}
      >
        <View style={styles.gradientOverlay} />
      </ImageBackground>

      <View style={styles.contentContainer}>
        {/* Top Bar */}
        <View style={styles.topBarRow}>
          <View style={styles.topBarPill}>
            <Text style={styles.topBarPillText}>For You</Text>
          </View>
          <View style={styles.topBarPill}>
            {getTypeIcon()}
            <Text style={styles.topBarPillText}>{video.type.charAt(0).toUpperCase() + video.type.slice(1)}</Text>
          </View>
        </View>

        {/* Bottom Content */}
        <View style={styles.bottomContent}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{video.title}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaSource}>{video.source}</Text>
              <View style={styles.metaDot} />
              <View style={styles.industryPill}>
                <Text style={styles.industryPillText}>{video.industry}</Text>
              </View>
            </View>
          </View>

          {/* Progress Bar - Placeholder */}
          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>

          <View style={styles.actionRow}>
            <View style={styles.actionBtnGroup}>
              <TouchableOpacity style={styles.actionBtn} accessibilityLabel={`Like video, ${video.likes} likes`} accessibilityRole="button">
                <View style={styles.actionBtnIconCircle}>
                  <Feather name="heart" size={22} color="white" />
                </View>
                <Text style={styles.actionBtnCount}>{video.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} accessibilityLabel={`Save video, ${video.saves} saves`} accessibilityRole="button">
                <View style={styles.actionBtnIconCircle}>
                  <Feather name="bookmark" size={22} color="white" />
                </View>
                <Text style={styles.actionBtnCount}>{video.saves}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} accessibilityLabel={`Comment on video, ${video.comments} comments`} accessibilityRole="button">
                <View style={styles.actionBtnIconCircle}>
                  <Feather name="message-circle" size={22} color="white" />
                </View>
                <Text style={styles.actionBtnCount}>{video.comments}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.readMoreBtn} accessibilityLabel="Read more about this video" accessibilityRole="button">
              <Text style={styles.readMoreBtnText}>Read More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#000',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 16,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
  },
  topBarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  topBarPillText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  bottomContent: {
    paddingBottom: 25,
  },
  titleBlock: {
    marginBottom: 8,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaSource: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  metaDot: {
    height: 4,
    width: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
    marginHorizontal: 8,
  },
  industryPill: {
    backgroundColor: 'rgba(59,130,246,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  industryPillText: {
    color: '#fff',
    fontSize: 14,
  },
  progressBarBg: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 999,
    height: 4,
    marginBottom: 16,
  },
  progressBarFill: {
    backgroundColor: '#fff',
    height: 4,
    borderRadius: 999,
    width: '75%',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBtnGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    alignItems: 'center',
    marginRight: 16,
  },
  actionBtnIconCircle: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 10,
    borderRadius: 999,
  },
  actionBtnCount: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  readMoreBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  readMoreBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});
