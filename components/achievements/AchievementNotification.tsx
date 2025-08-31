import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  Dimensions
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AchievementService, UserAchievement } from '../../services/achievementService';

const { width: screenWidth } = Dimensions.get('window');

interface AchievementNotificationProps {
  achievement: UserAchievement;
  onDismiss: () => void;
  onTap?: () => void;
  autoHideDuration?: number; // milliseconds, 0 for no auto-hide
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onDismiss,
  onTap,
  autoHideDuration = 4000
}) => {
  const { colors, isDark } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();

    // Auto-hide after duration
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Exit animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      onDismiss();
    });
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX, velocityX } = event.nativeEvent;
      
      // If swiped far enough or with enough velocity, dismiss
      if (translationX > 100 || velocityX > 500) {
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: screenWidth,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          })
        ]).start(() => {
          onDismiss();
        });
      } else {
        // Spring back to original position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };

  const getIconComponent = (iconName: string, size: number, color: string) => {
    // Enhanced icon mapping with multiple icon libraries
    const iconMaps = {
      feather: {
        'share': 'share',
        'users': 'users',
        'user-plus': 'user-plus',
        'link': 'link',
        'globe': 'globe',
        'heart': 'heart',
        'edit-3': 'edit-3',
        'edit': 'edit',
        'message-circle': 'message-circle',
        'zap': 'zap',
        'help-circle': 'help-circle',
        'brain': 'zap', // Use zap as fallback
        'target': 'target',
        'user-check': 'user-check',
        'calendar': 'calendar',
        'calendar-heart': 'calendar', // Use calendar as fallback
        'trophy': 'award',
        'award': 'award',
        'check-circle': 'check-circle',
        'graduation-cap': 'award', // Use award as fallback
      },
      materialCommunity: {
        'heart-multiple': 'cards-heart',
        'message-circle-multiple': 'message-text',
        'heart-circle': 'heart-circle',
      },
      ionicons: {
        'graduation-cap': 'school',
      }
    };

    // Try Feather first (most common)
    if (iconName in iconMaps.feather) {
      return (
        <Feather 
          name={iconMaps.feather[iconName as keyof typeof iconMaps.feather] as keyof typeof Feather.glyphMap} 
          size={size} 
          color={color} 
        />
      );
    }

    // Try MaterialCommunityIcons
    if (iconName in iconMaps.materialCommunity) {
      return (
        <MaterialCommunityIcons 
          name={iconMaps.materialCommunity[iconName as keyof typeof iconMaps.materialCommunity] as keyof typeof MaterialCommunityIcons.glyphMap} 
          size={size} 
          color={color} 
        />
      );
    }

    // Try Ionicons
    if (iconName in iconMaps.ionicons) {
      return (
        <Ionicons 
          name={iconMaps.ionicons[iconName as keyof typeof iconMaps.ionicons] as keyof typeof Ionicons.glyphMap} 
          size={size} 
          color={color} 
        />
      );
    }

    // Default fallback
    return <Feather name="award" size={size} color={color} />;
  };

  const getRarityGlow = (rarity: string) => {
    const rarityColors = {
      common: colors.textTertiary,
      uncommon: '#10B981',
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B',
    };
    return rarityColors[rarity as keyof typeof rarityColors] || rarityColors.common;
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 60, // Below status bar
      left: 20,
      right: 20,
      zIndex: 1000,
    },
    notificationCard: {
      backgroundColor: isDark ? colors.surface : colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: colors.primary,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    achievementBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: colors.primaryText,
      textTransform: 'uppercase',
    },
    dismissButton: {
      marginLeft: 'auto',
      padding: 4,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      shadowColor: getRarityGlow('rare'), // Default glow
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.5,
      shadowRadius: 6,
      elevation: 6,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 8,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    earnedText: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    voltzContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    voltzText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: colors.primary,
      marginLeft: 4,
    },
  });

  if (!isVisible) return null;

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View 
        style={[
          styles.container,
          {
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
              { translateX: translateX }
            ],
            opacity: opacityAnim,
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.notificationCard}
          onPress={onTap}
          activeOpacity={0.8}
        >
          <View style={styles.header}>
            <View style={styles.achievementBadge}>
              <Text style={styles.badgeText}>Achievement Unlocked!</Text>
            </View>
            <TouchableOpacity 
              style={styles.dismissButton}
              onPress={handleDismiss}
            >
              <Feather name="x" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              {getIconComponent(achievement.icon_name || 'award', 24, 'white')}
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title}>{achievement.title}</Text>
              {achievement.description && (
                <Text style={styles.description}>{achievement.description}</Text>
              )}
              
              <View style={styles.footer}>
                <Text style={styles.earnedText}>
                  {AchievementService.formatEarnedDate(achievement.earned_at)}
                </Text>
                
                <View style={styles.voltzContainer}>
                  <Feather name="zap" size={12} color={colors.primary} />
                  <Text style={styles.voltzText}>
                    +{/* We'd need voltz reward from the full achievement data */}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
};