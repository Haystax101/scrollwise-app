
import React from 'react';
import { MainOnboarding } from './onboarding/MainOnboarding';

interface NewOnboardingProps {
  onComplete: () => void;
  onSignIn?: () => void;
}

const NewOnboarding: React.FC<NewOnboardingProps> = ({ onComplete, onSignIn }) => {
  return <MainOnboarding onComplete={onComplete} onSignIn={onSignIn} />;
};

export default NewOnboarding;
