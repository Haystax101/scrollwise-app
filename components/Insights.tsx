import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

interface InsightItem {
  id: string;
  type: 'response' | 'own';
  userName: string;
  jobTitle: string;
  avatar: string;
  userMessage: string;
  insightTitle: string;
  responder_id?: string;
  original_author_id?: string;
}

const Insights = () => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newInsightContent, setNewInsightContent] = useState('');

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Fetch user's own insights with counts
    const { data: ownInsights, error: ownInsightsError } = await supabase
      .from('insights')
      .select(`id, content, created_at, likes_count, saves_count, comments_count,
        author:profiles!author_id(full_name, avatar_url)
      `)
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (ownInsightsError) {
      console.error('Error fetching insights:', ownInsightsError);
      setLoading(false);
      return;
    }

    // Fetch comprehensive profile details for current user
    const [eduRes, expRes, goalRes, industriesRes] = await Promise.all([
      supabase.from('user_education').select('universities (name), degrees (name), stage').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_experiences').select('companies (name), experience_level, description').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_goals').select('goal, timeframe').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_industries').select('industries (name)').eq('user_id', user.id)
    ]);

    const education = eduRes.data ? `${(eduRes.data as any).universities?.name || ''} ${(eduRes.data as any).degrees?.name || ''} (${eduRes.data.stage || ''})`.trim() : '';
    const experience = expRes.data ? `${(expRes.data as any).companies?.name || ''} (${expRes.data.experience_level || ''})`.trim() : '';
    const goals = goalRes.data ? `${goalRes.data.goal || ''} - ${goalRes.data.timeframe || ''}`.trim() : '';
    const industries = industriesRes.data?.map((i: any) => i.industries.name).join(', ') || '';

    // Build profile description with best 4 pieces of data
    const profileParts = [education, experience, industries, goals].filter(part => part && part !== ' ()' && part !== ' - ').slice(0, 4);
    const detailsText = profileParts.length > 0 ? profileParts.join(' • ') : 'Complete your profile to share more about yourself';

    const formatted = (ownInsights || []).map((item: any) => ({
      id: item.id,
      type: 'own' as const,
      userName: item.author?.full_name,
      avatar: item.author?.avatar_url,
      jobTitle: detailsText,
      userMessage: item.content,
      insightTitle: item.content.substring(0, 50) + (item.content.length > 50 ? '...' : ''),
      likes_count: item.likes_count || 0,
      saves_count: item.saves_count || 0,
      comments_count: item.comments_count || 0,
    }));

    setItems(formatted);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAccept = async (item: InsightItem) => {
    if (item.type !== 'response') return;
    try {
      const { data, error } = await supabase.functions.invoke('create-chat-on-insight-reply', {
        body: {
          responderId: item.responder_id,
          authorId: item.original_author_id,
          insightResponseId: item.id,
          insightResponseContent: item.userMessage,
        },
      });
      if (error) throw error;
      if (data.chatId) router.push(`/chat/${data.chatId}`);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleDismiss = async (itemId: string) => {
    await supabase.from('insight_responses').delete().eq('id', itemId);
    setItems(items.filter(i => i.id !== itemId));
  };

  const handleDelete = async (itemId: string) => {
    await supabase.from('insights').delete().eq('id', itemId);
    setItems(items.filter(i => i.id !== itemId));
  };

  const handlePublishInsight = async () => {
    if (!user || newInsightContent.trim() === '') return;
    try {
      const { error } = await supabase.from('insights').insert({
        content: newInsightContent.trim(),
        author_id: user.id,
      });

      if (error) throw error;
      
      // Close modal and refresh the data
      setNewInsightContent('');
      setModalVisible(false);
      fetchData(); // Re-fetch all data to ensure consistency
    } catch (error) {
      console.error('Error publishing insight:', error);
      Alert.alert('Error', 'Could not publish your insight.');
    }
  };

  const InsightCard = ({ item }: { item: InsightItem }) => {
    return (
      <View style={styles.insightCard}>
        <LinearGradient
          colors={isDark ? ['#1A1B2E', '#2D2D3A'] : [colors.card, colors.card]}
          style={styles.gradient}
        >
          <View style={styles.cardHeader}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.userName}</Text>
              <Text style={styles.jobTitle}>{item.jobTitle}</Text>
            </View>
          </View>
          <Text style={styles.messageText}>{item.userMessage}</Text>
          <Text style={styles.insightContext}>
            Your insight
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(item.id)}>
              <Feather name="trash-2" size={18} color={colors.error} />
              <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  };
  
  // Styles need to be defined here for the component to use them.
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: 60 }, // Increased top margin for notch
    createInsightButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, paddingVertical: 15, paddingHorizontal: 20, borderRadius: 12, marginVertical: 10, marginHorizontal: 16, alignSelf: 'center' },
    createInsightButtonText: { color: colors.primaryText, fontSize: 16, fontWeight: '600', marginLeft: 8 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: colors.card, borderRadius: 16, padding: 20, width: '80%', alignItems: 'center' },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
    modalInput: { width: '100%', height: 150, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 15, fontSize: 16, color: colors.text, backgroundColor: colors.inputBackground, textAlignVertical: 'top', marginBottom: 20 },
    publishButton: { backgroundColor: colors.primary, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 10 },
    publishButtonText: { color: colors.primaryText, fontSize: 18, fontWeight: 'bold' },
    cancelButton: { backgroundColor: 'transparent', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, width: '100%', alignItems: 'center' },
    cancelButtonText: { color: colors.textSecondary, fontSize: 18, fontWeight: 'bold' },
    insightCard: { borderRadius: 16, marginVertical: 8, marginHorizontal: 16, overflow: 'hidden' },
    gradient: { padding: 20 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    jobTitle: { fontSize: 14, color: colors.textSecondary },
    messageText: { fontSize: 16, color: colors.text, marginBottom: 8 },
    insightContext: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic' },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
    actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, marginLeft: 12 },
    replyButton: { backgroundColor: colors.primary },
    dismissButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.error },
    deleteButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.error },
    actionButtonText: { color: colors.text, fontWeight: '600', marginLeft: 8 },
    replyButtonText: { color: colors.primaryText },
  });

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InsightCard item={item} />}
        ListHeaderComponent={
          <TouchableOpacity style={styles.createInsightButton} onPress={() => setModalVisible(true)}>
            <Feather name="plus" size={18} color={colors.primaryText} />
            <Text style={styles.createInsightButtonText}>Create Insight</Text>
          </TouchableOpacity>
        }
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create an Insight</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Share your thoughts..."
              value={newInsightContent}
              onChangeText={setNewInsightContent}
              multiline
            />
            <TouchableOpacity style={styles.publishButton} onPress={handlePublishInsight}>
              <Text style={styles.publishButtonText}>Publish</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Insights; 