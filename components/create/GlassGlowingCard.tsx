import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

interface GlassGlowingCardProps {
    children: React.ReactNode;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    glowColor?: string;
    intensity?: number;
    activeOpacity?: number;
}

export const GlassGlowingCard: React.FC<GlassGlowingCardProps> = ({
    children,
    onPress,
    style,
    glowColor = '#FFD700', // Default Gold
    intensity = 40,
    activeOpacity = 0.8
}) => {
    const { isDark } = useTheme();

    const ContentWrapper = onPress ? TouchableOpacity : View;

    return (
        <View style={[styles.container, style]}>
            {/* Background Glow - Soft diffused shadow */}
            <View style={[styles.glowLayer, { shadowColor: glowColor }]} />

            <ContentWrapper
                style={styles.innerContainer}
                onPress={onPress}
                activeOpacity={activeOpacity}
            >
                {/* Main Glass Body */}
                <BlurView
                    intensity={intensity}
                    tint={isDark ? 'dark' : 'light'}
                    style={styles.blurView}
                >
                    {/* Seamless Gradient Accents */}

                    {/* Top Right Corner - Gold to Transparent Fade (Horizontal & Vertical) */}
                    <LinearGradient
                        colors={[glowColor, 'transparent']}
                        start={{ x: 1, y: 0 }}
                        end={{ x: 0.7, y: 0 }}
                        style={[styles.accentStrip, styles.topRightHorizontal]}
                    />
                    <LinearGradient
                        colors={[glowColor, 'transparent']}
                        start={{ x: 1, y: 0 }}
                        end={{ x: 1, y: 0.3 }}
                        style={[styles.accentStrip, styles.topRightVertical]}
                    />

                    {/* Bottom Left Corner - Gold to Transparent Fade */}
                    <LinearGradient
                        colors={[glowColor, 'transparent']}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 0.3, y: 1 }}
                        style={[styles.accentStrip, styles.bottomLeftHorizontal]}
                    />
                    <LinearGradient
                        colors={[glowColor, 'transparent']}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 0, y: 0.7 }}
                        style={[styles.accentStrip, styles.bottomLeftVertical]}
                    />

                    {/* Rich Gradient Overlay for depth */}
                    <LinearGradient
                        colors={['rgba(255,255,255,0.05)', 'transparent']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />

                    {/* Content */}
                    <View style={styles.content}>
                        {children}
                    </View>
                </BlurView>
            </ContentWrapper>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        borderRadius: 24,
    },
    innerContainer: {
        borderRadius: 24,
        overflow: 'hidden',
        flex: 1, // Ensure it fills the container
    },
    blurView: {
        flex: 1,
        backgroundColor: 'rgba(30, 30, 30, 0.6)', // Base darkness
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
    },
    glowLayer: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        bottom: 20,
        backgroundColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3, // Soft glow
        shadowRadius: 20,
        elevation: 10,
    },
    content: {
        padding: 16,
        flex: 1,
    },
    accentStrip: {
        position: 'absolute',
        opacity: 0.6, // Adjust for seamlessness
    },
    // Top Right positioning
    topRightHorizontal: {
        top: 0,
        right: 0,
        width: 60,
        height: 1.5, // Thin accent line
    },
    topRightVertical: {
        top: 0,
        right: 0,
        width: 1.5,
        height: 60,
    },
    // Bottom Left positioning
    bottomLeftHorizontal: {
        bottom: 0,
        left: 0,
        width: 60,
        height: 1.5,
    },
    bottomLeftVertical: {
        bottom: 0,
        left: 0,
        width: 1.5,
        height: 60,
    }
});
