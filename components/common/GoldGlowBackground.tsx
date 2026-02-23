import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

interface GoldGlowBackgroundProps {
    style?: ViewStyle;
    /**
     * Hex opacity string (e.g., '20' for ~12%, '33' for 20%).
     * Default is '20' to match Profile header.
     */
    opacityHex?: string;
}

export const GoldGlowBackground: React.FC<GoldGlowBackgroundProps> = ({ style, opacityHex = '20' }) => {
    const { colors } = useTheme();

    return (
        <LinearGradient
            // Richer Sunset: Gold -> Orange -> Transparent
            colors={['#FFD700' + '40', '#FFA500' + '20', 'transparent']}
            style={[StyleSheet.absoluteFill, style]}
            locations={[0, 0.4, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.6 }} // Extend further down for more pop
            pointerEvents="none"
        />
    );
};
