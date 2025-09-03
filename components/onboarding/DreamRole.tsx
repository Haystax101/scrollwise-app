import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { DatabaseAutocompleteInput } from './DatabaseAutocompleteInput';
import { OnboardingPage } from './OnboardingPage';

interface DreamRoleProps {
  onNext: (data: { dreamRole: string; dreamCompany: string }) => void;
  onBack?: () => void;
}

interface AutocompleteResult {
  id: string;
  name: string;
  type: 'company' | 'occupation';
  category_or_industry?: string;
  context?: string;
  relevance_score: number;
}

export const DreamRole: React.FC<DreamRoleProps> = ({ onNext, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dreamRole, setDreamRole] = useState('');
  const [dreamCompany, setDreamCompany] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const handleRoleNext = () => {
    if (dreamRole.trim()) {
      setCurrentStep(1);
    }
  };

  const handleCompanyNext = () => {
    if (dreamCompany.trim()) {
      onNext({ 
        dreamRole: dreamRole.trim(), 
        dreamCompany: dreamCompany.trim() 
      });
    }
  };

  const handleStepBack = () => {
    if (currentStep === 1) {
      setCurrentStep(0);
    } else if (currentStep === 0 && onBack) {
      onBack(); // Go back to previous onboarding screen
    }
  };

  const handleRoleSelect = (item: AutocompleteResult) => {
    setSelectedRoleId(item.id);
  };

  const handleCompanySelect = (item: AutocompleteResult) => {
    setSelectedCompanyId(item.id);
  };

  const isValidRole = dreamRole.trim().length >= 2;
  const isValidCompany = dreamCompany.trim().length >= 2;

  if (currentStep === 0) {
    return (
      <OnboardingPage
        title="Dream Role"
        subtitle="What position would you love to have one day?"
        onNext={handleRoleNext}
        onBack={onBack ? handleStepBack : undefined}
        buttonText="Continue"
        buttonDisabled={!isValidRole}
      >
        <View style={styles.container}>
          <DatabaseAutocompleteInput
            label="Dream Role"
            value={dreamRole}
            onChangeText={setDreamRole}
            onSelect={handleRoleSelect}
            searchType="occupations"
            maxResults={6}
          />
        </View>
      </OnboardingPage>
    );
  }

  return (
    <OnboardingPage
      title="Dream Company"
      subtitle="Where would you love to work?"
      onNext={handleCompanyNext}
      onBack={handleStepBack}
      buttonText="Continue"
      buttonDisabled={!isValidCompany}
    >
      <View style={styles.container}>
        <DatabaseAutocompleteInput
          label="Dream Company"
          value={dreamCompany}
          onChangeText={setDreamCompany}
          onSelect={handleCompanySelect}
          searchType="companies"
          maxResults={6}
          countryFilter="GB"
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