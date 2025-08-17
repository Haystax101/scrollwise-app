import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InputField } from './InputField';
import { Button } from './Button';

interface PasswordSetupProps {
  onNext: (data: { password: string }) => void;
  onBack: () => void;
}

export const PasswordSetup: React.FC<PasswordSetupProps> = ({ onNext, onBack }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleNext = () => {
    if (password && password === confirmPassword) {
      onNext({ password });
    }
  };

  const isValidPassword = password.length >= 6;
  const passwordsMatch = password === confirmPassword;
  const canContinue = isValidPassword && passwordsMatch && confirmPassword.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Create a password</Text>
        <Text style={styles.subtitle}>
          Choose a strong password to keep your account secure
        </Text>

        <View style={styles.inputContainer}>
          <InputField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <InputField
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          
          {confirmPassword.length > 0 && !passwordsMatch && (
            <Text style={styles.errorText}>Passwords don't match</Text>
          )}
          
          {password.length > 0 && !isValidPassword && (
            <Text style={styles.errorText}>Password must be at least 6 characters</Text>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          fullWidth
          onPress={handleNext}
          disabled={!canContinue}
        >
          Continue
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 48,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
  },
  footer: {
    paddingVertical: 32,
  },
});