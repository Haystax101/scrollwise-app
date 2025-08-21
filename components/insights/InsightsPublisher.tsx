import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Alert } from 'react-native';
import { InsightInput } from './InsightInput';
import { PublishOptions } from './PublishOptions';
import { LoadingScreen } from './LoadingScreen';
import { SuccessScreen } from './SuccessScreen';
import { VoltzSelector } from './VoltzSelector';
import { PostPreview } from './PostPreview';
import { useInsightsTheme } from '../../lib/insightsTheme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { voltzService } from '../../lib/voltzService';

const { width } = Dimensions.get('window');

interface MediaType {
  type: 'photo' | 'reel';
  source: string;
}

interface InsightsPublisherProps {
  onComplete?: () => void;
}

export const InsightsPublisher: React.FC<InsightsPublisherProps> = ({ onComplete }) => {
  const { colors, spacing, borderRadius, isDark } = useInsightsTheme();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [insightText, setInsightText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaType | null>(null);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [supercharged, setSupercharged] = useState(false);
  const [voltz, setVoltz] = useState(10);
  const [totalVoltz, setTotalVoltz] = useState(100);
  const [publishedInsightId, setPublishedInsightId] = useState<number | null>(null);

  // Fetch user's voltz balance on component mount
  useEffect(() => {
    const fetchVoltzBalance = async () => {
      if (user?.id) {
        const balance = await voltzService.getVoltzBalance(user.id);
        setTotalVoltz(balance);
      }
    };
    fetchVoltzBalance();
  }, [user?.id]);

  const handlePublish = async () => {
    setStep(3);
    
    try {
      // Insert the insight into the database
      const { data, error } = await supabase.from('insights').insert({
        content: insightText.trim(),
        author_id: user?.id,
      }).select('id').single();

      if (error) {
        console.error('Error publishing insight:', error);
        Alert.alert('Error', 'Failed to publish your insight. Please try again.');
        setStep(1); // Go back to input
        return;
      }

      const insightId = data?.id;
      setPublishedInsightId(insightId);

      // If supercharged, spend voltz using the atomic function
      if (supercharged && user?.id && insightId) {
        const success = await voltzService.spendVoltz(user.id, voltz, insightId.toString());
        
        if (!success) {
          Alert.alert('Error', 'Failed to supercharge your insight. It has been published normally.');
          setSupercharged(false); // Reset supercharge state
        }
      }

      // Simulate loading time
      setTimeout(() => {
        setStep(4);
      }, 3000);
    } catch (error) {
      console.error('Exception during publish:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setStep(1); // Go back to input
    }
  };

  const resetFlow = () => {
    setStep(1);
    setInsightText('');
    setSelectedMedia(null);
    setShowMediaSelector(false);
    setSupercharged(false);
    setVoltz(10);
    onComplete?.();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <InsightInput
            insightText={insightText}
            setInsightText={setInsightText}
            selectedMedia={selectedMedia}
            setSelectedMedia={setSelectedMedia}
            showMediaSelector={showMediaSelector}
            setShowMediaSelector={setShowMediaSelector}
            onNext={() => setStep(6)}
          />
        );
      case 2:
        return (
          <PublishOptions
            onBack={() => setStep(6)}
            onSupercharge={() => {
              setSupercharged(true);
              setStep(5);
            }}
            onPublishNormal={() => {
              setSupercharged(false);
              handlePublish();
            }}
          />
        );
      case 3:
        return <LoadingScreen supercharged={supercharged} />;
      case 4:
        return <SuccessScreen supercharged={supercharged} onDone={resetFlow} />;
      case 5:
        return (
          <VoltzSelector
            voltz={voltz}
            setVoltz={setVoltz}
            totalVoltz={totalVoltz}
            onBack={() => setStep(2)}
            onContinue={handlePublish}
            insightText={insightText}
            selectedMedia={selectedMedia}
          />
        );
      case 6:
        return (
          <PostPreview
            insightText={insightText}
            selectedMedia={selectedMedia}
            onBack={() => setStep(1)}
            onContinue={() => setStep(2)}
          />
        );
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