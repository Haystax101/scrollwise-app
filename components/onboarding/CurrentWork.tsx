import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { InputField } from './InputField';
import { OnboardingPage } from './OnboardingPage';

interface CurrentWorkProps {
  onNext: (data: { currentRole: string; currentCompany: string }) => void;
}

export const CurrentWork: React.FC<CurrentWorkProps> = ({ onNext }) => {
  const [currentRole, setCurrentRole] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');

  const handleNext = () => {
    // Allow empty values for current work (user might be unemployed/student)
    onNext({ 
      currentRole: currentRole.trim(), 
      currentCompany: currentCompany.trim() 
    });
  };

  return (
    <OnboardingPage
      title="Current Work"
      subtitle="Tell us about your current position (leave blank if unemployed or student)"
      onNext={handleNext}
      buttonText="Continue"
    >
      <View style={styles.container}>
        <InputField
          label="Current Role"
          value={currentRole}
          onChangeText={setCurrentRole}
        />
        <InputField
          label="Current Company"
          value={currentCompany}
          onChangeText={setCurrentCompany}
        />
      </View>
    </OnboardingPage>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});
