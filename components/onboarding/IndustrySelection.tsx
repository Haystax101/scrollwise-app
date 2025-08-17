import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';

const industries = [
  { id: 'finance', name: 'Finance and Economics', icon: 'briefcase-outline' },
  { id: 'politics', name: 'Politics, Law and International Relations', icon: 'globe-outline' },
  { id: 'entrepreneurship', name: 'Entrepreneurship and Startups', icon: 'rocket-outline' },
  { id: 'technology', name: 'Technology and AI', icon: 'desktop-outline' },
  { id: 'energy', name: 'Energy, Sustainability and Climate Innovation', icon: 'leaf-outline' },
  { id: 'creative', name: 'Creative Industries and the Arts', icon: 'color-palette-outline' },
  { id: 'engineering', name: 'Engineering and Automotive', icon: 'construct-outline' },
  { id: 'healthcare', name: 'Medicine and Healthcare', icon: 'medkit-outline' },
  { id: 'education', name: 'Education', icon: 'school-outline' },
];

interface IndustrySelectionProps {
  onNext: (data: { industries: typeof industries }) => void;
  onBack: () => void;
}

export const IndustrySelection: React.FC<IndustrySelectionProps> = ({ onNext, onBack }) => {
  const [selectedIndustries, setSelectedIndustries] = useState<typeof industries>([]);
  const [searchText, setSearchText] = useState('');

  const filteredIndustries = industries.filter(industry =>
    industry.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleNext = () => {
    if (selectedIndustries.length > 0) {
      onNext({ industries: selectedIndustries });
    }
  };

  const handleIndustryToggle = (industry: typeof industries[0]) => {
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
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select your industry</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search industries..."
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={setSearchText}
          selectionColor="#FBBF24"
        />
      </View>

      {/* Industries List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                <Ionicons 
                  name={industry.icon as any} 
                  size={24} 
                  color={isSelected ? '#000000' : '#FBBF24'} 
                />
              </View>
              <Text style={[
                styles.industryName,
                isSelected && styles.industryNameSelected
              ]}>
                {industry.name}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color="#000000" />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          fullWidth
          onPress={handleNext}
          disabled={selectedIndustries.length === 0}
        >
          Continue ({selectedIndustries.length} selected)
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
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  industryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  industryItemSelected: {
    backgroundColor: '#FBBF24',
    borderColor: '#F59E0B',
  },
  industryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  industryIconSelected: {
    backgroundColor: '#F59E0B',
  },
  industryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  industryNameSelected: {
    color: '#000000',
  },
  footer: {
    paddingVertical: 32,
  },
});