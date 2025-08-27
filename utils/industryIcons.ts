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
  'finance': '#9C27B0',      // Purple
  'banking': '#B71C1C',      // Red
  'investment': '#1565C0',   // Blue
  'politics': '#1B5E20',     // Green
  'law': '#5E35B1',          // Purple
  'legal': '#880E4F',        // Pink
  'entrepreneurship': '#C51162', // Pink
  'startups': '#311B92',     // Purple
  'technology': '#004D40',   // Teal
  'software development': '#9C27B0', // Purple
  'artificial intelligence': '#B71C1C', // Red
  'energy': '#1565C0',       // Blue
  'sustainability': '#1B5E20', // Green
  'creative': '#5E35B1',     // Purple
  'marketing': '#880E4F',    // Pink
  'design': '#C51162',       // Pink
  'engineering': '#311B92',  // Purple
  'automotive': '#004D40',   // Teal
  'manufacturing': '#9C27B0', // Purple
  'healthcare': '#B71C1C',   // Red
  'medicine': '#1565C0',     // Blue
  'education': '#1B5E20',    // Green
  'research': '#5E35B1',     // Purple
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
  'finance': { icon: 'briefcase-outline', color: '#9C27B0' },
  'politics': { icon: 'globe-outline', color: '#B71C1C' },
  'entrepreneurship': { icon: 'rocket-outline', color: '#1565C0' },
  'technology': { icon: 'desktop-outline', color: '#1B5E20' },
  'energy': { icon: 'leaf-outline', color: '#5E35B1' },
  'creative': { icon: 'color-palette-outline', color: '#880E4F' },
  'engineering': { icon: 'construct-outline', color: '#C51162' },
  'healthcare': { icon: 'medkit-outline', color: '#311B92' },
  'education': { icon: 'school-outline', color: '#004D40' },
};