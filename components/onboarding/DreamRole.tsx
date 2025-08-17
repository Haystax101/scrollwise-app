import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AutocompleteInput } from './AutocompleteInput';
import { OnboardingPage } from './OnboardingPage';

const loadJobTitles = async (): Promise<string[]> => {
  // UK-focused job titles for various industries
  return [
    'Software Engineer', 'Senior Software Engineer', 'Lead Software Engineer', 'Principal Software Engineer',
    'Software Architect', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
    'Mobile Developer', 'iOS Developer', 'Android Developer', 'React Developer', 'Angular Developer',
    'Vue.js Developer', 'Node.js Developer', 'Python Developer', 'Java Developer', 'C# Developer',
    'Product Manager', 'Senior Product Manager', 'Principal Product Manager', 'Director of Product',
    'Data Scientist', 'Data Analyst', 'Data Engineer', 'Machine Learning Engineer', 'AI Engineer',
    'UX Designer', 'UI Designer', 'Product Designer', 'Visual Designer', 'Interaction Designer',
    'DevOps Engineer', 'Site Reliability Engineer', 'Platform Engineer', 'Cloud Engineer',
    'Marketing Manager', 'Digital Marketing Manager', 'Content Marketing Manager', 'SEO Specialist',
    'Sales Engineer', 'Account Executive', 'Account Manager', 'Customer Success Manager',
    'Business Analyst', 'Systems Analyst', 'Financial Analyst', 'Quantitative Analyst',
    'Project Manager', 'Program Manager', 'Scrum Master', 'Agile Coach', 'Delivery Manager',
    'Engineering Manager', 'Tech Lead', 'Team Lead', 'Director of Engineering', 'VP of Engineering'
  ];
};

const loadCompanies = async (): Promise<string[]> => {
  // UK-focused companies across various industries
  return [
    'ASDA', 'ARM Holdings', 'ASOS', 'AstraZeneca', 'Aviva', 'BAE Systems', 'Barclays', 'BT Group',
    'BP', 'British Airways', 'Burberry', 'DeepMind', 'Deliveroo', 'Diageo', 'GSK', 'HSBC',
    'ITV', 'Lloyds Banking Group', 'Marks & Spencer', 'Monzo', 'National Grid', 'NatWest Group',
    'Next', 'NVIDIA UK', 'Ocado', 'Prudential', 'Rolls-Royce Holdings', 'Royal Mail', 'Sage Group',
    'Sainsbury\'s', 'Shell', 'Sky', 'Standard Chartered', 'Tesco', 'Unilever', 'Virgin Group',
    'Vodafone', 'WPP Group', 'Amazon UK', 'Apple UK', 'Microsoft UK', 'Google UK', 'Meta UK',
    'Netflix UK', 'Spotify UK', 'Uber UK', 'Airbnb UK', 'PayPal UK', 'eBay UK', 'LinkedIn UK',
    'Twitter UK', 'Zoom UK', 'Slack UK', 'Dropbox UK', 'Adobe UK', 'Salesforce UK', 'Oracle UK',
    'IBM UK', 'Intel UK', 'Cisco UK', 'VMware UK', 'Atlassian UK', 'GitHub UK', 'Stripe UK'
  ];
};

interface DreamRoleProps {
  onNext: (data: { dreamRole: string; dreamCompany: string }) => void;
}

export const DreamRole: React.FC<DreamRoleProps> = ({ onNext }) => {
  const [dreamRole, setDreamRole] = useState('');
  const [dreamCompany, setDreamCompany] = useState('');
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0); // 0 = role, 1 = company

  useEffect(() => {
    const loadData = async () => {
      const [jobs, comps] = await Promise.all([loadJobTitles(), loadCompanies()]);
      setJobTitles(jobs);
      setCompanies(comps);
    };
    loadData();
  }, []);

  const handleRoleNext = () => {
    if (jobTitles.includes(dreamRole.trim())) {
      setCurrentStep(1);
    }
  };

  const handleCompanyNext = () => {
    if (companies.includes(dreamCompany.trim())) {
      onNext({ 
        dreamRole: dreamRole.trim(), 
        dreamCompany: dreamCompany.trim() 
      });
    }
  };

  const handleStepBack = () => {
    if (currentStep === 1) {
      setCurrentStep(0);
    }
  };

  const isValidRole = jobTitles.includes(dreamRole.trim());
  const isValidCompany = companies.includes(dreamCompany.trim());

  if (currentStep === 0) {
    return (
      <OnboardingPage
        title="Dream Role"
        subtitle="What position would you love to have one day?"
        onNext={handleRoleNext}
        buttonText="Continue"
        buttonDisabled={!isValidRole}
      >
        <View style={styles.container}>
          <AutocompleteInput
            label="Dream Role"
            options={jobTitles}
            value={dreamRole}
            onChangeText={setDreamRole}
          />
        </View>
      </OnboardingPage>
    );
  }

  return (
    <OnboardingPage
      title="Dream Company"
      subtitle="Which company would you love to work for?"
      onBack={handleStepBack}
      onNext={handleCompanyNext}
      buttonText="Continue"
      buttonDisabled={!isValidCompany}
    >
      <View style={styles.container}>
        <View style={styles.selectedRoleContainer}>
          <Text style={styles.selectedRoleLabel}>Your Dream Role</Text>
          <Text style={styles.selectedRole}>{dreamRole}</Text>
        </View>
        <AutocompleteInput
          label="Dream Company"
          options={companies}
          value={dreamCompany}
          onChangeText={setDreamCompany}
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
  selectedRoleContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  selectedRoleLabel: {
    fontSize: 12,
    color: '#FBBF24',
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedRole: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
