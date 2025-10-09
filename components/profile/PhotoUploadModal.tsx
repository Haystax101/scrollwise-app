import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { profileImageService } from '../../services/profileImageService';

interface PhotoUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onImageUploaded: (imageUrl: string | null) => void;
  userId: string;
  currentAvatarUrl?: string | null;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  visible,
  onClose,
  onImageUploaded,
  userId,
  currentAvatarUrl
}) => {
  const { colors } = useTheme();
  const [uploading, setUploading] = useState(false);

  const requestPermission = async () => {
    console.log('📷 requestPermission: Starting media library permission request...');

    if (Platform.OS !== 'web') {
      console.log('📷 Platform is not web, requesting media library permissions...');

      try {
        // First check current permission status
        const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
        console.log('📷 Current media library permission status:', currentPermission);

        let permissionResult;
        if (currentPermission.status !== 'granted') {
          console.log('📷 Permission not granted, requesting permission...');
          permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
          console.log('📷 Permission request result:', permissionResult);
        } else {
          console.log('📷 Permission already granted');
          permissionResult = currentPermission;
        }

        if (permissionResult.status !== 'granted') {
          console.log('❌ Media library permission denied. Status:', permissionResult.status);
          console.log('📋 Permission details:', JSON.stringify(permissionResult, null, 2));

          let alertTitle = 'Permission Required';
          let alertMessage = '';
          let buttons: any[] = [];

          switch (permissionResult.status) {
            case 'denied':
              alertMessage = 'Access to your photo library has been denied. To upload photos, please enable photo library access in your device settings.';
              buttons = [
                { text: 'Cancel', style: 'cancel' as const },
                {
                  text: 'Open Settings',
                  onPress: async () => {
                    console.log('🔄 User chose to open settings from denied state');
                    try {
                      const retryResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      console.log('🔄 Retry permission result:', retryResult);
                    } catch (error) {
                      console.error('❌ Error retrying permission:', error);
                    }
                  }
                }
              ];
              break;
            case 'undetermined':
              alertMessage = 'We need access to your photo library to upload photos. Would you like to grant permission?';
              buttons = [
                { text: 'Cancel', style: 'cancel' as const },
                {
                  text: 'Allow',
                  onPress: async () => {
                    console.log('🔄 User chose to retry permission from undetermined state');
                    const retryResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    console.log('🔄 Retry permission result:', retryResult);
                    if (retryResult.status === 'granted') {
                      console.log('✅ Permission granted on retry');
                      Alert.alert('Success', 'Photo library access granted! You can now upload photos.');
                    }
                  }
                }
              ];
              break;
            default:
              alertMessage = `Photo library permission status: ${permissionResult.status}. Please enable photo library access in your device settings to upload photos.`;
              buttons = [
                { text: 'Cancel', style: 'cancel' as const },
                { text: 'Retry', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() }
              ];
          }

          Alert.alert(alertTitle, alertMessage, buttons);
          return false;
        }

        console.log('✅ Media library permission granted successfully');
        return true;
      } catch (error) {
        console.error('❌ Error requesting media library permission:', error);
        Alert.alert('Error', 'Failed to request camera roll permission. Please try again.');
        return false;
      }
    }

    console.log('📷 Platform is web, skipping permission request');
    return true;
  };

  const requestCameraPermission = async () => {
    console.log('📸 requestCameraPermission: Starting camera permission request...');

    if (Platform.OS !== 'web') {
      console.log('📸 Platform is not web, requesting camera permissions...');

      try {
        // First check current permission status
        const currentPermission = await ImagePicker.getCameraPermissionsAsync();
        console.log('📸 Current camera permission status:', currentPermission);

        let permissionResult;
        if (currentPermission.status !== 'granted') {
          console.log('📸 Permission not granted, requesting permission...');
          permissionResult = await ImagePicker.requestCameraPermissionsAsync();
          console.log('📸 Permission request result:', permissionResult);
        } else {
          console.log('📸 Permission already granted');
          permissionResult = currentPermission;
        }

        if (permissionResult.status !== 'granted') {
          console.log('❌ Camera permission denied. Status:', permissionResult.status);
          console.log('📋 Permission details:', JSON.stringify(permissionResult, null, 2));

          let alertTitle = 'Permission Required';
          let alertMessage = '';
          let buttons: any[] = [];

          switch (permissionResult.status) {
            case 'denied':
              alertMessage = 'Camera access has been denied. To take photos, please enable camera access in your device settings.';
              buttons = [
                { text: 'Cancel', style: 'cancel' as const },
                {
                  text: 'Open Settings',
                  onPress: async () => {
                    console.log('🔄 User chose to open settings from camera denied state');
                    try {
                      const retryResult = await ImagePicker.requestCameraPermissionsAsync();
                      console.log('🔄 Retry camera permission result:', retryResult);
                    } catch (error) {
                      console.error('❌ Error retrying camera permission:', error);
                    }
                  }
                }
              ];
              break;
            case 'undetermined':
              alertMessage = 'We need access to your camera to take photos. Would you like to grant permission?';
              buttons = [
                { text: 'Cancel', style: 'cancel' as const },
                {
                  text: 'Allow',
                  onPress: async () => {
                    console.log('🔄 User chose to retry camera permission from undetermined state');
                    const retryResult = await ImagePicker.requestCameraPermissionsAsync();
                    console.log('🔄 Retry camera permission result:', retryResult);
                    if (retryResult.status === 'granted') {
                      console.log('✅ Camera permission granted on retry');
                      Alert.alert('Success', 'Camera access granted! You can now take photos.');
                    }
                  }
                }
              ];
              break;
            default:
              alertMessage = `Camera permission status: ${permissionResult.status}. Please enable camera access in your device settings to take photos.`;
              buttons = [
                { text: 'Cancel', style: 'cancel' as const },
                { text: 'Retry', onPress: () => ImagePicker.requestCameraPermissionsAsync() }
              ];
          }

          Alert.alert(alertTitle, alertMessage, buttons);
          return false;
        }

        console.log('✅ Camera permission granted successfully');
        return true;
      } catch (error) {
        console.error('❌ Error requesting camera permission:', error);
        Alert.alert('Error', 'Failed to request camera permission. Please try again.');
        return false;
      }
    }

    console.log('📸 Platform is web, skipping permission request');
    return true;
  };

  const uploadImage = async (uri: string) => {
    try {
      console.log('🚀 uploadImage called with URI:', uri);
      setUploading(true);
      console.log('✅ setUploading(true) completed');

      console.log('📞 Calling profileImageService.uploadProfileImage...');
      const result = await profileImageService.uploadProfileImage(userId, uri);
      console.log('✅ profileImageService.uploadProfileImage completed:', result);

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (!result.url) {
        throw new Error('No URL returned from upload');
      }

      onImageUploaded(result.url);
      onClose();
      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    console.log('📷 handleTakePhoto called');
    console.log('📷 Platform:', Platform.OS);
    console.log('📷 Platform version:', Platform.Version);

    try {
      const hasPermission = await requestCameraPermission();
      console.log('📷 requestCameraPermission returned:', hasPermission);

      if (!hasPermission) {
        console.log('❌ Camera permission denied, exiting handleTakePhoto');
        return;
      }
      console.log('✅ Camera permission granted, proceeding with camera launch');

      console.log('📞 About to call ImagePicker.launchCameraAsync with config:', {
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
        exif: false,
      });

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
        exif: false,
      });

      console.log('✅ ImagePicker.launchCameraAsync completed with result:', JSON.stringify(result, null, 2));

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        const selectedAsset = result.assets[0];
        console.log('📸 Image selected successfully:', {
          uri: selectedAsset.uri,
          width: selectedAsset.width,
          height: selectedAsset.height,
          type: selectedAsset.type,
          fileSize: selectedAsset.fileSize
        });
        console.log('🚀 Calling uploadImage...');
        await uploadImage(selectedAsset.uri);
      } else {
        console.log('❌ Image picker was canceled or no valid asset selected:', {
          canceled: result.canceled,
          assetsLength: result.assets?.length || 0
        });
      }
    } catch (error) {
      console.error('❌ Unexpected error in handleTakePhoto:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred while trying to access the camera. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleChooseFromLibrary = async () => {
    console.log('📚 handleChooseFromLibrary called');
    console.log('📚 Platform:', Platform.OS);
    console.log('📚 Platform version:', Platform.Version);

    try {
      const hasPermission = await requestPermission();
      console.log('📚 requestPermission returned:', hasPermission);

      if (!hasPermission) {
        console.log('❌ Library permission denied, exiting handleChooseFromLibrary');
        return;
      }
      console.log('✅ Library permission granted, proceeding with library launch');

      console.log('📞 About to call ImagePicker.launchImageLibraryAsync with config:', {
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
        exif: false,
      });

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
        exif: false,
      });

      console.log('✅ ImagePicker.launchImageLibraryAsync completed with result:', JSON.stringify(result, null, 2));

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        const selectedAsset = result.assets[0];
        console.log('📚 Image selected successfully:', {
          uri: selectedAsset.uri,
          width: selectedAsset.width,
          height: selectedAsset.height,
          type: selectedAsset.type,
          fileSize: selectedAsset.fileSize
        });
        console.log('🚀 Calling uploadImage...');
        await uploadImage(selectedAsset.uri);
      } else {
        console.log('❌ Image library picker was canceled or no valid asset selected:', {
          canceled: result.canceled,
          assetsLength: result.assets?.length || 0
        });
      }
    } catch (error) {
      console.error('❌ Unexpected error in handleChooseFromLibrary:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred while trying to access the photo library. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRemovePhoto = async () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setUploading(true);
            try {
              const success = await profileImageService.removeUserAvatar(userId);
              if (success) {
                onImageUploaded(null);
                onClose();
                Alert.alert('Success', 'Profile photo removed successfully!');
              } else {
                Alert.alert('Error', 'Failed to remove photo. Please try again.');
              }
            } catch (error) {
              console.error('❌ Remove photo error:', error);
              Alert.alert('Error', 'Failed to remove photo. Please try again.');
            } finally {
              setUploading(false);
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 20,
      margin: 20,
      width: '85%',
      maxWidth: 380,
      overflow: 'hidden',
    },
    modalHeader: {
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    optionsContainer: {
      paddingVertical: 8,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 18,
      minHeight: 64,
    },
    optionIcon: {
      marginRight: 16,
      width: 24,
      alignItems: 'center',
    },
    optionTextContainer: {
      flex: 1,
    },
    optionText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
      marginBottom: 2,
    },
    optionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    cancelButton: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 24,
      paddingVertical: 18,
      alignItems: 'center',
    },
    cancelText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    uploadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
    },
    uploadingText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose}>
        <TouchableOpacity 
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Profile Photo</Text>
          </View>

          {uploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          ) : (
            <>
              <View style={styles.optionsContainer}>
                <TouchableOpacity 
                  style={styles.option} 
                  onPress={handleTakePhoto}
                >
                  <View style={styles.optionIcon}>
                    <Feather name="camera" size={24} color={colors.text} />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionText}>Take Photo</Text>
                    <Text style={styles.optionDescription}>
                      Use your camera to take a new photo
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.option}
                  onPress={handleChooseFromLibrary} 
                >
                  <View style={styles.optionIcon}>
                    <Feather name="image" size={24} color={colors.text} />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionText}>Choose from Library</Text>
                    <Text style={styles.optionDescription}>
                      Select a photo from your gallery
                    </Text>
                  </View>
                </TouchableOpacity>

                {currentAvatarUrl && (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={handleRemovePhoto}
                  >
                    <View style={styles.optionIcon}>
                      <Feather name="trash-2" size={24} color={colors.error} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionText, { color: colors.error }]}>Remove Photo</Text>
                      <Text style={styles.optionDescription}>
                        Remove your current profile photo
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};