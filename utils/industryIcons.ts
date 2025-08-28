// Shared industry icon mapping for consistent icons across onboarding and profile
// Now includes icon families for proper rendering
export const INDUSTRY_ICON_MAP: { [key: string]: { name: string; family: string } } = {
  // Finance and Business
  'finance': { name: 'business-center', family: 'MaterialIcons' },
  'banking': { name: 'account-balance', family: 'MaterialIcons' },
  'investment': { name: 'trending-up', family: 'MaterialIcons' },
  'insurance': { name: 'shield', family: 'MaterialIcons' },
  'accounting': { name: 'calculator', family: 'MaterialIcons' },
  'consulting': { name: 'people', family: 'MaterialIcons' },
  'management': { name: 'people', family: 'MaterialIcons' },
  'strategy': { name: 'bar-chart', family: 'Ionicons' },
  'operations': { name: 'settings', family: 'MaterialIcons' },

  // Politics and Law
  'politics': { name: 'public', family: 'MaterialIcons' },
  'law': { name: 'gavel', family: 'MaterialIcons' },
  'legal': { name: 'gavel', family: 'MaterialIcons' },
  'government': { name: 'account-balance', family: 'MaterialIcons' },

  // Technology
  'technology': { name: 'computer', family: 'MaterialIcons' },
  'software development': { name: 'code', family: 'MaterialIcons' },
  'artificial intelligence': { name: 'psychology', family: 'MaterialIcons' },
  'cybersecurity': { name: 'security', family: 'MaterialIcons' },
  'data science': { name: 'analytics', family: 'MaterialIcons' },
  'cloud computing': { name: 'cloud', family: 'MaterialIcons' },
  'mobile development': { name: 'phone-android', family: 'MaterialIcons' },
  'web development': { name: 'web', family: 'MaterialIcons' },
  'devops': { name: 'dns', family: 'MaterialIcons' },

  // Entrepreneurship
  'entrepreneurship': { name: 'rocket-launch', family: 'MaterialIcons' },
  'startups': { name: 'rocket-launch', family: 'MaterialIcons' },

  // Energy and Environment
  'energy': { name: 'bolt', family: 'MaterialIcons' },
  'sustainability': { name: 'eco', family: 'MaterialIcons' },
  'climate': { name: 'eco', family: 'MaterialIcons' },

  // Creative Industries
  'creative': { name: 'palette', family: 'MaterialIcons' },
  'marketing': { name: 'campaign', family: 'MaterialIcons' },
  'advertising': { name: 'campaign', family: 'MaterialIcons' },
  'design': { name: 'brush', family: 'MaterialIcons' },
  'media': { name: 'videocam', family: 'MaterialIcons' },
  'entertainment': { name: 'music-note', family: 'MaterialIcons' },
  'content creation': { name: 'create', family: 'MaterialIcons' },

  // Engineering
  'engineering': { name: 'engineering', family: 'MaterialIcons' },
  'manufacturing': { name: 'precision-manufacturing', family: 'MaterialIcons' },
  'automotive': { name: 'directions-car', family: 'MaterialIcons' },

  // Healthcare
  'healthcare': { name: 'local-hospital', family: 'MaterialIcons' },
  'medicine': { name: 'medical-services', family: 'MaterialIcons' },
  'nursing': { name: 'favorite', family: 'MaterialIcons' },
  'pharmaceuticals': { name: 'biotech', family: 'MaterialIcons' },
  'biotechnology': { name: 'biotech', family: 'MaterialIcons' },
  'medical devices': { name: 'memory', family: 'MaterialIcons' },

  // Education
  'education': { name: 'school', family: 'MaterialIcons' },
  'research': { name: 'science', family: 'MaterialIcons' },
  'academia': { name: 'menu-book', family: 'MaterialIcons' },
  'training': { name: 'person', family: 'MaterialIcons' },

  // Other sectors
  'retail': { name: 'storefront', family: 'MaterialIcons' },
  'real estate': { name: 'home', family: 'MaterialIcons' },
  'transportation': { name: 'local-shipping', family: 'MaterialIcons' },
  'non-profit': { name: 'volunteer-activism', family: 'MaterialIcons' },
  'logistics': { name: 'local-shipping', family: 'MaterialIcons' },
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

export const getIndustryIcon = (industryName: string): { name: string; family: string } => {
  const lowerName = industryName.toLowerCase();
  
  // Direct match
  if (INDUSTRY_ICON_MAP[lowerName]) {
    return INDUSTRY_ICON_MAP[lowerName];
  }
  
  // Partial match for compound names
  for (const [key, iconConfig] of Object.entries(INDUSTRY_ICON_MAP)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return iconConfig;
    }
  }
  
  // Default icon
  return { name: 'business', family: 'MaterialIcons' };
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
export const LEGACY_INDUSTRY_MAPPING: { [key: string]: { icon: { name: string; family: string }, color: string } } = {
  'finance': { icon: { name: 'business-center', family: 'MaterialIcons' }, color: '#9C27B0' },
  'politics': { icon: { name: 'public', family: 'MaterialIcons' }, color: '#B71C1C' },
  'entrepreneurship': { icon: { name: 'rocket-launch', family: 'MaterialIcons' }, color: '#1565C0' },
  'technology': { icon: { name: 'computer', family: 'MaterialIcons' }, color: '#1B5E20' },
  'energy': { icon: { name: 'bolt', family: 'MaterialIcons' }, color: '#5E35B1' },
  'creative': { icon: { name: 'palette', family: 'MaterialIcons' }, color: '#880E4F' },
  'engineering': { icon: { name: 'engineering', family: 'MaterialIcons' }, color: '#C51162' },
  'healthcare': { icon: { name: 'local-hospital', family: 'MaterialIcons' }, color: '#311B92' },
  'education': { icon: { name: 'school', family: 'MaterialIcons' }, color: '#004D40' },
};