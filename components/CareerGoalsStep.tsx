
import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface CareerGoalsStepProps {
  onComplete: () => void;
  onPrev: () => void;
  setData: (data: any) => void;
  data: any;
}

const CareerGoalsStep: React.FC<CareerGoalsStepProps> = ({ onComplete, onPrev, setData, data }) => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Career Path & Goals</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Long-term Career Goal" 
          value={data.goal}
          onChangeText={(text) => setData({ ...data, goal: text })}
        />
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={data.timeframe}
            onValueChange={(itemValue, itemIndex) =>
            setData({ ...data, timeframe: itemValue })
          }>
            <Picker.Item label="Select Timeframe" value={null} />
            <Picker.Item label="1 year" value="1 year" />
            <Picker.Item label="2 years" value="2 years" />
            <Picker.Item label="3 years" value="3 years" />
            <Picker.Item label="4 years" value="4 years" />
            <Picker.Item label="5 years" value="5 years" />
            <Picker.Item label=">5 years" value=">5 years" />
          </Picker>
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.prevButton]} onPress={onPrev}>
          <Text style={styles.buttonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.nextButton]} onPress={onComplete}>
          <Text style={styles.buttonText}>Complete Profile</Text>
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
    marginBottom: 20,
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
    marginTop: 20,
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

export default CareerGoalsStep;
