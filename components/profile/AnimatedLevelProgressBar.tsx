import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface AnimatedLevelProgressBarProps {
  level: number;
  currentVoltz: number;
  spendableVoltz?: number;
  levelProgress: number; // This is already a percentage (0-100) from database
  voltzForCurrentLevel: number;
  voltzForNextLevel: number;
  // Animation props
  animateOnMount?: boolean;
  previousLevel?: number;
  previousVoltz?: number;
  // Control when to trigger level-up animation
  triggerLevelUpAnimation?: boolean;
  // Callback when level-up animation completes
  onLevelUpAnimationComplete?: () => void;
}

export const AnimatedLevelProgressBar: React.FC<AnimatedLevelProgressBarProps> = ({
  level,
  currentVoltz,
  spendableVoltz = 0,
  levelProgress,
  voltzForCurrentLevel,
  voltzForNextLevel,
  animateOnMount = true,
  previousLevel,
  previousVoltz,
  triggerLevelUpAnimation = false,
  onLevelUpAnimationComplete
}) => {
  const { colors, isDark } = useTheme();
  
  // Animation values
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;
  
  // State for level-up animation
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [displayLevel, setDisplayLevel] = useState(level);
  
  // Ensure levelProgress is within bounds and handle the percentage correctly
  const progressPercentage = Math.min(Math.max(levelProgress, 0), 100);
  
  // Debug logging to see what values we're receiving
  console.log('AnimatedLevelProgressBar props:', {
    level,
    currentVoltz,
    levelProgress,
    voltzForCurrentLevel,
    voltzForNextLevel,
    displayLevel,
    progressPercentage
  });
  
  useEffect(() => {
    // Update display level when level prop changes (but not during level-up animation)
    if (!isLevelingUp) {
      setDisplayLevel(level);
    }
  }, [level, isLevelingUp]);

  useEffect(() => {
    // Only trigger level-up animation when explicitly requested AND when there's an actual level change
    const hasLeveledUp = previousLevel !== undefined && 
                         level > previousLevel && 
                         previousVoltz !== undefined && 
                         currentVoltz > previousVoltz;
    
    if (triggerLevelUpAnimation && hasLeveledUp) {
      // User actually gained voltz and leveled up - show the full level-up animation
      handleLevelUpAnimation();
    } else {
      // Normal progress animation - just fill to current progress
      // This covers: profile opening, voltz gains without level-up, etc.
      animateProgress();
    }
  }, [levelProgress, level, triggerLevelUpAnimation]);

  const animateProgress = () => {
    // Animate progress bar filling
    Animated.timing(progressAnimation, {
      toValue: progressPercentage,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const handleLevelUpAnimation = () => {
    setIsLevelingUp(true);
    
    // Keep displaying the OLD level during the initial animation phases
    // (displayLevel should already be set to previousLevel or current level-1)
    const oldLevel = previousLevel || (level - 1);
    setDisplayLevel(oldLevel);
    
    // Phase 1: Fill current level to 100%
    Animated.timing(progressAnimation, {
      toValue: 100,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      
      // Phase 2: Level up effects - scale and glow
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnimation, {
            toValue: 1.05,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnimation, {
              toValue: 1,
              duration: 500,
              useNativeDriver: false,
            }),
            Animated.timing(glowAnimation, {
              toValue: 0,
              duration: 500,
              useNativeDriver: false,
            })
          ]),
          { iterations: 3 }
        )
      ]).start(() => {
        
        // Phase 3: NOW update to the new level and animate to current progress
        setDisplayLevel(level);
        progressAnimation.setValue(0);
        
        Animated.timing(progressAnimation, {
          toValue: progressPercentage,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start(() => {
          setIsLevelingUp(false);
          glowAnimation.setValue(0);
          
          // Notify parent that level-up animation is complete
          onLevelUpAnimationComplete?.();
        });
      });
    });
  };

  // Calculate voltz needed for next level
  const voltzNeeded = voltzForNextLevel - currentVoltz;
  const voltzInCurrentLevel = currentVoltz - voltzForCurrentLevel;
  const totalVoltzForLevel = voltzForNextLevel - voltzForCurrentLevel;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 16,
      marginBottom: 24,
      marginHorizontal: 20,
      borderWidth: isDark ? 0 : 1,
      borderColor: isDark ? 'transparent' : colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    leftHeader: {
      flex: 1,
    },
    levelLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    rightHeader: {
      alignItems: 'flex-end',
    },
    voltzText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#EAB308',
    },
    progressLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    levelText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    progressContainer: {
      position: 'relative',
      height: 16,
      backgroundColor: isDark ? '#1A202C' : colors.inputBackground,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 12,
    },
    progressFill: {
      height: '100%',
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: 4,
    },
    progressIcon: {
      opacity: 0.8,
    },
    detailsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    detailText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    levelUpGlow: {
      position: 'absolute',
      top: -2,
      left: -2,
      right: -2,
      bottom: -2,
      borderRadius: 10,
      opacity: 0.6,
    },
  });

  // Create gradient background for progress bar
  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8],
  });

  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ scale: scaleAnimation }] }
      ]}
    >
      {isLevelingUp && (
        <Animated.View
          style={[
            styles.levelUpGlow,
            {
              backgroundColor: '#EAB308',
              opacity: glowOpacity,
            }
          ]}
        />
      )}
      
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <Text style={styles.levelLabel}>Voltz Level</Text>
        </View>
        <View style={styles.rightHeader}>
          <Text style={styles.voltzText}>
            {currentVoltz.toLocaleString()} Voltz
          </Text>
        </View>
      </View>

      <View style={styles.progressLabels}>
        <Text style={styles.levelText}>Level {displayLevel}</Text>
        <Text style={styles.levelText}>Level {displayLevel + 1}</Text>
      </View>

      <View style={styles.progressContainer}>
        <Animated.View 
          style={[
            styles.progressFill,
            {
              width: progressWidth,
              backgroundColor: '#EAB308',
            }
          ]}
        >
          <View style={styles.progressIcon}>
            <Feather name="zap" size={12} color="#000000" />
          </View>
        </Animated.View>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.detailText}>
          {voltzInCurrentLevel.toLocaleString()} / {totalVoltzForLevel.toLocaleString()} voltz
        </Text>
        <Text style={styles.detailText}>
          {voltzNeeded.toLocaleString()} to next level
        </Text>
      </View>
    </Animated.View>
  );
};