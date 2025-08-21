import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getIndustryIcon, getIndustryColor } from '../../utils/industryIcons';

interface Industry {
  id: string;
  name: string;
  icon_name?: string;
}

interface IndustrySelectionPageProps {
  onBack: () => void;
  onSave: (industries: Industry[]) => void;
  initialIndustries?: Industry[];
}

const getIndustryIconColor = (industryName: string, isSelected: boolean): string => {
  return getIndustryColor(industryName, isSelected);
};

export const IndustrySelectionPage: React.FC<IndustrySelectionPageProps> = ({
  onBack,
  onSave,
  initialIndustries = []
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [availableIndustries, setAvailableIndustries] = useState<Industry[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<Industry[]>(initialIndustries);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchIndustries();
  }, []);

  const fetchIndustries = async () => {
    try {
      const { data, error } = await supabase
        .from('industries')
        .select('id, name, category')
        .order('is_popular', { ascending: false })
        .order('category')
        .order('name');

      if (error) throw error;
      setAvailableIndustries(data || []);
    } catch (error) {
      console.error('Error fetching industries:', error);
      Alert.alert('Error', 'Failed to load industries.');
    } finally {
      setLoading(false);
    }
  };

  const filteredIndustries = availableIndustries.filter(industry =>
    industry.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleIndustryToggle = (industry: Industry) => {
    const isSelected = selectedIndustries.some(selected => selected.id === industry.id);
    if (isSelected) {
      setSelectedIndustries(selectedIndustries.filter(selected => selected.id !== industry.id));
    } else {
      setSelectedIndustries([...selectedIndustries, industry]);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Delete existing user industries
      await supabase
        .from('user_industries')
        .delete()
        .eq('user_id', user.id);

      // Insert new selections
      if (selectedIndustries.length > 0) {
        const industryInserts = selectedIndustries.map(industry => ({
          user_id: user.id,
          industry_id: industry.id,
          stage: 'interested' // Default stage
        }));

        const { error } = await supabase
          .from('user_industries')
          .insert(industryInserts);

        if (error) throw error;
      }

      onSave(selectedIndustries);
      Alert.alert('Success', 'Industries updated successfully!');
    } catch (error) {
      console.error('Error saving industries:', error);
      Alert.alert('Error', 'Failed to save industries. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backText: {
      fontSize: 16,
      color: colors.primary,
      marginLeft: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    saveButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.primary,
      borderRadius: 20,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 14,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      margin: 20,
      height: 48,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
    },
    content: {
      flex: 1,
    },
    industriesContainer: {
      paddingHorizontal: 20,
      paddingBottom: 100, // Increased to clear tab navigation bar
    },
    industryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: colors.border,
    },
    industryItemSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    industryIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    industryIconSelected: {
      backgroundColor: colors.primary + '20',
    },
    industryName: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    industryNameSelected: {
      color: colors.primary,
    },
    loadingText: {
      textAlign: 'center',
      color: colors.textSecondary,
      marginTop: 40,
    },
    emptyText: {
      textAlign: 'center',
      color: colors.textSecondary,
      marginTop: 20,
      fontSize: 16,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading industries...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Select Industries</Text>
        
        <TouchableOpacity 
          style={[
            styles.saveButton, 
            saving && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search industries..."
          placeholderTextColor={colors.textTertiary}
          value={searchText}
          onChangeText={setSearchText}
          selectionColor={colors.primary}
        />
      </View>

      {/* Industries List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.industriesContainer}>
          {filteredIndustries.length === 0 ? (
            <Text style={styles.emptyText}>
              {searchText ? 'No industries found' : 'No industries available'}
            </Text>
          ) : (
            filteredIndustries.map((industry) => {
              const isSelected = selectedIndustries.some(selected => selected.id === industry.id);
              return (
                <TouchableOpacity
                  key={industry.id}
                  style={[
                    styles.industryItem,
                    isSelected && styles.industryItemSelected
                  ]}
                  onPress={() => handleIndustryToggle(industry)}
                >
                  <View style={[
                    styles.industryIcon,
                    isSelected && styles.industryIconSelected
                  ]}>
                    <Ionicons 
                      name={getIndustryIcon(industry.name) as any} 
                      size={20} 
                      color={getIndustryIconColor(industry.name, isSelected)} 
                    />
                  </View>
                  <Text style={[
                    styles.industryName,
                    isSelected && styles.industryNameSelected
                  ]}>
                    {industry.name}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};