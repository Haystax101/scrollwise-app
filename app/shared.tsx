import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useSearchParams } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * Deep link entry point for shared content
 * Handles URLs like: https://learningsupercharged.com/shared?content=article:123&ref=code
 *
 * This route exists to prevent "Unmatched Route" errors when universal links are opened.
 * It immediately redirects to /feed with the appropriate parameters.
 */
export default function SharedScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    const handleDeepLink = async () => {
      console.log('🔗 SharedScreen: Processing deep link with params:', params);

      // Extract content parameter (format: "article:123" or "paper:456")
      const contentParam = params.get('content');
      const referralCode = params.get('ref');

      if (!contentParam) {
        console.warn('🔗 SharedScreen: No content parameter, redirecting to feed');
        router.replace('/feed');
        return;
      }

      // Parse content type and ID
      const [contentType, contentId] = contentParam.split(':');

      if (!contentType || !contentId) {
        console.error('🔗 SharedScreen: Invalid content format:', contentParam);
        router.replace('/feed');
        return;
      }

      console.log('🔗 SharedScreen: Parsed content:', { contentType, contentId, referralCode });

      // Track referral if code provided and user is logged in
      if (referralCode && user) {
        try {
          console.log('🔗 SharedScreen: Tracking referral:', referralCode);
          await supabase.rpc('track_referral_click', {
            p_referral_code: referralCode,
            p_user_id: user.id,
            p_content_type: contentType,
            p_content_id: parseInt(contentId, 10)
          });
        } catch (error) {
          console.error('🔗 SharedScreen: Error tracking referral:', error);
          // Continue anyway - don't block navigation
        }
      }

      // Navigate to feed with content parameters
      console.log('🔗 SharedScreen: Navigating to feed with content');
      router.replace({
        pathname: '/feed',
        params: {
          contentId: contentId,
          contentType: contentType,
          showBackButton: 'true',
          backTo: 'app'
        }
      });
    };

    handleDeepLink();
  }, [params, router, user]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
