import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

// Import onboarding components
import { WelcomeScreen } from '../WelcomeScreen';
import { LoginScreen } from './LoginScreen';
import { OnboardingLayout } from './OnboardingLayout';
import { AnimatedStepContainer } from './AnimatedStepContainer';
import { PersonalInfo } from './PersonalInfo';
import { IndustrySelection } from './IndustrySelection';
import { EmailInput } from './EmailInput';
import { OtpVerificationScreen } from './OtpVerificationScreen';
import { PasswordSetup } from './PasswordSetup';
import { Notifications } from './Notifications';

// Import assets (if needed, currently unused in simplified flow)

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
  industries?: { id: string; name: string }[];
  enableNotifications?: boolean;
}

export const MainOnboarding: React.FC<MainOnboardingProps> = ({ onComplete, onSignIn, refreshMainFeed, tutorialOnly }) => {
  const { user } = useAuth();

  // Steps definition for progress calculation
  const TOTAL_STEPS = 6; // Name, Industry, Email, OTP, Password, Notifications

  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(!tutorialOnly); // Show welcome unless tutorial only
  const [showLogin, setShowLogin] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [userId, setUserId] = useState<string | null>(null);

  const [emailExistsError, setEmailExistsError] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);

  // Set userId from auth context for authenticated users
  useEffect(() => {
    if (user && !userId) {
      setUserId(user.id);
    }
  }, [user, userId]);

  const updateOnboardingData = (newData: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...newData }));
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleCompletion();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      setShowWelcome(true);
    }
  };

  const handleCompletion = async () => {
    if (refreshMainFeed) {
      await refreshMainFeed();
    }
    onComplete();
  };

  // --- Step Handlers ---

  const handlePersonalInfo = (data: { firstName: string; lastName: string }) => {
    updateOnboardingData(data);
    handleNext();
  };

  const handleIndustrySelection = (data: { industries: any[] }) => {
    updateOnboardingData(data);
    handleNext();
  };

  const handleEmailInput = async (data: { email: string }) => {
    const { email } = data;
    try {
      const { data: emailExists, error } = await supabase.rpc('check_email_exists', {
        email_to_check: email.trim()
      });

      if (error) throw error;

      if (emailExists) {
        setEmailExistsError(true);
        return;
      }

      setEmailExistsError(false);
      updateOnboardingData({ email });

      // Send OTP
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });

      if (otpError) throw otpError;

      handleNext(); // Move to OTP
    } catch (error) {
      console.error('Email check/OTP error:', error);
      Alert.alert('Error', 'Could not verify email. Please try again.');
    }
  };

  const handleOtpSuccess = () => {
    handleNext(); // Move to Password
  };

  const handlePasswordSetup = async (data: { password: string }) => {
    updateOnboardingData(data);

    // Create the account/profile now
    setCreatingAccount(true);
    const { email, firstName, lastName } = onboardingData;

    try {
      // 1. Set Password
      const { error: pwdError } = await supabase.auth.updateUser({ password: data.password });
      if (pwdError) throw pwdError;

      // 2. Update Profile
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No user found');

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: currentUser.id,
        full_name: `${firstName} ${lastName}`,
        email: email,
      });
      if (profileError) throw profileError;

      // 3. Save Industries
      if (onboardingData.industries) {
        // Clear old
        await supabase.from('user_industries').delete().eq('user_id', currentUser.id);

        // Add new
        for (const industry of onboardingData.industries) {
          // Find industry ID (assuming names match, optimization: handle IDs directly if available)
          const { data: indData } = await supabase.from('industries').select('id').eq('name', industry.name).single();
          if (indData) {
            await supabase.from('user_industries').insert({
              user_id: currentUser.id,
              industry_id: indData.id
            });
          }
        }
      }

      setUserId(currentUser.id);
      handleNext(); // Move to Notifications

    } catch (error: any) {
      console.error('Account creation error:', error);
      Alert.alert('Error', error.message || 'Failed to create account');
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleNotifications = (data: { enableNotifications: boolean }) => {
    updateOnboardingData(data);
    // Request permissions logic here if needed, or just save preference
    handleNext(); // Complete
  };

  // --- Rendering ---

  if (showWelcome) {
    return (
      <WelcomeScreen
        onGetStarted={() => setShowWelcome(false)}
        onSignIn={() => {
          setShowWelcome(false);
          setShowLogin(true);
        }}
      />
    );
  }

  if (showLogin) {
    return (
      <LoginScreen
        onSuccess={() => {
          if (onSignIn) onSignIn();
        }}
        onBack={() => {
          setShowLogin(false);
          setShowWelcome(true);
        }}
      />
    );
  }

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={TOTAL_STEPS}
      onBack={handleBack}
      showBack={true}
    >
      <AnimatedStepContainer stepKey={`step-${currentStep}`}>
        {currentStep === 0 && (
          <PersonalInfo onNext={handlePersonalInfo} />
        )}
        {currentStep === 1 && (
          <IndustrySelection onNext={handleIndustrySelection} />
        )}
        {currentStep === 2 && (
          <EmailInput
            onNext={handleEmailInput}
            emailExistsError={emailExistsError}
            onGoToLogin={() => {
              if (onSignIn) onSignIn();
            }}
          />
        )}
        {currentStep === 3 && (
          <OtpVerificationScreen
            email={onboardingData.email}
            onSuccess={handleOtpSuccess}
            skipInitialOtpSend={true} // Already sent in EmailInput
          />
        )}
        {currentStep === 4 && (
          <PasswordSetup onNext={handlePasswordSetup} isLoading={creatingAccount} />
        )}
        {currentStep === 5 && (
          <Notifications onNext={handleNotifications} />
        )}
      </AnimatedStepContainer>
    </OnboardingLayout>
  );
};
