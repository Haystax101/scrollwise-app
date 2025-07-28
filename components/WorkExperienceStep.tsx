
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';

interface WorkExperienceStepProps {
  onNext: () => void;
  onPrev: () => void;
}

const WorkExperienceStep: React.FC<WorkExperienceStepProps> = ({ onNext, onPrev }) => {
  const [experienceLevel, setExperienceLevel] = useState<string | null>(null);
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const { user } = useAuth();

  // Helper to upsert company and return its id
  const upsertCompany = async (companyName: string) => {
    if (!companyName.trim()) return null;
    // Try to find company first
    let { data: existing, error } = await supabase
      .from('companies')
      .select('id')
      .eq('name', companyName.trim())
      .maybeSingle();
    if (existing && existing.id) return existing.id;
    // Insert if not found
    const { data: inserted, error: insertError } = await supabase
      .from('companies')
      .insert([{ name: companyName.trim() }])
      .select('id')
      .single();
    return inserted?.id || null;
  };

  const handleNext = async () => {
    if (!user?.id) {
      alert('User not found. Please sign in again.');
      return;
    }
    // Save work experience if company or description or experienceLevel is provided
    if (company.trim() || description.trim() || experienceLevel) {
      const companyId = await upsertCompany(company);
      await supabase.from('user_experiences').insert({
        user_id: user.id,
        company_id: companyId,
        title: '', // You can add a title field if you collect it
        description: description.trim(),
        experience_level: experienceLevel,
      });
    }
    onNext();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <ScrollView style={styles.content}>
          <Text style={styles.title}>Work Experience</Text>
          <TextInput
            style={styles.input}
            placeholder="Describe your relevant work experience, roles, and responsibilities"
            multiline
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
            style={styles.input}
            placeholder="Current/Most Recent Company"
            value={company}
            onChangeText={setCompany}
            autoCapitalize="words"
          />
          <Picker
            selectedValue={experienceLevel}
            onValueChange={(itemValue, itemIndex) =>
            setExperienceLevel(itemValue)
          }>
            <Picker.Item label="Select Experience Level" value={null} />
            <Picker.Item label="Unemployed" value={"Unemployed"} />
            <Picker.Item label="Student" value="Student" />
            <Picker.Item label="Intern" value="Intern" />
            <Picker.Item label="Entry Level" value="Entry Level" />
            <Picker.Item label="Mid Level" value="Mid Level" />
            <Picker.Item label="Senior" value="Senior" />
            <Picker.Item label="Executive" value="Executive" />
          </Picker>
        </ScrollView>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.prevButton]} onPress={onPrev}>
            <Text style={styles.buttonText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.nextButton]} onPress={handleNext}>
            <Text style={styles.buttonText}>Next Step</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
  },
});

export default WorkExperienceStep;
