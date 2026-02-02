import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text, SafeAreaView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { voltzService } from '../../lib/voltzService';
import { Podium } from '../../components/leaderboard/Podium';
import { LeaderboardList } from '../../components/leaderboard/LeaderboardList';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { GoldGlowBackground } from '../../components/common/GoldGlowBackground';

export default function LeaderboardScreen() {
    const { colors } = useTheme();
    const { session } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLeaderboard = async () => {
        try {
            const data = await voltzService.getLeaderboard(50);
            setUsers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchLeaderboard();
    };

    const topThree = users.slice(0, 3);
    const rest = users.slice(3);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <GoldGlowBackground />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                <Text style={[styles.headerTitle, { color: colors.text }]}>Top Earners</Text>

                {/* Podium for Top 3 */}
                <View style={{ marginTop: 20 }}>
                    <Podium users={topThree} currentUserId={session?.user?.id} />
                </View>

                {/* List for the rest */}
                <View style={styles.listContainer}>
                    <LeaderboardList users={rest} currentUserId={session?.user?.id} />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    listContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
    }
});
