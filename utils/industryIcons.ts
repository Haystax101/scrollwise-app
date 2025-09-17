// Simplified industry icon mapping for the 9 core industries only
export const INDUSTRY_ICON_MAP: { [key: string]: { name: string; family: string } } = {
  'finance': { name: 'business-center', family: 'MaterialIcons' },
  'politics': { name: 'public', family: 'MaterialIcons' },
  'entrepreneurship': { name: 'rocket-launch', family: 'MaterialIcons' },
  'technology': { name: 'computer', family: 'MaterialIcons' },
  'energy': { name: 'bolt', family: 'MaterialIcons' },
  'creative': { name: 'palette', family: 'MaterialIcons' },
  'engineering': { name: 'engineering', family: 'MaterialIcons' },
  'healthcare': { name: 'local-hospital', family: 'MaterialIcons' },
  'education': { name: 'school', family: 'MaterialIcons' },
};

// Color map using simplified keys (matches IndustrySelection.tsx)
export const INDUSTRY_COLOR_MAP: { [key: string]: string } = {
  'finance': '#9C27B0',          // Purple
  'politics': '#B71C1C',         // Red
  'entrepreneurship': '#1565C0', // Blue
  'technology': '#1B5E20',       // Green
  'energy': '#5E35B1',           // Purple
  'creative': '#880E4F',         // Pink
  'engineering': '#C51162',      // Pink
  'healthcare': '#311B92',       // Purple
  'education': '#004D40',        // Teal
};

// Mapping from full database names to simplified keys
export const INDUSTRY_NAME_TO_KEY: { [key: string]: string } = {
  'Finance and Economics': 'finance',
  'Politics and International Relations': 'politics',
  'Entrepreneurship and Startups': 'entrepreneurship',
  'Technology and AI': 'technology',
  'Energy, Sustainability and Climate Innovation': 'energy',
  'Creative Industries and the Arts': 'creative',
  'Engineering and Automotive': 'engineering',
  'Medicine and Healthcare': 'healthcare',
  'Education': 'education',
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

  // First check if it's already a simplified key (like from IndustrySelection.tsx)
  if (INDUSTRY_COLOR_MAP[industryName]) {
    return INDUSTRY_COLOR_MAP[industryName];
  }

  // Map from full database name to simplified key
  const simplifiedKey = INDUSTRY_NAME_TO_KEY[industryName];
  if (simplifiedKey && INDUSTRY_COLOR_MAP[simplifiedKey]) {
    return INDUSTRY_COLOR_MAP[simplifiedKey];
  }

  // Case-insensitive simplified key match
  const lowerName = industryName.toLowerCase();
  if (INDUSTRY_COLOR_MAP[lowerName]) {
    return INDUSTRY_COLOR_MAP[lowerName];
  }

  // Partial match for compound names (fallback)
  for (const [key, color] of Object.entries(INDUSTRY_COLOR_MAP)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return color;
    }
  }

  // Default color
  return '#6B7280';
};

// Legacy mapping for backward compatibility - simplified to 9 core industries only
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