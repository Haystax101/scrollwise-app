import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, FlatList, TouchableOpacity, Animated } from 'react-native';

interface AutocompleteInputProps {
  label: string;
  options: string[];
  value: string;
  onChangeText: (text: string) => void;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  label,
  options,
  value,
  onChangeText,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const inputRef = useRef<TextInput>(null);

  const filteredOptions = options
    .filter(option => option.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 3); // Limit to 3 results

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, animatedValue]);

  const handleFocus = () => {
    setIsFocused(true);
    if (value.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Use a timeout to allow the press on a dropdown item to register
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  const handleTextChange = (text: string) => {
    onChangeText(text);
    if (text.length > 0) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    onChangeText(option);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const labelStyle = {
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 4],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: isFocused ? '#FBBF24' : '#9CA3AF',
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.inputContainer}
        onPress={() => {
          inputRef.current?.focus();
        }}
        activeOpacity={1}
      >
        <Animated.Text style={[styles.label, labelStyle]}>
          {label}
        </Animated.Text>
        <TextInput
          ref={inputRef}
          style={[styles.input, isFocused && styles.inputFocused]}
          value={value}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor="#FBBF24"
        />
      </TouchableOpacity>
      {showDropdown && filteredOptions.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleOptionSelect(item)}
              >
                <Text style={styles.dropdownItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 16,
    zIndex: 1, // Let parent control stacking
  },
  inputContainer: {
    // This now wraps the input and label for focus handling
  },
  input: {
    height: 56,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#4B5563',
    color: '#FFFFFF',
    fontSize: 16,
  },
  inputFocused: {
    borderBottomColor: '#FBBF24',
  },
  label: {
    position: 'absolute',
    left: 16,
    fontWeight: '400',
    zIndex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: 60, // Position below the input
    left: 0,
    right: 0,
    backgroundColor: '#2b394d',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 8,
    maxHeight: 150,
    zIndex: 100, // Ensure dropdown is above other elements in the same container
    elevation: 100,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4B5563',
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
