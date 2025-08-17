import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AutocompleteInput } from './AutocompleteInput';
import { Button } from './Button';

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
  onBack: () => void;
}

export const DreamRole: React.FC<DreamRoleProps> = ({ onNext, onBack }) => {
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
    } else {
      onBack();
    }
  };

  const isValidRole = jobTitles.includes(dreamRole.trim());
  const isValidCompany = companies.includes(dreamCompany.trim());

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleStepBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {currentStep === 0 ? 'Dream Role' : 'Dream Company'}
          </Text>
          <Text style={styles.subtitle}>
            {currentStep === 0 
              ? 'What position would you love to have one day?'
              : 'Which company would you love to work for?'
            }
          </Text>
        </View>

        <View style={styles.inputContainer}>
          {currentStep === 0 && (
            <View style={styles.inputWrapper}>
              <AutocompleteInput
                label="Dream Role"
                options={jobTitles}
                value={dreamRole}
                onChangeText={setDreamRole}
              />
            </View>
          )}
          
          {currentStep === 1 && (
            <>
              {/* Show selected role */}
              <View style={styles.selectedRoleContainer}>
                <Text style={styles.selectedRoleLabel}>Your Dream Role</Text>
                <Text style={styles.selectedRole}>{dreamRole}</Text>
              </View>
              
              <View style={styles.inputWrapper}>
                <AutocompleteInput
                  label="Dream Company"
                  options={companies}
                  value={dreamCompany}
                  onChangeText={setDreamCompany}
                />
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          fullWidth
          onPress={currentStep === 0 ? handleRoleNext : handleCompanyNext}
          disabled={currentStep === 0 ? !isValidRole : !isValidCompany}
        >
          Continue
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  textContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  inputContainer: {
    paddingHorizontal: 16,
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 80, // More space between inputs to accommodate dropdowns
    zIndex: 1000,
  },
  footer: {
    paddingVertical: 32,
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