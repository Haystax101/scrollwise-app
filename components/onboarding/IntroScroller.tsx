import React, { useRef, useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Image, SafeAreaView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Preload images at module level for immediate availability
const HeroImage = require('../../assets/hero.png');
const Hero2Image = require('../../assets/hero2.png');

// Create stable image components to prevent re-rendering
const HeroImageComponent = React.memo(() => (
  <Image 
    source={HeroImage} 
    style={{ width: 280, height: 280 }} 
    resizeMode="contain"
    fadeDuration={0}
  />
));

const Hero2ImageComponent = React.memo(() => (
  <Image 
    source={Hero2Image} 
    style={{ width: 280, height: 280 }} 
    resizeMode="contain"
    fadeDuration={0}
  />
));

const introSteps = [
  {
    key: '1',
    icon: <HeroImageComponent />,
    title: 'Take Control Of Your Scrolls',
    description: 'With supercharged you have the power of all in the package of one',
  },
  {
    key: '2',
    icon: <Hero2ImageComponent />,
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
  const dotAnimations = useRef(introSteps.map(() => new Animated.Value(0))).current;

  // Initialize first dot as active
  useEffect(() => {
    dotAnimations[0].setValue(1);
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setActiveIndex(newIndex);
      
      // Animate progress dots
      dotAnimations.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: index === newIndex ? 1 : 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
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
          {activeIndex + 1} / {introSteps.length}
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
        decelerationRate="fast"
        snapToAlignment="center"
        snapToInterval={width}
        scrollEventThrottle={16}
        bounces={false}
        overScrollMode="never"
      />

      <View style={styles.footer}>
        <View style={styles.progressContainer}>
          {Array.from({ length: introSteps.length }).map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: dotAnimations[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#E5E7EB', '#F59E0B'],
                  }),
                  transform: [{
                    scale: dotAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    })
                  }]
                }
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
    backgroundColor: '#FFFBF0',
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
    color: '#6B7280',
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
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
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
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  nextButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
