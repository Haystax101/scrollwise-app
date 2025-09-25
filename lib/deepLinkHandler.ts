import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export interface DeepLinkData {
  contentType?: 'article' | 'paper' | 'book' | 'insight';
  contentId?: string;
  referralCode?: string;
  screen?: string;
}

export class DeepLinkHandler {
  /**
   * Parse deep link URL and extract relevant data
   */
  static parseDeepLink(url: string): DeepLinkData | null {
    try {
      console.log('🔗 DeepLink: Parsing URL:', url);

      const parsed = Linking.parse(url);

      // Handle Universal Links (https://learningsupercharged.com/shared/...)
      if (url.includes('learningsupercharged.com')) {
        console.log('🔗 DeepLink: Processing Universal Link');
        return this.parseUniversalLink(url);
      }

      // Handle custom scheme (supercharged://...)
      if (parsed.path) {
        // Pattern: supercharged://content/article/123?ref=abc
        if (parsed.path.startsWith('content/')) {
          const pathParts = parsed.path.split('/');
          if (pathParts.length >= 3) {
            const contentType = pathParts[1] as 'article' | 'paper' | 'book' | 'insight';
            const contentId = pathParts[2];
            const referralCode = parsed.queryParams?.ref as string;

            return {
              contentType,
              contentId,
              referralCode
            };
          }
        }

        // Pattern: supercharged://invite?ref=abc
        if (parsed.path === 'invite' || parsed.path === '') {
          const referralCode = parsed.queryParams?.ref as string;
          return {
            referralCode,
            screen: 'invite'
          };
        }
      }

      console.warn('🔗 DeepLink: Unrecognized URL pattern:', url);
      return null;

    } catch (error) {
      console.error('🔗 DeepLink: Error parsing URL:', error);
      return null;
    }
  }

  /**
   * Parse Universal Link URLs
   */
  private static parseUniversalLink(url: string): DeepLinkData | null {
    try {
      const urlObj = new URL(url);
      const searchParams = urlObj.searchParams;

      // Extract content parameter (format: "article:123" or "paper:456")
      const content = searchParams.get('content');
      const referralCode = searchParams.get('ref');

      if (content) {
        const [contentType, contentId] = content.split(':');
        if (contentType && contentId) {
          return {
            contentType: contentType as 'article' | 'paper' | 'book' | 'insight',
            contentId,
            referralCode: referralCode || undefined
          };
        }
      }

      // If no content parameter, check if it's just a referral invite
      if (referralCode) {
        return {
          referralCode,
          screen: 'invite'
        };
      }

      return null;
    } catch (error) {
      console.error('🔗 DeepLink: Error parsing Universal Link:', error);
      return null;
    }
  }

  /**
   * Handle incoming deep link
   */
  static async handleDeepLink(url: string): Promise<void> {
    try {
      const linkData = this.parseDeepLink(url);
      if (!linkData) return;

      console.log('🔗 DeepLink: Processed link data:', linkData);

      // Store the deep link data for processing after app is ready
      await AsyncStorage.setItem('pending_deep_link', JSON.stringify({
        ...linkData,
        timestamp: Date.now()
      }));

      // Process referral if present
      if (linkData.referralCode) {
        await this.processReferral(linkData.referralCode);
      }

    } catch (error) {
      console.error('🔗 DeepLink: Error handling deep link:', error);
    }
  }

  /**
   * Process pending deep link (call this when app is ready)
   */
  static async processPendingDeepLink(router: any): Promise<void> {
    try {
      const pendingLinkString = await AsyncStorage.getItem('pending_deep_link');
      if (!pendingLinkString) return;

      const linkData = JSON.parse(pendingLinkString);

      // Check if link is not too old (5 minutes max)
      const maxAge = 5 * 60 * 1000; // 5 minutes
      if (Date.now() - linkData.timestamp > maxAge) {
        await AsyncStorage.removeItem('pending_deep_link');
        return;
      }

      console.log('🔗 DeepLink: Processing pending link:', linkData);

      // Navigate based on link type
      if (linkData.contentType && linkData.contentId) {
        // Navigate to specific content
        await this.navigateToContent(router, linkData.contentType, linkData.contentId);
      } else if (linkData.screen === 'invite') {
        // Navigate to friends/invite screen
        router.push('/friends');
      }

      // Clear the pending link
      await AsyncStorage.removeItem('pending_deep_link');

    } catch (error) {
      console.error('🔗 DeepLink: Error processing pending deep link:', error);
    }
  }

  /**
   * Navigate to specific content using router
   */
  static async navigateToContent(
    router: any,
    contentType: string,
    contentId: string
  ): Promise<void> {
    try {
      console.log(`🔗 DeepLink: Navigating to ${contentType} ${contentId}`);

      // Navigate to feed with specific content parameters
      router.push({
        pathname: '/feed',
        params: {
          initialContentId: contentId,
          initialContentType: contentType
        }
      });

    } catch (error) {
      console.error('🔗 DeepLink: Error navigating to content:', error);

      // Fallback: just go to feed
      router.push('/feed');
    }
  }

  /**
   * Process referral code
   */
  private static async processReferral(referralCode: string): Promise<void> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        // User not logged in - store referral for later
        await AsyncStorage.setItem('pending_referral', JSON.stringify({
          referralCode,
          timestamp: Date.now()
        }));
        console.log('🔗 DeepLink: Stored referral for after login:', referralCode);
        return;
      }

      // Find the referrer
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('referral_code', referralCode)
        .single();

      if (referrer) {
        console.log('🔗 DeepLink: Found referrer:', referrer.full_name);

        // Update the referral record to mark as opened
        await supabase
          .from('user_referrals')
          .update({
            status: 'opened',
            referred_user_id: currentUser.user.id,
            opened_at: new Date().toISOString()
          })
          .eq('referral_code', referralCode);

        // You could show a notification about the referrer here
        console.log(`🔗 DeepLink: Processed referral from ${referrer.full_name}`);
      }

    } catch (error) {
      console.error('🔗 DeepLink: Error processing referral:', error);
    }
  }

  /**
   * Process pending referral after user logs in
   */
  static async processPendingReferral(): Promise<void> {
    try {
      const pendingReferralString = await AsyncStorage.getItem('pending_referral');
      if (!pendingReferralString) return;

      const { referralCode } = JSON.parse(pendingReferralString);

      // Process the referral now that user is logged in
      await this.processReferral(referralCode);

      // Clear pending referral
      await AsyncStorage.removeItem('pending_referral');

    } catch (error) {
      console.error('🔗 DeepLink: Error processing pending referral:', error);
    }
  }
}

/**
 * React hook to handle deep links in components
 */
export function useDeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    // Handle deep link when app is opened from a link
    const handleInitialURL = async () => {
      try {
        const initialURL = await Linking.getInitialURL();
        if (initialURL) {
          console.log('🔗 DeepLink: App opened with URL:', initialURL);
          await DeepLinkHandler.handleDeepLink(initialURL);

          // Small delay to ensure router is ready
          setTimeout(() => {
            DeepLinkHandler.processPendingDeepLink(router);
          }, 1000);
        }
      } catch (error) {
        console.error('🔗 DeepLink: Error handling initial URL:', error);
      }
    };

    // Handle deep link when app is already running
    const handleURL = (event: { url: string }) => {
      console.log('🔗 DeepLink: App received URL while running:', event.url);
      DeepLinkHandler.handleDeepLink(event.url);

      // Process immediately since app is already running
      setTimeout(() => {
        DeepLinkHandler.processPendingDeepLink(router);
      }, 500);
    };

    // Set up listeners
    handleInitialURL();
    const subscription = Linking.addEventListener('url', handleURL);

    // Process any pending deep links on mount
    setTimeout(() => {
      DeepLinkHandler.processPendingDeepLink(router);
    }, 1000);

    return () => {
      subscription?.remove();
    };
  }, [router]);

  // Return helper functions for manual navigation
  return {
    navigateToContent: (contentType: string, contentId: string) => {
      DeepLinkHandler.navigateToContent(router, contentType, contentId);
    },
    processPendingReferral: DeepLinkHandler.processPendingReferral
  };
}