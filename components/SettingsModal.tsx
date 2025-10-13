import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Dimensions, Modal, Linking, Switch, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { NotificationService } from '../services/notificationService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  navigateTo: (screen: string) => void;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose, navigateTo, signOut, deleteAccount }) => {
    const { colors, themeMode, setThemeMode } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const { height: screenHeight } = Dimensions.get('window');
    const snapPoints = useMemo(() => [screenHeight], [screenHeight]);

    // Push notification state
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(true);
    const [pushToken, setPushToken] = useState<string | null>(null);

    // Check notification permission status on mount
    useEffect(() => {
      if (visible) {
        checkNotificationStatus();
      }
    }, [visible]);

    const checkNotificationStatus = async () => {
      try {
        setNotificationsLoading(true);

        if (!user) {
          setNotificationsLoading(false);
          return;
        }

        const permissionStatus = await NotificationService.getPermissionStatus();
        setNotificationsEnabled(permissionStatus.granted);

        // Check if we have a token saved
        const { data, error } = await supabase
          .from('user_push_tokens')
          .select('push_token')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (!error && data?.push_token) {
          setPushToken(data.push_token);
        }
      } catch (error) {
        console.error('Error checking notification status:', error);
      } finally {
        setNotificationsLoading(false);
      }
    };

    const handleNotificationToggle = async (enabled: boolean) => {
      try {
        if (enabled) {
          // Request permissions and register for push
          setNotificationsLoading(true);
          const result = await NotificationService.registerForPushNotifications();

          if (result.success && result.token) {
            // Save token to database
            if (user) {
              const { error } = await supabase
                .from('user_push_tokens')
                .upsert({
                  user_id: user.id,
                  push_token: result.token,
                  device_type: 'ios', // or detect dynamically
                  is_active: true,
                  updated_at: new Date().toISOString(),
                });

              if (error) {
                console.error('Error saving push token:', error);
                Alert.alert('Error', 'Failed to save notification settings');
                setNotificationsEnabled(false);
              } else {
                setPushToken(result.token);
                setNotificationsEnabled(true);
                Alert.alert('Success', 'Push notifications enabled! You\'ll now receive notifications for likes, comments, and more.');
              }
            }
          } else {
            Alert.alert(
              'Permission Denied',
              'Please enable notifications in your device settings to receive push notifications.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings() }
              ]
            );
            setNotificationsEnabled(false);
          }
        } else {
          // Disable notifications
          if (user && pushToken) {
            await supabase
              .from('user_push_tokens')
              .update({ is_active: false })
              .eq('user_id', user.id)
              .eq('push_token', pushToken);
          }
          setNotificationsEnabled(false);
          Alert.alert('Disabled', 'Push notifications have been disabled');
        }
      } catch (error) {
        console.error('Error toggling notifications:', error);
        Alert.alert('Error', 'Failed to update notification settings');
      } finally {
        setNotificationsLoading(false);
      }
    };


    const handleSignOut = () => {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: () => {
              onClose();
              setTimeout(() => signOut(), 100);
            }
          },
        ]
      );
    };

    const handleDeleteAccount = () => {
      Alert.alert(
        'Delete Account',
        'Are you sure you want to permanently delete your account? This action cannot be undone and will delete all your data.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Account',
            style: 'destructive',
            onPress: () => {
              onClose();
              setTimeout(async () => {
                try {
                  await deleteAccount();
                } catch (error) {
                  console.error('Error deleting account:', error);
                  Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
                }
              }, 100);
            }
          },
        ]
      );
    };

    const handleSupportPress = () => {
      const email = 'admin@learningsupercharged.com';
      const subject = 'Support Request';
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

      Linking.openURL(mailtoUrl).catch(err => {
        console.error('Failed to open email client:', err);
        Alert.alert('Error', 'Unable to open email client. Please email us at admin@learningsupercharged.com');
      });
    };

    const handlePrivacyPolicyPress = () => {
      onClose();
      setTimeout(() => navigateTo('/privacy-policy?fromSettings=true'), 100);
    };

    const themeOptions: { mode: ThemeMode; label: string; description: string }[] = [
      { mode: 'light', label: 'Light', description: 'Always use light theme' },
      { mode: 'dark', label: 'Dark', description: 'Always use dark theme' },
    ];

    const dynamicStyles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: insets.top + 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
      },
      closeButton: {
        padding: 8,
        borderRadius: 999,
      },
      scrollContent: {
        paddingVertical: 20,
        paddingHorizontal: 20,
        paddingBottom: 100, // Extra bottom padding to clear the bottom navigation
      },
      section: {
        marginBottom: 24,
      },
      sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      },
      settingCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      },
      settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      settingItemLast: {
        borderBottomWidth: 0,
      },
      settingIcon: {
        marginRight: 12,
        width: 24,
        alignItems: 'center',
      },
      settingContent: {
        flex: 1,
      },
      settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text,
        marginBottom: 2,
      },
      settingDescription: {
        fontSize: 14,
        color: colors.textSecondary,
      },
      settingAction: {
        marginLeft: 8,
      },
      themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      themeOptionLast: {
        borderBottomWidth: 0,
      },
      themeOptionSelected: {
        backgroundColor: colors.primary + '10',
      },
      themeRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.border,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
      },
      themeRadioSelected: {
        borderColor: colors.primary,
      },
      themeRadioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
      },
      themeContent: {
        flex: 1,
      },
      themeLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text,
        marginBottom: 2,
      },
      themeDescription: {
        fontSize: 14,
        color: colors.textSecondary,
      },
      signOutItem: {
        backgroundColor: '#fee2e2',
        borderColor: '#fecaca',
      },
      signOutTitle: {
        color: '#dc2626',
      },
      deleteAccountItem: {
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
      },
      deleteAccountTitle: {
        color: '#dc2626',
      },
    });

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={dynamicStyles.container}>
          {/* Header */}
          <View style={dynamicStyles.header}>
            <Text style={dynamicStyles.headerTitle}>Settings</Text>
            <TouchableOpacity
              style={dynamicStyles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close settings"
              accessibilityRole="button"
            >
              <Feather name="x" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={dynamicStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Notifications Settings */}
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Notifications</Text>
              <View style={dynamicStyles.settingCard}>
                <View style={[dynamicStyles.settingItem, dynamicStyles.settingItemLast]}>
                  <View style={dynamicStyles.settingIcon}>
                    <Feather name="bell" size={20} color={colors.primary} />
                  </View>
                  <View style={dynamicStyles.settingContent}>
                    <Text style={dynamicStyles.settingTitle}>Push Notifications</Text>
                    <Text style={dynamicStyles.settingDescription}>
                      {notificationsEnabled
                        ? 'Receive notifications for likes, comments, and more'
                        : 'Enable to receive push notifications'}
                    </Text>
                  </View>
                  <View style={dynamicStyles.settingAction}>
                    {notificationsLoading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Switch
                        value={notificationsEnabled}
                        onValueChange={handleNotificationToggle}
                        trackColor={{ false: colors.border, true: colors.primary + '40' }}
                        thumbColor={notificationsEnabled ? colors.primary : colors.textTertiary}
                      />
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* Theme Settings */}
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Appearance</Text>
              <View style={dynamicStyles.settingCard}>
                {themeOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option.mode}
                    style={[
                      dynamicStyles.themeOption,
                      index === themeOptions.length - 1 && dynamicStyles.themeOptionLast,
                      themeMode === option.mode && dynamicStyles.themeOptionSelected,
                    ]}
                    onPress={() => {
                      console.log('🎨 SettingsModal: User tapped theme option:', option.mode);
                      console.log('🎨 SettingsModal: Current theme mode:', themeMode);
                      setThemeMode(option.mode);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: themeMode === option.mode }}
                    accessibilityLabel={`${option.label} theme`}
                  >
                    <View style={[
                      dynamicStyles.themeRadio,
                      themeMode === option.mode && dynamicStyles.themeRadioSelected,
                    ]}>
                      {themeMode === option.mode && <View style={dynamicStyles.themeRadioInner} />}
                    </View>
                    <View style={dynamicStyles.themeContent}>
                      <Text style={dynamicStyles.themeLabel}>{option.label}</Text>
                      <Text style={dynamicStyles.themeDescription}>{option.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Support Settings */}
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Support</Text>
              <View style={dynamicStyles.settingCard}>
                <TouchableOpacity
                  style={dynamicStyles.settingItem}
                  onPress={handleSupportPress}
                  accessibilityRole="button"
                  accessibilityLabel="Contact support"
                >
                  <View style={dynamicStyles.settingIcon}>
                    <Feather name="help-circle" size={20} color={colors.primary} />
                  </View>
                  <View style={dynamicStyles.settingContent}>
                    <Text style={dynamicStyles.settingTitle}>Contact Support</Text>
                    <Text style={dynamicStyles.settingDescription}>Get help with your account</Text>
                  </View>
                  <View style={dynamicStyles.settingAction}>
                    <Feather name="external-link" size={16} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[dynamicStyles.settingItem, dynamicStyles.settingItemLast]}
                  onPress={handlePrivacyPolicyPress}
                  accessibilityRole="button"
                  accessibilityLabel="View privacy policy"
                >
                  <View style={dynamicStyles.settingIcon}>
                    <Feather name="shield" size={20} color={colors.primary} />
                  </View>
                  <View style={dynamicStyles.settingContent}>
                    <Text style={dynamicStyles.settingTitle}>Privacy Policy</Text>
                    <Text style={dynamicStyles.settingDescription}>View our privacy policy</Text>
                  </View>
                  <View style={dynamicStyles.settingAction}>
                    <Feather name="chevron-right" size={16} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Account Settings */}
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Account</Text>
              <View style={[dynamicStyles.settingCard, dynamicStyles.signOutItem]}>
                <TouchableOpacity
                  style={[dynamicStyles.settingItem, dynamicStyles.settingItemLast]}
                  onPress={handleSignOut}
                  accessibilityRole="button"
                  accessibilityLabel="Sign out of your account"
                >
                  <View style={dynamicStyles.settingIcon}>
                    <Feather name="log-out" size={20} color="#dc2626" />
                  </View>
                  <View style={dynamicStyles.settingContent}>
                    <Text style={[dynamicStyles.settingTitle, dynamicStyles.signOutTitle]}>Sign Out</Text>
                    <Text style={dynamicStyles.settingDescription}>Sign out of your account</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={[dynamicStyles.settingCard, dynamicStyles.deleteAccountItem]}>
                <TouchableOpacity
                  style={[dynamicStyles.settingItem, dynamicStyles.settingItemLast]}
                  onPress={handleDeleteAccount}
                  accessibilityRole="button"
                  accessibilityLabel="Delete your account"
                >
                  <View style={dynamicStyles.settingIcon}>
                    <Feather name="trash-2" size={20} color="#dc2626" />
                  </View>
                  <View style={dynamicStyles.settingContent}>
                    <Text style={[dynamicStyles.settingTitle, dynamicStyles.deleteAccountTitle]}>Delete Account</Text>
                    <Text style={dynamicStyles.settingDescription}>Permanently delete your account and data</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
};

export default SettingsModal; 