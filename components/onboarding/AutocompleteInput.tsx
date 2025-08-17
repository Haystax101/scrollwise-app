import React, { useState, useRef } from 'react';
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
  const animatedValue = new Animated.Value(value ? 1 : 0);
  const inputRef = useRef<TextInput>(null);

  const filteredOptions = options
    .filter(option => option.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 3); // Limit to 3 results

  const handleFocus = () => {
    setIsFocused(true);
    setShowDropdown(value.length > 0);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTimeout(() => setShowDropdown(false), 300); // Increased delay for better touch handling
    if (!value) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleTextChange = (text: string) => {
    onChangeText(text);
    setShowDropdown(text.length > 0);
  };

  const handleOptionSelect = (option: string) => {
    onChangeText(option);
    setShowDropdown(false);
    inputRef.current?.blur(); // Manually blur to hide keyboard
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
    <TouchableOpacity
      style={styles.container}
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
      {showDropdown && filteredOptions.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={filteredOptions}
            keyExtractor={(item, index) => index.toString()}
            style={styles.dropdownList}
            nestedScrollEnabled={true}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleOptionSelect(item)}
                delayPressIn={0}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 16,
    zIndex: 1000,
    elevation: 1000, // For Android
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
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 144, // Reduced height for 3 items
    zIndex: 2000,
    elevation: 2000, // For Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dropdownList: {
    maxHeight: 144,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4B5563',
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});