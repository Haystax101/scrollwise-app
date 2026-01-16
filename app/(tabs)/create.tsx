import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { RecentReadsList } from '../../components/create/RecentReadsList';
import { SparklesIcon, ClockIcon, PencilSquareIcon, CameraIcon } from 'react-native-heroicons/outline';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function CreateScreen() {
    const { colors, theme } = useTheme();
    const router = useRouter();

    const ActionButton = ({ icon: Icon, title, subtitle, color, onPress }: any) => (
        <TouchableOpacity style={[styles.actionButton, { borderColor: colors.border }]} onPress={onPress}>
            <BlurView intensity={20} tint={theme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
                <Icon size={24} color={color} />
            </View>
            <View>
                <Text style={[styles.actionTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.actionSubtitle, { color: colors.text + '80' }]}>{subtitle}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.primary + '10', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

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
                        <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center', height: 100 }}>
                            <Text style={{ color: colors.text + '60' }}>No drafts yet. Start creating!</Text>
                        </View>
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
    profileButton: {
        padding: 10,
        borderRadius: 20,
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
    actionButton: {
        flex: 1,
        height: 140, // Tall buttons
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        padding: 16,
        justifyContent: 'space-between',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 8,
    },
    actionSubtitle: {
        fontSize: 12,
        fontWeight: '500',
    },
});
