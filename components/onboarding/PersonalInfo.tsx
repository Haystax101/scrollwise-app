import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InputField } from './InputField';
import { Button } from './Button';

interface PersonalInfoProps {
  onNext: (data: { firstName: string; lastName: string }) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const PersonalInfo: React.FC<PersonalInfoProps> = ({ onNext, onBack, isLoading = false }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleNext = () => {
    if (firstName.trim() && lastName.trim()) {
      onNext({ 
        firstName: firstName.trim(), 
        lastName: lastName.trim() 
      });
    }
  };

  const canContinue = firstName.trim().length > 0 && lastName.trim().length > 0;

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
        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.subtitle}>
          Help us personalize your experience
        </Text>

        <View style={styles.inputContainer}>
          <InputField
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
          />
          <InputField
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          fullWidth
          onPress={handleNext}
          disabled={!canContinue || isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Continue'}
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
    justifyContent: 'center',
    paddingBottom: 64,
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