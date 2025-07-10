import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Industry, ExperienceLevel } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useIndustries } from '../context/IndustriesContext';
import { useTheme } from '../context/ThemeContext';

const industriesData: Industry[] = [
  {
    id: 1, // CS
    name: 'CS',
    description: 'Computer Science, Programming, Software Development',
    icon: <MaterialCommunityIcons name="laptop" size={24} color="#16A34A" />,
    color: 'bg-green-100',
  },
  {
    id: 2, // Finance & Economics
    name: 'Finance & Economics',
    description: 'Markets, Investment, Economic Theory',
    icon: <MaterialCommunityIcons name="chart-line" size={24} color="#2563EB" />,
    color: 'bg-blue-100',
  },
  {
    id: 3, // Maths
    name: 'Maths',
    description: 'Pure Mathematics, Applied Math, Statistics',
    icon: <MaterialCommunityIcons name="function" size={24} color="#DC2626" />,
    color: 'bg-red-100',
  },
  {
    id: 4, // Physics
    name: 'Physics',
    description: 'Theoretical Physics, Applied Physics, Research',
    icon: <MaterialCommunityIcons name="atom" size={24} color="#F59E42" />,
    color: 'bg-yellow-100',
  },
  {
    id: 5, // EdTech
    name: 'EdTech',
    description: 'Educational Technology, Learning Innovation',
    icon: <MaterialCommunityIcons name="school" size={24} color="#9333EA" />,
    color: 'bg-purple-100',
  },
];

const experienceLevels: ExperienceLevel[] = [
  'Student',
  'Working Professional',
  'Researcher',
  'Enthusiast',
];

interface OnboardingProps {
  onComplete: (interests: number[]) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const [interests, setInterests] = useState<number[]>([]);
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const { user } = useAuth();
  const { refreshIndustries } = useIndustries();

  const toggleIndustry = (industryId: number) => {
    setInterests((prev) =>
      prev.includes(industryId)
        ? prev.filter((id) => id !== industryId)
        : [...prev, industryId]
    );
  };

  const handleComplete = async () => {
    if (interests.length === 0) {
        alert("Please select at least one industry.");
        return;
    }
    if (!experience) {
        alert("Please select your experience level.");
        return;
    }
    if (!user) {
        alert("User not found in context. Cannot submit onboarding.");
        return;
    }
    const payload = {
      experience,
      interests // now an array of numbers
    };
    const { error } = await supabase 
      .from('profiles')
      .update(payload)
      .eq('id', user.id);
    if (error) {
      return;
    }
    // Refresh industries context after successful update
    await refreshIndustries();
    onComplete(interests);
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      flexGrow: 1,
    },
    padding: {
      paddingHorizontal: 16,
      paddingTop: 32,
      paddingBottom: 80,
    },
    welcomeContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    welcomeTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    welcomeSubtitle: {
      marginTop: 8,
      color: colors.textSecondary,
    },
    progressContainer: {
      marginBottom: 24,
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    progressText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    progressBarBg: {
      width: '100%',
      backgroundColor: colors.border,
      borderRadius: 999,
      height: 8,
    },
    progressBarFill: {
      backgroundColor: colors.primary,
      height: 8,
      borderRadius: 999,
    },
    questionContainer: {
      marginBottom: 24,
    },
    questionTitle: {
      fontSize: 18,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    questionSubtitle: {
      color: colors.textSecondary,
      marginBottom: 16,
    },
    industryCard: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      marginBottom: 12,
    },
    industryCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    industryCardDefault: {
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    industryIconContainer: {
      padding: 12,
      borderRadius: 999,
      marginRight: 16,
    },
    industryTextContainer: {
      flex: 1,
    },
    industryName: {
      fontWeight: '500',
      color: colors.text,
    },
    industryDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    experienceCard: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      borderWidth: 2,
      marginBottom: 12,
    },
    experienceCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    experienceCardDefault: {
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    experienceText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    buttonContainer: {
      marginTop: 32,
    },
    button: {
      width: '100%',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonEnabled: {
      backgroundColor: colors.primary,
    },
    buttonDisabled: {
      backgroundColor: colors.border,
    },
    buttonTextEnabled: {
      fontWeight: '500',
      color: colors.primaryText,
    },
    buttonTextDisabled: {
      fontWeight: '500',
      color: colors.textTertiary,
    },
  });

      return (
    <ScrollView style={dynamicStyles.container} contentContainerStyle={dynamicStyles.contentContainer}>
      <View style={dynamicStyles.padding}>
        {step === 1 && (
          <>
            <View style={dynamicStyles.welcomeContainer}>
              <Text style={dynamicStyles.welcomeTitle}>Welcome to ScrollWise</Text>
              <Text style={dynamicStyles.welcomeSubtitle}>Let's personalize your knowledge feed</Text>
            </View>
            <View style={dynamicStyles.progressContainer}>
              <View style={dynamicStyles.progressRow}>
                <Text style={dynamicStyles.progressText}>Step 1 of 2</Text>
                <Text style={dynamicStyles.progressText}>Select Industries</Text>
              </View>
              <View style={dynamicStyles.progressBarBg}>
                <View style={[dynamicStyles.progressBarFill, { width: '50%' }]} />
              </View>
            </View>
            <View style={dynamicStyles.questionContainer}>
              <Text style={dynamicStyles.questionTitle}>
                Which industries are you interested in?
              </Text>
              <Text style={dynamicStyles.questionSubtitle}>
                Select all that apply. We'll use this to curate your feed.
              </Text>
              <View>
                {industriesData.map((industry) => (
                  <TouchableOpacity
                    key={industry.id}
                    onPress={() => toggleIndustry(industry.id)}
                    style={[
                      dynamicStyles.industryCard,
                      interests.includes(industry.id) 
                        ? dynamicStyles.industryCardSelected 
                        : dynamicStyles.industryCardDefault
                    ]}
                    accessibilityLabel={`Select industry ${industry.name}`}
                    accessibilityState={{ selected: interests.includes(industry.id) }}
                  >
                    <View style={[
                      dynamicStyles.industryIconContainer,
                      { backgroundColor: getIndustryBgColor(industry.id) }
                    ]}>
                      {industry.icon}
                    </View>
                    <View style={dynamicStyles.industryTextContainer}>
                      <Text style={dynamicStyles.industryName}>{industry.name}</Text>
                      <Text style={dynamicStyles.industryDescription}>{industry.description}</Text>
                    </View>
                    {interests.includes(industry.id) && <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={dynamicStyles.buttonContainer}>
              <TouchableOpacity
                onPress={() => setStep(2)}
                disabled={interests.length === 0}
                style={[
                  dynamicStyles.button,
                  interests.length > 0 ? dynamicStyles.buttonEnabled : dynamicStyles.buttonDisabled
                ]}
                accessibilityLabel="Continue to experience level selection"
                accessibilityState={{ disabled: interests.length === 0 }}
              >
                <Text style={interests.length > 0 ? dynamicStyles.buttonTextEnabled : dynamicStyles.buttonTextDisabled}>Continue</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        {step === 2 && (
          <>
            <View style={dynamicStyles.welcomeContainer}>
              <Text style={dynamicStyles.welcomeTitle}>Almost there!</Text>
              <Text style={dynamicStyles.welcomeSubtitle}>Tell us about your experience level</Text>
            </View>
            <View style={dynamicStyles.progressContainer}>
              <View style={dynamicStyles.progressRow}>
                <Text style={dynamicStyles.progressText}>Step 2 of 2</Text>
                <Text style={dynamicStyles.progressText}>Experience Level</Text>
              </View>
              <View style={dynamicStyles.progressBarBg}>
                <View style={[dynamicStyles.progressBarFill, { width: '100%' }]} />
              </View>
            </View>
            <View style={dynamicStyles.questionContainer}>
              <Text style={dynamicStyles.questionTitle}>
                What's your experience level?
              </Text>
              <Text style={dynamicStyles.questionSubtitle}>
                This helps us tailor content to your knowledge level.
              </Text>
              <View>
                {experienceLevels.map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setExperience(level)}
                    style={[
                      dynamicStyles.experienceCard,
                      experience === level 
                        ? dynamicStyles.experienceCardSelected 
                        : dynamicStyles.experienceCardDefault
                    ]}
                    accessibilityLabel={`Select experience level ${level}`}
                    accessibilityState={{ selected: experience === level }}
                    accessibilityRole="radio"
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={dynamicStyles.experienceText}>{level}</Text>
                    </View>
                    {experience === level ? (
                      <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary} />
                    ) : (
                      <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={24} color={colors.border} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={dynamicStyles.buttonContainer}>
              <TouchableOpacity
                onPress={handleComplete}
                disabled={!experience}
                style={[
                  dynamicStyles.button,
                  experience ? dynamicStyles.buttonEnabled : dynamicStyles.buttonDisabled,
                  { marginBottom: 12 }
                ]}
                accessibilityLabel="Get started with onboarding"
                accessibilityState={{ disabled: !experience }}
              >
                <Text style={experience ? dynamicStyles.buttonTextEnabled : dynamicStyles.buttonTextDisabled}>Get Started</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setStep(1)}
                style={[
                  dynamicStyles.button,
                  dynamicStyles.buttonDisabled,
                  { borderWidth: 1, borderColor: colors.border }
                ]}
                accessibilityLabel="Go back to industry selection"
              >
                <Text style={dynamicStyles.buttonTextDisabled}>Back</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
};

// Helper to map industry id to background color
function getIndustryBgColor(id: number) {
  switch (id) {
    case 1:
      return '#DCFCE7'; // green-100
    case 2:
      return '#DBEAFE'; // blue-100
    case 3:
      return '#FEE2E2'; // red-100
    case 4:
      return '#FEF9C3'; // yellow-100
    case 5:
      return '#F3E8FF'; // purple-100
    default:
      return '#F3F4F6'; // gray-100 fallback
  }
}
