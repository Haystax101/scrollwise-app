import React from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';
import { Button } from './Button';
import { OnboardingStyles } from './styles';

interface OnboardingStepContentProps {
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    onNext?: () => void;
    buttonText?: string;
    buttonDisabled?: boolean;
    alternativeComponent?: React.ReactNode; // For things like "Already have an account?"
}

export const OnboardingStepContent: React.FC<OnboardingStepContentProps> = ({
    title,
    subtitle,
    children,
    onNext,
    buttonText = "Continue",
    buttonDisabled = false,
    alternativeComponent,
}) => {
    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {(title || subtitle) && (
                            <View style={styles.headerContainer}>
                                {title && <Text style={styles.title}>{title}</Text>}
                                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                            </View>
                        )}

                        <View style={styles.body}>
                            {children}
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        {onNext && (
                            <Button
                                onPress={onNext}
                                disabled={buttonDisabled}
                                style={styles.button}
                                textStyle={{ color: OnboardingStyles.buttonTextColor }}
                            >
                                {buttonText}
                            </Button>
                        )}
                        {alternativeComponent}
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: OnboardingStyles.containerPaddingHorizontal,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 24,
        paddingBottom: 100, // Extra space for footer
    },
    headerContainer: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '800', // Extra bold for headers
        color: OnboardingStyles.textPrimary,
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: OnboardingStyles.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    body: {
        flex: 1,
        width: '100%',
    },
    footer: {
        paddingVertical: OnboardingStyles.footerPaddingVertical,
        alignItems: 'center',
        marginBottom: 10,
    },
    button: {
        width: '100%',
    },
});
