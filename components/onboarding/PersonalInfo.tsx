import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { InputField } from './InputField';
import { OnboardingPage } from './OnboardingPage';

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
    <OnboardingPage
      title="Tell us about yourself"
      subtitle="Help us personalize your experience"
      onBack={onBack}
      onNext={handleNext}
      buttonText={isLoading ? 'Creating Account...' : 'Continue'}
      buttonDisabled={!canContinue || isLoading}
    >
      <View style={styles.container}>
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
    </OnboardingPage>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 20, // Add some space from the title
  },
});
