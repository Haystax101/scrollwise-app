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

      // Handle Universal Links (https://learningsupercharged.com/shared/...)
      if (url.includes('learningsupercharged.com')) {
        console.log('🔗 DeepLink: Processing Universal Link');
        return this.parseUniversalLink(url);
      }

      // Handle custom scheme URLs manually for better control
      if (url.startsWith('supercharged:')) {
        console.log('🔗 DeepLink: Processing custom scheme URL manually');
        return this.parseCustomSchemeUrl(url);
      }

      const parsed = Linking.parse(url);
      console.log('🔗 DeepLink: Expo-linking parsed result:', JSON.stringify(parsed, null, 2));

      // Handle custom scheme (supercharged://...)
      if (parsed.path) {
        console.log('🔗 DeepLink: Parsed path:', parsed.path);
        console.log('🔗 DeepLink: Parsed hostname:', parsed.hostname);

        // Pattern: supercharged://content/article/123?ref=abc or supercharged:///content/article/123
        let pathToCheck = parsed.path;

        // Handle triple slash case where hostname might be included
        if (parsed.hostname && parsed.hostname.startsWith('content')) {
          pathToCheck = parsed.hostname + (parsed.path ? parsed.path : '');
          console.log('🔗 DeepLink: Using combined hostname+path:', pathToCheck);
        }

        if (pathToCheck.startsWith('content/')) {
          const pathParts = pathToCheck.split('/');
          console.log('🔗 DeepLink: Path parts:', pathParts);

          if (pathParts.length >= 3) {
            const contentType = pathParts[1] as 'article' | 'paper' | 'book' | 'insight';
            const contentId = pathParts[2];
            const referralCode = parsed.queryParams?.ref as string;

            console.log('🔗 DeepLink: Extracted content:', { contentType, contentId, referralCode });

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
   * Parse custom scheme URLs manually (better control than expo-linking)
   */
  private static parseCustomSchemeUrl(url: string): DeepLinkData | null {
    try {
      console.log('🔗 DeepLink: Manual parsing of custom scheme URL:', url);

      // Remove scheme and normalize slashes
      // Handle: supercharged://content/paper/902 or supercharged:///content/paper/902
      let urlPath = url.replace(/^supercharged:\/*/i, '');
      console.log('🔗 DeepLink: URL path after scheme removal:', urlPath);

      // Remove query parameters from path for proper parsing
      const queryIndex = urlPath.indexOf('?');
      if (queryIndex > -1) {
        urlPath = urlPath.substring(0, queryIndex);
      }

      // Split by / and filter out empty parts
      const pathParts = urlPath.split('/').filter(part => part.length > 0);
      console.log('🔗 DeepLink: Path parts:', pathParts);

      // Check for content pattern: ['content', 'paper', '902']
      if (pathParts.length >= 3 && pathParts[0] === 'content') {
        const contentType = pathParts[1] as 'article' | 'paper' | 'book' | 'insight';
        const contentId = pathParts[2];

        // Parse query parameters if any
        let referralCode: string | undefined;
        const queryIndex = url.indexOf('?');
        if (queryIndex > -1) {
          const queryString = url.substring(queryIndex + 1);
          const urlParams = new URLSearchParams(queryString);
          referralCode = urlParams.get('ref') || undefined;
        }

        console.log('🔗 DeepLink: Manual parse result:', { contentType, contentId, referralCode });

        return {
          contentType,
          contentId,
          referralCode
        };
      }

      // Check for invite pattern: ['invite'] or just referral params
      if (pathParts.length === 0 || (pathParts.length === 1 && pathParts[0] === 'invite')) {
        const queryIndex = url.indexOf('?');
        if (queryIndex > -1) {
          const queryString = url.substring(queryIndex + 1);
          const urlParams = new URLSearchParams(queryString);
          const referralCode = urlParams.get('ref');

          if (referralCode) {
            return {
              referralCode,
              screen: 'invite'
            };
          }
        }
      }

      console.warn('🔗 DeepLink: Custom scheme URL does not match expected patterns');
      return null;

    } catch (error) {
      console.error('🔗 DeepLink: Error in manual custom scheme parsing:', error);
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
      console.log('🔗 DeepLink: Starting to handle URL:', url);

      const linkData = this.parseDeepLink(url);
      if (!linkData) {
        console.warn('🔗 DeepLink: Failed to parse URL, no link data extracted');
        return;
      }

      console.log('🔗 DeepLink: Successfully processed link data:', JSON.stringify(linkData, null, 2));

      // Store the deep link data for processing after app is ready
      const pendingData = {
        ...linkData,
        timestamp: Date.now(),
        originalUrl: url
      };

      await AsyncStorage.setItem('pending_deep_link', JSON.stringify(pendingData));
      console.log('🔗 DeepLink: Stored pending deep link data:', pendingData);

      // Process referral if present
      if (linkData.referralCode) {
        console.log('🔗 DeepLink: Processing referral code:', linkData.referralCode);
        await this.processReferral(linkData.referralCode);
      }

    } catch (error) {
      console.error('🔗 DeepLink: Error handling deep link:', error);
      console.error('🔗 DeepLink: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Process pending deep link (call this when app is ready)
   */
  static async processPendingDeepLink(router: any): Promise<void> {
    try {
      console.log('🔗 DeepLink: Checking for pending deep links...');

      const pendingLinkString = await AsyncStorage.getItem('pending_deep_link');
      if (!pendingLinkString) {
        console.log('🔗 DeepLink: No pending deep links found');
        return;
      }

      const linkData = JSON.parse(pendingLinkString);
      console.log('🔗 DeepLink: Found pending link data:', JSON.stringify(linkData, null, 2));

      // Check if link is not too old (5 minutes max)
      const maxAge = 5 * 60 * 1000; // 5 minutes
      const age = Date.now() - linkData.timestamp;
      if (age > maxAge) {
        console.log(`🔗 DeepLink: Pending link too old (${Math.round(age / 1000)}s), removing`);
        await AsyncStorage.removeItem('pending_deep_link');
        return;
      }

      console.log(`🔗 DeepLink: Processing pending link (age: ${Math.round(age / 1000)}s):`, linkData);

      // Navigate based on link type
      if (linkData.contentType && linkData.contentId) {
        console.log(`🔗 DeepLink: Navigating to content: ${linkData.contentType} ${linkData.contentId}`);
        await this.navigateToContent(router, linkData.contentType, linkData.contentId);
      } else if (linkData.screen === 'invite') {
        console.log('🔗 DeepLink: Navigating to friends/invite screen');
        router.push('/friends');
      } else {
        console.warn('🔗 DeepLink: Unhandled link data structure:', linkData);
      }

      // Clear the pending link
      console.log('🔗 DeepLink: Clearing pending deep link');
      await AsyncStorage.removeItem('pending_deep_link');

    } catch (error) {
      console.error('🔗 DeepLink: Error processing pending deep link:', error);
      console.error('🔗 DeepLink: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Clear the pending link on error to prevent repeated failures
      try {
        await AsyncStorage.removeItem('pending_deep_link');
        console.log('🔗 DeepLink: Cleared pending link due to processing error');
      } catch (clearError) {
        console.error('🔗 DeepLink: Failed to clear pending link:', clearError);
      }
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
      console.log(`🔗 DeepLink: Starting navigation to ${contentType} ${contentId}`);

      const navigationParams = {
        pathname: '/feed',
        params: {
          contentId: contentId,
          contentType: contentType,
          showBackButton: 'true', // Add back button for deep linked content
          backTo: 'app' // Indicate this came from external
        }
      };

      console.log('🔗 DeepLink: Navigation params:', JSON.stringify(navigationParams, null, 2));

      // Try direct navigation first
      await router.push(navigationParams);

      console.log(`🔗 DeepLink: Successfully navigated to feed with ${contentType} ${contentId}`);

    } catch (error) {
      console.error('🔗 DeepLink: Error navigating to content:', error);
      console.error('🔗 DeepLink: Navigation error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        contentType,
        contentId
      });

      try {
        console.log('🔗 DeepLink: Attempting fallback navigation to feed');
        await router.push('/feed');
        console.log('🔗 DeepLink: Fallback navigation successful');
      } catch (fallbackError) {
        console.error('🔗 DeepLink: Fallback navigation also failed:', fallbackError);
      }
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
        console.log('🔗 DeepLink: Checking for initial URL...');
        const initialURL = await Linking.getInitialURL();
        if (initialURL) {
          console.log('🔗 DeepLink: App opened with URL:', initialURL);
          console.log('🔗 DeepLink: URL type:', typeof initialURL);
          await DeepLinkHandler.handleDeepLink(initialURL);

          // Small delay to ensure router is ready (reduced to minimize "unmatched route" flash)
          setTimeout(() => {
            console.log('🔗 DeepLink: Processing pending deep link after 200ms delay');
            DeepLinkHandler.processPendingDeepLink(router);
          }, 200);
        } else {
          console.log('🔗 DeepLink: No initial URL found');
        }
      } catch (error) {
        console.error('🔗 DeepLink: Error handling initial URL:', error);
      }
    };

    // Handle deep link when app is already running
    const handleURL = (event: { url: string }) => {
      console.log('🔗 DeepLink: App received URL while running:', event.url);
      console.log('🔗 DeepLink: Event object:', JSON.stringify(event, null, 2));
      DeepLinkHandler.handleDeepLink(event.url);

      // Process immediately since app is already running
      setTimeout(() => {
        console.log('🔗 DeepLink: Processing pending deep link after 500ms delay');
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