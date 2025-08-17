import React from 'react';
import NewOnboarding from './NewOnboarding';

import type { Industry } from '../types';

interface OnboardingProps {
  onComplete: (interests: Industry[]) => void;
  onSignIn?: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onSignIn }) => {
  const handleComplete = () => {
    // For now, pass empty array for interests
    // This can be enhanced later to map selected industry to proper Industry objects
    onComplete([]);
  };

  return <NewOnboarding onComplete={handleComplete} onSignIn={onSignIn} />;
};