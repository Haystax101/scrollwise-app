import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

interface SettingsProps {
  navigateTo: (screen: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ navigateTo }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigateTo('signIn');
  };

  const handleContentPreferences = () => {
    navigateTo('onboarding');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Button title="Content Preferences" onPress={handleContentPreferences} />
      <Button title="Log Out" color="red" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
});

export default Settings;
