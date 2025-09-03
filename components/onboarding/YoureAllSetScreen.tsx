import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { OnboardingStyles } from './styles';

interface YoureAllSetScreenProps {
  onNext: () => void;
}

export const YoureAllSetScreen: React.FC<YoureAllSetScreenProps> = ({ onNext }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.successIconBg}>
            <Ionicons name="checkmark" size={64} color={OnboardingStyles.accent} />
          </View>
        </View>

        <Text style={styles.title}>You're All Set!</Text>
        
        <Text style={styles.subtitle}>
          Congratulations! Your profile is complete and you're ready to start your learning journey.
        </Text>

        <Text style={styles.description}>
          Next, we'll introduce you to Supercharged Simon, your personal learning assistant who will help guide you through the app and maximize your learning potential.
        </Text>

      </View>

      <View style={styles.bottomContainer}>
        <Button 
          title="Meet Simon"
          onPress={onNext}
          style={styles.nextButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OnboardingStyles.backgroundColor,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  successIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEF3C7', // Light golden background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: OnboardingStyles.accent,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: OnboardingStyles.textColor,
    textAlign: 'center',
    marginBottom: 16,
    maxFontSizeMultiplier: 1.2,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: OnboardingStyles.textColor,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    maxFontSizeMultiplier: 1.2,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    maxFontSizeMultiplier: 1.2,
  },
  featuresContainer: {
    alignSelf: 'stretch',
    paddingHorizontal: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 16,
    color: OnboardingStyles.textColor,
    marginLeft: 12,
    flex: 1,
    maxFontSizeMultiplier: 1.2,
  },
  bottomContainer: {
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  nextButton: {
    width: '100%',
  },
});