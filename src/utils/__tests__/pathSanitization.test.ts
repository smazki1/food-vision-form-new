import { describe, it, expect } from 'vitest';

// Function to test (extracted from LeadSubmissionModal)
const sanitizePathComponent = (text: string): string => {
  // First, replace whole Hebrew words with their English equivalents
  const hebrewToEnglish: Record<string, string> = {
    'מנה': 'dish',
    'שתיה': 'drink', 
    'קוקטייל': 'cocktail',
    'עוגה': 'cake',
    'קינוח': 'dessert',
    'סלט': 'salad',
    'מרק': 'soup',
    'פיצה': 'pizza',
    'המבורגר': 'hamburger',
    'סטייק': 'steak',
    'פסטה': 'pasta',
    'סושי': 'sushi',
    'כריך': 'sandwich'
  };

  let result = text;
  
  // Replace known Hebrew words
  Object.entries(hebrewToEnglish).forEach(([hebrew, english]) => {
    result = result.replace(new RegExp(hebrew, 'g'), english);
  });
  
  // Replace any remaining Hebrew characters with dashes
  result = result.replace(/[א-ת]/g, '-');
  
  // Replace any non-alphanumeric characters (except dash and underscore) with dash
  result = result.replace(/[^a-zA-Z0-9\-_]/g, '-');
  
  // Collapse multiple dashes into single dash
  result = result.replace(/-+/g, '-');
  
  // Remove leading and trailing dashes
  result = result.replace(/^-|-$/g, '');
  
  return result;
};

describe('pathSanitization', () => {
  describe('sanitizePathComponent', () => {
    it('should convert common Hebrew food types to English', () => {
      expect(sanitizePathComponent('מנה')).toBe('dish');
      expect(sanitizePathComponent('שתיה')).toBe('drink');
      expect(sanitizePathComponent('קוקטייל')).toBe('cocktail');
      expect(sanitizePathComponent('עוגה')).toBe('cake');
      expect(sanitizePathComponent('קינוח')).toBe('dessert');
      expect(sanitizePathComponent('פיצה')).toBe('pizza');
    });

    it('should handle Hebrew characters not in the lookup table', () => {
      const result = sanitizePathComponent('חומוס');
      expect(result).not.toContain('ח');
      expect(result).not.toContain('ו');
      expect(result).not.toContain('מ');
      expect(result).not.toContain('ס');
      expect(result).toMatch(/^[a-zA-Z0-9\-_]*$/); // Allow empty string
    });

    it('should remove special characters and spaces', () => {
      expect(sanitizePathComponent('מנה ראשונה!')).toBe('dish');
      expect(sanitizePathComponent('מנה/ראשונה')).toBe('dish');
      expect(sanitizePathComponent('מנה & שתיה')).toBe('dish-drink');
    });

    it('should handle mixed Hebrew and English text', () => {
      expect(sanitizePathComponent('pizza עוגה')).toBe('pizza-cake');
      expect(sanitizePathComponent('סלט Caesar')).toBe('salad-Caesar');
    });

    it('should remove leading and trailing dashes', () => {
      expect(sanitizePathComponent('/מנה/')).toBe('dish');
      expect(sanitizePathComponent('!@#מנה$%^')).toBe('dish');
    });

    it('should collapse multiple dashes into single dash', () => {
      expect(sanitizePathComponent('מנה   ראשונה')).toBe('dish');
      expect(sanitizePathComponent('מנה!!!שתיה')).toBe('dish-drink');
    });

    it('should handle empty string', () => {
      expect(sanitizePathComponent('')).toBe('');
    });

    it('should handle pure English text unchanged', () => {
      expect(sanitizePathComponent('dish')).toBe('dish');
      expect(sanitizePathComponent('drink')).toBe('drink');
      expect(sanitizePathComponent('cocktail')).toBe('cocktail');
    });

    it('should generate storage-safe paths for the reported error cases', () => {
      // This was the original failing case: עוגה (cake)
      const result = sanitizePathComponent('עוגה');
      expect(result).toBe('cake');
      
      // Verify the storage path would be valid
      const leadId = '8486981f-2c1d-43d0-a23f-fbf2a4523e0f';
      const itemId = '167477d1-0196-4a15-83b5-75b5415f5b03';
      const fileName = '47005434-6b73-431c-89fe-26e6df617e33.jpeg';
      
      const sanitizedPath = `leads/${leadId}/${result}/${itemId}/${fileName}`;
      
      // This should be a valid storage path (no Hebrew characters)
      expect(sanitizedPath).not.toMatch(/[א-ת]/);
      expect(sanitizedPath).toBe(`leads/${leadId}/cake/${itemId}/${fileName}`);
    });
  });
}); 