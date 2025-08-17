import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

// Preload all images at module level for immediate availability
const WelcomeHeroImage = require('../assets/welcomehero.png');
const HeroImage = require('../assets/hero.png');
const Hero2Image = require('../assets/hero2.png');

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, onSignIn }) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={WelcomeHeroImage} 
            style={[styles.heroImage, { opacity: imagesLoaded ? 1 : 0 }]} 
            resizeMode="contain"
            fadeDuration={0}
          />
        </View>
        
        {/* Main Text */}
        <Text style={styles.mainText}>A Scroll A Day Keeps Ignorance Away</Text>
        
        {/* Buttons */}
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
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxHeight: '50%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    maxWidth: 350,
    maxHeight: 350,
  },
  mainText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 32,
    lineHeight: 36,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#FBBF24',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FBBF24',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FBBF24',
  },
});