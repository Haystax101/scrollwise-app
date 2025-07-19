import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, TextStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ReactNode } from 'react';

interface CustomCheckboxProps {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean; // Currently not used for validation display
  accessibilityLabelText?: string;
  labelStyle?: TextStyle; // Add style prop for label text
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ 
  label, 
  checked, 
  onChange, 
  accessibilityLabelText,
  labelStyle 
}) => {
  const labelText = typeof label === 'string' ? label : accessibilityLabelText || "Checkbox";
  return (
    <TouchableOpacity 
      onPress={() => onChange(!checked)} 
      style={styles.container}
      accessibilityLabel={labelText}
      accessibilityState={{ checked }}
      accessibilityRole="checkbox"
    >
      <View 
        style={[styles.checkbox, checked ? styles.checkedBox : styles.uncheckedBox]}
      >
        {checked && <Feather name="check" color="white" size={12} />}
      </View>
      <View style={styles.labelContainer}>
        {typeof label === 'string' ? (
          <Text style={[styles.labelText, labelStyle]}>{label}</Text>
        ) : (
          label
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 6,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#2563EB', // blue-600
    borderColor: '#2563EB',
  },
  uncheckedBox: {
    borderColor: '#d1d5db', // gray-300
    backgroundColor: 'transparent',
  },
  labelContainer: {
    flex: 1,
  },
  labelText: {
    fontSize: 14,
    color: '#111827', // gray-900
  },
});
