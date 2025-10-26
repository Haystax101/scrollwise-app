import React, { useState, useMemo, useEffect } from 'react';
import { View, Image, Alert, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { InputField } from './InputField';
import { Button } from './Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { streakService } from '../../services/streakService';

// Import onboarding components
import { OnboardingScreen } from './OnboardingScreen';
import { ChargingComponent, ChargingBoltIcon } from './ChargingComponent';
import { ImageScroller } from './ImageScroller';
import { WelcomeScreen } from '../WelcomeScreen';
import { EmailInput } from './EmailInput';
import { PasswordSetup } from './PasswordSetup';
import { PersonalInfo } from './PersonalInfo';
import { IndustrySelection } from './IndustrySelection';
import { StreakSelection } from './StreakSelection';
import { OnboardingProgressBar } from './OnboardingProgressBar';
import { FinalOnboardingScreen } from './FinalOnboardingScreen';
import { OtpVerificationScreen } from './OtpVerificationScreen';
import { AnimatedStepContainer } from './AnimatedStepContainer';

// Import assets
const HeroImage = require('../../assets/hero.png');
const Hero2Image = require('../../assets/hero2.png');

interface MainOnboardingProps {
  onComplete: () => void;
  onSignIn?: () => void;
  refreshMainFeed?: () => Promise<void>;
  tutorialOnly?: boolean;
}

interface OnboardingData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  industries?: { id: string; name: string; icon: string }[];
  dreamRole?: string;
  dreamCompany?: string;
  currentRole?: string;
  currentCompany?: string;
  streakGoal?: number;
  enableNotifications?: boolean;
}

// Moved inside component to access chargeLevel state

const tutorialSteps = [
  {
    icon: <ImageScroller />,
    title: 'Industry Insights',
    description: 'Access exclusive knowledge and stay ahead with the latest industry trends',
  },
];

export const MainOnboarding: React.FC<MainOnboardingProps> = ({ onComplete, onSignIn, refreshMainFeed, tutorialOnly }) => {
  const router = useRouter();
  const { user } = useAuth();
  
  // Initialize based on the entry point
  const getInitialSection = () => {
    if (tutorialOnly) return 'tutorial';
    return 'welcome';
  };
  
  const getInitialStep = () => {
    return 0;
  };
  
  const [currentStep, setCurrentStep] = useState(getInitialStep());
  const [currentSection, setCurrentSection] = useState<'welcome' | 'intro' | 'registration' | 'tutorial'>(getInitialSection());
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [userId, setUserId] = useState<string | null>(null);
  
  // Set userId from auth context for authenticated users
  useEffect(() => {
    if (user && !userId) {
      console.log('MainOnboarding: Setting userId from authenticated user:', user.id);
      setUserId(user.id);
    }
  }, [user, userId]);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [chargeLevel, setChargeLevel] = useState(0);
  const [emailExistsError, setEmailExistsError] = useState(false);

  // Stable image components to prevent re-creation
  const chargingBolt = useMemo(() => <ChargingBoltIcon charge={chargeLevel} />, [chargeLevel]);
  
  const introSteps = useMemo(() => [
    {
      icon: chargingBolt,
      title: 'Get Supercharged',
      description: 'Connect with like-minded professionals for exciting project opportunities',
    },
  ], [chargingBolt]);

  const updateOnboardingData = (newData: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...newData }));
  };

  const handleTutorialComplete = async () => {
    // Refresh industries context since user just selected industries during onboarding
    if (refreshMainFeed) {
      try {
        await refreshMainFeed();
        console.log('Industries refreshed after onboarding completion');
      } catch (error) {
        console.error('Error refreshing industries after onboarding:', error);
      }
    }
    // Complete onboarding
    onComplete();
  };

  const nextStep = () => {
    if (currentSection === 'welcome') {
      // Go to intro section (Get Supercharged)
      setCurrentSection('intro');
      setCurrentStep(0);
    } else if (currentSection === 'intro') {
      // Only 1 intro screen now, go straight to registration
      setCurrentSection('registration');
      setCurrentStep(0);
    } else if (currentSection === 'registration') {
      if (currentStep < 5) { // 6 registration screens (0-5)
        setCurrentStep(prev => prev + 1);
      } else {
        // Skip tutorial, complete onboarding
        handleTutorialComplete();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else if (currentSection === 'intro') {
      // Go back to welcome
      setCurrentSection('welcome');
      setCurrentStep(0);
    } else if (currentSection === 'registration') {
      // Go back to intro (Get Supercharged)
      setCurrentSection('intro');
      setCurrentStep(0);
    }
  };

  const goToLogin = () => {
    setEmailExistsError(false);
    setShowLogin(true);
    setCurrentSection('intro');
    setCurrentStep(0);
  };

  // Supabase integration functions
  const signInUser = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert('Sign In Error', error.message);
        return false;
      }

      if (data.user && onSignIn) {
        onSignIn();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error signing in:', error);
      Alert.alert('Error', 'Failed to sign in. Please try again.');
      return false;
    }
  };

  const createUserAccount = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      console.log('Updating user profile after email verification:', { email, firstName, lastName });
      
      // User already exists from OTP verification, just get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Error getting current user:', userError);
        Alert.alert('Authentication Error', 'Please restart the onboarding process.');
        return null;
      }

      console.log('Current user found:', user.id);
      setUserId(user.id);
      
      // CRITICAL FIX: Set the password for the user account
      console.log('Setting password for user account...');
      const { error: passwordError } = await supabase.auth.updateUser({
        password: password
      });

      if (passwordError) {
        console.error('Error setting user password:', passwordError);
        Alert.alert('Password Setup Error', 'Failed to set password. Please try again.');
        return null;
      }

      console.log('Password set successfully');
      
      // Update profile record (user already exists from OTP)
      const profileSuccess = await updateUserProfile(user.id, {
        firstName,
        lastName,
        email
      });
      
      if (!profileSuccess) {
        console.error('Failed to update profile record');
        Alert.alert('Database Error', 'Profile setup failed. Please contact support.');
        return null;
      }
      
      console.log('Profile updated successfully');
      return user.id;
    } catch (error) {
      console.error('Error updating user account:', error);
      Alert.alert('Error', `Failed to update account: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  const updateUserProfile = async (userId: string, profileData: any) => {
    try {
      console.log('Updating user profile:', { userId, profileData });
      
      // Only include fields that exist in the profiles table
      const profilePayload = {
        id: userId,
        full_name: `${profileData.firstName} ${profileData.lastName}`,
        email: profileData.email,
        // Add other valid profile fields here as needed
        // Note: interests, experience, etc. are handled in separate tables
      };
      
      console.log('Profile payload:', profilePayload);
      
      const { error } = await supabase
        .from('profiles')
        .upsert(profilePayload, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Profile update error:', error);
        Alert.alert('Database Error', `Failed to save profile: ${error.message}`);
        return false;
      }
      
      console.log('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      Alert.alert('Database Error', `Failed to save user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const saveIndustrySelection = async (userId: string, industry: any) => {
    try {
      console.log('Saving industry selection:', { userId, industry });
      
      // Find the existing industry by name
      const { data: industryData, error: industryError } = await supabase
        .from('industries')
        .select('id')
        .eq('name', industry.name)
        .single();

      if (industryError) {
        console.error('Error finding industry:', industryError);
        Alert.alert('Database Error', `Failed to find industry "${industry.name}": ${industryError.message}`);
        return false;
      }

      if (!industryData) {
        console.error('Industry not found:', industry.name);
        Alert.alert('Database Error', `Industry "${industry.name}" not found in database. Please contact support.`);
        return false;
      }

      console.log('Linking user to industry:', { userId, industryId: industryData.id });
      
      // Link user to industry
      const { error } = await supabase
        .from('user_industries')
        .upsert({
          user_id: userId,
          industry_id: industryData.id,
        });

      if (error) {
        console.error('Error linking user to industry:', error);
        Alert.alert('Database Error', `Failed to link user to industry: ${error.message}`);
        return false;
      }

      console.log('Industry selection saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving industry selection:', error);
      Alert.alert('Database Error', `Failed to save industry: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const saveCareerGoals = async (userId: string, dreamRole: string, dreamCompany: string) => {
    try {
      // Find or create dream company
      let { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('name', dreamCompany)
        .single();

      if (!companyData) {
        const { data: newCompany } = await supabase
          .from('companies')
          .insert({ name: dreamCompany })
          .select('id')
          .single();
        companyData = newCompany;
      }

      // Save user goals with enhanced schema
      const { error: goalsError } = await supabase
        .from('user_goals')
        .upsert({
          user_id: userId,
          goal: dreamRole,
          goal_type: 'career',
          status: 'active',
          priority: 1,
          description: `Dream role: ${dreamRole} at ${dreamCompany}`,
        });

      if (goalsError) {
        console.error('Error saving user goals:', goalsError);
        return false;
      }

      // Link to goal company
      if (companyData) {
        const { error: goalCompanyError } = await supabase
          .from('user_goal_companies')
          .upsert({
            user_id: userId,
            company_id: companyData.id,
          });

        if (goalCompanyError) {
          console.error('Error linking goal company:', goalCompanyError);
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving career goals:', error);
      return false;
    }
  };

  const saveCurrentWork = async (userId: string, currentRole: string, currentCompany: string) => {
    try {
      if (!currentRole && !currentCompany) return true; // Skip if both empty

      let companyId = null;
      if (currentCompany) {
        // Find or create current company
        let { data: companyData } = await supabase
          .from('companies')
          .select('id')
          .eq('name', currentCompany)
          .single();

        if (!companyData) {
          const { data: newCompany } = await supabase
            .from('companies')
            .insert({ name: currentCompany })
            .select('id')
            .single();
          companyData = newCompany;
        }
        companyId = companyData?.id;
      }

      // Save user experience with enhanced schema
      const { error } = await supabase
        .from('user_experiences')
        .upsert({
          user_id: userId,
          company_id: companyId,
          position_title: currentRole,
          description: `Current position: ${currentRole}`,
          is_current: true,
          start_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
          employment_type: 'full_time', // Default assumption
          experience_level: 'Current',
        });

      if (error) {
        console.error('Error saving current work:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving current work:', error);
      return false;
    }
  };

  // Registration step handlers
  const handleEmailInput = async (data: { email: string }) => {
    const { email } = data;

    console.log('Checking if email exists using secure function:', email);

    try {
      // Use the secure database function to check if email exists
      const { data: emailExists, error } = await supabase.rpc('check_email_exists', {
        email_to_check: email.trim()
      });

      if (error) {
        console.error('Error checking email existence:', error);
        Alert.alert('Error', 'Could not verify email. Please try again.');
        return;
      }

      console.log('Email check result:', emailExists);

      if (emailExists) {
        console.log('Email already exists in profiles table');
        setEmailExistsError(true);
        // Don't proceed - stay on email input screen to show error
        return;
      } else {
        console.log('Email not found in profiles table, proceeding with OTP');
        setEmailExistsError(false);
        updateOnboardingData(data);

        // Send OTP for email verification (not magic link)
        console.log('Sending OTP for email verification:', email);
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            // Don't set emailRedirectTo to ensure OTP is sent instead of magic link
          },
        });

        if (otpError) {
          console.error('Error sending OTP:', otpError);
          console.error('OTP Error details:', JSON.stringify(otpError, null, 2));
          Alert.alert('Error', 'Failed to send verification code. Please try again.');
          return;
        }

        console.log('OTP sent successfully for email verification');
        console.log('Expected: User should receive a 6-digit verification code, NOT a magic link');
        nextStep(); // Move to OTP verification step
      }
    } catch (error) {
      console.error('Unexpected error during email validation:', error);
      Alert.alert('Error', 'Could not verify email. Please try again.');
    }
  };

  const handleOtpSuccess = () => {
    console.log('OTP verification successful, proceeding to password setup');
    nextStep();
  };

  const handleOtpBack = () => {
    console.log('Going back from OTP verification to email input');
    prevStep();
  };

  const handlePasswordSetup = async (data: { password: string }) => {
    updateOnboardingData(data);
    // Just store the password, don't create account yet
    nextStep();
  };

  const handlePersonalInfo = async (data: { firstName: string; lastName: string }) => {
    updateOnboardingData(data);
    
    // Now we have all the data needed - create the user account with profile
    const completeData = { ...onboardingData, ...data };
    console.log('Creating user account with complete data:', completeData);
    
    setCreatingAccount(true);
    const result = await createUserAccount(
      completeData.email!,
      completeData.password!,
      data.firstName,
      data.lastName
    );
    setCreatingAccount(false);
    
    if (!result) {
      console.error('Failed to create user account, not proceeding');
      return; // Don't proceed if account creation failed
    }
    
    console.log('User account and profile created successfully');
    nextStep();
  };

  const handleIndustrySelection = async (data: { industries: any[] }) => {
    updateOnboardingData(data);
    
    if (userId) {
      console.log('Attempting to save industry selections:', data.industries);
      
      // First, clear all existing industry selections for this user
      console.log('Clearing existing industry selections for user:', userId);
      const { error: deleteError } = await supabase
        .from('user_industries')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) {
        console.error('Failed to clear existing industries:', deleteError);
        Alert.alert('Database Error', `Failed to clear existing industries: ${deleteError.message}`);
        return; // Don't proceed if deletion failed
      }
      
      // Now save all selected industries
      for (const industry of data.industries) {
        const success = await saveIndustrySelection(userId, industry);
        if (!success) {
          console.error('Failed to save industry selection, not proceeding');
          return; // Don't proceed if any industry save failed
        }
      }
    }
    nextStep();
  };

  const handleDreamRole = async (data: { dreamRole: string; dreamCompany: string }) => {
    updateOnboardingData(data);
    
    if (userId) {
      await saveCareerGoals(userId, data.dreamRole, data.dreamCompany);
    }
    nextStep();
  };

  const handleCurrentWork = async (data: { currentRole: string; currentCompany: string }) => {
    updateOnboardingData(data);
    
    if (userId) {
      await saveCurrentWork(userId, data.currentRole, data.currentCompany);
    }
    nextStep();
  };

  const handleStreakSelection = async (data: { streakGoal: number; enableNotifications?: boolean }) => {
    updateOnboardingData(data);

    if (userId) {
      console.log('Setting up user learning streak:', data.streakGoal);

      const success = await streakService.initializeStreak(userId, data.streakGoal);

      if (!success) {
        Alert.alert('Error', 'Failed to set up learning streak. Please try again.');
        return; // Don't proceed if streak setup failed
      }
      console.log('Learning streak set up successfully');
    }

    // Transition directly to tutorial after streak setup
    setCurrentSection('tutorial');
    setCurrentStep(0);
  };

  const handleNotifications = async (data: { enableNotifications: boolean }) => {
    updateOnboardingData(data);
    
    // Handle notification permissions here if needed
    if (data.enableNotifications) {
      // Request notification permissions
      // This would typically involve Expo Notifications
    }
    
    nextStep();
  };

  const handleYoureAllSet = () => {
    console.log('YoureAllSetScreen: Transitioning from registration to tutorial');
    // Transition from registration to tutorial
    setCurrentSection('tutorial');
    setCurrentStep(0);
  };


  // Render different sections
  const renderRegistrationStep = () => {
    // Show progress bar for ALL registration steps (6 total steps)
    const totalProgressSteps = 6; // Email, OTP, Password, Name, Industry, Streak
    const currentProgressStep = currentStep + 1; // Steps 1-6

    const stepContent = (() => {
      switch (currentStep) {
        case 0:
          return <EmailInput onNext={handleEmailInput} onBack={prevStep} emailExistsError={emailExistsError} onGoToLogin={goToLogin} />;
        case 1:
          return <OtpVerificationScreen
            email={onboardingData.email}
            onSuccess={handleOtpSuccess}
            onBack={handleOtpBack}
            skipInitialOtpSend={true} // OTP was already sent in EmailInput
          />;
        case 2:
          return <PasswordSetup onNext={handlePasswordSetup} onBack={prevStep} />;
        case 3:
          return <PersonalInfo onNext={handlePersonalInfo} onBack={prevStep} isLoading={creatingAccount} />;
        case 4:
          return <IndustrySelection onNext={handleIndustrySelection} />;
        case 5:
          return <StreakSelection onNext={handleStreakSelection} onBack={prevStep} />;
        default:
          return null;
      }
    })();

    return (
      <View style={{ flex: 1 }}>
        <AnimatedStepContainer stepKey={`registration-${currentStep}`}>
          {stepContent}
        </AnimatedStepContainer>
        <OnboardingProgressBar
          currentStep={currentProgressStep}
          totalSteps={totalProgressSteps}
          onBack={prevStep}
          hideBackButton={false} // Always show back button, even on email input
        />
      </View>
    );
  };

  if (currentSection === 'registration') {
    return renderRegistrationStep();
  }


  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoggingIn(true);
    const success = await signInUser(loginEmail, loginPassword);
    setLoggingIn(false);

    if (!success) {
      // Error already shown in signInUser
      return;
    }
  };

  // Welcome screen handlers
  const handleGetStarted = () => {
    nextStep(); // This will move to intro section
  };

  const handleWelcomeSignIn = () => {
    setShowLogin(true);
    setCurrentSection('intro');
    setCurrentStep(0);
  };

  // Render welcome screen
  if (currentSection === 'welcome') {
    return <WelcomeScreen onGetStarted={handleGetStarted} onSignIn={handleWelcomeSignIn} />;
  }


  // Handle login on first intro screen
  if (currentSection === 'intro' && currentStep === 0 && showLogin) {
    return (
      <OnboardingScreen
        icon={null}
        title="Welcome Back"
        description="Sign in to continue your journey"
        currentStep={currentStep}
        totalSteps={introSteps.length}
        onNext={handleLogin}
        onBack={() => {
          setShowLogin(false);
          setCurrentSection('welcome');
        }}
        hideStepCounter={true}
        hideProgressDots={true}
        showBackButton={true}
        customContent={
          <View style={{ width: '100%', paddingHorizontal: 24 }}>
            <InputField
              label="Email"
              value={loginEmail}
              onChangeText={setLoginEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={{ marginTop: 16 }} />
            <InputField
              label="Password"
              value={loginPassword}
              onChangeText={setLoginPassword}
              secureTextEntry
            />
            <View style={{ marginTop: 16, alignItems: 'center' }}>
              <TouchableOpacity 
                onPress={() => router.push('/reset-password-request')}
                style={{ paddingVertical: 8 }}
              >
                <Text style={{ color: '#EAB308', fontSize: 16 }}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        buttonText={loggingIn ? "Signing In..." : "Sign In"}
        buttonDisabled={loggingIn || !loginEmail || !loginPassword}
      />
    );
  }

  // Handle tutorial section with custom final screen
  if (currentSection === 'tutorial') {
    return <FinalOnboardingScreen onNext={handleTutorialComplete} />;
  }

  // Render intro sections
  const steps = introSteps;
  const step = steps[currentStep];
  const isFinalIntroStep = currentSection === 'intro' && currentStep === introSteps.length - 1;

  return (
    <OnboardingScreen
      icon={step.icon}
      title={step.title}
      description={step.description}
      currentStep={currentStep}
      totalSteps={steps.length}
      onNext={nextStep}
      onBack={prevStep}
      isFinalStep={isFinalIntroStep}
      chargeComponent={isFinalIntroStep ? <ChargingComponent onComplete={nextStep} onChargeChange={setChargeLevel} /> : undefined}
      disableIconAnimation={isFinalIntroStep}
      hideStepCounter={isFinalIntroStep}
      hideProgressDots={isFinalIntroStep}
      showBackButton={isFinalIntroStep}
    />
  );
};
