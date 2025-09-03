import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { DatabaseAutocompleteInput } from './DatabaseAutocompleteInput';
import { OnboardingPage } from './OnboardingPage';

interface CurrentWorkProps {
  onNext: (data: { currentRole: string; currentCompany: string }) => void;
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

export const CurrentWork: React.FC<CurrentWorkProps> = ({ onNext, onBack }) => {
  const [currentRole, setCurrentRole] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const handleNext = () => {
    // Allow empty values for current work (user might be unemployed/student)
    onNext({ 
      currentRole: currentRole.trim(), 
      currentCompany: currentCompany.trim() 
    });
  };

  const handleRoleSelect = (item: AutocompleteResult) => {
    setSelectedRoleId(item.id);
  };

  const handleCompanySelect = (item: AutocompleteResult) => {
    setSelectedCompanyId(item.id);
  };

  return (
    <OnboardingPage
      title="Current Work"
      subtitle="Tell us about your current position (leave blank if unemployed or student)"
      onNext={handleNext}
      onBack={onBack}
      buttonText="Continue"
    >
      <View style={styles.container}>
        <DatabaseAutocompleteInput
          label="Current Role"
          value={currentRole}
          onChangeText={setCurrentRole}
          onSelect={handleRoleSelect}
          searchType="occupations"
          maxResults={6}
        />
        <DatabaseAutocompleteInput
          label="Current Company"
          value={currentCompany}
          onChangeText={setCurrentCompany}
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
