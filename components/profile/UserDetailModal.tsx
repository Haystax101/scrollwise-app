import React from 'react';
import { Modal } from 'react-native';
import { UserDetailContent } from './UserDetailContent';

interface UserDetailModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  currentUserId?: string;
}

/**
 * Wrapper for UserDetailContent that presents it as a Modal.
 * Use this when you need an internal modal (e.g. within People tab).
 */
export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  visible,
  onClose,
  userId,
  currentUserId,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <UserDetailContent
        userId={userId}
        currentUserId={currentUserId}
        onClose={onClose}
      />
    </Modal>
  );
};