# React Native Insights Publishing Flow - Implementation Guide

This guide provides a complete implementation for recreating the insights publishing flow in React Native Expo. The original React app consists of a multi-step wizard for creating and publishing industry insights with optional supercharging features.

## Overview

The insights flow consists of 6 main steps:
1. **Insight Input** - Text area with optional media attachment
2. **Publish Options** - Choice to supercharge or publish normally
3. **Loading** - Animated publishing progress
4. **Success** - Confirmation screen
5. **Voltz Selection** - Choose how many voltz to spend for supercharging
6. **Post Preview** - Preview the final post before publishing

## Dependencies

First, install the required dependencies:

```bash
npm install react-native-vector-icons
npx expo install expo-image-picker expo-av
```

For icons, we'll use `react-native-vector-icons` or `@expo/vector-icons` (which comes with Expo):

```bash
npm install @expo/vector-icons
```

## Core Theme & Colors

```typescript
// theme.ts
export const theme = {
  colors: {
    black: '#000000',
    white: '#FFFFFF',
    gray: {
      900: '#1F2937',
      800: '#374151',
      700: '#4B5563',
      400: '#9CA3AF',
      300: '#D1D5DB',
    },
    yellow: {
      400: '#FBBF24',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
};
```

## 1. Main Container Component

```tsx
// InsightsPublisher.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { InsightInput } from './components/InsightInput';
import { PublishOptions } from './components/PublishOptions';
import { LoadingScreen } from './components/LoadingScreen';
import { SuccessScreen } from './components/SuccessScreen';
import { VoltzSelector } from './components/VoltzSelector';
import { PostPreview } from './components/PostPreview';
import { theme } from './theme';

const { width } = Dimensions.get('window');

interface MediaType {
  type: 'photo' | 'reel';
  source: string;
}

export const InsightsPublisher: React.FC = () => {
  const [step, setStep] = useState(1);
  const [insightText, setInsightText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaType | null>(null);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [supercharged, setSupercharged] = useState(false);
  const [voltz, setVoltz] = useState(10);
  const [totalVoltz] = useState(100);

  const handlePublish = () => {
    setStep(3);
    setTimeout(() => {
      setStep(4);
    }, 3000);
  };

  const resetFlow = () => {
    setStep(1);
    setInsightText('');
    setSelectedMedia(null);
    setShowMediaSelector(false);
    setSupercharged(false);
    setVoltz(10);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <InsightInput
            insightText={insightText}
            setInsightText={setInsightText}
            selectedMedia={selectedMedia}
            setSelectedMedia={setSelectedMedia}
            showMediaSelector={showMediaSelector}
            setShowMediaSelector={setShowMediaSelector}
            onNext={() => setStep(6)}
          />
        );
      case 2:
        return (
          <PublishOptions
            onBack={() => setStep(6)}
            onSupercharge={() => {
              setSupercharged(true);
              setStep(5);
            }}
            onPublishNormal={() => {
              setSupercharged(false);
              handlePublish();
            }}
          />
        );
      case 3:
        return <LoadingScreen supercharged={supercharged} />;
      case 4:
        return <SuccessScreen supercharged={supercharged} onDone={resetFlow} />;
      case 5:
        return (
          <VoltzSelector
            voltz={voltz}
            setVoltz={setVoltz}
            totalVoltz={totalVoltz}
            onBack={() => setStep(2)}
            onContinue={handlePublish}
            insightText={insightText}
            selectedMedia={selectedMedia}
          />
        );
      case 6:
        return (
          <PostPreview
            insightText={insightText}
            selectedMedia={selectedMedia}
            onBack={() => setStep(1)}
            onContinue={() => setStep(2)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.black} />
      <View style={styles.content}>
        {renderStep()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  content: {
    flex: 1,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
});
```

## 2. Insight Input Component

```tsx
// components/InsightInput.tsx
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Zap, Image as ImageIcon } from 'lucide-react-native';
import { MediaSelector } from './MediaSelector';
import { theme } from '../theme';

interface Props {
  insightText: string;
  setInsightText: (text: string) => void;
  selectedMedia: any;
  setSelectedMedia: (media: any) => void;
  showMediaSelector: boolean;
  setShowMediaSelector: (show: boolean) => void;
  onNext: () => void;
}

export const InsightInput: React.FC<Props> = ({
  insightText,
  setInsightText,
  selectedMedia,
  setSelectedMedia,
  showMediaSelector,
  setShowMediaSelector,
  onNext,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Publish Insight</Text>
        <View style={styles.zapContainer}>
          <Zap size={24} color={theme.colors.black} />
        </View>
      </View>

      {/* Text Input */}
      <TextInput
        style={styles.textInput}
        placeholder="Share your industry insight..."
        placeholderTextColor={theme.colors.gray[400]}
        value={insightText}
        onChangeText={setInsightText}
        multiline
        textAlignVertical="top"
      />

      {/* Media Selector Toggle */}
      {!showMediaSelector ? (
        <TouchableOpacity
          style={styles.mediaToggle}
          onPress={() => setShowMediaSelector(true)}
        >
          <ImageIcon size={20} color={theme.colors.gray[400]} />
          <Text style={styles.mediaToggleText}>Add media to your insight</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.mediaSelectorContainer}>
          <View style={styles.mediaSelectorHeader}>
            <Text style={styles.mediaSelectorTitle}>Media</Text>
            <TouchableOpacity onPress={() => setShowMediaSelector(false)}>
              <Text style={styles.hideButton}>Hide</Text>
            </TouchableOpacity>
          </View>
          <MediaSelector
            selectedMedia={selectedMedia}
            setSelectedMedia={setSelectedMedia}
          />
        </View>
      )}

      {/* Next Button */}
      <TouchableOpacity
        style={[
          styles.nextButton,
          insightText ? styles.nextButtonActive : styles.nextButtonInactive,
        ]}
        disabled={!insightText}
        onPress={onNext}
      >
        <Text
          style={[
            styles.nextButtonText,
            insightText ? styles.nextButtonTextActive : styles.nextButtonTextInactive,
          ]}
        >
          Next
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  zapContainer: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.yellow[400],
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    backgroundColor: theme.colors.gray[900],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    height: 192,
    fontSize: 18,
    color: theme.colors.white,
  },
  mediaToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  mediaToggleText: {
    color: theme.colors.gray[400],
    fontSize: 16,
  },
  mediaSelectorContainer: {
    gap: theme.spacing.sm,
  },
  mediaSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mediaSelectorTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.white,
  },
  hideButton: {
    fontSize: 12,
    color: theme.colors.gray[400],
  },
  nextButton: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonActive: {
    backgroundColor: theme.colors.yellow[400],
  },
  nextButtonInactive: {
    backgroundColor: theme.colors.gray[700],
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButtonTextActive: {
    color: theme.colors.black,
  },
  nextButtonTextInactive: {
    color: theme.colors.gray[400],
  },
});
```

## 3. Media Selector Component

```tsx
// components/MediaSelector.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import { Image as ImageIcon, Film, X } from 'lucide-react-native';
import { theme } from '../theme';

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
  const [activeTab, setActiveTab] = useState<'photo' | 'reel'>('photo');

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

  if (selectedMedia) {
    return (
      <View style={styles.selectedContainer}>
        <View style={styles.selectedImageContainer}>
          <Image source={{ uri: selectedMedia.source }} style={styles.selectedImage} />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => setSelectedMedia(null)}
          >
            <X size={20} color={theme.colors.white} />
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
          <ImageIcon size={16} color={theme.colors.white} />
          <Text style={styles.tabText}>Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reel' && styles.activeTab]}
          onPress={() => setActiveTab('reel')}
        >
          <Film size={16} color={theme.colors.white} />
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
              <ImageIcon size={32} color={theme.colors.gray[400]} />
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.gray[900],
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  selectedContainer: {
    backgroundColor: theme.colors.gray[900],
    borderRadius: theme.borderRadius.lg,
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
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.xs,
  },
  selectedLabel: {
    padding: theme.spacing.sm,
    fontSize: 12,
    color: theme.colors.gray[400],
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[800],
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  activeTab: {
    backgroundColor: theme.colors.gray[800],
  },
  tabText: {
    color: theme.colors.white,
    fontSize: 14,
  },
  content: {
    padding: theme.spacing.md,
    maxHeight: 200,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  photoItem: {
    width: '48%',
    aspectRatio: 1,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  addPhotoButton: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: theme.colors.gray[800],
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelsList: {
    gap: theme.spacing.sm,
  },
  reelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.gray[800],
    borderRadius: theme.borderRadius.sm,
  },
  reelThumbnail: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.sm,
  },
  reelInfo: {
    flex: 1,
  },
  reelTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.white,
  },
  reelSubtitle: {
    fontSize: 12,
    color: theme.colors.gray[400],
  },
});
```

## 4. Post Preview Component

```tsx
// components/PostPreview.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { ArrowLeft, User, Zap, Heart, MessageSquare, Repeat } from 'lucide-react-native';
import { theme } from '../theme';

interface Props {
  insightText: string;
  selectedMedia: any;
  onBack: () => void;
  onContinue: () => void;
}

export const PostPreview: React.FC<Props> = ({
  insightText,
  selectedMedia,
  onBack,
  onContinue,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={20} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Preview Your Post</Text>
      </View>

      {/* Preview Container */}
      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>Post Preview</Text>
        <View style={styles.postCard}>
          {/* Post Header */}
          <View style={styles.postHeader}>
            <View style={styles.avatar}>
              <User size={20} color={theme.colors.gray[400]} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Your Name</Text>
              <Text style={styles.userTitle}>Your Title • Just now</Text>
            </View>
            <View style={styles.zapBadge}>
              <Zap size={16} color={theme.colors.black} />
            </View>
          </View>

          {/* Post Content */}
          <View style={styles.postContent}>
            <Text style={styles.postText}>
              {insightText || 'Your insight text will appear here'}
            </Text>
            {selectedMedia && (
              <Image source={{ uri: selectedMedia.source }} style={styles.postImage} />
            )}
          </View>

          {/* Post Actions */}
          <View style={styles.postActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Heart size={20} color={theme.colors.gray[400]} />
              <Text style={styles.actionCount}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MessageSquare size={20} color={theme.colors.gray[400]} />
              <Text style={styles.actionCount}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Repeat size={20} color={theme.colors.gray[400]} />
              <Text style={styles.actionCount}>0</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Continue Button */}
      <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  previewContainer: {
    backgroundColor: theme.colors.gray[900],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.gray[400],
    marginBottom: theme.spacing.sm,
  },
  postCard: {
    borderWidth: 1,
    borderColor: theme.colors.gray[800],
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[800],
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.gray[700],
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.white,
  },
  userTitle: {
    fontSize: 12,
    color: theme.colors.gray[400],
  },
  zapBadge: {
    width: 24,
    height: 24,
    backgroundColor: theme.colors.yellow[400],
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postContent: {
    padding: theme.spacing.sm,
  },
  postText: {
    fontSize: 16,
    color: theme.colors.white,
    lineHeight: 24,
    marginBottom: theme.spacing.sm,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.lg,
    resizeMode: 'cover',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[800],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actionCount: {
    fontSize: 12,
    color: theme.colors.gray[400],
  },
  continueButton: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.yellow[400],
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.black,
  },
});
```

## 5. Publish Options Component

```tsx
// components/PublishOptions.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, Zap } from 'lucide-react-native';
import { theme } from '../theme';

interface Props {
  onBack: () => void;
  onSupercharge: () => void;
  onPublishNormal: () => void;
}

export const PublishOptions: React.FC<Props> = ({
  onBack,
  onSupercharge,
  onPublishNormal,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={20} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Publish Options</Text>
      </View>

      {/* Supercharge Card */}
      <View style={styles.superchargeCard}>
        <View style={styles.superchargeHeader}>
          <View style={styles.zapContainer}>
            <Zap size={24} color={theme.colors.black} />
          </View>
          <View style={styles.superchargeContent}>
            <Text style={styles.superchargeTitle}>Supercharge Your Insight</Text>
            <Text style={styles.superchargeDescription}>
              Boost your insight's visibility with voltz to reach more industry
              professionals and gain more engagement.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.superchargeButton} onPress={onSupercharge}>
          <Text style={styles.superchargeButtonText}>Supercharge This Insight</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.normalButton} onPress={onPublishNormal}>
          <Text style={styles.normalButtonText}>Publish Without Supercharging</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  superchargeCard: {
    backgroundColor: theme.colors.gray[900],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  superchargeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  zapContainer: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.yellow[400],
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  superchargeContent: {
    flex: 1,
  },
  superchargeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  superchargeDescription: {
    fontSize: 16,
    color: theme.colors.gray[300],
    lineHeight: 24,
  },
  superchargeButton: {
    width: '100%',
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.yellow[400],
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  superchargeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.black,
  },
  normalButton: {
    width: '100%',
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.gray[800],
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  normalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.white,
  },
});
```

## 6. Voltz Selector Component

```tsx
// components/VoltzSelector.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { ArrowLeft, Zap, Plus, Minus, ChevronRight } from 'lucide-react-native';
import { theme } from '../theme';

interface Props {
  voltz: number;
  setVoltz: (voltz: number) => void;
  totalVoltz: number;
  onBack: () => void;
  onContinue: () => void;
  insightText: string;
  selectedMedia: any;
}

export const VoltzSelector: React.FC<Props> = ({
  voltz,
  setVoltz,
  totalVoltz,
  onBack,
  onContinue,
}) => {
  const [reach, setReach] = useState(0);
  const incrementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const decrementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(voltz)).current;

  useEffect(() => {
    setReach(voltz * 50);
    Animated.timing(progressAnim, {
      toValue: voltz,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [voltz, progressAnim]);

  const startIncrement = () => {
    if (incrementIntervalRef.current) return;
    incrementVoltz();
    incrementIntervalRef.current = setInterval(() => {
      incrementVoltz();
    }, 150);
  };

  const stopIncrement = () => {
    if (incrementIntervalRef.current) {
      clearInterval(incrementIntervalRef.current);
      incrementIntervalRef.current = null;
    }
  };

  const startDecrement = () => {
    if (decrementIntervalRef.current) return;
    decrementVoltz();
    decrementIntervalRef.current = setInterval(() => {
      decrementVoltz();
    }, 150);
  };

  const stopDecrement = () => {
    if (decrementIntervalRef.current) {
      clearInterval(decrementIntervalRef.current);
      decrementIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (incrementIntervalRef.current) clearInterval(incrementIntervalRef.current);
      if (decrementIntervalRef.current) clearInterval(decrementIntervalRef.current);
    };
  }, []);

  const incrementVoltz = () => {
    if (voltz < Math.min(100, totalVoltz)) setVoltz(voltz + 5);
  };

  const decrementVoltz = () => {
    if (voltz > 5) setVoltz(voltz - 5);
  };

  const remainingVoltz = totalVoltz - voltz;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={20} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Supercharge</Text>
      </View>

      {/* Icon and Description */}
      <View style={styles.iconContainer}>
        <View style={styles.zapContainer}>
          <Zap size={40} color={theme.colors.black} />
        </View>
        <Text style={styles.description}>Choose how many voltz to spend</Text>
      </View>

      {/* Voltz Selection Card */}
      <View style={styles.selectionCard}>
        {/* Balance Info */}
        <View style={styles.balanceContainer}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Your voltz balance:</Text>
            <Text style={styles.balanceValue}>{totalVoltz} VOLTZ</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>After spending:</Text>
            <Text style={styles.balanceValue}>{remainingVoltz} VOLTZ remaining</Text>
          </View>
        </View>

        {/* Voltz Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.controlButton}
            onPressIn={startDecrement}
            onPressOut={stopDecrement}
          >
            <Minus size={24} color={theme.colors.white} />
          </TouchableOpacity>

          <View style={styles.voltzDisplay}>
            <Text style={styles.voltzNumber}>{voltz}</Text>
            <Text style={styles.voltzLabel}>VOLTZ</Text>
          </View>

          <TouchableOpacity
            style={styles.controlButton}
            onPressIn={startIncrement}
            onPressOut={stopIncrement}
          >
            <Plus size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>

        {/* Reach Boost Info */}
        <View style={styles.reachContainer}>
          <View style={styles.reachHeader}>
            <Text style={styles.reachLabel}>Reach boost</Text>
            <Text style={styles.reachValue}>+{reach} people</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Continue Button */}
      <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
        <Text style={styles.continueButtonText}>Supercharge & Publish</Text>
        <ChevronRight size={20} color={theme.colors.black} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  iconContainer: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  zapContainer: {
    width: 80,
    height: 80,
    backgroundColor: theme.colors.yellow[400],
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    textAlign: 'center',
    color: theme.colors.gray[300],
    fontSize: 16,
  },
  selectionCard: {
    backgroundColor: theme.colors.gray[900],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  balanceContainer: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 14,
    color: theme.colors.gray[400],
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.yellow[400],
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  controlButton: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.gray[800],
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voltzDisplay: {
    alignItems: 'center',
  },
  voltzNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.yellow[400],
  },
  voltzLabel: {
    fontSize: 14,
    color: theme.colors.gray[400],
  },
  reachContainer: {
    backgroundColor: theme.colors.gray[800],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  reachHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  reachLabel: {
    fontSize: 14,
    color: theme.colors.white,
  },
  reachValue: {
    fontSize: 14,
    color: theme.colors.yellow[400],
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.gray[700],
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.yellow[400],
    borderRadius: theme.borderRadius.full,
  },
  continueButton: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.yellow[400],
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.black,
  },
});
```

## 7. Loading Screen Component

```tsx
// components/LoadingScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Zap } from 'lucide-react-native';
import { theme } from '../theme';

interface Props {
  supercharged: boolean;
}

export const LoadingScreen: React.FC<Props> = ({ supercharged }) => {
  const [progress, setProgress] = useState(0);
  const spinValue = new Animated.Value(0);

  useEffect(() => {
    // Spinning animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    // Progress animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Publishing...</Text>
      
      <View style={styles.loadingContainer}>
        {/* Spinning Border */}
        <Animated.View style={[styles.spinningBorder, { transform: [{ rotate: spin }] }]} />
        
        {/* Center Icon */}
        <View style={styles.iconContainer}>
          <Zap size={48} color={theme.colors.yellow[400]} />
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {supercharged ? 'Supercharging your insight...' : 'Publishing your insight...'}
        </Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressPercentage}>{progress}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  loadingContainer: {
    position: 'relative',
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinningBorder: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: theme.colors.yellow[400],
  },
  iconContainer: {
    width: 96,
    height: 96,
    backgroundColor: theme.colors.gray[800],
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  progressText: {
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    color: theme.colors.white,
    fontSize: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.gray[800],
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.xs,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.yellow[400],
    borderRadius: theme.borderRadius.full,
    transition: 'width 0.3s ease-out',
  },
  progressPercentage: {
    fontSize: 12,
    color: theme.colors.gray[400],
    alignSelf: 'flex-end',
  },
});
```

## 8. Success Screen Component

```tsx
// components/SuccessScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, Zap } from 'lucide-react-native';
import { theme } from '../theme';

interface Props {
  onDone: () => void;
  supercharged: boolean;
}

export const SuccessScreen: React.FC<Props> = ({ onDone, supercharged }) => {
  return (
    <View style={styles.container}>
      {/* Success Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.checkContainer}>
          <Check size={48} color={theme.colors.black} />
        </View>
        {supercharged && (
          <View style={styles.zapBadge}>
            <Zap size={24} color={theme.colors.yellow[400]} />
          </View>
        )}
      </View>

      {/* Success Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.title}>
          {supercharged 
            ? 'Your influence is successfully supercharged!' 
            : 'Your insight has been published!'
          }
        </Text>
        <Text style={styles.description}>
          {supercharged
            ? 'Your insight is now live and boosted for maximum impact.'
            : 'Your industry insight is now live for your network to see.'
          }
        </Text>
      </View>

      {/* Done Button */}
      <TouchableOpacity style={styles.doneButton} onPress={onDone}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  iconContainer: {
    position: 'relative',
  },
  checkContainer: {
    width: 96,
    height: 96,
    backgroundColor: theme.colors.yellow[400],
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zapBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 40,
    height: 40,
    backgroundColor: theme.colors.black,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.yellow[400],
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: 16,
    color: theme.colors.gray[400],
    textAlign: 'center',
    lineHeight: 24,
  },
  doneButton: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.gray[800],
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.md,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.white,
  },
});
```

## Implementation Tips

### 1. Navigation Integration
If using React Navigation, wrap the `InsightsPublisher` in a screen:

```tsx
// screens/InsightsScreen.tsx
import React from 'react';
import { InsightsPublisher } from '../components/InsightsPublisher';

export const InsightsScreen: React.FC = () => {
  return <InsightsPublisher />;
};
```

### 2. State Management
For production apps, consider using Redux or Zustand:

```tsx
// stores/insightsStore.ts
import { create } from 'zustand';

interface InsightsState {
  insights: any[];
  addInsight: (insight: any) => void;
  userVoltz: number;
  spendVoltz: (amount: number) => void;
}

export const useInsightsStore = create<InsightsState>((set) => ({
  insights: [],
  addInsight: (insight) => set((state) => ({ 
    insights: [...state.insights, insight] 
  })),
  userVoltz: 100,
  spendVoltz: (amount) => set((state) => ({ 
    userVoltz: state.userVoltz - amount 
  })),
}));
```

### 3. Animations
For more advanced animations, use `react-native-reanimated`:

```bash
npx expo install react-native-reanimated
```

### 4. Image Picker Integration
Replace mock photos with real image picker:

```tsx
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (!result.canceled) {
    setSelectedMedia({
      type: 'photo',
      source: result.assets[0].uri,
    });
  }
};
```

### 5. Toast Notifications
For success notifications, use `react-native-toast-message`:

```bash
npm install react-native-toast-message
```

### 6. Haptic Feedback
Add haptic feedback for better UX:

```tsx
import * as Haptics from 'expo-haptics';

const handleButtonPress = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  // Button action
};
```

## Key Features Implemented

✅ **Multi-step wizard flow**  
✅ **Dark theme with yellow accent**  
✅ **Media selection (photos/reels)**  
✅ **Post preview functionality**  
✅ **Supercharge options with voltz**  
✅ **Animated progress indicators**  
✅ **Success confirmation screens**  
✅ **Responsive layout for mobile**  
✅ **Touch-friendly controls**  
✅ **Proper state management**  

This implementation provides a pixel-perfect recreation of the original React insights flow, optimized for React Native and mobile interactions. The modular component structure makes it easy to customize and extend features as needed.