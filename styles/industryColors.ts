/**
 * Centralized Industry Color System for Discover Section
 * Based on discoverPlan.md specifications
 */

export interface IndustryColor {
  id: string;
  name: string;
  primary: string;
  background: string; // 20% opacity
  hover: string; // 60% opacity
  text: string; // For text on colored backgrounds
}

// Primary industry color definitions - simplified to match the 9 core industries
export const INDUSTRY_COLORS: Record<string, Omit<IndustryColor, 'id' | 'name'>> = {
  // Finance and Economics
  finance: {
    primary: '#9C27B0', // Purple
    background: '#9C27B033',
    hover: '#9C27B099',
    text: '#FFFFFF'
  },

  // Politics and International Relations
  politics: {
    primary: '#B71C1C', // Red
    background: '#B71C1C33',
    hover: '#B71C1C99',
    text: '#FFFFFF'
  },

  // Entrepreneurship and Startups
  entrepreneurship: {
    primary: '#1565C0', // Blue
    background: '#1565C033',
    hover: '#1565C099',
    text: '#FFFFFF'
  },

  // Technology and AI
  technology: {
    primary: '#1B5E20', // Green
    background: '#1B5E2033',
    hover: '#1B5E2099',
    text: '#FFFFFF'
  },

  // Energy, Sustainability and Climate Innovation
  energy: {
    primary: '#5E35B1', // Purple
    background: '#5E35B133',
    hover: '#5E35B199',
    text: '#FFFFFF'
  },

  // Creative Industries and the Arts
  creative: {
    primary: '#880E4F', // Pink
    background: '#880E4F33',
    hover: '#880E4F99',
    text: '#FFFFFF'
  },

  // Engineering and Automotive
  engineering: {
    primary: '#C51162', // Pink
    background: '#C5116233',
    hover: '#C5116299',
    text: '#FFFFFF'
  },

  // Medicine and Healthcare
  healthcare: {
    primary: '#311B92', // Purple
    background: '#311B9233',
    hover: '#311B9299',
    text: '#FFFFFF'
  },

  // Education
  education: {
    primary: '#004D40', // Teal
    background: '#004D4033',
    hover: '#004D4099',
    text: '#FFFFFF'
  },

  // Default/fallback colors
  default: {
    primary: '#6B7280', // Gray
    background: '#6B728033',
    hover: '#6B728099',
    text: '#FFFFFF'
  }
};

/**
 * Get industry colors by name or ID
 * Performs case-insensitive matching and handles common variations
 */
export const getIndustryColors = (industryIdentifier: string): Omit<IndustryColor, 'id' | 'name'> => {
  if (!industryIdentifier) {
    return INDUSTRY_COLORS.default;
  }
  
  // Normalize the identifier: lowercase, remove spaces and special chars
  const normalized = industryIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Direct match
  if (INDUSTRY_COLORS[normalized]) {
    return INDUSTRY_COLORS[normalized];
  }
  
  // Fuzzy matching for common variations
  const fuzzyMatches: Record<string, string> = {
    // Finance variations
    'banking': 'finance',
    'fintech': 'finance',
    'investment': 'finance',
    'accounting': 'finance',
    'economics': 'finance',
    'financial': 'finance',

    // Politics variations
    'political': 'politics',
    'government': 'politics',
    'international': 'politics',
    'relations': 'politics',
    'policy': 'politics',

    // Entrepreneurship variations
    'startup': 'entrepreneurship',
    'startups': 'entrepreneurship',
    'business': 'entrepreneurship',
    'ventures': 'entrepreneurship',
    'innovation': 'entrepreneurship',

    // Technology variations
    'tech': 'technology',
    'ai': 'technology',
    'software': 'technology',
    'computing': 'technology',
    'digital': 'technology',

    // Energy variations
    'sustainability': 'energy',
    'climate': 'energy',
    'renewable': 'energy',
    'environment': 'energy',
    'green': 'energy',

    // Creative variations
    'art': 'creative',
    'arts': 'creative',
    'design': 'creative',
    'media': 'creative',
    'entertainment': 'creative',

    // Engineering variations
    'automotive': 'engineering',
    'mechanical': 'engineering',
    'electrical': 'engineering',
    'civil': 'engineering',

    // Healthcare variations
    'medicine': 'healthcare',
    'medical': 'healthcare',
    'health': 'healthcare',
    'pharma': 'healthcare',
    'biotech': 'healthcare',

    // Education variations
    'teaching': 'education',
    'academic': 'education',
    'university': 'education',
    'school': 'education'
  };
  
  // Check fuzzy matches
  if (fuzzyMatches[normalized]) {
    return INDUSTRY_COLORS[fuzzyMatches[normalized]];
  }
  
  // Check if the normalized identifier contains any of our industry keys
  for (const industryKey of Object.keys(INDUSTRY_COLORS)) {
    if (normalized.includes(industryKey) || industryKey.includes(normalized)) {
      return INDUSTRY_COLORS[industryKey];
    }
  }
  
  // Return default if no match found
  return INDUSTRY_COLORS.default;
};

/**
 * Generate a consistent hash-based color from industry ID or name
 * Used as fallback for unmapped industries
 */
export const generateIndustryColor = (industryIdentifier: string): Omit<IndustryColor, 'id' | 'name'> => {
  // Predefined color palette for hash-based assignment
  const hashColors = [
    '#9C27B0', // Purple
    '#B71C1C', // Red
    '#1565C0', // Blue
    '#1B5E20', // Green
    '#5E35B1', // Purple
    '#880E4F', // Pink
    '#C51162', // Pink
    '#311B92', // Purple
    '#004D40', // Teal
    '#BF360C', // Orange
    '#3E2723', // Brown
    '#424242', // Gray
  ];
  
  // Generate hash from industry identifier
  const hash = industryIdentifier.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const colorIndex = Math.abs(hash) % hashColors.length;
  const primaryColor = hashColors[colorIndex];
  
  return {
    primary: primaryColor,
    background: primaryColor + '33', // 20% opacity
    hover: primaryColor + '99', // 60% opacity
    text: '#FFFFFF'
  };
};

/**
 * Get industry color with fallback to hash-based generation
 * This is the main function to use throughout the app
 */
export const getIndustryColorScheme = (industryIdentifier: string): Omit<IndustryColor, 'id' | 'name'> => {
  // First try to get predefined colors
  const predefinedColors = getIndustryColors(industryIdentifier);
  
  // If it's the default color and we have a specific identifier, try hash-based generation
  if (predefinedColors === INDUSTRY_COLORS.default && industryIdentifier && industryIdentifier.toLowerCase() !== 'default') {
    return generateIndustryColor(industryIdentifier);
  }
  
  return predefinedColors;
};

/**
 * Golden theme primary color for selected states and primary actions
 */
export const GOLDEN_PRIMARY = '#EAB308';

/**
 * Helper to check if a color needs dark text for contrast
 */
export const needsDarkText = (hexColor: string): boolean => {
  // Remove # if present
  const color = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return true if the color is light (needs dark text)
  return luminance > 0.6;
};