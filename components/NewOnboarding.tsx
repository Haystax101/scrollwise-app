
import React from 'react';
import { MainOnboarding } from './onboarding/MainOnboarding';

interface NewOnboardingProps {
  onComplete: () => void;
  onSignIn?: () => void;
  tutorialOnly?: boolean;
}

const NewOnboarding: React.FC<NewOnboardingProps> = ({ onComplete, onSignIn, tutorialOnly }) => {
  return <MainOnboarding onComplete={onComplete} onSignIn={onSignIn} tutorialOnly={tutorialOnly} />;
};

export default NewOnboarding;
