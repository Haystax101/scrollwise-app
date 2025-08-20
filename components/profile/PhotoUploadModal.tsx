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
import { supabase } from '../../lib/supabase';

interface PhotoUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onImageUploaded: (imageUrl: string) => void;
  userId: string;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  visible,
  onClose,
  onImageUploaded,
  userId
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

      // Create form data for file upload
      const formData = new FormData();
      const filename = `profile-${userId}-${Date.now()}.jpg`;
      
      // Append file to form data
      formData.append('file', {
        uri,
        name: filename,
        type: 'image/jpeg',
      } as any);

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filename, formData, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      onImageUploaded(publicUrl);
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
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
      borderRadius: 16,
      margin: 20,
      width: '80%',
      maxWidth: 350,
    },
    modalHeader: {
      padding: 20,
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
      paddingVertical: 16,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    optionIcon: {
      marginRight: 16,
      width: 24,
      alignItems: 'center',
    },
    optionText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    optionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    cancelButton: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 20,
      paddingVertical: 16,
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
      paddingVertical: 20,
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
                  <View style={{ flex: 1 }}>
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
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionText}>Choose from Library</Text>
                    <Text style={styles.optionDescription}>
                      Select a photo from your gallery
                    </Text>
                  </View>
                </TouchableOpacity>
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