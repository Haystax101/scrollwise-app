import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Button } from './Button';

const { height: screenHeight } = Dimensions.get('window');

const CheckIcon = () => (
  <Svg width="96" height="96" viewBox="0 0 24 24" fill="none">
    <Path 
      d="M20 6L9 17L4 12" 
      stroke="#F59E0B" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

interface CongratulationsScreenProps {
  onNext: () => void;
}

export const CongratulationsScreen: React.FC<CongratulationsScreenProps> = ({ onNext }) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    // Slide up animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.animatedContainer,
        {
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header} />

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckIcon />
        </View>
        
        <Text style={styles.title}>Great choice!</Text>
        <Text style={styles.description}>
          Over 95% of Superchargers Report Feeling More Clued-In on both their industry and others'
        </Text>
      </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Button onPress={onNext}>
            Select aspirations
          </Button>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFBF0',
    paddingHorizontal: 32,
  },
  header: {
    height: 60,
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
    lineHeight: 24,
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
});