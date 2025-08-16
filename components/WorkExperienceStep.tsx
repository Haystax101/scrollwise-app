
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface WorkExperienceStepProps {
  onNext: () => void;
  onPrev: () => void;
  setData: (data: any) => void;
  data: any;
}

const WorkExperienceStep: React.FC<WorkExperienceStepProps> = ({ onNext, onPrev, setData, data }) => {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <ScrollView style={styles.content}>
          <Text style={styles.title}>Work Experience</Text>
          <TextInput
            style={styles.input}
            placeholder="Describe your relevant work experience, roles, and responsibilities"
            multiline
            value={data.description}
            onChangeText={(text) => setData({ ...data, description: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Current/Most Recent Company"
            value={data.company}
            onChangeText={(text) => setData({ ...data, company: text })}
            autoCapitalize="words"
          />
          <Picker
            selectedValue={data.experienceLevel}
            onValueChange={(itemValue, itemIndex) =>
            setData({ ...data, experienceLevel: itemValue })
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
          <TouchableOpacity style={[styles.button, styles.nextButton]} onPress={onNext}>
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
    backgroundColor: '#EAB308',
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
