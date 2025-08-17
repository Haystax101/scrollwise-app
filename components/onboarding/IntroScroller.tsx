import React, { useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Image, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Preload images
const HeroImage = require('../../assets/hero.png');
const Hero2Image = require('../../assets/hero2.png');

const introSteps = [
  {
    key: '1',
    icon: <Image source={HeroImage} style={{ width: 280, height: 280 }} resizeMode="contain" />,
    title: 'Take Control Of Your Scrolls',
    description: 'With supercharged you have the power of all in the package of one',
  },
  {
    key: '2',
    icon: <Image source={Hero2Image} style={{ width: 280, height: 280 }} resizeMode="contain" />,
    title: 'Meet Your Goals',
    description: 'Progress in your industry, one scroll at a time',
  },
];

interface IntroScrollerProps {
  onComplete: () => void;
  onBack: () => void;
}

export const IntroScroller: React.FC<IntroScrollerProps> = ({ onComplete, onBack }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const renderItem = ({ item }: { item: typeof introSteps[0] }) => (
    <View style={styles.slide}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>{item.icon}</View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.stepCounter}>
          {activeIndex + 1} / {introSteps.length + 1}
        </Text>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={introSteps}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        style={{ flex: 1 }}
      />

      <View style={styles.footer}>
        <View style={styles.progressContainer}>
          {/* Add an extra dot for the charging screen */}
          {Array.from({ length: introSteps.length + 1 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === activeIndex && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.nextButton} onPress={onComplete}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  slide: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48, // Matches OnboardingScreen's content padding
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCounter: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    maxWidth: 300,
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4B5563',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#FBBF24',
  },
  nextButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#FBBF24',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});
