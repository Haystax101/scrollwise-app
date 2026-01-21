import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStyles } from './styles';
import { AnimatedProgressBar } from './AnimatedProgressBar';

interface OnboardingLayoutProps {
    children: React.ReactNode;
    currentStep: number;
    totalSteps: number;
    onBack?: () => void;
    showBack?: boolean;
    showProgressBar?: boolean;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
    children,
    currentStep,
    totalSteps,
    onBack,
    showBack = true,
    showProgressBar = true,
}) => {
    const progress = totalSteps > 0 ? (currentStep + 1 / totalSteps) : 0;
    // Calculate raw progress ratio 0-1 based on steps (1-based or 0-based to be decided)
    // Assuming currentStep is 0-based index. 
    const progressValue = totalSteps > 0 ? (currentStep + 1) / totalSteps : 0;

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={styles.safeArea}>
                {/* Header Area */}
                <View style={styles.header}>
                    <View style={styles.leftContainer}>
                        {showBack && onBack ? (
                            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color={OnboardingStyles.textSecondary} />
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.backButtonPlaceholder} />
                        )}
                    </View>

                    <View style={styles.progressContainer}>
                        {showProgressBar && (
                            <AnimatedProgressBar progress={progressValue} />
                        )}
                    </View>

                    <View style={styles.rightContainer} />
                </View>

                {/* Content Area */}
                <View style={styles.contentContainer}>
                    {children}
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: OnboardingStyles.backgroundColor,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 60,
        width: '100%',
        zIndex: 10,
    },
    leftContainer: {
        width: 40,
        alignItems: 'flex-start',
    },
    rightContainer: {
        width: 40,
    },
    progressContainer: {
        flex: 1,
        paddingHorizontal: 12,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    backButtonPlaceholder: {
        width: 40,
    },
    contentContainer: {
        flex: 1,
    },
});
