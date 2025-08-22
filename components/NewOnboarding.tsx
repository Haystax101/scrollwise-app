
import React from 'react';
import { MainOnboarding } from './onboarding/MainOnboarding';

interface NewOnboardingProps {
  onComplete: () => void;
  onSignIn?: () => void;
  tutorialOnly?: boolean;
  refreshMainFeed?: () => Promise<void>;
}

const NewOnboarding: React.FC<NewOnboardingProps> = ({ onComplete, onSignIn, tutorialOnly, refreshMainFeed }) => {
  return <MainOnboarding 
    onComplete={onComplete} 
    onSignIn={onSignIn} 
    tutorialOnly={tutorialOnly} 
    refreshMainFeed={refreshMainFeed} 
  />;
};

export default NewOnboarding;
