

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';

interface IndustryStepProps {
  onNext: () => void;
  onPrev: () => void;
  setData: (data: any) => void;
  data: any;
}

const IndustryStep: React.FC<IndustryStepProps> = ({ onNext, onPrev, setData, data }) => {
  const [industries, setIndustries] = useState<any[]>([]);

  useEffect(() => {
    const fetchIndustries = async () => {
      const { data, error } = await supabase.from('industries').select('*');
      if (data) setIndustries(data);
    };

    fetchIndustries();
  }, []);

  // Ensure selectedIndustries is always an array
  const selectedIndustries = Array.isArray(data.selectedIndustries) ? data.selectedIndustries : [];

  const handleSelectIndustry = (industry: any) => {
    if (selectedIndustries.find((item: any) => item.id === industry.id)) {
      setData({ ...data, selectedIndustries: selectedIndustries.filter((item: any) => item.id !== industry.id) });
    } else {
      setData({ ...data, selectedIndustries: [...selectedIndustries, industry] });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Industry</Text>
        <Text style={styles.subtitle}>Your industry selections will be used to populate your feed.</Text>
        <View style={styles.industryList}>
          {industries.map((industry) => {
            const isSelected = selectedIndustries.some((item: any) => item.id === industry.id);
            return (
              <TouchableOpacity
                key={industry.id}
                style={[styles.industryItem, isSelected && styles.industryItemSelected]}
                onPress={() => handleSelectIndustry(industry)}
              >
                <View style={styles.iconContainer}>
                  {/* Placeholder for icon */}
                </View>
                <View>
                  <Text style={styles.industryName}>{industry.name}</Text>
                  <Text style={styles.industryDescription}>{industry.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.prevButton]} onPress={onPrev}>
          <Text style={styles.buttonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.nextButton]} onPress={onNext}>
          <Text style={styles.buttonText}>Next Step</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    marginBottom: 20,
  },
  industryList: {
    marginBottom: 20,
  },
  industryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
  },
  industryItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 15,
  },
  industryName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  industryDescription: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    width: '48%',
  },
  prevButton: {
    backgroundColor: '#ccc',
  },
  nextButton: {
    backgroundColor: '#6A0DAD',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default IndustryStep;

