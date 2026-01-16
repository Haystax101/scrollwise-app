import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import { ArrowLeftIcon, XMarkIcon, MagnifyingGlassIcon } from 'react-native-heroicons/outline';
import { BlurView } from 'expo-blur';
import { searchContentV2, SearchResultV2 } from '../lib/smartSearchService';
import { SearchResultItem } from '../components/SearchResultItem';
import _ from 'lodash';

export default function SearchScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const inputRef = useRef<TextInput>(null);

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResultV2[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Debounced Search
    const handleSearch = useCallback(
        _.debounce(async (text: string) => {
            if (!text.trim()) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            const data = await searchContentV2(text);
            setResults(data);
            setIsLoading(false);
        }, 500),
        []
    );

    const onChangeText = (text: string) => {
        setQuery(text);
        handleSearch(text);
    };

    const clearSearch = () => {
        setQuery('');
        setResults([]);
        inputRef.current?.blur();
    };

    const handlePressItem = (item: SearchResultV2) => {
        // Navigate to content
        // Assuming feed handles these params or we have specific screens
        // For now, routing to feed with specific content might be best, or specialized screens if they exist
        // Note: The original generic feed deep linking logic was at /index

        router.push({
            pathname: '/(tabs)/', // Or to specific viewer
            params: {
                contentId: item.id,
                contentType: item.type,
                backTo: 'search'
            }
        });
    };

    const renderItem = ({ item }: { item: SearchResultV2 }) => {
        return (
            <SearchResultItem
                id={item.id}
                type={item.type}
                title={item.title}
                subtitle={item.subtitle}
                imageUrl={item.image_url}
                colour={item.colour}
                date={item.date}
                special={item.special}
                onPress={() => handlePressItem(item)}
            />
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>

            {/* Header */}
            <BlurView intensity={90} tint="dark" style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.searchContainer}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeftIcon color="white" size={24} />
                    </TouchableOpacity>

                    <View style={styles.inputWrapper}>
                        <MagnifyingGlassIcon color="rgba(255,255,255,0.5)" size={20} style={styles.searchIcon} />
                        <TextInput
                            ref={inputRef}
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Search..."
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={query}
                            onChangeText={onChangeText}
                            autoFocus
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={clearSearch}>
                                <XMarkIcon color="white" size={20} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </BlurView>

            {/* Content */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FFD700" />
                </View>
            ) : (
                <FlatList
                    data={results}
                    renderItem={renderItem}
                    keyExtractor={(item) => `${item.type}-${item.id}`}
                    contentContainerStyle={{ paddingTop: 140, paddingBottom: 50, paddingHorizontal: 16 }}
                    ListEmptyComponent={
                        query.length > 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No results found.</Text>
                            </View>
                        ) : null
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 50,
    },
    backButton: {
        padding: 5,
        marginRight: 10,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        paddingHorizontal: 15,
        height: 40,
    },
    searchIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Montserrat_400Regular',
    },
    loadingContainer: {
        marginTop: 150,
        alignItems: 'center',
    },
    emptyState: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 16,
    },
});
