import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { RecentReadsList } from '../../components/create/RecentReadsList';
import { PencilSquareIcon, CameraIcon } from 'react-native-heroicons/outline';
import { GlassGlowingCard } from '../../components/create/GlassGlowingCard';
import { GoldGlowBackground } from '../../components/common/GoldGlowBackground';

export default function CreateScreen() {
    const { colors } = useTheme();
    const router = useRouter();

    const ActionButton = ({ icon: Icon, title, subtitle, color, onPress }: any) => (
        <GlassGlowingCard
            style={styles.actionButtonContainer}
            glowColor={color}
            onPress={onPress}
        >
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
                <View style={[styles.iconCircle, { backgroundColor: color + '20', borderColor: color + '40', borderWidth: 1 }]}>
                    <Icon size={24} color={color} />
                </View>
                <View>
                    <Text style={[styles.actionTitle, { color: colors.text }]}>{title}</Text>
                    <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
                </View>
            </View>
        </GlassGlowingCard>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <GoldGlowBackground />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Grow</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Hero Section: Quick Actions */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Log Progress</Text>
                        <View style={styles.actionGrid}>
                            <ActionButton
                                icon={PencilSquareIcon}
                                title="New Insight"
                                subtitle="Write & Share"
                                color="#4F46E5" // Indigo
                                onPress={() => router.push('/create-insight')}
                            />
                            <ActionButton
                                icon={CameraIcon}
                                title="Timelapse"
                                subtitle="Focus Session"
                                color="#E11D48" // Rose
                                onPress={() => router.push('/create-timelapse')}
                            />
                        </View>
                    </View>

                    {/* Recent Knowledge Flow */}
                    <RecentReadsList />

                    {/* Drafts or Projects (Placeholder) */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Drafts</Text>
                        <GlassGlowingCard
                            glowColor={colors.primary}
                            style={{ width: '100%', height: 120 }}
                        >
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: colors.text + '60', fontFamily: 'Montserrat_400Regular' }}>No drafts yet. Start creating!</Text>
                            </View>
                        </GlassGlowingCard>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        fontFamily: 'Oswald_700Bold',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    section: {
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Montserrat_700Bold',
        marginBottom: 16,
    },
    actionGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButtonContainer: {
        flex: 1,
        height: 150, // Slightly taller for better spacing
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 12,
        fontFamily: 'Oswald_500Medium',
        letterSpacing: 0.5,
    },
    actionSubtitle: {
        fontSize: 13,
        fontWeight: '400',
        fontFamily: 'Montserrat_400Regular',
        opacity: 0.8,
    },
});
