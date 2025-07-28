
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import EducationBackgroundStep from './EducationBackgroundStep';
import IndustryStep from './IndustryStep';
import WorkExperienceStep from './WorkExperienceStep';
import CurrentProjectsStep from './CurrentProjectsStep';
import CareerGoalsStep from './CareerGoalsStep';

interface NewOnboardingProps {
  onComplete: () => void;
}

const NewOnboarding: React.FC<NewOnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const renderStep = () => {
    switch (step) {
      case 1:
        return <EducationBackgroundStep onNext={nextStep} />;
      case 2:
        return <IndustryStep onNext={nextStep} onPrev={prevStep} />;
      case 3:
        return <WorkExperienceStep onNext={nextStep} onPrev={prevStep} />;
      case 4:
        return <CurrentProjectsStep onNext={nextStep} onPrev={prevStep} />;
      case 5:
        return <CareerGoalsStep onComplete={onComplete} onPrev={prevStep} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Supercharged</Text>
        <Text style={styles.headerSubtitle}>Let's build your professional profile</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${step * 20}%` }]} />
        </View>
        <Text style={styles.progressText}>{step} of 5</Text>
      </View>
      {renderStep()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginBottom: 20,
    paddingTop: 40, // Add padding to ensure visibility
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6A0DAD',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6A0DAD',
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  progressBarFill: {
    height: 10,
    backgroundColor: '#6A0DAD',
    borderRadius: 5,
  },
  progressText: {
    textAlign: 'right',
    marginTop: 5,
    color: '#6A0DAD',
  },
});

export default NewOnboarding;
