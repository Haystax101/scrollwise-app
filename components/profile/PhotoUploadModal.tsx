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
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to upload photos.'
        );
        return false;
      }
    }
    return true;
  };

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera permissions to take photos.'
        );
        return false;
      }
    }
    return true;
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);

      const result = await profileImageService.uploadProfileImage(userId, uri);

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
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const handleChooseFromLibrary = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
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