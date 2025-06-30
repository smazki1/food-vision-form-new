/**
 * Utility functions for formatting data in the UI
 */

/**
 * Format a number as currency with appropriate locale and currency symbol
 * @param value The numeric value to format
 * @param locale The locale to use for formatting (default: 'he-IL')
 * @param currency The currency code (default: 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | null | undefined,
  locale = 'he-IL',
  currency = 'ILS'
): string {
  if (value === null || value === undefined) return '—';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number as Israeli Shekels (ILS) currency
 * @param value The numeric value to format
 * @param locale The locale to use for formatting (default: 'he-IL')
 * @returns Formatted currency string in ILS
 */
export function formatCurrencyILS(
  value: number | null | undefined,
  locale = 'he-IL'
): string {
  if (value === null || value === undefined) return '—';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number as a percentage with appropriate locale
 * @param value The numeric value to format (e.g., 75.5 for 75.5%)
 * @param locale The locale to use for formatting (default: 'he-IL')
 * @param decimals Number of decimal places to show
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number | null | undefined,
  locale = 'he-IL',
  decimals = 0
): string {
  if (value === null || value === undefined) return '—';
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value / 100); // Convert from percent value to decimal for Intl API
}

/**
 * Format a date in a user-friendly format
 * @param date The date to format (Date object, ISO string, or null/undefined)
 * @param locale The locale to use for formatting (default: 'he-IL')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | null | undefined,
  locale = 'he-IL'
): string {
  if (!date) return '—';
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '—';
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Format a date and time in a user-friendly format
 * @param date The date to format (Date object, ISO string, or null/undefined)
 * @param locale The locale to use for formatting (default: 'he-IL')
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: Date | string | null | undefined,
  locale = 'he-IL'
): string {
  if (!date) return '—';
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '—';
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(dateObj);
}

/**
 * Format a phone number for display
 * @param phone The phone number string
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '—';
  
  // Handle Israeli phone numbers (example format: 050-123-4567)
  // This is a simple implementation - for production, consider using a library like libphonenumber-js
  
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    // Format as 050-123-4567
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // If it doesn't match our expected format, return as-is
  return phone;
}

/**
 * Format a number with appropriate locale
 * @param value The numeric value to format
 * @param locale The locale to use for formatting (default: 'he-IL')
 * @returns Formatted number string
 */
export function formatNumber(
  value: number | null | undefined,
  locale = 'he-IL'
): string {
  if (value === null || value === undefined) return '—';
  
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);
} 