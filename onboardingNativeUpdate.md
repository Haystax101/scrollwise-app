# React Native Onboarding Implementation Guide

This document provides comprehensive guidance for implementing the onboarding flow in React Native based on the existing React web implementation.

## Overview

The onboarding consists of two main sections:
1. **Intro Flow**: Welcome screens with hero images and charging interaction (4 screens)
2. **Registration Flow**: User data collection (7 screens)
3. **Tutorial Section**: App feature walkthrough (multiple screens)

## Project Structure

```
src/
├── components/
│   ├── Button.tsx
│   ├── InputField.tsx
│   ├── AutocompleteInput.tsx
│   └── ImageScroller.tsx
├── onboarding/
│   ├── OnboardingScreen.tsx
│   ├── EmailInput.tsx
│   ├── PasswordSetup.tsx
│   ├── PersonalInfo.tsx
│   ├── IndustrySelection.tsx
│   ├── DreamRole.tsx
│   ├── CurrentWork.tsx
│   ├── StreakSelection.tsx
│   └── Notifications.tsx
└── assets/
    ├── hero.png
    ├── hero2.png
    ├── IMG_2106.jpg
    ├── IMG_2107.jpg
    └── IMG_2108.jpg
```

## Color Palette & Design System

```javascript
const colors = {
  primary: '#FBBF24', // Yellow-400
  primaryHover: '#F59E0B', // Yellow-500
  primaryText: '#000000', // Black text on yellow
  background: '#000000', // Black
  surface: '#1F2937', // Gray-800
  surfaceLight: '#374151', // Gray-700
  border: '#4B5563', // Gray-600
  borderActive: '#FBBF24', // Yellow-400
  text: '#FFFFFF', // White
  textSecondary: '#9CA3AF', // Gray-400
  textMuted: '#6B7280', // Gray-500
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 64,
};

const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
```

## Core Components

### 1. Button Component

```tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ButtonProps {
  children: string;
  onPress: () => void;
  fullWidth?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  fullWidth = false,
  disabled = false,
  variant = 'primary'
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        variant === 'secondary' && styles.secondary
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: '#FBBF24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  text: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: {
    color: '#9CA3AF',
  },
});
```

### 2. InputField Component

```tsx
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Animated } from 'react-native';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default'
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = new Animated.Value(value ? 1 : 0);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const labelStyle = {
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 4],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: isFocused ? '#FBBF24' : '#9CA3AF',
  };

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.label, labelStyle]}>
        {label}
      </Animated.Text>
      <TextInput
        style={[styles.input, isFocused && styles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        selectionColor="#FBBF24"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    height: 56,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#4B5563',
    color: '#FFFFFF',
    fontSize: 16,
  },
  inputFocused: {
    borderBottomColor: '#FBBF24',
  },
  label: {
    position: 'absolute',
    left: 16,
    fontWeight: '400',
    zIndex: 1,
  },
});
```

### 3. AutocompleteInput Component

```tsx
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, FlatList, TouchableOpacity, Animated } from 'react-native';

interface AutocompleteInputProps {
  label: string;
  options: string[];
  value: string;
  onChangeText: (text: string) => void;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  label,
  options,
  value,
  onChangeText,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const animatedValue = new Animated.Value(value ? 1 : 0);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(value.toLowerCase())
  );

  const handleFocus = () => {
    setIsFocused(true);
    setShowDropdown(value.length > 0);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTimeout(() => setShowDropdown(false), 150);
    if (!value) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleTextChange = (text: string) => {
    onChangeText(text);
    setShowDropdown(text.length > 0);
  };

  const handleOptionSelect = (option: string) => {
    onChangeText(option);
    setShowDropdown(false);
  };

  const labelStyle = {
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 4],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: isFocused ? '#FBBF24' : '#9CA3AF',
  };

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.label, labelStyle]}>
        {label}
      </Animated.Text>
      <TextInput
        style={[styles.input, isFocused && styles.inputFocused]}
        value={value}
        onChangeText={handleTextChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        selectionColor="#FBBF24"
      />
      {showDropdown && filteredOptions.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={filteredOptions}
            keyExtractor={(item, index) => index.toString()}
            style={styles.dropdownList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleOptionSelect(item)}
              >
                <Text style={styles.dropdownItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 16,
    zIndex: 1000,
  },
  input: {
    height: 56,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#4B5563',
    color: '#FFFFFF',
    fontSize: 16,
  },
  inputFocused: {
    borderBottomColor: '#FBBF24',
  },
  label: {
    position: 'absolute',
    left: 16,
    fontWeight: '400',
    zIndex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 192,
    zIndex: 1000,
  },
  dropdownList: {
    maxHeight: 192,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4B5563',
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
```

## Onboarding Screens

### 1. OnboardingScreen (Base Layout)

```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OnboardingScreenProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  isFinalStep?: boolean;
  chargeComponent?: React.ReactNode;
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
}) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {currentStep > 0 ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : <View style={styles.backButton} />}
        <Text style={styles.stepCounter}>
          {currentStep + 1} / {totalSteps}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Progress Dots */}
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

        {/* Action Button */}
        {isFinalStep ? (
          chargeComponent
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={onNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 32,
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
    paddingVertical: 32,
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
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});
```

### 2. Charging Component

```tsx
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder } from 'react-native';
import Svg, { Path, Rect, ClipPath, Defs } from 'react-native-svg';

interface ChargingComponentProps {
  onComplete: () => void;
}

export const ChargingComponent: React.FC<ChargingComponentProps> = ({ onComplete }) => {
  const [charge, setCharge] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const chargeAnimation = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const chargeDuration = 2000;

  const startCharge = () => {
    setIsCharging(true);
    startTimeRef.current = Date.now();
    
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current === null) return;
      const elapsedTime = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsedTime / chargeDuration, 1);
      const easedProgress = progress * (2 - progress);
      
      setCharge(easedProgress * 100);
      
      if (progress >= 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        onComplete();
      }
    }, 10);
  };

  const stopCharge = () => {
    setIsCharging(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCharge(0);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: startCharge,
    onPanResponderRelease: stopCharge,
    onPanResponderTerminate: stopCharge,
  });

  return (
    <View style={styles.container}>
      {/* Lightning Bolt Icon */}
      <View style={styles.iconContainer}>
        <Svg width="128" height="128" viewBox="0 0 24 24">
          <Defs>
            <ClipPath id="bolt-clip">
              <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </ClipPath>
          </Defs>
          <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#1F2937" />
          <Rect
            clipPath="url(#bolt-clip)"
            x="0"
            y={24 - (24 * charge) / 100}
            width="24"
            height={(24 * charge) / 100}
            fill="#FBBF24"
          />
          <Path
            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            fill="none"
            stroke="#FBBF24"
            strokeWidth="1"
          />
        </Svg>
      </View>

      {/* Charge Button */}
      <View
        {...panResponder.panHandlers}
        style={[styles.chargeButton, { backgroundColor: `rgba(251, 191, 36, ${charge / 100})` }]}
      >
        <Animated.View style={[styles.chargeProgress, { width: `${charge}%` }]} />
        <Text style={styles.chargeButtonText}>Hold To Charge</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  chargeButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FBBF24',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  chargeProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: '#FBBF24',
    borderRadius: 24,
  },
  chargeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    zIndex: 1,
  },
});
```

## Main App Flow Structure

```tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import { OnboardingScreen } from './onboarding/OnboardingScreen';
import { EmailInput } from './onboarding/EmailInput';
import { PasswordSetup } from './onboarding/PasswordSetup';
import { PersonalInfo } from './onboarding/PersonalInfo';
import { IndustrySelection } from './onboarding/IndustrySelection';
import { DreamRole } from './onboarding/DreamRole';
import { CurrentWork } from './onboarding/CurrentWork';
import { StreakSelection } from './onboarding/StreakSelection';
import { Notifications } from './onboarding/Notifications';
import { ChargingComponent } from './components/ChargingComponent';
import { ImageScroller } from './components/ImageScroller';

// Import assets
import HeroImage from './assets/hero.png';
import Hero2Image from './assets/hero2.png';

const onboardingSteps = [
  {
    icon: <Image source={HeroImage} style={{ width: 192, height: 192 }} resizeMode="contain" />,
    title: 'Take Control Of Your Scrolls',
    description: 'With supercharged you have the power of all in the package of one',
  },
  {
    icon: <Image source={Hero2Image} style={{ width: 192, height: 192 }} resizeMode="contain" />,
    title: 'Meet Your Goals',
    description: 'Progress in your industry, one scroll at a time',
  },
  {
    icon: <Ionicons name="flash" size={96} color="#FBBF24" />,
    title: 'Get Supercharged',
    description: 'Connect with like-minded professionals for exciting project opportunities',
  },
  { component: EmailInput },
  { component: PasswordSetup },
  { component: PersonalInfo },
  { component: IndustrySelection },
  { component: DreamRole },
  { component: CurrentWork },
  { component: StreakSelection },
  { component: Notifications },
];

const tutorialSteps = [
  {
    icon: <ImageScroller />,
    title: 'Industry Insights',
    description: 'Access exclusive knowledge and stay ahead with the latest industry trends',
  },
  // Add tutorial screenshots here
  {
    icon: <Image source={require('./assets/app-screenshot-1.png')} style={{ width: 250, height: 400 }} />,
    title: 'Your Feed',
    description: 'Scroll through curated content from industry leaders',
  },
  // More tutorial screens...
];

export const App = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentSection, setCurrentSection] = useState<'onboarding' | 'tutorial'>('onboarding');
  
  const nextStep = () => {
    if (currentSection === 'onboarding') {
      if (currentStep < onboardingSteps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Move to tutorial section
        setCurrentSection('tutorial');
        setCurrentStep(0);
      }
    } else {
      if (currentStep < tutorialSteps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Complete onboarding
        console.log('Onboarding complete');
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else if (currentSection === 'tutorial') {
      // Go back to onboarding
      setCurrentSection('onboarding');
      setCurrentStep(onboardingSteps.length - 1);
    }
  };

  const steps = currentSection === 'onboarding' ? onboardingSteps : tutorialSteps;
  const step = steps[currentStep];
  const isIntroStep = currentSection === 'onboarding' && currentStep < 3;
  const isFinalIntroStep = currentSection === 'onboarding' && currentStep === 2;

  if (!isIntroStep && currentSection === 'onboarding') {
    const CurrentScreen = step.component;
    return <CurrentScreen onNext={nextStep} onBack={prevStep} />;
  }

  return (
    <OnboardingScreen
      icon={step.icon}
      title={step.title}
      description={step.description}
      currentStep={currentStep}
      totalSteps={currentSection === 'onboarding' ? 3 : tutorialSteps.length}
      onNext={nextStep}
      onBack={prevStep}
      isFinalStep={isFinalIntroStep}
      chargeComponent={isFinalIntroStep ? <ChargingComponent onComplete={nextStep} /> : undefined}
    />
  );
};
```

## Individual Screen Implementations

### EmailInput Screen
- **Layout**: Full-screen black background
- **Header**: "What's your email?" title, subtitle explaining usage
- **Input**: Single email input field with floating label
- **Footer**: Full-width Continue button

### PasswordSetup Screen
- **Layout**: Same as EmailInput
- **Header**: "Create a password" title
- **Inputs**: Password and Confirm Password fields
- **Validation**: Ensure passwords match (implement in React Native)

### PersonalInfo Screen
- **Layout**: Same pattern
- **Header**: "Tell us about yourself"
- **Inputs**: First Name and Last Name fields

### IndustrySelection Screen
- **Layout**: Different layout with search and list
- **Header**: "Select your industry" with search bar
- **Content**: Scrollable list of industries with icons
- **Selection**: Single-select with visual feedback
- **Data**: 7 industries with Ionicons

```tsx
const industries = [
  { id: 'finance', name: 'Finance & Economics', icon: 'briefcase-outline' },
  { id: 'politics', name: 'Politics & International Relations', icon: 'globe-outline' },
  { id: 'entrepreneurship', name: 'Entrepreneurship & Startups', icon: 'rocket-outline' },
  { id: 'technology', name: 'Technology & AI', icon: 'desktop-outline' },
  { id: 'energy', name: 'Energy & Sustainability', icon: 'leaf-outline' },
  { id: 'creative', name: 'Creative Industries & Arts', icon: 'color-palette-outline' },
  { id: 'engineering', name: 'Engineering & Automotive', icon: 'construct-outline' },
];
```

### DreamRole Screen
- **Layout**: Standard form layout
- **Header**: "Career Aspirations" title
- **Inputs**: Dream Role and Dream Company with autocomplete
- **Data Arrays**:

```tsx
const jobTitles = [
  'Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer',
  'Marketing Manager', 'Sales Director', 'DevOps Engineer', 'Frontend Developer',
  'Backend Developer', 'Full Stack Developer'
];

const companies = [
  'Google', 'Apple', 'Microsoft', 'Amazon', 'Meta',
  'Netflix', 'Tesla', 'Uber', 'Airbnb', 'Spotify'
];
```

### CurrentWork Screen
- **Layout**: Same as DreamRole
- **Header**: "Current Work"
- **Inputs**: Current Role and Current Company (regular inputs, no autocomplete)

### StreakSelection Screen
- **Layout**: Centered with large flame icon
- **Header**: "Set your weekly goal"
- **Icon**: Large flame that changes color based on selection
- **Selector**: Horizontal button row for days 3-7
- **Colors**: Green (3-4), Blue (5-6), Orange (7)

### Notifications Screen
- **Layout**: Centered layout
- **Icon**: Large bell icon (96px)
- **Header**: "Stay on track"
- **Buttons**: "Enable Notifications" (primary) and "Maybe Later" (text button)

## Tutorial Section Implementation

The tutorial section should use the same OnboardingScreen component but with different content:

1. **First Screen**: ImageScroller component showing app screenshots
2. **Subsequent Screens**: Static images of app features with explanatory text
3. **Navigation**: Same dot navigation and back/next buttons

### ImageScroller for React Native

```tsx
import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';

const images = [
  require('../assets/IMG_2106.jpg'),
  require('../assets/IMG_2107.jpg'),
  require('../assets/IMG_2108.jpg'),
];

export const ImageScroller: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(true);
  const translateY = new Animated.Value(0);
  const scale = new Animated.Value(1);

  useEffect(() => {
    const sequence = () => {
      // Zoom out
      Animated.timing(scale, {
        toValue: 0.93,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Scroll to next
        const nextIndex = (currentIndex + 1) % images.length;
        setCurrentIndex(nextIndex);
        
        Animated.timing(translateY, {
          toValue: -nextIndex * 100,
          duration: 700,
          useNativeDriver: true,
        }).start(() => {
          // Zoom in
          Animated.timing(scale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        });
      });
    };

    const timer = setTimeout(sequence, 3000);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.scrollContainer,
          {
            transform: [
              { translateY: translateY },
              { scale: scale }
            ]
          }
        ]}
      >
        {images.map((source, index) => (
          <Image
            key={index}
            source={source}
            style={styles.image}
            resizeMode="cover"
          />
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 300,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4B5563',
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  scrollContainer: {
    flexDirection: 'column',
  },
  image: {
    width: 200,
    height: 300,
  },
});
```

## Assets Required

Ensure these assets are copied to your React Native project:
- `hero.png` - Viking character with lightning
- `hero2.png` - Second hero image
- `IMG_2106.jpg`, `IMG_2107.jpg`, `IMG_2108.jpg` - Scroller images

## Key Implementation Notes

1. **Expo Compatibility**: All components use Expo-compatible libraries
2. **TypeScript**: Maintain full TypeScript support
3. **Styling**: Use StyleSheet.create for all styles
4. **Icons**: Use @expo/vector-icons for consistency
5. **Navigation**: Implement step-based navigation as shown
6. **State Management**: Use React state for form data
7. **Animations**: Use React Native Animated API for smooth transitions
8. **Platform**: Ensure iOS/Android compatibility
9. **Accessibility**: Add accessibility labels where needed
10. **Performance**: Optimize image loading and animations

This implementation will recreate the exact onboarding experience from the React web version in React Native, maintaining the same visual design, interactions, and user flow.