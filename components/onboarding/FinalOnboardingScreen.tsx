import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, SafeAreaView, Dimensions, Animated, TouchableOpacity, Text } from 'react-native';
import { ImageScroller } from './ImageScroller';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Preload the peekhero image
const PeekHeroImage = require('../../assets/peekhero.png');

interface FinalOnboardingScreenProps {
  onNext: () => void;
}

const tutorialTexts = [
  "I'm Supercharged Simon. Let's show you around!",
  "This is your main feed, where your industry-specific articles, papers, books and insights will appear. You can like, comment, save and tap to read in-depth",
  "This is your discover page. Search for anything, and upgrade to pro for advanced search capabilities",
  "This is the insights tab, where you can create insights to appear in others' feeds",
  "This is your profile. You can check the leaderboard, track your progress and strengthen your profile",
  "These are your voltz, which you'll earn from quizzes and insight reactions. You can use them to boost your insight views. Complete your profile to earn bonus voltz!",
  "You're all set!"
];

export const FinalOnboardingScreen: React.FC<FinalOnboardingScreenProps> = ({ onNext }) => {
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  const [currentPhase, setCurrentPhase] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    // Slide in from right animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Typewriter effect
  useEffect(() => {
    const currentText = tutorialTexts[currentPhase];
    setDisplayedText('');
    setIsTyping(true);
    
    let index = 0;
    const timer = setInterval(() => {
      if (index < currentText.length) {
        setDisplayedText(currentText.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 30); // Adjust speed as needed

    return () => clearInterval(timer);
  }, [currentPhase]);

  const handleTap = () => {
    if (isTyping) {
      // If still typing, complete the text immediately
      setDisplayedText(tutorialTexts[currentPhase]);
      setIsTyping(false);
    } else {
      // Move to next phase
      if (currentPhase < tutorialTexts.length - 1) {
        setCurrentPhase(currentPhase + 1);
      } else {
        // Complete onboarding
        onNext();
      }
    }
  };

  // Show scroller only for phase 1 (second text)
  const showScroller = currentPhase === 1;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.touchableContainer} 
        onPress={handleTap}
        activeOpacity={1}
      >
        <Animated.View 
          style={[
            styles.animatedContainer,
            {
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          {/* Header with scroller and skip button */}
          <View style={styles.header}>
            {showScroller && (
              <View style={styles.scrollerContainer}>
                <ImageScroller />
              </View>
            )}
            {/* Skip Button */}
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={onNext}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Text Box */}
            <View style={styles.textBox}>
              <Text style={styles.tutorialText}>{displayedText}</Text>
              {!isTyping && (
                <Text style={styles.tapToContinue}>tap to continue</Text>
              )}
            </View>
          </View>

          {/* Peek Hero Image - positioned absolutely in bottom right */}
          <Image 
            source={PeekHeroImage} 
            style={styles.peekHero}
            resizeMode="contain"
            fadeDuration={0}
          />
        </Animated.View>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  touchableContainer: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
    paddingHorizontal: 32,
  },
  header: {
    height: 300, // Make room for larger scroller
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    position: 'relative',
  },
  scrollerContainer: {
    alignItems: 'center',
    transform: [{ scale: 1.2 }], // Make scroller slightly larger
  },
  skipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(75, 85, 99, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  skipButtonText: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  textBox: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 10,
    marginLeft: 2, // More to the left
    marginRight: screenWidth * 0.3, // Leave space for Simon
    marginTop: 40, // Move down slightly
    maxWidth: screenWidth * 0.65, // Narrower to avoid Simon
    borderWidth: 1,
    borderColor: '#374151',
  },
  tutorialText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    textAlign: 'left',
  },
  tapToContinue: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 12,
    fontStyle: 'italic',
  },
  peekHero: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: screenWidth * 0.35, // Slightly smaller to make room for text
    height: screenHeight * 0.35,
    zIndex: 1,
  },
});