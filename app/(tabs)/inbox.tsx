import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ChatList } from '../../components/chat/ChatList';
import { Inbox as SocialInbox } from '../../components/friends/Inbox';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function InboxPage() {
    const { colors } = useTheme();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'messages' | 'activity'>('messages');

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Main Header */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Inbox</Text>

                {/* New Chat Action */}
                {activeTab === 'messages' && (
                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: colors.primary + '20' }]}
                        onPress={() => router.push('/new-chat')} // We need to build this
                    >
                        <Feather name="edit" size={20} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Top Tabs Segmented Control */}
            <View style={styles.tabContainer}>
                <View style={[styles.tabSegment, { backgroundColor: colors.card }]}>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            activeTab === 'messages' && { backgroundColor: colors.background, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 }
                        ]}
                        onPress={() => setActiveTab('messages')}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'messages' ? colors.text : colors.textSecondary }
                        ]}>
                            Messages
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            activeTab === 'activity' && { backgroundColor: colors.background, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 }
                        ]}
                        onPress={() => setActiveTab('activity')}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'activity' ? colors.text : colors.textSecondary }
                        ]}>
                            Activity
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content Area */}
            <View style={{ flex: 1 }}>
                {activeTab === 'messages' ? (
                    <ChatList />
                ) : (
                    // We hide the internal header of the legacy component
                    <View style={{ flex: 1, marginTop: -10 }}>
                        <SocialInbox showHeader={false} />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabContainer: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    tabSegment: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        height: 44,
    },
    tabButton: {
        flex: 1,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    }
});
