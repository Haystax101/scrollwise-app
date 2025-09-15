import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  Clipboard,
  Platform
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { FriendsService } from '../../lib/friendsService';

export const InviteFriends: React.FC = () => {
  const { colors } = useTheme();
  const [referralCode, setReferralCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    loadReferralCode();
  }, []);

  const loadReferralCode = async () => {
    try {
      const code = await FriendsService.getReferralCode();
      setReferralCode(code);
    } catch (error) {
      console.error('Error loading referral code:', error);
      Alert.alert('Error', 'Failed to load referral code');
    } finally {
      setLoading(false);
    }
  };

  const generateInviteMessage = () => {
    const baseUrl = 'https://supercharged.app/invite'; // Update with your actual app URL
    const inviteUrl = `${baseUrl}/${referralCode}`;

    return {
      message: `Join me on Supercharged to keep tabs on your industry! 🚀\n\nDiscover personalized content, connect with professionals, and earn rewards for learning.\n\n${inviteUrl}`,
      url: inviteUrl
    };
  };

  const handleShare = async () => {
    if (!referralCode) return;

    setSharing(true);
    try {
      const { message, url } = generateInviteMessage();

      // Cross-platform sharing configuration
      const shareOptions = Platform.select({
        ios: {
          message,
          url, // iOS can handle URL separately
          title: 'Join me on Supercharged!'
        },
        android: {
          message: message, // Android includes URL in message
          title: 'Join me on Supercharged!'
        },
        default: {
          message,
          title: 'Join me on Supercharged!'
        }
      });

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        // User shared successfully
        Alert.alert(
          'Shared!',
          'Your invitation has been shared. You\'ll earn 50 voltz when someone joins using your link!'
        );
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share invitation');
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!referralCode) return;

    const { url } = generateInviteMessage();

    try {
      await Clipboard.setString(url);
      Alert.alert('Copied!', 'Invitation link copied to clipboard');
    } catch (error) {
      console.error('Error copying link:', error);
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const handleShareViaMethod = (method: string) => {
    // For cross-platform compatibility, we use the general share
    // which will show platform-specific options
    handleShare();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading invitation...
        </Text>
      </View>
    );
  }

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    header: {
      alignItems: 'center',
      marginBottom: 32,
      paddingVertical: 20,
    },
    headerIcon: {
      backgroundColor: colors.primary + '20',
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    rewardCard: {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary,
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      flexDirection: 'row',
      alignItems: 'center',
    },
    rewardInfo: {
      flex: 1,
    },
    rewardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    rewardDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    rewardAmount: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
    },
    shareMethodsContainer: {
      marginBottom: 24,
    },
    shareMethodsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    shareMethod: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      marginBottom: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    shareMethodIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    shareMethodInfo: {
      flex: 1,
    },
    shareMethodTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    shareMethodDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    shareMethodChevron: {
      marginLeft: 8,
    },
    primaryShareButton: {
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    primaryShareButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    copyLinkButton: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
    },
    copyLinkButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    referralCodeContainer: {
      backgroundColor: colors.border + '20',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    referralCodeLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    referralCodeText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 2,
    },
    platformNote: {
      marginTop: 16,
      padding: 12,
      backgroundColor: colors.border + '20',
      borderRadius: 8,
    },
    platformNoteText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.headerIcon}>
          <Feather name="users" size={32} color={colors.primary} />
        </View>
        <Text style={dynamicStyles.headerTitle}>Invite Friends</Text>
        <Text style={dynamicStyles.headerSubtitle}>
          Share Supercharged with your network and earn rewards when they join!
        </Text>
      </View>

      {/* Reward Card */}
      <View style={dynamicStyles.rewardCard}>
        <View style={dynamicStyles.rewardInfo}>
          <Text style={dynamicStyles.rewardTitle}>Earn Voltz</Text>
          <Text style={dynamicStyles.rewardDescription}>
            Get 50 voltz for each friend who joins and completes onboarding
          </Text>
        </View>
        <Text style={dynamicStyles.rewardAmount}>50⚡</Text>
      </View>

      {/* Primary Share Button */}
      <TouchableOpacity
        style={dynamicStyles.primaryShareButton}
        onPress={handleShare}
        disabled={sharing}
      >
        <Feather name="share" size={20} color="white" />
        <Text style={dynamicStyles.primaryShareButtonText}>
          {sharing ? 'Sharing...' : 'Share Invitation'}
        </Text>
      </TouchableOpacity>

      {/* Copy Link Button */}
      <TouchableOpacity
        style={dynamicStyles.copyLinkButton}
        onPress={handleCopyLink}
      >
        <Feather name="copy" size={20} color={colors.text} />
        <Text style={dynamicStyles.copyLinkButtonText}>Copy Link</Text>
      </TouchableOpacity>

      {/* Share Methods */}
      <View style={dynamicStyles.shareMethodsContainer}>
        <Text style={dynamicStyles.shareMethodsTitle}>Share via</Text>

        <TouchableOpacity
          style={dynamicStyles.shareMethod}
          onPress={() => handleShareViaMethod('messages')}
        >
          <View style={[dynamicStyles.shareMethodIcon, { backgroundColor: '#007AFF' + '20' }]}>
            <MaterialCommunityIcons name="message-text" size={20} color="#007AFF" />
          </View>
          <View style={dynamicStyles.shareMethodInfo}>
            <Text style={dynamicStyles.shareMethodTitle}>
              {Platform.OS === 'ios' ? 'Messages' : 'Messaging'}
            </Text>
            <Text style={dynamicStyles.shareMethodDescription}>
              {Platform.OS === 'ios' ? 'Send via iMessage/SMS' : 'Send via SMS/messaging apps'}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={dynamicStyles.shareMethod}
          onPress={() => handleShareViaMethod('email')}
        >
          <View style={[dynamicStyles.shareMethodIcon, { backgroundColor: '#FF9500' + '20' }]}>
            <Feather name="mail" size={20} color="#FF9500" />
          </View>
          <View style={dynamicStyles.shareMethodInfo}>
            <Text style={dynamicStyles.shareMethodTitle}>Email</Text>
            <Text style={dynamicStyles.shareMethodDescription}>
              Send via email apps
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={dynamicStyles.shareMethod}
          onPress={() => handleShareViaMethod('social')}
        >
          <View style={[dynamicStyles.shareMethodIcon, { backgroundColor: '#1DA1F2' + '20' }]}>
            <Feather name="share-2" size={20} color="#1DA1F2" />
          </View>
          <View style={dynamicStyles.shareMethodInfo}>
            <Text style={dynamicStyles.shareMethodTitle}>Social Media</Text>
            <Text style={dynamicStyles.shareMethodDescription}>
              {Platform.OS === 'ios' ? 'Share on social platforms' : 'Share via installed apps'}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Referral Code */}
      <View style={dynamicStyles.referralCodeContainer}>
        <Text style={dynamicStyles.referralCodeLabel}>Your Referral Code</Text>
        <Text style={dynamicStyles.referralCodeText}>{referralCode}</Text>

        {/* Platform-specific note */}
        <View style={dynamicStyles.platformNote}>
          <Text style={dynamicStyles.platformNoteText}>
            {Platform.OS === 'ios'
              ? 'Share options will vary based on installed apps'
              : 'Available sharing options depend on your installed apps'
            }
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});