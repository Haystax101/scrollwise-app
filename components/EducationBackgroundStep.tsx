
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import {Picker} from '@react-native-picker/picker';

interface EducationBackgroundStepProps {
  onNext: () => void;
  setData: (data: any) => void;
  data: any;
}

const EducationBackgroundStep: React.FC<EducationBackgroundStepProps> = ({ onNext, setData, data }) => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Education Background</Text>
        <TextInput 
          style={styles.input} 
          placeholder="University/Institution" 
          value={data.institution}
          onChangeText={(text) => setData({ ...data, institution: text })}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Degree/Subject/Discipline" 
          value={data.degree}
          onChangeText={(text) => setData({ ...data, degree: text })}
        />
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={data.stage}
            onValueChange={(itemValue, itemIndex) =>
            setData({ ...data, stage: itemValue })
          }>
            <Picker.Item label="Bachelors" value="Bachelors" />
            <Picker.Item label="Masters" value="Masters" />
            <Picker.Item label="PhD" value="PhD" />
          </Picker>
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>Next Step</Text>
      </TouchableOpacity>
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
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#EAB308',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
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

export default EducationBackgroundStep;
