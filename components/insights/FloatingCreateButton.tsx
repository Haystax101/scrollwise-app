import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FloatingCreateButtonProps {
  onPress: () => void;
}

export const FloatingCreateButton: React.FC<FloatingCreateButtonProps> = ({ onPress }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: insets.bottom + 90, // Above navbar (typical tab bar height ~50-60px + margin)
      right: 20,
      zIndex: 1000,
    },
    button: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#EAB308', // Golden yellow
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessible={true}
        accessibilityLabel="Create new insight"
        accessibilityRole="button"
        accessibilityHint="Opens the insight creation screen"
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Feather name="plus" size={24} color="white" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};