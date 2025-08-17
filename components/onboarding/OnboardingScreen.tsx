import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStyles } from './styles';

interface OnboardingScreenProps {
  icon: React.ReactNode | null;
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  isFinalStep?: boolean;
  chargeComponent?: React.ReactNode;
  customContent?: React.ReactNode;
  buttonText?: string;
  buttonDisabled?: boolean;
  secondaryButtonText?: string;
  onSecondaryAction?: () => void;
  disableIconAnimation?: boolean;
  hideStepCounter?: boolean;
  hideProgressDots?: boolean;
  showBackButton?: boolean;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  icon,
  title,
  description,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  isFinalStep = false,
  chargeComponent,
  customContent,
  buttonText,
  buttonDisabled = false,
  secondaryButtonText,
  onSecondaryAction,
  disableIconAnimation = false,
  hideStepCounter = false,
  hideProgressDots = false,
  showBackButton = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (disableIconAnimation) {
      fadeAnim.setValue(1);
      return;
    }
    // Quick fade out then fade in for icon changes only
    if (icon) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [icon, disableIconAnimation]);
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {(currentStep > 0 || showBackButton) ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : <View style={styles.backButton} />}
        {!hideStepCounter && (
          <Text style={styles.stepCounter}>
            {currentStep + 1} / {totalSteps}
          </Text>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {icon && (
          <Animated.View 
            style={[
              styles.iconContainer,
              {
                opacity: fadeAnim,
              }
            ]}
          >
            {icon}
          </Animated.View>
        )}
        <Text style={styles.title}>
          {title}
        </Text>
        <Text style={styles.description}>
          {description}
        </Text>
        {customContent && (
          <View style={styles.customContentContainer}>
            {customContent}
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Progress Dots - Show below icon for charging page */}
        {isFinalStep && chargeComponent ? (
          <View style={styles.chargingLayout}>
            {/* Progress Dots */}
            {!hideProgressDots && (
              <View style={styles.progressContainer}>
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.progressDot,
                      index === currentStep && styles.progressDotActive
                    ]}
                  />
                ))}
              </View>
            )}
            {/* Charging Component */}
            {chargeComponent}
          </View>
        ) : (
          <>
            {/* Progress Dots */}
            {!hideProgressDots && (
              <View style={styles.progressContainer}>
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.progressDot,
                      index === currentStep && styles.progressDotActive
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Action Button */}
            <TouchableOpacity 
              style={[styles.nextButton, buttonDisabled && styles.nextButtonDisabled]} 
              onPress={onNext}
              disabled={buttonDisabled}
            >
              <Text style={[styles.nextButtonText, buttonDisabled && styles.nextButtonTextDisabled]}>
                {buttonText || 'Next'}
              </Text>
            </TouchableOpacity>
          </>
        )}
        
        {/* Secondary Button */}
        {secondaryButtonText && onSecondaryAction && (
          <TouchableOpacity style={styles.secondaryButton} onPress={onSecondaryAction}>
            <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OnboardingStyles.backgroundColor,
    paddingHorizontal: OnboardingStyles.containerPaddingHorizontal,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
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
    paddingHorizontal: 16,
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
    paddingVertical: OnboardingStyles.footerPaddingVertical,
    paddingHorizontal: OnboardingStyles.footerPaddingHorizontal,
    alignItems: 'center',
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
  nextButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  nextButtonTextDisabled: {
    color: '#9CA3AF',
  },
  customContentContainer: {
    marginTop: 32,
    width: '100%',
  },
  secondaryButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#FBBF24',
    textAlign: 'center',
  },
  chargingLayout: {
    alignItems: 'center',
    width: '100%',
  },
});