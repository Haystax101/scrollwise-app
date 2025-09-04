import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface SkeletonItemProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonItem: React.FC<SkeletonItemProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style
}) => {
  const { colors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const startAnimation = () => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(startAnimation);
    };

    startAnimation();
  }, [fadeAnim]);

  const skeletonStyle = [
    {
      width,
      height,
      borderRadius,
      backgroundColor: isDark ? colors.surface : colors.inputBackground,
      opacity: fadeAnim,
    },
    style
  ];

  return <Animated.View style={skeletonStyle} />;
};

interface SearchResultSkeletonProps {
  count?: number;
}

export const SearchResultSkeleton: React.FC<SearchResultSkeletonProps> = ({ count = 3 }) => {
  const { colors } = useTheme();
  
  const items = Array.from({ length: count }, (_, index) => (
    <View 
      key={index} 
      style={[
        styles.resultCardSkeleton,
        { 
          backgroundColor: colors.card,
          borderColor: colors.border,
          marginBottom: index === count - 1 ? 0 : 16 
        }
      ]}
    >
      {/* Header with type indicator and industry tag */}
      <View style={styles.headerSkeleton}>
        <View style={styles.typeIndicatorSkeleton}>
          <SkeletonItem width={16} height={16} borderRadius={8} />
          <SkeletonItem width={60} height={14} style={{ marginLeft: 8 }} />
        </View>
        <SkeletonItem width={80} height={20} borderRadius={10} />
      </View>
      
      {/* Title */}
      <SkeletonItem width="90%" height={18} style={{ marginBottom: 8 }} />
      <SkeletonItem width="70%" height={18} style={{ marginBottom: 12 }} />
      
      {/* Author */}
      <SkeletonItem width="40%" height={14} style={{ marginBottom: 12 }} />
      
      {/* Content preview */}
      <SkeletonItem width="100%" height={14} style={{ marginBottom: 4 }} />
      <SkeletonItem width="100%" height={14} style={{ marginBottom: 4 }} />
      <SkeletonItem width="60%" height={14} style={{ marginBottom: 12 }} />
      
      {/* Footer stats */}
      <View style={styles.footerSkeleton}>
        <View style={styles.statSkeleton}>
          <SkeletonItem width={14} height={14} borderRadius={7} />
          <SkeletonItem width={20} height={12} style={{ marginLeft: 4 }} />
        </View>
        <View style={styles.statSkeleton}>
          <SkeletonItem width={14} height={14} borderRadius={7} />
          <SkeletonItem width={20} height={12} style={{ marginLeft: 4 }} />
        </View>
        <View style={styles.statSkeleton}>
          <SkeletonItem width={14} height={14} borderRadius={7} />
          <SkeletonItem width={20} height={12} style={{ marginLeft: 4 }} />
        </View>
        <View style={styles.statSkeleton}>
          <SkeletonItem width={14} height={14} borderRadius={7} />
          <SkeletonItem width={20} height={12} style={{ marginLeft: 4 }} />
        </View>
        <View style={styles.statSkeleton}>
          <SkeletonItem width={14} height={14} borderRadius={7} />
          <SkeletonItem width={50} height={12} style={{ marginLeft: 4 }} />
        </View>
      </View>
    </View>
  ));
  
  return <View style={styles.container}>{items}</View>;
};

interface IndustryPillSkeletonProps {
  count?: number;
}

export const IndustryPillSkeleton: React.FC<IndustryPillSkeletonProps> = ({ count = 5 }) => {
  const items = Array.from({ length: count }, (_, index) => (
    <SkeletonItem 
      key={index}
      width={Math.random() * 40 + 60} // Random width between 60-100
      height={36}
      borderRadius={18}
      style={{ marginRight: 8 }}
    />
  ));
  
  return (
    <View style={styles.pillContainer}>
      {items}
    </View>
  );
};

interface ContentTransitionProps {
  isLoading: boolean;
  loadingComponent: React.ReactNode;
  children: React.ReactNode;
}

export const ContentTransition: React.FC<ContentTransitionProps> = ({
  isLoading,
  loadingComponent,
  children
}) => {
  const fadeAnim = useRef(new Animated.Value(isLoading ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isLoading ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isLoading, fadeAnim]);

  if (isLoading) {
    return <View>{loadingComponent}</View>;
  }

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  resultCardSkeleton: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIndicatorSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

// No default export needed - all components are named exports