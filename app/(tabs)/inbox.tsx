import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ChatList } from '../../components/chat/ChatList';
import { Inbox as SocialInbox } from '../../components/friends/Inbox';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GoldGlowBackground } from '../../components/common/GoldGlowBackground';

const { width } = Dimensions.get('window');

export default function InboxPage() {
    const { colors } = useTheme();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'messages' | 'activity'>('messages');

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <GoldGlowBackground />
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
                <View style={[styles.tabSegment, { backgroundColor: colors.glassBg }]}>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            activeTab === 'messages' && {
                                backgroundColor: colors.glassBgStrong,
                                borderWidth: 1,
                                borderColor: colors.glassBorder,
                                shadowColor: colors.primary,
                                shadowOpacity: 0.2,
                                shadowRadius: 8
                            }
                        ]}
                        onPress={() => setActiveTab('messages')}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'messages' ? colors.gold : colors.textSecondary }
                        ]}>
                            Messages
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            activeTab === 'activity' && {
                                backgroundColor: colors.glassBgStrong,
                                borderWidth: 1,
                                borderColor: colors.glassBorder,
                                shadowColor: colors.primary,
                                shadowOpacity: 0.2,
                                shadowRadius: 8
                            }
                        ]}
                        onPress={() => setActiveTab('activity')}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'activity' ? colors.gold : colors.textSecondary }
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
        fontWeight: 'bold',
        fontFamily: 'Oswald_700Bold', // Consistent typography
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        // Glass effect
    },
    tabContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    tabSegment: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 4,
        height: 48,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tabButton: {
        flex: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Montserrat_600SemiBold',
    }
});
