import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { InsightCard } from '../../components/InsightCard';
import { Insight } from '../../types';

export default function InsightDetail() {
  const { id, showBackButton } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('insights')
          .select(`
            id,
            content,
            created_at,
            likes_count,
            saves_count,
            comments_count,
            views_count,
            author:profiles!author_id(full_name, avatar_url)
          `)
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching insight:', error);
          return;
        }

        if (data) {
          const formattedInsight: Insight = {
            id: data.id,
            type: 'insight',
            content: data.content,
            created_at: data.created_at,
            title: data.content ? data.content.substring(0, 50) + (data.content.length > 50 ? '...' : '') : '',
            likes_count: data.likes_count || 0,
            comments_count: data.comments_count || 0,
            views_count: data.views_count || 0,
            saves_count: data.saves_count || 0,
            author: {
              name: data.author?.full_name || 'User',
              handle: '@' + (data.author?.full_name?.toLowerCase().replace(/\s+/g, '') || 'user'),
              avatar: data.author?.avatar_url || '',
              role: '',
              company: '',
              industry: '',
              location: '',
              currentProject: '',
              projectTags: []
            }
          };
          setInsight(formattedInsight);
        }
      } catch (error) {
        console.error('Error fetching insight:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [id]);

  const handleBack = () => {
    router.back();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    errorText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {showBackButton === 'true' && (
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Feather name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Insight</Text>
          </View>
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading insight...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!insight) {
    return (
      <SafeAreaView style={styles.container}>
        {showBackButton === 'true' && (
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Feather name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Insight</Text>
          </View>
        )}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Insight not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {showBackButton === 'true' && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Insight</Text>
        </View>
      )}
      <View style={styles.content}>
        <InsightCard insight={insight} />
      </View>
    </SafeAreaView>
  );
}