import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#1F2937" />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          
          <View style={styles.childrenContainer}>
            {children}
          </View>
        </View>

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
    paddingVertical: 16,
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
