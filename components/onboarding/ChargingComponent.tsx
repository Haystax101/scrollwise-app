import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder } from 'react-native';
import Svg, { Path, Rect, ClipPath, Defs } from 'react-native-svg';
import { OnboardingStyles } from './styles';

interface ChargingBoltIconProps {
  charge: number;
}

export const ChargingBoltIcon: React.FC<ChargingBoltIconProps> = ({ charge }) => {
  return (
    <Svg width="200" height="200" viewBox="0 0 24 24">
      <Defs>
        <ClipPath id="bolt-clip">
          <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </ClipPath>
      </Defs>
      {/* Outline bolt */}
      <Path 
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" 
        fill="none" 
        stroke="#FBBF24" 
        strokeWidth="1.5" 
      />
      {/* Fill that grows with charge */}
      <Rect
        clipPath="url(#bolt-clip)"
        x="0"
        y={24 - (24 * charge) / 100}
        width="24"
        height={(24 * charge) / 100}
        fill="#FBBF24"
      />
    </Svg>
  );
};

interface ChargingComponentProps {
  onComplete: () => void;
  onChargeChange?: (charge: number) => void;
}

export const ChargingComponent: React.FC<ChargingComponentProps> = ({ onComplete, onChargeChange }) => {
  const [charge, setCharge] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const chargeDuration = 2000;

  const startCharge = () => {
    startTimeRef.current = Date.now();
    
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current === null) return;
      const elapsedTime = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsedTime / chargeDuration, 1);
      const easedProgress = progress * (2 - progress);
      const chargeValue = easedProgress * 100;
      
      setCharge(chargeValue);
      onChargeChange?.(chargeValue);
      
      if (progress >= 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        onComplete();
      }
    }, 10);
  };

  const stopCharge = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCharge(0);
    onChargeChange?.(0);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: startCharge,
    onPanResponderRelease: stopCharge,
    onPanResponderTerminate: stopCharge,
  });

  return (
    <View style={styles.container}>
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
  chargeButton: {
    width: '100%',
    height: OnboardingStyles.buttonHeight,
    borderRadius: OnboardingStyles.buttonBorderRadius,
    borderWidth: 2,
    borderColor: OnboardingStyles.accent,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    minWidth: OnboardingStyles.buttonMinWidth,
  },
  chargeProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: OnboardingStyles.accent,
    borderRadius: OnboardingStyles.buttonBorderRadius,
  },
  chargeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    zIndex: 1,
  },
});