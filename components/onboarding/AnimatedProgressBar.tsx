import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    Easing
} from 'react-native-reanimated';
import { OnboardingStyles } from './styles';

interface AnimatedProgressBarProps {
    progress: number; // 0 to 1
}

const { width } = Dimensions.get('window');

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({ progress }) => {
    const widthValue = useSharedValue(0);
    const glowOpacity = useSharedValue(0);

    useEffect(() => {
        // Smooth spring animation for the bar width
        widthValue.value = withSpring(Math.max(0.05, Math.min(progress, 1)), {
            damping: 15,
            stiffness: 100,
        });

        // Pulse effect when progress changes
        glowOpacity.value = withTiming(1, { duration: 300 }, () => {
            glowOpacity.value = withTiming(0, { duration: 500 });
        });
    }, [progress]);

    const barStyle = useAnimatedStyle(() => {
        return {
            width: `${widthValue.value * 100}%`,
        };
    });

    const glowStyle = useAnimatedStyle(() => {
        return {
            opacity: glowOpacity.value,
        };
    });

    return (
        <View style={styles.container}>
            <View style={styles.track}>
                <Animated.View style={[styles.fill, barStyle]}>
                    <Animated.View style={[styles.glow, glowStyle]} />
                    <View style={styles.shine} />
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 10,
        marginBottom: 20,
        height: 12,
        justifyContent: 'center',
    },
    track: {
        height: 12,
        backgroundColor: OnboardingStyles.progressBarTrack,
        borderRadius: 8,
        overflow: 'hidden',
        width: '100%',
        borderWidth: 1,
        borderColor: '#334155', // Slate 700
    },
    fill: {
        height: '100%',
        backgroundColor: OnboardingStyles.progressBarFill,
        borderRadius: 8,
        position: 'relative',
    },
    glow: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FFFFFF',
        opacity: 0,
    },
    shine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    }
});
