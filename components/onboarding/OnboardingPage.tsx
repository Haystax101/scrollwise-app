import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { OnboardingStyles } from './styles';

interface OnboardingPageProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  buttonText: string;
  buttonDisabled?: boolean;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({
  title,
  subtitle,
  children,
  onBack,
  onNext,
  buttonText,
  buttonDisabled = false,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >

          {/* Content */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>
              <View style={styles.textContainer}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>
              
              <View style={styles.childrenContainer}>
                {children}
              </View>
            </View>
          </TouchableWithoutFeedback>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              onPress={onNext}
              disabled={buttonDisabled}
              style={styles.button}
            >
              {buttonText}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OnboardingStyles.backgroundColor,
    paddingHorizontal: OnboardingStyles.containerPaddingHorizontal,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 86, //this isn't there anymore
    height: OnboardingStyles.headerHeight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingVertical: 86,
    justifyContent: 'flex-start',
  },
  textContainer: {
    marginBottom: OnboardingStyles.contentMarginBottom,
    paddingHorizontal: OnboardingStyles.textPaddingHorizontal, // Added text padding
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: OnboardingStyles.textPrimary,
    marginBottom: OnboardingStyles.titleMarginBottom,
  },
  subtitle: {
    fontSize: 16,
    color: OnboardingStyles.textSecondary,
    lineHeight: OnboardingStyles.subtitleLineHeight,
  },
  childrenContainer: {
    flex: 1,
    paddingHorizontal: OnboardingStyles.textPaddingHorizontal, // Added padding for input fields
  },
  footer: {
    paddingVertical: OnboardingStyles.footerPaddingVertical,
    paddingHorizontal: OnboardingStyles.footerPaddingHorizontal,
    alignItems: 'center',
  },
  button: {
    minWidth: OnboardingStyles.buttonMinWidth, // Ensure minimum button width
    width: '100%', // Make button full width
  },
});
