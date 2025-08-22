import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, TextInput, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';

interface AutocompleteResult {
  id: string;
  name: string;
  type: 'company' | 'occupation';
  category_or_industry?: string;
  context?: string;
  relevance_score: number;
}

interface DatabaseAutocompleteInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelect?: (item: AutocompleteResult) => void;
  searchType: 'companies' | 'occupations' | 'mixed';
  debounceMs?: number;
  maxResults?: number;
  countryFilter?: string; // For companies
  categoryFilter?: string; // For occupations
}

export const DatabaseAutocompleteInput: React.FC<DatabaseAutocompleteInputProps> = ({
  label,
  value,
  onChangeText,
  onSelect,
  searchType,
  debounceMs = 250,
  maxResults = 8,
  countryFilter,
  categoryFilter,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [results, setResults] = useState<AutocompleteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, animatedValue]);

  const searchDatabase = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let data, error;

      switch (searchType) {
        case 'companies':
          ({ data, error } = await supabase.rpc('search_companies', {
            query_text: query,
            result_limit: maxResults,
            country_filter: countryFilter
          }));
          break;
        
        case 'occupations':
          ({ data, error } = await supabase.rpc('search_occupations', {
            query_text: query,
            result_limit: maxResults,
            category_filter: categoryFilter
          }));
          break;
        
        case 'mixed':
          ({ data, error } = await supabase.rpc('search_mixed', {
            query_text: query,
            result_limit: maxResults
          }));
          break;
      }

      if (error) {
        console.error('Search error:', error);
        setResults([]);
      } else {
        // Transform results to consistent format
        const transformedResults: AutocompleteResult[] = (data || []).map((item: any) => ({
          id: item.id,
          name: searchType === 'occupations' ? item.title : item.name,
          type: searchType === 'mixed' ? item.type : searchType.slice(0, -1) as 'company' | 'occupation',
          category_or_industry: item.category_or_industry || item.industry_sector || item.category,
          context: item.context,
          relevance_score: item.relevance_score
        }));
        
        setResults(transformedResults);
      }
    } catch (err) {
      console.error('Database search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchType, maxResults, countryFilter, categoryFilter]);

  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchDatabase(query);
    }, debounceMs);
  }, [searchDatabase, debounceMs]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    if (value.length >= 2) {
      setShowDropdown(true);
      if (results.length === 0) {
        debouncedSearch(value);
      }
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
    
    if (text.length >= 2) {
      setShowDropdown(true);
      debouncedSearch(text);
    } else {
      setShowDropdown(false);
      setResults([]);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    }
  };

  const handleOptionSelect = async (item: AutocompleteResult) => {
    onChangeText(item.name);
    setShowDropdown(false);
    inputRef.current?.blur();
    
    // Record selection for popularity tracking
    try {
      await supabase.rpc('record_selection', {
        entity_type: item.type,
        entity_id: item.id,
        query_text: value
      });
    } catch (error) {
      console.log('Failed to record selection:', error);
    }
    
    if (onSelect) {
      onSelect(item);
    }
  };

  const renderResultItem = ({ item }: { item: AutocompleteResult }) => {
    const highlightedName = highlightMatch(item.name, value);
    
    return (
      <TouchableOpacity
        style={styles.dropdownItem}
        onPress={() => handleOptionSelect(item)}
      >
        <View style={styles.itemContent}>
          <Text style={styles.itemName}>{highlightedName}</Text>
          {item.context && (
            <Text style={styles.itemContext}>{item.context}</Text>
          )}
          {searchType === 'mixed' && (
            <View style={styles.typeTag}>
              <Text style={styles.typeTagText}>
                {item.type === 'company' ? 'Company' : 'Job Title'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const highlightMatch = (text: string, query: string) => {
    // Simple highlighting - in production you might want more sophisticated matching
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <Text>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <Text key={index} style={styles.highlight}>{part}</Text>
          ) : (
            part
          )
        )}
      </Text>
    );
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
    color: isFocused ? '#F59E0B' : '#6B7280',
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
          autoCapitalize="words"
          autoCorrect={false}
        />
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#F59E0B" />
          </View>
        )}
      </TouchableOpacity>
      
      {showDropdown && (results.length > 0 || loading) && (
        <View style={styles.dropdown}>
          {loading && results.length === 0 ? (
            <View style={styles.loadingItem}>
              <ActivityIndicator size="small" color="#F59E0B" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              style={styles.resultsScrollView}
            >
              {results.map((item, index) => (
                <React.Fragment key={item.id || index}>
                  {renderResultItem({ item })}
                </React.Fragment>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 16,
    zIndex: 1,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    height: 56,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    paddingRight: 40, // Space for loading indicator
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    color: '#1F2937',
    fontSize: 16,
  },
  inputFocused: {
    borderBottomColor: '#F59E0B',
  },
  label: {
    position: 'absolute',
    left: 16,
    fontWeight: '400',
    zIndex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    right: 12,
    top: 16,
  },
  dropdown: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 100,
    elevation: 100,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  resultsScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemContext: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 4,
  },
  typeTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  typeTagText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  highlight: {
    backgroundColor: '#FEF3C7',
    fontWeight: '600',
  },
  loadingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#6B7280',
    fontSize: 14,
  },
});