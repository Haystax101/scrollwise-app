import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { Button } from './Button';
import { OnboardingStyles } from './styles';
import { getIndustryIcon, getIndustryColor, LEGACY_INDUSTRY_MAPPING } from '../../utils/industryIcons';
import * as Haptics from 'expo-haptics';

const industries = [
  { id: 'finance', name: 'Finance and Economics' },
  { id: 'politics', name: 'Politics and International Relations' },
  { id: 'entrepreneurship', name: 'Entrepreneurship and Startups' },
  { id: 'technology', name: 'Technology and AI' },
  { id: 'energy', name: 'Energy, Sustainability and Climate Innovation' },
  { id: 'creative', name: 'Creative Industries and the Arts' },
  { id: 'engineering', name: 'Engineering and Automotive' },
  { id: 'healthcare', name: 'Medicine and Healthcare' },
  { id: 'education', name: 'Education' },
];

interface IndustrySelectionProps {
  onNext: (data: { industries: typeof industries }) => void;
}

const getIndustryIconColor = (industryId: string, isSelected: boolean): string => {
  return getIndustryColor(industryId, isSelected);
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select your industry</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainerWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search industries..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
            selectionColor="#F59E0B"
          />
        </View>
      </View>

      {/* Industries List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                <Ionicons name="checkmark-circle" size={24} color="#F59E0B" />
              )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          onPress={handleNext}
          disabled={selectedIndustries.length === 0 || isLoading}
        >
          {isLoading ? "Saving..." : `Continue (${selectedIndustries.length} selected)`}
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OnboardingStyles.backgroundColor,
    paddingHorizontal: OnboardingStyles.containerPaddingHorizontal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingTop: 120, // Move down to accommodate progress bar overlay (60px top + 60px progress bar area)
    marginBottom: OnboardingStyles.contentMarginBottom,
    height: OnboardingStyles.headerHeight + 104, // Increase height for extra padding
    paddingHorizontal: OnboardingStyles.textPaddingHorizontal, // Added text padding
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: OnboardingStyles.textPrimary,
  },
  searchContainerWrapper: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#1F2937',
    fontSize: 16,
    letterSpacing: 0,
  },
  content: {
    flex: 1,
    maxHeight: '60%', // Limit content height to make room for moved header
  },
  industriesWrapper: {
    paddingHorizontal: 16,
  },
  industryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  industryItemSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  industryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  industryIconSelected: {
    backgroundColor: '#FEF3C7',
  },
  industryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  industryNameSelected: {
    color: '#1F2937',
  },
  footer: {
    paddingVertical: OnboardingStyles.footerPaddingVertical,
    paddingHorizontal: OnboardingStyles.footerPaddingHorizontal,
    alignItems: 'center',
  },
});