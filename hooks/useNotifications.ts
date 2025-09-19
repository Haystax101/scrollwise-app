import { useNotifications as useNotificationContext } from '../context/NotificationContext';

// Re-export the hook from context for easier imports
export { useNotifications } from '../context/NotificationContext';

// Additional notification-related hooks can be added here in the future
export const useNotificationPermissions = () => {
  const { permissionStatus, requestPermissions, isSupported } = useNotificationContext();

  return {
    hasPermission: permissionStatus?.granted ?? false,
    canAskAgain: permissionStatus?.canAskAgain ?? true,
    permissionStatus: permissionStatus?.status ?? 'undetermined',
    requestPermissions,
    isSupported,
  };
};