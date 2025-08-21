// Shared industry icon mapping for consistent icons across onboarding and profile
export const INDUSTRY_ICON_MAP: { [key: string]: string } = {
  // Finance and Business
  'finance': 'briefcase-outline',
  'banking': 'briefcase-outline',
  'investment': 'trending-up-outline',
  'insurance': 'shield-outline',
  'accounting': 'calculator-outline',
  'consulting': 'people-outline',
  'management': 'people-outline',
  'strategy': 'analytics-outline',
  'operations': 'settings-outline',

  // Politics and Law
  'politics': 'globe-outline',
  'law': 'library-outline',
  'legal': 'library-outline',
  'government': 'business-outline',

  // Technology
  'technology': 'desktop-outline',
  'software development': 'code-outline',
  'artificial intelligence': 'bulb-outline',
  'cybersecurity': 'shield-checkmark-outline',
  'data science': 'analytics-outline',
  'cloud computing': 'cloud-outline',
  'mobile development': 'phone-portrait-outline',
  'web development': 'globe-outline',
  'devops': 'server-outline',

  // Entrepreneurship
  'entrepreneurship': 'rocket-outline',
  'startups': 'rocket-outline',

  // Energy and Environment
  'energy': 'leaf-outline',
  'sustainability': 'leaf-outline',
  'climate': 'leaf-outline',

  // Creative Industries
  'creative': 'color-palette-outline',
  'marketing': 'megaphone-outline',
  'advertising': 'megaphone-outline',
  'design': 'brush-outline',
  'media': 'videocam-outline',
  'entertainment': 'musical-notes-outline',
  'content creation': 'create-outline',

  // Engineering
  'engineering': 'construct-outline',
  'manufacturing': 'build-outline',
  'automotive': 'car-outline',

  // Healthcare
  'healthcare': 'medkit-outline',
  'medicine': 'medical-outline',
  'nursing': 'heart-outline',
  'pharmaceuticals': 'flask-outline',
  'biotechnology': 'leaf-outline',
  'medical devices': 'hardware-chip-outline',

  // Education
  'education': 'school-outline',
  'research': 'library-outline',
  'academia': 'book-outline',
  'training': 'person-outline',

  // Other sectors
  'retail': 'storefront-outline',
  'real estate': 'home-outline',
  'transportation': 'car-outline',
  'non-profit': 'heart-outline',
  'logistics': 'airplane-outline',
};

export const INDUSTRY_COLOR_MAP: { [key: string]: string } = {
  'finance': '#3B82F6',      // Blue
  'banking': '#3B82F6',      // Blue
  'investment': '#3B82F6',   // Blue
  'politics': '#8B5CF6',     // Purple
  'law': '#8B5CF6',          // Purple
  'legal': '#8B5CF6',        // Purple
  'entrepreneurship': '#EF4444', // Red
  'startups': '#EF4444',     // Red
  'technology': '#10B981',   // Green
  'software development': '#10B981', // Green
  'artificial intelligence': '#10B981', // Green
  'energy': '#22C55E',       // Green (climate)
  'sustainability': '#22C55E', // Green
  'creative': '#F59E0B',     // Yellow/Orange
  'marketing': '#F59E0B',    // Orange
  'design': '#F59E0B',       // Orange
  'engineering': '#6B7280',  // Gray
  'automotive': '#6B7280',   // Gray
  'manufacturing': '#6B7280', // Gray
  'healthcare': '#EC4899',   // Pink
  'medicine': '#EC4899',     // Pink
  'education': '#F97316',    // Orange
  'research': '#F97316',     // Orange
};

export const getIndustryIcon = (industryName: string): string => {
  const lowerName = industryName.toLowerCase();
  
  // Direct match
  if (INDUSTRY_ICON_MAP[lowerName]) {
    return INDUSTRY_ICON_MAP[lowerName];
  }
  
  // Partial match for compound names
  for (const [key, icon] of Object.entries(INDUSTRY_ICON_MAP)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return icon;
    }
  }
  
  // Default icon
  return 'business-outline';
};

export const getIndustryColor = (industryName: string, isSelected: boolean = false): string => {
  if (isSelected) return '#F59E0B'; // Yellow when selected
  
  const lowerName = industryName.toLowerCase();
  
  // Direct match
  if (INDUSTRY_COLOR_MAP[lowerName]) {
    return INDUSTRY_COLOR_MAP[lowerName];
  }
  
  // Partial match for compound names
  for (const [key, color] of Object.entries(INDUSTRY_COLOR_MAP)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return color;
    }
  }
  
  // Default color
  return '#6B7280';
};

// Legacy mapping for backward compatibility with the old hardcoded array
export const LEGACY_INDUSTRY_MAPPING: { [key: string]: { icon: string, color: string } } = {
  'finance': { icon: 'briefcase-outline', color: '#3B82F6' },
  'politics': { icon: 'globe-outline', color: '#8B5CF6' },
  'entrepreneurship': { icon: 'rocket-outline', color: '#EF4444' },
  'technology': { icon: 'desktop-outline', color: '#10B981' },
  'energy': { icon: 'leaf-outline', color: '#22C55E' },
  'creative': { icon: 'color-palette-outline', color: '#F59E0B' },
  'engineering': { icon: 'construct-outline', color: '#6B7280' },
  'healthcare': { icon: 'medkit-outline', color: '#EC4899' },
  'education': { icon: 'school-outline', color: '#F97316' },
};