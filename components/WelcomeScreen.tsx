import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

// Preload all images at module level for immediate availability
const WelcomeHeroImage = require('../assets/welcomehero.png');
const HeroImage = require('../assets/hero.png');
const Hero2Image = require('../assets/hero2.png');

// Create stable image components to prevent re-rendering
const WelcomeHeroImageComponent = React.memo(() => (
  <Image 
    source={WelcomeHeroImage} 
    style={styles.slideImage} 
    resizeMode="contain"
    fadeDuration={0}
  />
));

const HeroImageComponent = React.memo(() => (
  <Image 
    source={HeroImage} 
    style={styles.slideImage} 
    resizeMode="contain"
    fadeDuration={0}
  />
));

const Hero2ImageComponent = React.memo(() => (
  <Image 
    source={Hero2Image} 
    style={styles.slideImage} 
    resizeMode="contain"
    fadeDuration={0}
  />
));

const welcomeSlides = [
  {
    key: '1',
    image: <WelcomeHeroImageComponent />,
    title: 'A Scroll A Day Keeps Ignorance Away',
    description: 'Stay ahead with the latest insights'
  },
  {
    key: '2',
    image: <HeroImageComponent />,
    title: 'Take Control Of Your Scrolls',
    description: 'With supercharged you have the power of all in the package of one',
  },
  {
    key: '3',
    image: <Hero2ImageComponent />,
    title: 'Meet Your Goals',
    description: 'Progress in your industry, one scroll at a time',
  },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, onSignIn }) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Preload images for the next screens to avoid flickering
    const preloadImages = async () => {
      try {
        await Promise.all([
          Image.prefetch(Image.resolveAssetSource(HeroImage).uri),
          Image.prefetch(Image.resolveAssetSource(Hero2Image).uri),
          Image.prefetch(Image.resolveAssetSource(WelcomeHeroImage).uri)
        ]);
        setImagesLoaded(true);
      } catch (error) {
        console.log('Image preload error:', error);
        // Still allow navigation even if preload fails
        setImagesLoaded(true);
      }
    };
    preloadImages();
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const renderItem = ({ item }: { item: typeof welcomeSlides[0] }) => (
    <View style={styles.slide}>
      <View style={styles.slideContent}>
        <View style={styles.imageContainer}>
          {item.image}
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Image and Text Scroller */}
        <View style={styles.scrollerContainer}>
          <FlatList
            ref={flatListRef}
            data={welcomeSlides}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.key}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{
              itemVisiblePercentThreshold: 50,
            }}
            style={styles.flatList}
          />
        </View>

        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          {welcomeSlides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === activeIndex && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
        
        {/* Buttons - Always Present */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={onGetStarted}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={onSignIn}>
            <Text style={styles.secondaryButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF0',
  },
  content: {
    flex: 1,
    paddingVertical: 48,
    justifyContent: 'space-between',
  },
  scrollerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  slideImage: {
    width: 300,
    height: 300,
    maxWidth: 350,
    maxHeight: 350,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
    paddingHorizontal: 16,
  },
  slideDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#F59E0B',
  },
  buttonContainer: {
    paddingHorizontal: 32,
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
  },
});