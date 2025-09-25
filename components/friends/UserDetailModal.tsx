import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  tagline?: string;
  total_voltz_earned: number;
  level?: number;
  email: string;
  created_at: string;
  industries?: string[];
  education?: string;
  experience?: string;
  goals?: string;
}

interface UserDetailModalProps {
  visible: boolean;
  user: UserProfile | null;
  onClose: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  visible,
  user,
  onClose
}) => {
  const { colors } = useTheme();

  const defaultProfileImage = require('../../assets/profileIconDefault.png');

  const calculateLevel = (voltz: number) => {
    // Simple level calculation - adjust as needed
    return Math.floor(voltz / 100) + 1;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <View style={{
          backgroundColor: colors.card || colors.background,
          margin: 20,
          borderRadius: 16,
          padding: 20,
          maxHeight: '80%',
          width: '90%'
        }}>
          {user && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Image
                  source={
                    (user.avatar_url && user.avatar_url.trim() && user.avatar_url !== 'null' && user.avatar_url !== 'undefined')
                      ? { uri: user.avatar_url }
                      : defaultProfileImage
                  }
                  style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 12 }}
                  defaultSource={defaultProfileImage}
                />
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: colors.text,
                  marginBottom: 4
                }}>
                  {user.full_name}
                </Text>

                {/* Display tagline if available */}
                {user.tagline && (
                  <Text style={{
                    color: colors.textSecondary,
                    fontStyle: 'italic',
                    marginBottom: 8,
                    fontSize: 14
                  }}>
                    {user.tagline}
                  </Text>
                )}

                <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
                  Level {user.level || calculateLevel(user.total_voltz_earned)} • {user.total_voltz_earned} Voltz
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </Text>
              </View>

              {/* Profile Details */}
              {user.industries && user.industries.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: 8
                  }}>
                    Industries
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {user.industries.map((industry, index) => (
                      <View key={index} style={{
                        backgroundColor: colors.primary + '20',
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 16,
                        marginRight: 8,
                        marginBottom: 4
                      }}>
                        <Text style={{
                          color: colors.primary,
                          fontSize: 12,
                          fontWeight: '600'
                        }}>
                          {industry}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {user.education && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: 8
                  }}>
                    Education
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>{user.education}</Text>
                </View>
              )}

              {user.experience && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: 8
                  }}>
                    Experience
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>{user.experience}</Text>
                </View>
              )}

              {user.goals && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: 8
                  }}>
                    Goals
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>{user.goals}</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 16,
                gap: 12
              }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                    paddingVertical: 12,
                    flex: 1,
                    alignItems: 'center'
                  }}
                  onPress={() => {
                    // TODO: Add friend or send message functionality
                    onClose();
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>Connect</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: colors.border,
                    borderRadius: 8,
                    paddingVertical: 12,
                    flex: 1,
                    alignItems: 'center'
                  }}
                  onPress={onClose}
                >
                  <Text style={{ color: colors.text, fontWeight: '600' }}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};