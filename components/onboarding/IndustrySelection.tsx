import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { OnboardingStepContent } from './OnboardingStepContent';
import { OnboardingStyles } from './styles';
import { getIndustryIcon, getIndustryColor } from '../../utils/industryIcons';
import * as Haptics from 'expo-haptics';

const industries = [
  { id: 'finance', name: 'Finance and Economics' },
  { id: 'politics', name: 'Politics and International Relations' },
  { id: 'entrepreneurship', name: 'Entrepreneurship and Startups' },
  { id: 'technology', name: 'Technology and AI' },
  { id: 'energy', name: 'Energy, Sustainability and Climate Innovation' },
  { id: 'law', name: 'Law' },
  { id: 'engineering', name: 'Engineering and Automotive' },
  { id: 'healthcare', name: 'Medicine and Healthcare' },
  { id: 'education', name: 'Education' },
];

interface IndustrySelectionProps {
  onNext: (data: { industries: typeof industries }) => void;
}

const getIndustryIconColor = (industryId: string, isSelected: boolean): string => {
  // Use explicit colours for dark mode visibility
  if (isSelected) return '#000000'; // Black icon on gold background
  return OnboardingStyles.accent; // Gold icon on dark background
};

export const IndustrySelection: React.FC<IndustrySelectionProps> = ({ onNext }) => {
  const [selectedIndustries, setSelectedIndustries] = useState<typeof industries>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredIndustries = industries.filter(industry =>
    industry.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleNext = () => {
    if (selectedIndustries.length > 0 && !isLoading) {
      setIsLoading(true);
      onNext({ industries: selectedIndustries });
      setTimeout(() => setIsLoading(false), 2000);
    }
  };

  const handleIndustryToggle = async (industry: typeof industries[0]) => {
    // Trigger haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isSelected = selectedIndustries.some(selected => selected.id === industry.id);
    if (isSelected) {
      setSelectedIndustries(selectedIndustries.filter(selected => selected.id !== industry.id));
    } else {
      setSelectedIndustries([...selectedIndustries, industry]);
    }
  };

  return (
    <OnboardingStepContent
      title="Select your industry"
      subtitle="Pick the topics you want to explore"
      onNext={handleNext}
      buttonText={isLoading ? "Saving..." : `Continue (${selectedIndustries.length} selected)`}
      buttonDisabled={selectedIndustries.length === 0 || isLoading}
    // Custom children container style to allow scrolling the list within the step content
    >
      {/* Search Bar */}
      <View style={styles.searchContainerWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={OnboardingStyles.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search industries..."
            placeholderTextColor={OnboardingStyles.textTertiary}
            value={searchText}
            onChangeText={setSearchText}
            selectionColor={OnboardingStyles.accent}
          />
        </View>
      </View>

      {/* Industries List */}
      <View style={styles.industriesWrapper}>
        {filteredIndustries.map((industry) => {
          const isSelected = selectedIndustries.some(selected => selected.id === industry.id);
          return (
            <TouchableOpacity
              key={industry.id}
              style={[
                styles.industryItem,
                isSelected && styles.industryItemSelected
              ]}
              onPress={() => handleIndustryToggle(industry)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.industryIcon,
                isSelected && styles.industryIconSelected
              ]}>
                {(() => {
                  const iconConfig = getIndustryIcon(industry.id);
                  const IconComponent = iconConfig.family === 'MaterialIcons' ? MaterialIcons :
                    iconConfig.family === 'FontAwesome' ? FontAwesome : Ionicons;
                  return (
                    <IconComponent
                      name={iconConfig.name as any}
                      size={24}
                      color={getIndustryIconColor(industry.id, isSelected)}
                    />
                  );
                })()}
              </View>
              <Text style={[
                styles.industryName,
                isSelected && styles.industryNameSelected
              ]}>
                {industry.name}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color={OnboardingStyles.buttonTextColor} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingStepContent>
  );
};

const styles = StyleSheet.create({
  searchContainerWrapper: {
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OnboardingStyles.inputBackground,
    borderRadius: OnboardingStyles.inputBorderRadius,
    paddingHorizontal: 16,
    height: OnboardingStyles.inputHeight,
    borderWidth: 1,
    borderColor: OnboardingStyles.borderColor,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: OnboardingStyles.textPrimary,
    fontSize: 16,
  },
  industriesWrapper: {
    paddingBottom: 20,
  },
  industryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: OnboardingStyles.cardBackground,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: OnboardingStyles.borderColor,
  },
  industryItemSelected: {
    backgroundColor: OnboardingStyles.accent,
    borderColor: OnboardingStyles.accent,
  },
  industryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(234, 179, 8, 0.1)', // customized dark mode bubble
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  industryIconSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  industryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: OnboardingStyles.textPrimary,
  },
  industryNameSelected: {
    color: OnboardingStyles.buttonTextColor,
  },
});