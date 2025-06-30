import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Industry, ExperienceLevel } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useIndustries } from '../context/IndustriesContext';

const industriesData: Industry[] = [
  {
    id: 1, // STEM
    name: 'STEM',
    description: 'Tech, AI, Engineering, Biology',
    icon: <MaterialCommunityIcons name="microscope" size={24} color="#16A34A" />,
    color: 'bg-green-100',
  },
  {
    id: 2, // Finance & Economics
    name: 'Finance & Economics',
    description: 'Markets, Investment, Economy',
    icon: <MaterialCommunityIcons name="chart-line" size={24} color="#2563EB" />,
    color: 'bg-blue-100',
  },
  {
    id: 3, // Medicine & Healthcare
    name: 'Medicine & Healthcare',
    description: 'Medical research, Health trends',
    icon: <MaterialCommunityIcons name="heart-pulse" size={24} color="#DC2626" />,
    color: 'bg-red-100',
  },
  {
    id: 4, // Education & EdTech
    name: 'Education & EdTech',
    description: 'Teaching methods, Learning science',
    icon: <MaterialCommunityIcons name="book-open-variant" size={24} color="#F59E42" />,
    color: 'bg-yellow-100',
  },
  {
    id: 5, // Law & Policy
    name: 'Law & Policy',
    description: 'Legal updates, Policy changes',
    icon: <MaterialCommunityIcons name="brain" size={24} color="#9333EA" />,
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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 32, paddingBottom: 80 }}>
        {step === 1 && (
          <>
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>Welcome to ScrollWise</Text>
              <Text style={{ marginTop: 8, color: '#4B5563' }}>Let's personalize your knowledge feed</Text>
            </View>
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>Step 1 of 2</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>Select Industries</Text>
              </View>
              <View style={{ width: '100%', backgroundColor: '#E5E7EB', borderRadius: 999, height: 8 }}>
                <View style={{ backgroundColor: '#2563EB', height: 8, borderRadius: 999, width: '50%' }} />
              </View>
            </View>
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '500', color: '#111827', marginBottom: 8 }}>
                Which industries are you interested in?
              </Text>
              <Text style={{ color: '#4B5563', marginBottom: 16 }}>
                Select all that apply. We'll use this to curate your feed.
              </Text>
              <View>
                {industriesData.map((industry) => (
                  <TouchableOpacity
                    key={industry.id}
                    onPress={() => toggleIndustry(industry.id)}
                    style={{
                      width: '100%',
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: interests.includes(industry.id) ? '#2563EB' : '#E5E7EB',
                      backgroundColor: interests.includes(industry.id) ? '#EFF6FF' : '#fff',
                      marginBottom: 12,
                    }}
                    accessibilityLabel={`Select industry ${industry.name}`}
                    accessibilityState={{ selected: interests.includes(industry.id) }}
                  >
                    <View style={{
                      padding: 12,
                      borderRadius: 999,
                      marginRight: 16,
                      backgroundColor: getIndustryBgColor(industry.id),
                    }}>
                      {industry.icon}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '500', color: '#111827' }}>{industry.name}</Text>
                      <Text style={{ fontSize: 14, color: '#4B5563' }}>{industry.description}</Text>
                    </View>
                    {interests.includes(industry.id) && <MaterialCommunityIcons name="check-circle" size={24} color="#2563EB" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ marginTop: 32 }}>
              <TouchableOpacity
                onPress={() => setStep(2)}
                disabled={interests.length === 0}
                style={{
                  width: '100%',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: interests.length > 0 ? '#2563EB' : '#E5E7EB',
                }}
                accessibilityLabel="Continue to experience level selection"
                accessibilityState={{ disabled: interests.length === 0 }}
              >
                <Text style={{ fontWeight: '500', color: interests.length > 0 ? '#fff' : '#6B7280' }}>Continue</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        {step === 2 && (
          <>
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>Almost there!</Text>
              <Text style={{ marginTop: 8, color: '#4B5563' }}>Tell us about your experience level</Text>
            </View>
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>Step 2 of 2</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>Experience Level</Text>
              </View>
              <View style={{ width: '100%', backgroundColor: '#E5E7EB', borderRadius: 999, height: 8 }}>
                <View style={{ backgroundColor: '#2563EB', height: 8, borderRadius: 999, width: '100%' }} />
              </View>
            </View>
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '500', color: '#111827', marginBottom: 8 }}>
                What's your experience level?
              </Text>
              <Text style={{ color: '#4B5563', marginBottom: 16 }}>
                This helps us tailor content to your knowledge level.
              </Text>
              <View>
                {experienceLevels.map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setExperience(level)}
                    style={{
                      width: '100%',
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: experience === level ? '#2563EB' : '#E5E7EB',
                      backgroundColor: experience === level ? '#EFF6FF' : '#fff',
                      marginBottom: 12,
                    }}
                    accessibilityLabel={`Select experience level ${level}`}
                    accessibilityState={{ selected: experience === level }}
                    accessibilityRole="radio"
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '500', color: '#111827' }}>{level}</Text>
                    </View>
                    {experience === level ? (
                      <MaterialCommunityIcons name="check-circle" size={24} color="#2563EB" />
                    ) : (
                      <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={24} color="#D1D5DB" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ marginTop: 32 }}>
              <TouchableOpacity
                onPress={handleComplete}
                disabled={!experience}
                style={{
                  width: '100%',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: experience ? '#2563EB' : '#E5E7EB',
                  marginBottom: 12,
                }}
                accessibilityLabel="Get started with onboarding"
                accessibilityState={{ disabled: !experience }}
              >
                <Text style={{ fontWeight: '500', color: experience ? '#fff' : '#6B7280' }}>Get Started</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setStep(1)}
                style={{
                  width: '100%',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#fff',
                }}
                accessibilityLabel="Go back to industry selection"
              >
                <Text style={{ fontWeight: '500', color: '#374151' }}>Back</Text>
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
