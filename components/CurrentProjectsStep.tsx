
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface CurrentProjectsStepProps {
  onNext: () => void;
  onPrev: () => void;
  setData: (data: any) => void;
  data: any;
}

const CurrentProjectsStep: React.FC<CurrentProjectsStepProps> = ({ onNext, onPrev, setData, data }) => {
  // Ensure projects is always an array
  const projects = Array.isArray(data.projects) ? data.projects : [];

  const handleAddProject = () => {
    setData({ ...data, projects: [...projects, { name: '', description: '' }] });
  };

  const handleProjectChange = (index: number, field: string, value: string) => {
    const newProjects = [...projects];
    newProjects[index][field] = value;
    setData({ ...data, projects: newProjects });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Current Projects</Text>
        {projects.map((project: any, index: number) => (
          <View key={index}>
            <TextInput
              style={styles.input}
              placeholder="Project Name"
              value={project.name}
              onChangeText={(text) => handleProjectChange(index, 'name', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Project Description"
              value={project.description}
              onChangeText={(text) => handleProjectChange(index, 'description', text)}
              multiline
            />
          </View>
        ))}
        <TouchableOpacity onPress={handleAddProject}>
          <Text style={styles.addProjectText}>+ Add Another Project</Text>
        </TouchableOpacity>
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
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  addProjectText: {
    color: '#6A0DAD',
    marginBottom: 20,
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
});

export default CurrentProjectsStep;
