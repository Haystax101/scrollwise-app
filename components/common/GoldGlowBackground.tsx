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
            // Primary gold with low opacity fading to transparent
            colors={[colors.primary + opacityHex, 'transparent']}
            style={[StyleSheet.absoluteFill, style]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.35 }} // Fades out by top 35% of screen
            pointerEvents="none" // Critical: Allow touches to pass through
        />
    );
};
