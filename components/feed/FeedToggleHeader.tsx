import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MagnifyingGlassIcon } from 'react-native-heroicons/outline';
import { useRouter } from 'expo-router';

/* 
  FeedToggleHeader
  - Segmented Control for switching between 'Learning' (Algo) and 'Community' (Social).
  - Uses Glassmorphism and Animated highlight.
*/

export type FeedType = 'learning' | 'community';

const BUTTON_WIDTH = 100;
const BUTTON_HEIGHT = 42; // Slightly thicker

interface FeedToggleHeaderProps {
    activeFeed: FeedType;
    onToggle: (feed: FeedType) => void;
}

export const FeedToggleHeader: React.FC<FeedToggleHeaderProps> = ({
    activeFeed,
    onToggle
}) => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const translateX = useSharedValue(0);

    useEffect(() => {
        translateX.value = withSpring(activeFeed === 'learning' ? 0 : BUTTON_WIDTH, {
            damping: 15,
            stiffness: 120
        });
    }, [activeFeed]);

    const highlightStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }]
    }));

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
            <BlurView intensity={90} tint="dark" style={styles.glassContainer}>
                {/* Highlight */}
                <Animated.View style={[styles.highlight, highlightStyle]} />

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => onToggle('learning')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.text, activeFeed === 'learning' && styles.activeText]}>Learning</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => onToggle('community')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.text, activeFeed === 'community' && styles.activeText]}>Community</Text>
                    </TouchableOpacity>
                </View>
            </BlurView>

            {/* Right Search Icon */}
            <TouchableOpacity
                style={[styles.searchButton, { top: insets.top + 10 }]}
                onPress={() => router.push('/search')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <BlurView intensity={80} tint="dark" style={styles.iconBlur}>
                    <MagnifyingGlassIcon color="white" size={18} />
                </BlurView>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center', // Center align
        paddingLeft: 0,
        zIndex: 100,
    },
    glassContainer: {
        flexDirection: 'row',
        borderRadius: 14, // Less rounded, not pill
        overflow: 'hidden',
        backgroundColor: 'rgba(30, 30, 30, 0.75)', // More evident glass background
        borderWidth: 1.5, // Thicker border
        borderColor: 'rgba(255,255,255,0.2)',
        height: BUTTON_HEIGHT,
        width: BUTTON_WIDTH * 2,
    },
    buttonRow: {
        flexDirection: 'row',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    button: {
        width: BUTTON_WIDTH,
        height: BUTTON_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    highlight: {
        position: 'absolute',
        width: BUTTON_WIDTH,
        height: BUTTON_HEIGHT,
        backgroundColor: 'rgba(255, 255, 255, 0.15)', // Stronger highlight
        borderRadius: 12, // Match container radius minus border
        margin: 1, // Slight inset
    },
    text: {
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '600',
        fontSize: 13,
        fontFamily: 'Montserrat_600SemiBold',
    },
    activeText: {
        color: '#F4D03F', // Gold accent
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    searchButton: {
        position: 'absolute',
        right: 20,
        height: BUTTON_HEIGHT,
        justifyContent: 'center',
        // Top is dynamic
    },
    iconBlur: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    }
});
