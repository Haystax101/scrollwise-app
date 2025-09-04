import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getIndustryColorScheme, GOLDEN_PRIMARY, needsDarkText } from '../../styles/industryColors';

export interface IndustryColorBadgeProps {
  industryId?: string;
  industryName: string;
  selected?: boolean;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'pill' | 'tag' | 'chip';
  showName?: boolean;
}

export const IndustryColorBadge: React.FC<IndustryColorBadgeProps> = ({
  industryId,
  industryName,
  selected = false,
  onPress,
  size = 'medium',
  variant = 'pill',
  showName = true
}) => {
  // Get industry colors based on ID or name
  const industryColors = getIndustryColorScheme(industryId || industryName);
  
  // Determine background and text colors based on state
  const getColors = () => {
    if (selected) {
      // Selected state uses golden theme
      return {
        backgroundColor: GOLDEN_PRIMARY,
        textColor: needsDarkText(GOLDEN_PRIMARY) ? '#000000' : '#FFFFFF',
        borderColor: GOLDEN_PRIMARY
      };
    } else {
      // Unselected state uses industry colors with transparency
      return {
        backgroundColor: industryColors.background,
        textColor: industryColors.primary,
        borderColor: industryColors.hover
      };
    }
  };

  const colors = getColors();

  // Size-based styling
  const sizeStyles = {
    small: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: variant === 'tag' ? 6 : 12,
      fontSize: 12
    },
    medium: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: variant === 'tag' ? 8 : 20,
      fontSize: 14
    },
    large: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: variant === 'tag' ? 10 : 25,
      fontSize: 16
    }
  };

  const currentSizeStyle = sizeStyles[size];

  const badgeStyle = [
    styles.badge,
    {
      backgroundColor: colors.backgroundColor,
      borderColor: colors.borderColor,
      paddingVertical: currentSizeStyle.paddingVertical,
      paddingHorizontal: currentSizeStyle.paddingHorizontal,
      borderRadius: currentSizeStyle.borderRadius,
      borderWidth: variant === 'pill' ? 1 : 0
    }
  ];

  const textStyle = [
    styles.text,
    {
      color: colors.textColor,
      fontSize: currentSizeStyle.fontSize,
      fontWeight: selected ? '600' : '500'
    }
  ];

  // If onPress is provided, render as TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity
        style={badgeStyle}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityLabel={`Industry: ${industryName}`}
        accessibilityRole="button"
        accessibilityState={{ selected }}
      >
        {showName && <Text style={textStyle}>{industryName}</Text>}
      </TouchableOpacity>
    );
  }

  // Otherwise render as static View
  return (
    <View style={badgeStyle}>
      {showName && <Text style={textStyle}>{industryName}</Text>}
    </View>
  );
};

// For backwards compatibility - pill variant
export const IndustryPill: React.FC<IndustryColorBadgeProps> = (props) => (
  <IndustryColorBadge {...props} variant="pill" />
);

// Specialized variants
export const IndustryTag: React.FC<IndustryColorBadgeProps> = (props) => (
  <IndustryColorBadge {...props} variant="tag" size="small" />
);

export const IndustryChip: React.FC<IndustryColorBadgeProps> = (props) => (
  <IndustryColorBadge {...props} variant="chip" />
);

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  text: {
    textAlign: 'center',
    lineHeight: undefined, // Let React Native calculate optimal line height
  },
});

export default IndustryColorBadge;