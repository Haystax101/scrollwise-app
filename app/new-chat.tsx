import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { chatService } from '../lib/chatService';
import { FriendsService } from '../lib/friendsService'; // Assuming we have user search here
import { profileImageService } from '../services/profileImageService';

export default function NewChatScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (text: string) => {
        setQuery(text);
        if (text.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            // Reusing FriendsService search or adding a general user search
            const users = await FriendsService.searchUsers(text);
            setResults(users);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleStartChat = async (user: any) => {
        try {
            const chatId = await chatService.getOrCreateDirectChat(user.id);
            // Navigate to chat
            router.replace({
                pathname: '/messages/[id]',
                params: {
                    id: chatId,
                    name: user.full_name,
                    avatar: user.avatar_url
                }
            });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="x" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>New Message</Text>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <Feather name="search" size={20} color={colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Search for people..."
                    placeholderTextColor={colors.textSecondary}
                    value={query}
                    onChangeText={handleSearch}
                    autoFocus
                />
            </View>

            {/* Results */}
            <FlatList
                data={results}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.resultItem, { borderBottomColor: colors.border }]}
                        onPress={() => handleStartChat(item)}
                    >
                        <Image
                            source={
                                item.avatar_url
                                    ? { uri: profileImageService.getProfileImageUrl(item.avatar_url) }
                                    : require('../assets/profileIconDefault.png')
                            }
                            style={styles.avatar}
                        />
                        <View>
                            <Text style={[styles.name, { color: colors.text }]}>{item.full_name}</Text>
                            <Text style={[styles.username, { color: colors.textSecondary }]}>@{item.username || 'user'}</Text>
                        </View>
                        <Feather name="message-circle" size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                )}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                    loading ? <ActivityIndicator style={{ marginTop: 20 }} /> :
                        query.length > 2 ? <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textSecondary }}>No users found.</Text> : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 60, // Safe area rough
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: 40,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#333'
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
    },
    username: {
        fontSize: 13,
    }
});
