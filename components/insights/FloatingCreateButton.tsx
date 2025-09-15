import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View, Dimensions, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FloatingCreateButtonProps {
  onPress: () => void;
}

export const FloatingCreateButton: React.FC<FloatingCreateButtonProps> = ({ onPress }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { width: screenWidth } = Dimensions.get('window');

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
      bottom: insets.bottom + 50, 
      left: 20, // Center horizontally (56 is button width)
      zIndex: 1000,
    },
    button: {
      width: screenWidth - 40, // Full width with margin
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary, // Golden yellow
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.text,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    buttonText: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
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
        <Animated.View style={{ transform: [{ scale: scaleAnim }], flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.buttonText}>Create Insight</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};