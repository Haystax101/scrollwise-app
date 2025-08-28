// Date utility functions for profile components

export interface DateInput {
  month: string;
  year: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Map month names to numbers
const MONTH_NAMES = {
  'jan': 1, 'january': 1,
  'feb': 2, 'february': 2,
  'mar': 3, 'march': 3,
  'apr': 4, 'april': 4,
  'may': 5,
  'jun': 6, 'june': 6,
  'jul': 7, 'july': 7,
  'aug': 8, 'august': 8,
  'sep': 9, 'september': 9,
  'oct': 10, 'october': 10,
  'nov': 11, 'november': 11,
  'dec': 12, 'december': 12
};

// Convert month name or number to month number (1-12)
const getMonthNumber = (month: string): number | null => {
  const trimmed = month.trim().toLowerCase();
  
  // Check if it's a number
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num >= 1 && num <= 12) {
    return num;
  }
  
  // Check if it's a month name
  return MONTH_NAMES[trimmed as keyof typeof MONTH_NAMES] || null;
};

// Get month name from month number
const getMonthName = (month: number): string => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return months[month - 1] || '';
};

// Validate a month input
export const validateMonth = (month: string): ValidationResult => {
  if (!month.trim()) {
    return { isValid: false, error: 'Month is required' };
  }
  
  const monthNum = getMonthNumber(month);
  if (!monthNum) {
    return { isValid: false, error: 'Please enter a valid month (Jan-Dec or 1-12)' };
  }
  
  return { isValid: true };
};

// Validate a year input
export const validateYear = (year: string): ValidationResult => {
  if (!year.trim()) {
    return { isValid: false, error: 'Year is required' };
  }
  
  const yearNum = parseInt(year.trim(), 10);
  if (isNaN(yearNum)) {
    return { isValid: false, error: 'Please enter a valid year' };
  }
  
  if (yearNum < 1925 || yearNum > 2025) {
    return { isValid: false, error: 'Year must be between 1925 and 2025' };
  }
  
  return { isValid: true };
};

// Validate a date input (month + year)
export const validateDate = (dateInput: DateInput): ValidationResult => {
  const monthValidation = validateMonth(dateInput.month);
  if (!monthValidation.isValid) {
    return monthValidation;
  }
  
  const yearValidation = validateYear(dateInput.year);
  if (!yearValidation.isValid) {
    return yearValidation;
  }
  
  const monthNum = getMonthNumber(dateInput.month)!;
  const yearNum = parseInt(dateInput.year.trim(), 10);
  
  // Check if date is not in the future
  const currentDate = new Date();
  const inputDate = new Date(yearNum, monthNum - 1); // Month is 0-indexed in Date
  
  if (inputDate > currentDate) {
    return { isValid: false, error: 'Date cannot be in the future' };
  }
  
  return { isValid: true };
};

// Validate date range (start date must be before or same as end date)
export const validateDateRange = (startDate: DateInput, endDate: DateInput): ValidationResult => {
  const startValidation = validateDate(startDate);
  if (!startValidation.isValid) {
    return { isValid: false, error: `Start date: ${startValidation.error}` };
  }
  
  const endValidation = validateDate(endDate);
  if (!endValidation.isValid) {
    return { isValid: false, error: `End date: ${endValidation.error}` };
  }
  
  const startMonthNum = getMonthNumber(startDate.month)!;
  const startYearNum = parseInt(startDate.year.trim(), 10);
  const endMonthNum = getMonthNumber(endDate.month)!;
  const endYearNum = parseInt(endDate.year.trim(), 10);
  
  const startDateObj = new Date(startYearNum, startMonthNum - 1);
  const endDateObj = new Date(endYearNum, endMonthNum - 1);
  
  if (startDateObj > endDateObj) {
    return { isValid: false, error: 'Start date must be before or same as end date' };
  }
  
  return { isValid: true };
};

// Convert DateInput to database date format (YYYY-MM-DD)
export const dateInputToDbDate = (dateInput: DateInput): string | null => {
  const validation = validateDate(dateInput);
  if (!validation.isValid) return null;
  
  const monthNum = getMonthNumber(dateInput.month)!;
  const yearNum = parseInt(dateInput.year.trim(), 10);
  
  // Create date as first day of the month for consistency
  const date = new Date(yearNum, monthNum - 1, 1);
  return date.toISOString().split('T')[0];
};

// Convert database date to display format (Jan 2020)
export const dbDateToDisplayFormat = (dbDate: string): string => {
  if (!dbDate) return '';
  
  const date = new Date(dbDate);
  const monthName = getMonthName(date.getMonth() + 1);
  const year = date.getFullYear();
  
  return `${monthName} ${year}`;
};

// Convert database date to DateInput format
export const dbDateToDateInput = (dbDate: string): DateInput => {
  if (!dbDate) return { month: '', year: '' };
  
  const date = new Date(dbDate);
  const monthName = getMonthName(date.getMonth() + 1);
  const year = date.getFullYear().toString();
  
  return { month: monthName, year };
};

// Calculate duration between two dates in months
export const calculateDuration = (startDate: string, endDate: string): string => {
  if (!startDate || !endDate) return '';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
  
  if (months <= 0) return '';
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years === 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  } else if (remainingMonths === 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  } else {
    return `${years} ${years === 1 ? 'year' : 'years'} ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
  }
};

// Format period for display (Jan 2020 - Dec 2022)
export const formatPeriod = (startDate: string, endDate: string | null, isCurrent: boolean): string => {
  if (!startDate) return '';
  
  const startFormatted = dbDateToDisplayFormat(startDate);
  
  if (isCurrent) {
    return `${startFormatted} - Present`;
  } else if (endDate) {
    const endFormatted = dbDateToDisplayFormat(endDate);
    return `${startFormatted} - ${endFormatted}`;
  } else {
    return startFormatted;
  }
};