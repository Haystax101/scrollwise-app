import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

interface SavedItem {
  id: number;
  title: string;
  type: string;
  date: string;
}

export const SavedFeed: React.FC = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedItems = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('article_saves')
        .select(`
          created_at,
          articles (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved items:', error);
      } else if (data) {
        const formattedItems: SavedItem[] = data.map((item: any) => ({
          id: item.articles.id,
          title: item.articles.title,
          type: item.articles.type,
          date: new Date(item.created_at).toLocaleDateString(),
        }));
        setSavedItems(formattedItems);
      }
    } catch (err) {
      console.error('Error fetching saved items:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedItems();
  }, [fetchSavedItems]);

  const renderItem = ({ item }: { item: SavedItem }) => (
    <TouchableOpacity
      style={dynamicStyles.savedItemRow}
      onPress={() => router.push({ pathname: '/feed', params: { reelId: item.id } })}
    >
      <View style={dynamicStyles.savedIconCircle}>
        <Feather name="bookmark" size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={dynamicStyles.savedItemTitle}>{item.title}</Text>
        <View style={dynamicStyles.savedItemMetaRow}>
          <Text style={dynamicStyles.savedItemType}>{item.type}</Text>
          <View style={dynamicStyles.savedDot} />
          <Text style={dynamicStyles.savedItemDate}>{item.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textTertiary,
      textAlign: 'center',
    },
    listContent: {
      padding: 16,
    },
    savedItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.card,
      marginBottom: 12,
    },
    savedIconCircle: {
      padding: 10,
      backgroundColor: colors.primary + '20', // Lighter primary color
      borderRadius: 999,
      marginRight: 12,
    },
    savedItemTitle: {
      fontWeight: '500',
      color: colors.text,
      fontSize: 16,
      lineHeight: 20,
    },
    savedItemMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    savedItemType: {
      textTransform: 'capitalize',
      color: colors.textTertiary,
      fontSize: 12,
    },
    savedDot: {
      height: 4,
      width: 4,
      borderRadius: 2,
      backgroundColor: '#9CA3AF',
      marginHorizontal: 8,
    },
    savedItemDate: {
      color: colors.textTertiary,
      fontSize: 12,
    },
  });

  if (loading) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (savedItems.length === 0) {
    return (
      <View style={dynamicStyles.emptyContainer}>
        <Feather name="bookmark" size={40} color={colors.textTertiary} />
        <Text style={dynamicStyles.emptyText}>You haven't saved any content yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={savedItems}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      style={dynamicStyles.container}
      contentContainerStyle={dynamicStyles.listContent}
    />
  );
};

export default SavedFeed;