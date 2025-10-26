import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated';

interface AnimatedStepContainerProps {
  children: React.ReactNode;
  stepKey: string | number; // Unique key for each step to force remount
}

export const AnimatedStepContainer: React.FC<AnimatedStepContainerProps> = ({
  children,
  stepKey,
}) => {
  return (
    <Animated.View
      key={stepKey}
      entering={SlideInRight.duration(250).springify().damping(35).stiffness(100)}
      exiting={SlideOutLeft.duration(200).springify().damping(35).stiffness(100)}
      style={styles.container}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});
