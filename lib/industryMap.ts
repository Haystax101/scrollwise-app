// Helper to map industry_id (int) to industry name (string)
// This should match your industries table in Supabase
export const industryIdToName: Record<number, string> = {
  1: 'CS',
  2: 'Finance & Economics',
  3: 'Maths',
  4: 'Physics',
  5: 'EdTech',
};

export const industryNameToId: Record<string, number> = {
  'CS': 1,
  'Finance & Economics': 2,
  'Maths': 3,
  'Physics': 4,
  'EdTech': 5,
};
