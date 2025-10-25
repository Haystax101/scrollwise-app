import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Alert } from 'react-native';
import { InsightInput } from './InsightInput';
import { EditSuccessScreen } from './EditSuccessScreen';
import { PostPreview } from './PostPreview';
import { useInsightsTheme } from '../../lib/insightsTheme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Insight } from '../../types';

const { width } = Dimensions.get('window');

interface InsightsEditorProps {
  insight: Insight;
  onComplete?: () => void;
}

export const InsightsEditor: React.FC<InsightsEditorProps> = ({ insight, onComplete }) => {
  const { colors, spacing, borderRadius, isDark } = useInsightsTheme();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [insightText, setInsightText] = useState(insight.content || '');

  const handleSaveChanges = async () => {
    try {
      console.log('Updating insight with data:', {
        id: insight.id,
        content: insightText.trim(),
        contentLength: insightText.trim().length,
        userExists: !!user?.id
      });

      // Update the insight in the database
      const { error } = await supabase
        .from('insights')
        .update({ content: insightText.trim() })
        .eq('id', insight.id);

      if (error) {
        console.error('Error updating insight:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        Alert.alert('Error', 'Failed to update your insight. Please try again.');
        return;
      }

      console.log('Successfully updated insight:', insight.id);
      
      // Go directly to success screen (no loading animation)
      setStep(3);
    } catch (error) {
      console.error('Exception during update:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const resetFlow = () => {
    setStep(1);
    setInsightText(insight.content || '');
    onComplete?.();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <InsightInput
            insightText={insightText}
            setInsightText={setInsightText}
            selectedMedia={null}
            setSelectedMedia={() => {}}
            showMediaSelector={false}
            setShowMediaSelector={() => {}}
            onNext={() => setStep(2)}
            onBack={onComplete}
          />
        );
      case 2:
        return (
          <PostPreview
            insightText={insightText}
            selectedMedia={null}
            onBack={() => setStep(1)}
            onContinue={handleSaveChanges}
            buttonText="Save Changes"
          />
        );
      case 3:
        return <EditSuccessScreen onDone={resetFlow} />;
      default:
        return null;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.insightsBackground,
    },
    content: {
      flex: 1,
      maxWidth: 400,
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: spacing.lg,
      paddingTop: 50,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={colors.insightsBackground} 
      />
      <View style={styles.content}>
        {renderStep()}
      </View>
    </View>
  );
};