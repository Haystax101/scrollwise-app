import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InputField } from './InputField';
import { Button } from './Button';

interface EmailInputProps {
  onNext: (data: { email: string }) => void;
  onBack: () => void;
}

export const EmailInput: React.FC<EmailInputProps> = ({ onNext, onBack }) => {
  const [email, setEmail] = useState('');

  const handleNext = () => {
    if (email.trim()) {
      onNext({ email: email.trim() });
    }
  };

  const isValidEmail = email.includes('@') && email.includes('.');

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
        <Text style={styles.title}>What's your email?</Text>
        <Text style={styles.subtitle}>
          We'll use this to send you updates and keep your account secure
        </Text>

        <View style={styles.inputContainer}>
          <InputField
            label="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          fullWidth
          onPress={handleNext}
          disabled={!isValidEmail}
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
  footer: {
    paddingVertical: 32,
  },
});