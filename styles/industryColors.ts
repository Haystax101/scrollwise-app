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

// Primary industry color definitions based on discoverPlan.md
export const INDUSTRY_COLORS: Record<string, Omit<IndustryColor, 'id' | 'name'>> = {
  // Technology stack
  technology: {
    primary: '#2563EB',
    background: '#2563EB33', // 20% opacity
    hover: '#2563EB99', // 60% opacity
    text: '#FFFFFF'
  },
  tech: { // Alternative name
    primary: '#2563EB',
    background: '#2563EB33',
    hover: '#2563EB99',
    text: '#FFFFFF'
  },
  
  // Finance stack
  finance: {
    primary: '#059669',
    background: '#05966933',
    hover: '#05966999',
    text: '#FFFFFF'
  },
  financial: { // Alternative name
    primary: '#059669',
    background: '#05966933',
    hover: '#05966999',
    text: '#FFFFFF'
  },
  
  // Healthcare stack
  healthcare: {
    primary: '#DC2626',
    background: '#DC262633',
    hover: '#DC262699',
    text: '#FFFFFF'
  },
  health: { // Alternative name
    primary: '#DC2626',
    background: '#DC262633',
    hover: '#DC262699',
    text: '#FFFFFF'
  },
  
  // Education stack
  education: {
    primary: '#7C3AED',
    background: '#7C3AED33',
    hover: '#7C3AED99',
    text: '#FFFFFF'
  },
  
  // Marketing stack
  marketing: {
    primary: '#EA580C',
    background: '#EA580C33',
    hover: '#EA580C99',
    text: '#FFFFFF'
  },
  
  // Consulting stack
  consulting: {
    primary: '#0F766E',
    background: '#0F766E33',
    hover: '#0F766E99',
    text: '#FFFFFF'
  },
  
  // Engineering stack
  engineering: {
    primary: '#4338CA',
    background: '#4338CA33',
    hover: '#4338CA99',
    text: '#FFFFFF'
  },
  
  // Design stack
  design: {
    primary: '#BE185D',
    background: '#BE185D33',
    hover: '#BE185D99',
    text: '#FFFFFF'
  },
  
  // Sales stack
  sales: {
    primary: '#B91C1C',
    background: '#B91C1C33',
    hover: '#B91C1C99',
    text: '#FFFFFF'
  },
  
  // Operations stack
  operations: {
    primary: '#374151',
    background: '#37415133',
    hover: '#37415199',
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
    // Technology variations
    'it': 'technology',
    'informationtechnology': 'technology',
    'software': 'technology',
    'computing': 'technology',
    
    // Finance variations
    'banking': 'finance',
    'fintech': 'finance',
    'investment': 'finance',
    'accounting': 'finance',
    'economics': 'finance',
    
    // Healthcare variations
    'medical': 'healthcare',
    'medicine': 'healthcare',
    'pharma': 'healthcare',
    'pharmaceutical': 'healthcare',
    'biotech': 'healthcare',
    'biotechnology': 'healthcare',
    
    // Education variations
    'teaching': 'education',
    'academic': 'education',
    'university': 'education',
    'school': 'education',
    
    // Marketing variations
    'advertising': 'marketing',
    'promotion': 'marketing',
    'brand': 'marketing',
    'digital': 'marketing',
    
    // Consulting variations
    'advisory': 'consulting',
    'strategy': 'consulting',
    'management': 'consulting',
    
    // Engineering variations
    'mechanical': 'engineering',
    'electrical': 'engineering',
    'civil': 'engineering',
    'chemical': 'engineering',
    
    // Design variations
    'creative': 'design',
    'art': 'design',
    'graphics': 'design',
    'ux': 'design',
    'ui': 'design',
    
    // Sales variations
    'business': 'sales',
    'commerce': 'sales',
    'retail': 'sales',
    
    // Operations variations
    'logistics': 'operations',
    'supply': 'operations',
    'manufacturing': 'operations',
    'production': 'operations'
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