import React, { forwardRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useTheme, ThemeMode } from '../context/ThemeContext';

interface SettingsModalProps {
  navigateTo: (screen: string) => void;
  signOut: () => Promise<void>;
}

const SettingsModal = forwardRef<BottomSheetModal, SettingsModalProps>(
  ({ navigateTo, signOut }, ref) => {
    const { colors, themeMode, setThemeMode } = useTheme();
    const insets = useSafeAreaInsets();
    
    const { height: screenHeight } = Dimensions.get('window');
    const snapPoints = useMemo(() => [screenHeight], [screenHeight]);

    const handleContentPreferences = () => {
      if (ref && 'current' in ref && ref.current) {
        ref.current.dismiss();
      }
      setTimeout(() => navigateTo('onboarding'), 100);
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
              if (ref && 'current' in ref && ref.current) {
                ref.current.dismiss();
              }
              setTimeout(() => signOut(), 100);
            }
          },
        ]
      );
    };

    const themeOptions: { mode: ThemeMode; label: string; description: string }[] = [
      { mode: 'light', label: 'Light', description: 'Always use light theme' },
      { mode: 'dark', label: 'Dark', description: 'Always use dark theme' },
      { mode: 'system', label: 'System', description: 'Follow device setting' },
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
    });

    const renderBackdrop = (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.textTertiary }}
        topInset={0}
      >
        <BottomSheetView style={dynamicStyles.container}>
          {/* Header */}
          <View style={dynamicStyles.header}>
            <Text style={dynamicStyles.headerTitle}>Settings</Text>
            <TouchableOpacity
              style={dynamicStyles.closeButton}
              onPress={() => {
                if (ref && 'current' in ref && ref.current) {
                  ref.current.dismiss();
                }
              }}
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
                    onPress={() => setThemeMode(option.mode)}
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

            {/* Content Settings */}
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Content</Text>
              <View style={dynamicStyles.settingCard}>
                <TouchableOpacity
                  style={[dynamicStyles.settingItem, dynamicStyles.settingItemLast]}
                  onPress={handleContentPreferences}
                  accessibilityRole="button"
                  accessibilityLabel="Edit content preferences"
                >
                  <View style={dynamicStyles.settingIcon}>
                    <Feather name="sliders" size={20} color={colors.textSecondary} />
                  </View>
                  <View style={dynamicStyles.settingContent}>
                    <Text style={dynamicStyles.settingTitle}>Content Preferences</Text>
                    <Text style={dynamicStyles.settingDescription}>Update your academic interests</Text>
                  </View>
                  <View style={dynamicStyles.settingAction}>
                    <Feather name="chevron-right" size={20} color={colors.textTertiary} />
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
            </View>
          </ScrollView>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

SettingsModal.displayName = 'SettingsModal';

export default SettingsModal; 