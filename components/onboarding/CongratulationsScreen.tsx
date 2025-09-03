import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const { height: screenHeight } = Dimensions.get('window');

const CheckIcon = () => (
  <Svg width="96" height="96" viewBox="0 0 24 24" fill="none">
    <Path 
      d="M20 6L9 17L4 12" 
      stroke="#F59E0B" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

interface CongratulationsScreenProps {
  onNext: () => void;
  onBack?: () => void;
}

// Industry-specific congratulations messages
const industryMessages: Record<string, string> = {
  'Finance and Economics': "Smart move! You understand that knowledge is the ultimate currency. You're about to master the financial forces that drive our world forward.",
  'Technology and AI': "Brilliant choice! You're joining the innovators shaping tomorrow. The AI revolution is here, and you're about to stay ahead of every breakthrough that's redefining what's possible.",
  'Politics and International Relations': "Powerful choice! You understand that knowledge shapes nations. You're about to dive into the insights that influence global decisions and diplomatic breakthroughs.",
  'Medicine and Healthcare': "Incredible! You're part of the heroes advancing human health. Every insight you discover here could spark the next medical breakthrough that changes lives.",
  'Education': "Perfect! You're with the knowledge architects building brighter futures. Every lesson learned here multiplies into countless minds you'll inspire and transform.",
  'Creative Industries and the Arts': "Inspiring choice! You know that creativity changes everything. You're about to discover the ideas that will fuel your next masterpiece and cultural breakthrough.",
  'Arts and Creative Industries': "Inspiring choice! You know that creativity changes everything. You're about to discover the ideas that will fuel your next masterpiece and cultural breakthrough.",
  'Entrepreneurship and Startups': "Fantastic! You see opportunities where others see obstacles. You're about to discover the insights that turn bold visions into the next unicorn success story.",
  'Engineering and Automotive': "Outstanding! You're joining the builders of tomorrow's mobility. From electric vehicles to autonomous systems, you're about to master the innovations driving our future.",
  'Energy, Sustainability and Climate Innovation': "Amazing choice! You're joining the planet's champions powering a sustainable future. From clean energy to climate solutions, your knowledge here could help solve the greatest challenge of our time.",
  'Energy, Sustainability and Climate Tech': "Amazing choice! You're joining the planet's champions powering a sustainable future. From clean energy to climate solutions, your knowledge here could help solve the greatest challenge of our time."
};

const multipleIndustriesTitle = "Incredible!";
const multipleIndustriesBody = "You're a true renaissance mind who sees connections across fields. You're about to discover how different industries spark breakthrough innovations together.";

const generalBackupTitle = "Perfect choice!";
const generalBackupMessage = "You're joining a community of curious minds who know that knowledge is power. Get ready to supercharge your expertise with insights that matter.";

// Helper function to extract title and body from industry messages
const extractTitleAndBody = (message: string): { title: string; body: string } => {
  const exclamationIndex = message.indexOf('!');
  if (exclamationIndex !== -1) {
    const title = message.substring(0, exclamationIndex + 1);
    const body = message.substring(exclamationIndex + 1).trim();
    return { title, body };
  }
  return { title: generalBackupTitle, body: message };
};

export const CongratulationsScreen: React.FC<CongratulationsScreenProps> = ({ onNext, onBack }) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [congratulationsMessage, setCongratulationsMessage] = useState(generalBackupMessage);
  const [title, setTitle] = useState(generalBackupTitle);

  // Fetch user's selected industries and set appropriate message
  const fetchUserIndustries = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data: userIndustries, error } = await supabase
        .from('user_industries')
        .select(`
          industries (
            name
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user industries:', error);
        setLoading(false);
        return;
      }

      if (userIndustries && userIndustries.length > 0) {
        const industryNames = userIndustries
          .map((ui: any) => ui.industries?.name)
          .filter((name: string | undefined): name is string => name !== undefined && name !== null);
        
        if (industryNames.length === 1) {
          // Single industry selected
          const industryName = industryNames[0];
          const message = industryMessages[industryName];
          if (message) {
            const { title: extractedTitle, body } = extractTitleAndBody(message);
            setTitle(extractedTitle);
            setCongratulationsMessage(body);
          }
        } else if (industryNames.length > 1) {
          // Multiple industries selected
          setTitle(multipleIndustriesTitle);
          setCongratulationsMessage(multipleIndustriesBody);
        }
        // If no matching message found, keep the general backup message
      }
    } catch (error) {
      console.error('Error in fetchUserIndustries:', error);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    // Start slide up animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Fetch user industries
    fetchUserIndustries();
  }, [user?.id]);

  return (
    <Animated.View 
      style={[
        styles.animatedContainer,
        {
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <SafeAreaView style={styles.container}>
      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckIcon />
        </View>
        
        <Text style={styles.title}>{title}</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#F59E0B" />
            <Text style={styles.loadingText}>Personalizing your experience...</Text>
          </View>
        ) : (
          <Text style={styles.description}>
            {congratulationsMessage}
          </Text>
        )}
      </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Button onPress={onNext}>
            Select aspirations
          </Button>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFBF0',
    paddingHorizontal: 32,
  },
  header: {
    height: 60,
    justifyContent: 'center',
    paddingTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    maxWidth: 300,
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
});