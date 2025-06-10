import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import type { SearchResult } from '../types';


const mockResults: SearchResult[] = [
  {
    type: 'user',
    id: 1,
    name: 'Dr. Evelyn Reed',
    role: 'Quantum Physicist',
    avatar: 'https://picsum.photos/seed/user1/124/124',
  },
  {
    type: 'post',
    id: 2,
    title: 'The Entanglement Frontier: Beyond Qubits',
    author: 'Dr. Evelyn Reed',
    thumbnail: 'https://picsum.photos/seed/post1/300/200',
  },
  {
    type: 'user',
    id: 3,
    name: 'Marcus Chen',
    role: 'AI Ethics Advocate',
    avatar: 'https://picsum.photos/seed/user2/124/124',
  },
  {
    type: 'post',
    id: 4,
    title: 'Navigating Bias in Large Language Models',
    author: 'Marcus Chen',
    thumbnail: 'https://picsum.photos/seed/post2/300/200',
  },
  {
    type: 'post',
    id: 5,
    title: 'CRISPR Gene Editing: The Next Decade',
    author: 'BioInnovate Journal',
    thumbnail: 'https://picsum.photos/seed/post3/300/200',
  }
];

export const Discover: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResults = searchQuery
    ? mockResults.filter(result => {
        const query = searchQuery.toLowerCase();
        if (result.type === 'user') {
          return result.name.toLowerCase().includes(query) || result.role.toLowerCase().includes(query);
        } else {
          return result.title.toLowerCase().includes(query) || result.author.toLowerCase().includes(query);
        }
      })
    : mockResults;


  return (
    <View style={styles.root}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputWrapper}>
          <Feather
            name="search"
            style={styles.searchIcon}
            size={20}
            color="#9CA3AF"
          />
          <TextInput
            placeholder="Search people and posts..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            accessibilityLabel="Search input for people and posts"
          />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View>
          {filteredResults.length > 0 ? filteredResults.map((result) => (
            <TouchableOpacity 
              key={`${result.type}-${result.id}`}
              style={styles.resultCard}
              onPress={() => console.log('Tapped on:', result)}
              accessibilityLabel={`View details for ${result.type === 'user' ? result.name : result.title}`}
              accessibilityRole="button"
            >
              {result.type === 'user' ? (
                <View style={styles.resultUserRow}>
                  {result.avatar ? (
                    <Image
                      source={{ uri: result.avatar }}
                      accessibilityLabel={`Avatar for ${result.name}`}
                      style={styles.avatarImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <FontAwesome name="user" size={24} color="#9CA3AF" />
                    </View>
                  )}
                  <View>
                    <Text style={styles.resultUserName}>{result.name}</Text>
                    <Text style={styles.resultUserRole}>{result.role}</Text>
                  </View>
                </View>
              ) : ( // Post
                <View style={styles.resultPostRow}>
                  {result.thumbnail ? (
                    <Image
                      source={{ uri: result.thumbnail }}
                      accessibilityLabel={`Thumbnail for ${result.title}`}
                      style={styles.postImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.postImgFallback}>
                      <Feather name="book-open" size={24} color="#9CA3AF" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultPostTitle}>{result.title}</Text>
                    <Text style={styles.resultPostAuthor}>By {result.author}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          )) : (
            <View style={styles.noResultsRow}>
              <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: 16,
    zIndex: 10,
  },
  searchInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    marginTop: -10,
    zIndex: 10,
  },
  searchInput: {
    width: '100%',
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    fontSize: 16,
    color: '#111827',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  resultCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
  },
  resultUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultUserName: {
    fontWeight: '500',
    color: '#111827',
    fontSize: 16,
  },
  resultUserRole: {
    color: '#6B7280',
    fontSize: 14,
  },
  resultPostRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  postImg: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 12,
  },
  postImgFallback: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultPostTitle: {
    fontWeight: '500',
    color: '#111827',
    fontSize: 16,
    lineHeight: 20,
  },
  resultPostAuthor: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 4,
  },
  noResultsRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    color: '#6B7280',
    fontSize: 18,
    textAlign: 'center',
  },
});
