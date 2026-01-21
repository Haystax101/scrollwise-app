import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, SafeAreaView } from 'react-native';
import { OnboardingStyles } from './styles';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface LoginScreenProps {
    onSuccess: () => void;
    onBack: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess, onBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                setError(error.message);
            } else {
                onSuccess();
            }
        } catch (e) {
            setError('An unexpected error occurred.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.mainContainer}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={OnboardingStyles.textSecondary} />
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    style={styles.flex}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView contentContainerStyle={styles.scrollContent}>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>Sign in to continue your journey</Text>

                            <View style={styles.form}>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Email</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="you@example.com"
                                        placeholderTextColor={OnboardingStyles.textTertiary}
                                        value={email}
                                        onChangeText={(text) => {
                                            setEmail(text);
                                            setError(null);
                                        }}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        keyboardAppearance="dark"
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Password</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your password"
                                        placeholderTextColor={OnboardingStyles.textTertiary}
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            setError(null);
                                        }}
                                        secureTextEntry
                                        keyboardAppearance="dark"
                                    />
                                </View>

                                {error && <Text style={styles.errorText}>{error}</Text>}

                                <TouchableOpacity
                                    style={[styles.button, isLoading && styles.buttonDisabled]}
                                    onPress={handleLogin}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.buttonText}>
                                        {isLoading ? 'Signing In...' : 'Sign In'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
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
        height: 60,
        justifyContent: 'center',
        paddingHorizontal: OnboardingStyles.containerPaddingHorizontal,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: OnboardingStyles.containerPaddingHorizontal,
        paddingTop: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: OnboardingStyles.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: OnboardingStyles.textSecondary,
        marginBottom: 40,
    },
    form: {
        gap: 20,
    },
    inputContainer: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: OnboardingStyles.textSecondary,
    },
    input: {
        height: OnboardingStyles.inputHeight,
        backgroundColor: OnboardingStyles.inputBackground,
        borderRadius: OnboardingStyles.inputBorderRadius,
        paddingHorizontal: 16,
        color: OnboardingStyles.textPrimary,
        fontSize: 16,
        borderWidth: 1,
        borderColor: OnboardingStyles.borderColor,
    },
    errorText: {
        color: OnboardingStyles.error,
        fontSize: 14,
        textAlign: 'center',
    },
    button: {
        height: OnboardingStyles.buttonHeight,
        backgroundColor: OnboardingStyles.accent,
        borderRadius: OnboardingStyles.buttonBorderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: OnboardingStyles.buttonTextColor,
    },
});
