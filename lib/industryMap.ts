// Helper to map industry_id (int) to industry name (string)
// This should match your industries table in Supabase
export const industryIdToName: Record<number, string> = {
  1: 'STEM',
  2: 'Finance',
  3: 'Healthcare',
  4: 'Education',
  5: 'Law',
};

export const industryNameToId: Record<string, number> = {
  'STEM': 1,
  'Finance': 2,
  'Healthcare': 3,
  'Education': 4,
  'Law': 5,
};
