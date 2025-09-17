import { Share, Platform, Alert } from 'react-native';
import { supabase } from './supabase';
import { FriendsService } from './friendsService';

export type ShareContentType = 'article' | 'paper' | 'book' | 'insight';

export interface ShareContent {
  type: ShareContentType;
  id: string;
  title: string;
  summary?: string;
}

export class ShareService {
  /**
   * Share specific content with referral tracking
   */
  static async shareContent(content: ShareContent): Promise<void> {
    try {
      const referralLink = await this.generateReferralLink(content.type, content.id);

      // Create content-specific message
      const shareMessage = this.createContentShareMessage(content, referralLink);

      await this.performShare({
        message: shareMessage,
        url: referralLink,
        title: `Check out "${content.title}" on Supercharged`
      });

      // Track the share event
      await this.trackShareEvent(content.type, content.id, 'content_share');

    } catch (error) {
      console.error('Error sharing content:', error);
      Alert.alert('Error', 'Failed to share content');
      throw error;
    }
  }

  /**
   * Share general app invitation
   */
  static async shareAppInvitation(): Promise<void> {
    try {
      const referralLink = await this.generateReferralLink();

      const shareMessage = this.createGeneralInviteMessage(referralLink);

      await this.performShare({
        message: shareMessage,
        url: referralLink,
        title: 'Join me on Supercharged!'
      });

      // Track the share event
      await this.trackShareEvent(null, null, 'app_invite');

    } catch (error) {
      console.error('Error sharing app invitation:', error);
      Alert.alert('Error', 'Failed to share invitation');
      throw error;
    }
  }

  /**
   * Generate referral link for tracking
   */
  private static async generateReferralLink(
    contentType?: ShareContentType,
    contentId?: string
  ): Promise<string> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new Error('Not authenticated');
    }

    // Get or create referral code
    const referralCode = await FriendsService.getReferralCode();

    // Create or update referral record for tracking
    const referralData = {
      referrer_id: currentUser.user.id,
      referral_code: referralCode,
      shared_content_type: contentType || null,
      shared_content_id: contentId || null,
      referral_source: Platform.OS === 'ios' ? 'ios_share' : 'android_share',
      status: 'pending' as const
    };

    // Use upsert to handle duplicate referral codes
    const { error } = await supabase
      .from('user_referrals')
      .upsert(referralData, {
        onConflict: 'referral_code'
      });

    if (error) {
      console.error('Error creating/updating referral record:', error);
      // Don't throw here - we still want to share even if tracking fails
    }

    // Return web URL that handles app detection and download
    if (contentType && contentId) {
      // Content-specific sharing link
      return `https://learningsupercharged.com/shared?content=${contentType}:${contentId}&ref=${referralCode}`;
    } else {
      // General app invitation
      return `https://learningsupercharged.com/shared?ref=${referralCode}`;
    }
  }

  /**
   * Perform cross-platform share
   */
  private static async performShare(options: {
    message: string;
    url: string;
    title: string;
  }): Promise<void> {
    // Configure sharing options for each platform
    const shareOptions = Platform.select({
      ios: {
        message: options.message,
        url: options.url, // iOS can handle URL separately
        title: options.title
      },
      android: {
        message: `${options.message}\n\n${options.url}`, // Android includes URL in message
        title: options.title
      },
      default: {
        message: `${options.message}\n\n${options.url}`,
        title: options.title
      }
    });

    const result = await Share.share(shareOptions);

    if (result.action === Share.sharedAction) {
      // Successfully shared
      if (Platform.OS === 'ios' && result.activityType) {
        console.log('Shared via:', result.activityType);
      }

      // Show success message
      Alert.alert(
        'Shared Successfully!',
        'Your invitation has been shared. You\'ll earn voltz when someone joins using your link!'
      );
    }
  }

  /**
   * Create content-specific share message
   */
  private static createContentShareMessage(content: ShareContent, link: string): string {
    const contentTypeDisplayName = content.type.charAt(0).toUpperCase() + content.type.slice(1);

    let message = `Check out this interesting ${contentTypeDisplayName.toLowerCase()} I found on Supercharged:\n\n`;
    message += `"${content.title}"\n\n`;

    message += `Join me on Supercharged to discover more personalized content for your industry! 🚀\n\n${link}`;

    return message;
  }

  /**
   * Create general app invitation message
   */
  private static createGeneralInviteMessage(link: string): string {
    return `Join me on Supercharged to keep tabs on your industry! 🚀

📚 Discover personalized articles, papers, and insights
🤝 Connect with professionals in your field
⚡ Earn voltz rewards for learning and engagement
🎯 Get content tailored to your interests

Download the app and sign up using my link:
${link}`;
  }

  /**
   * Track share events for analytics
   */
  private static async trackShareEvent(
    contentType: ShareContentType | null,
    contentId: string | null,
    shareType: 'content_share' | 'app_invite'
  ): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) return;

    try {
      // You can integrate with your analytics service here
      // For example, PostHog, Mixpanel, etc.

      const eventData = {
        user_id: currentUser.user.id,
        event_type: shareType,
        content_type: contentType,
        content_id: contentId,
        platform: Platform.OS,
        timestamp: new Date().toISOString()
      };

      console.log('Share event tracked:', eventData);

      // If you have a specific analytics table, insert here
      // await supabase.from('analytics_events').insert(eventData);

    } catch (error) {
      console.error('Error tracking share event:', error);
      // Don't throw - tracking failures shouldn't break sharing
    }
  }

  /**
   * Check if sharing is available on the current platform
   */
  static async isShareAvailable(): Promise<boolean> {
    try {
      // Share is available on both iOS and Android in React Native
      return true;
    } catch (error) {
      console.error('Error checking share availability:', error);
      return false;
    }
  }

  /**
   * Get platform-specific share options info
   */
  static getShareOptionsInfo(): {
    supportsURL: boolean;
    recommendedApproach: string;
    platformName: string;
  } {
    return Platform.select({
      ios: {
        supportsURL: true,
        recommendedApproach: 'Use separate URL parameter for better integration',
        platformName: 'iOS'
      },
      android: {
        supportsURL: false,
        recommendedApproach: 'Include URL in message text',
        platformName: 'Android'
      },
      default: {
        supportsURL: false,
        recommendedApproach: 'Include URL in message text',
        platformName: 'Unknown'
      }
    });
  }
}

/**
 * Deep Link Handler for processing referral links
 */
export class DeepLinkHandler {
  /**
   * Handle incoming referral links
   */
  static async handleReferralLink(url: string): Promise<void> {
    try {
      const parsedUrl = new URL(url);
      const pathParts = parsedUrl.pathname.split('/');
      const referralCode = pathParts[pathParts.length - 1];
      const contentParam = parsedUrl.searchParams.get('content');

      if (!referralCode) {
        console.warn('No referral code found in URL:', url);
        return;
      }

      await this.processReferral(referralCode, contentParam);

    } catch (error) {
      console.error('Error handling referral link:', error);
    }
  }

  /**
   * Process referral and navigate appropriately
   */
  private static async processReferral(
    referralCode: string,
    contentParam: string | null
  ): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();

    if (currentUser.user) {
      // Existing user - handle appropriately
      await this.handleExistingUserReferral(referralCode, contentParam);
    } else {
      // New user - store referral info for after signup
      await this.storePendingReferral(referralCode, contentParam);
    }
  }

  /**
   * Handle referral for existing users
   */
  private static async handleExistingUserReferral(
    referralCode: string,
    contentParam: string | null
  ): Promise<void> {
    // Find the referrer
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('referral_code', referralCode)
      .single();

    if (!referrer) {
      console.warn('Referrer not found for code:', referralCode);
      return;
    }

    if (contentParam) {
      // Navigate to specific content
      const [contentType, contentId] = contentParam.split(':');
      console.log('Navigate to content:', { contentType, contentId });
      // Implement navigation logic here
      // router.push(`/content/${contentType}/${contentId}`);
    } else {
      // Show referrer's profile or suggest friendship
      console.log('Show referrer profile:', referrer);
      // router.push(`/profile/${referrer.id}?suggest_friend=true`);
    }
  }

  /**
   * Store pending referral for new users
   */
  private static async storePendingReferral(
    referralCode: string,
    contentParam: string | null
  ): Promise<void> {
    try {
      // Store in AsyncStorage or similar for after signup
      const pendingReferral = {
        referral_code: referralCode,
        content_param: contentParam,
        timestamp: Date.now()
      };

      // You would use AsyncStorage here
      console.log('Store pending referral:', pendingReferral);
      // await AsyncStorage.setItem('pending_referral', JSON.stringify(pendingReferral));

      // Navigate to signup
      // router.push('/signup');

    } catch (error) {
      console.error('Error storing pending referral:', error);
    }
  }

  /**
   * Complete pending referral after user signs up
   */
  static async completePendingReferral(): Promise<void> {
    try {
      // Retrieve from AsyncStorage
      // const pendingReferralString = await AsyncStorage.getItem('pending_referral');

      // if (!pendingReferralString) return;

      // const pendingReferral = JSON.parse(pendingReferralString);

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      // Update referral status
      // await supabase
      //   .from('user_referrals')
      //   .update({
      //     status: 'registered',
      //     referred_user_id: currentUser.user.id
      //   })
      //   .eq('referral_code', pendingReferral.referral_code);

      // Navigate to content if specified
      // if (pendingReferral.content_param) {
      //   const [contentType, contentId] = pendingReferral.content_param.split(':');
      //   router.push(`/content/${contentType}/${contentId}`);
      // }

      // Clear pending referral
      // await AsyncStorage.removeItem('pending_referral');

    } catch (error) {
      console.error('Error completing pending referral:', error);
    }
  }
}