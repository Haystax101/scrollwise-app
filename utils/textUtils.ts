import { Dimensions } from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

interface DynamicTextOptions {
  hasAuthor: boolean;
  hasMultipleMetadataRows?: boolean;
  fontSize?: number;
  lineHeight?: number;
  containerHeight?: number;
  titleLines?: number;
  metadataHeight?: number;
  authorHeight?: number;
  actionsHeight?: number;
  padding?: number;
}

/**
 * Calculates the optimal number of lines for content text based on available space
 * and content card layout constraints.
 */
export const calculateDynamicTextLines = (options: DynamicTextOptions): number => {
  const {
    hasAuthor = false,
    hasMultipleMetadataRows = false,
    fontSize = 16,
    lineHeight = 22,
    containerHeight = screenHeight * 0.55, // Content section height
    titleLines = 2,
    metadataHeight = hasMultipleMetadataRows ? 40 : 20, // Height for metadata rows
    authorHeight = hasAuthor ? 28 : 0, // Height for author tags
    actionsHeight = 60, // Height for actions row
    padding = 32 // Total padding (top + bottom)
  } = options;

  // Calculate space used by fixed elements
  const titleHeight = titleLines * 26; // Title line height is typically 26
  const fixedElementsHeight = metadataHeight + titleHeight + authorHeight + actionsHeight + padding;
  
  // Calculate available space for content text
  const availableHeight = containerHeight - fixedElementsHeight;
  
  // Calculate maximum lines that fit
  const maxLines = Math.floor(availableHeight / lineHeight);
  
  // Apply constraints based on author presence and reduce by 1 to prevent overflow
  let optimalLines: number;
  if (hasAuthor) {
    // When author is present, limit to 6 lines maximum but use available space (was 7, now 6)
    optimalLines = Math.min(maxLines - 1, 6);
  } else {
    // When no author, limit to 7 lines maximum but use available space (was 8, now 7)
    optimalLines = Math.min(maxLines - 1, 7);
  }
  
  // Ensure minimum of 3 lines for readability
  return Math.max(optimalLines, 3);
};

/**
 * Optimizes industry name display for space efficiency
 */
export const optimizeIndustryName = (industryName: string): string => {
  // Special case for Creative Industries and the Arts
  if (industryName.toLowerCase().includes('creative industries and the arts')) {
    return 'Creative and the Arts';
  }
  
  // Future optimizations can be added here for other long industry names
  // For example:
  // if (industryName.includes('Technology and AI')) return 'Tech & AI';
  
  return industryName;
};

/**
 * Removes HTML tags from text strings
 */
export const removeHtmlTags = (text: string): string => {
  if (!text) return '';
  
  // Remove anything enclosed in < >
  return text.replace(/<[^>]*>/g, '').trim();
};

/**
 * Processes insight text to make first sentence bold and colored, with remaining text as one block
 */
export const processInsightText = (text: string, _accentColor: string): Array<{ text: string; style: any }> => {
  // Remove line breaks and normalize whitespace
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Return entire text as one block with consistent white styling for book cards
  return [{
    text: cleanText,
    style: { color: '#FFFFFF', fontWeight: '700' }
  }];
};