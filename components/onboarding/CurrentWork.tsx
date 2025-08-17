import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InputField } from './InputField';
import { Button } from './Button';

interface CurrentWorkProps {
  onNext: (data: { currentRole: string; currentCompany: string }) => void;
  onBack: () => void;
}

export const CurrentWork: React.FC<CurrentWorkProps> = ({ onNext, onBack }) => {
  const [currentRole, setCurrentRole] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');

  const handleNext = () => {
    // Allow empty values for current work (user might be unemployed/student)
    onNext({ 
      currentRole: currentRole.trim(), 
      currentCompany: currentCompany.trim() 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Current Work</Text>
        <Text style={styles.subtitle}>
          Tell us about your current position (leave blank if unemployed or student)
        </Text>

        <View style={styles.inputContainer}>
          <InputField
            label="Current Role"
            value={currentRole}
            onChangeText={setCurrentRole}
          />
          <InputField
            label="Current Company"
            value={currentCompany}
            onChangeText={setCurrentCompany}
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          fullWidth
          onPress={handleNext}
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
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 48,
    lineHeight: 24,
  },
  inputContainer: {
    marginTop: 24,
  },
  footer: {
    paddingVertical: 32,
  },
});