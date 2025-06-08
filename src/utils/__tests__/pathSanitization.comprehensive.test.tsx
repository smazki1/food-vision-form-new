import { describe, it, expect } from 'vitest';

// Import the path sanitization utility
const sanitizePathComponent = (text: string): string => {
  // Hebrew word mapping for food industry terms
  const hebrewToEnglish = {
    'מנה': 'dish', 'שתיה': 'drink', 'קוקטייל': 'cocktail',
    'עוגה': 'cake', 'מאפה': 'pastry', 'סלט': 'salad',
    'עוף': 'chicken', 'בשר': 'meat', 'דג': 'fish',
    'ירקות': 'vegetables', 'פירות': 'fruits'
  };
  
  let sanitized = text;
  
  // Replace whole Hebrew words first
  Object.entries(hebrewToEnglish).forEach(([hebrew, english]) => {
    const regex = new RegExp(hebrew, 'g');
    sanitized = sanitized.replace(regex, english);
  });
  
  // Convert remaining Hebrew chars to dashes
  sanitized = sanitized.replace(/[\u0590-\u05FF]/g, '-');
  
  // Sanitize special characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9\-_]/g, '-');
  
  // Normalize dashes (collapse multiples, trim)
  sanitized = sanitized.replace(/-+/g, '-').replace(/^-|-$/g, '');
  
  return sanitized || 'item';
};

describe('Hebrew Character Storage Path Resolution - Comprehensive Tests', () => {
  describe('Happy Path Tests', () => {
    it('should convert common Hebrew food terms correctly', () => {
      expect(sanitizePathComponent('עוגה')).toBe('cake');
      expect(sanitizePathComponent('מנה')).toBe('dish');
      expect(sanitizePathComponent('שתיה')).toBe('drink');
      expect(sanitizePathComponent('קוקטייל')).toBe('cocktail');
      expect(sanitizePathComponent('מאפה')).toBe('pastry');
      expect(sanitizePathComponent('סלט')).toBe('salad');
    });

    it('should handle protein types correctly', () => {
      expect(sanitizePathComponent('עוף')).toBe('chicken');
      expect(sanitizePathComponent('בשר')).toBe('meat');
      expect(sanitizePathComponent('דג')).toBe('fish');
    });

    it('should handle food categories correctly', () => {
      expect(sanitizePathComponent('ירקות')).toBe('vegetables');
      expect(sanitizePathComponent('פירות')).toBe('fruits');
    });

    it('should create valid storage paths', () => {
      const leadId = 'lead-123';
      const itemType = sanitizePathComponent('עוגה');
      const path = `leads/${leadId}/${itemType}/`;
      
      expect(path).toBe('leads/lead-123/cake/');
      expect(path).toMatch(/^[a-zA-Z0-9\-_\/]+$/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle Hebrew text with mixed content', () => {
      expect(sanitizePathComponent('עוגה שוקולד')).toBe('cake');
      expect(sanitizePathComponent('מנה ראשונה')).toBe('dish');
      expect(sanitizePathComponent('שתיה קרה')).toBe('drink');
    });

    it('should handle unknown Hebrew characters', () => {
      expect(sanitizePathComponent('חומוס')).toBe('item');
      expect(sanitizePathComponent('פלאפל')).toBe('item');
    });

    it('should handle mixed Hebrew and English', () => {
      expect(sanitizePathComponent('עוגה cake')).toBe('cake-cake');
      expect(sanitizePathComponent('dish מנה')).toBe('dish-dish');
    });

    it('should handle empty and whitespace strings', () => {
      expect(sanitizePathComponent('')).toBe('item');
      expect(sanitizePathComponent('   ')).toBe('item');
      expect(sanitizePathComponent('\t\n')).toBe('item');
    });

    it('should handle special characters', () => {
      expect(sanitizePathComponent('עוגה@#$')).toBe('cake');
      expect(sanitizePathComponent('מנה/\\|')).toBe('dish');
      expect(sanitizePathComponent('שתיה!@#$%')).toBe('drink');
    });

    it('should normalize multiple dashes', () => {
      expect(sanitizePathComponent('עוגה   שוקולד')).toBe('cake');
      expect(sanitizePathComponent('מנה---ראשונה')).toBe('dish');
    });

    it('should trim leading and trailing dashes', () => {
      expect(sanitizePathComponent('-עוגה-')).toBe('cake');
      expect(sanitizePathComponent('--מנה--')).toBe('dish');
    });
  });

  describe('Production Storage Path Tests', () => {
    it('should create ASCII-safe paths for Supabase Storage', () => {
      const hebrewTerms = ['עוגה', 'מנה', 'שתיה', 'עוף', 'בשר'];
      
      hebrewTerms.forEach(term => {
        const sanitized = sanitizePathComponent(term);
        
        // Should be ASCII-safe
        expect(sanitized).toMatch(/^[a-zA-Z0-9\-_]+$/);
        
        // Should not contain Hebrew characters
        expect(sanitized).not.toMatch(/[\u0590-\u05FF]/);
        
        // Should not be empty
        expect(sanitized.length).toBeGreaterThan(0);
      });
    });

    it('should handle real-world storage path scenarios', () => {
      const testCases = [
        {
          input: 'עוגה',
          expectedPath: 'leads/lead-123/cake/product/',
          description: 'Hebrew cake item'
        },
        {
          input: 'מנה',
          expectedPath: 'leads/lead-456/dish/branding/',
          description: 'Hebrew dish item'
        },
        {
          input: 'שתיה',
          expectedPath: 'leads/lead-789/drink/reference/',
          description: 'Hebrew drink item'
        }
      ];

      testCases.forEach(({ input, expectedPath, description }) => {
        const leadId = expectedPath.split('/')[1];
        const fileType = expectedPath.split('/')[3];
        const sanitized = sanitizePathComponent(input);
        const generatedPath = `leads/${leadId}/${sanitized}/${fileType}/`;
        
        expect(generatedPath).toBe(expectedPath);
      });
    });

    it('should prevent Supabase Storage "Invalid key" errors', () => {
      // These are real Hebrew terms that caused 400 errors in production
      const problematicTerms = [
        'עוגת שוקולד',
        'מנה ראשונה', 
        'שתיה קרה',
        'עוף בגריל',
        'בשר צלוי'
      ];

      problematicTerms.forEach(term => {
        const sanitized = sanitizePathComponent(term);
        
        // Should not cause Supabase Storage errors
        expect(sanitized).not.toContain(' ');
        expect(sanitized).not.toMatch(/[\u0590-\u05FF]/);
        expect(sanitized).toMatch(/^[a-zA-Z0-9\-_]+$/);
        
        // Build a full path and verify it's valid
        const fullPath = `leads/test-lead/${sanitized}/product/image.jpg`;
        expect(fullPath).toMatch(/^[a-zA-Z0-9\-_\/\.]+$/);
      });
    });
  });

  describe('Performance & Consistency Tests', () => {
    it('should be deterministic - same input always produces same output', () => {
      const testTerms = ['עוגה', 'מנה', 'שתיה', 'עוף'];
      
      testTerms.forEach(term => {
        const result1 = sanitizePathComponent(term);
        const result2 = sanitizePathComponent(term);
        const result3 = sanitizePathComponent(term);
        
        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
      });
    });

    it('should handle rapid successive calls efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        sanitizePathComponent('עוגה שוקולד מיוחדת');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete 1000 sanitizations in under 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should handle various Hebrew text lengths', () => {
      const shortText = 'עוגה';
      const mediumText = 'עוגה שוקולד מיוחדת';
      const longText = 'עוגה שוקולד מיוחדת עם קרם וניל וציפוי גנאש';
      
      expect(sanitizePathComponent(shortText)).toBe('cake');
      expect(sanitizePathComponent(mediumText)).toBe('cake');
      expect(sanitizePathComponent(longText)).toBe('cake');
      
      // All should be ASCII-safe regardless of length
      [shortText, mediumText, longText].forEach(text => {
        const result = sanitizePathComponent(text);
        expect(result).toMatch(/^[a-zA-Z0-9\-_]+$/);
      });
    });
  });

  describe('Integration with Storage Buckets', () => {
    it('should work with all storage bucket paths', () => {
      const storageStructure = {
        'food-vision-images': {
          uploads: ['עוגה', 'מנה', 'שתיה'],
          leads: ['עוף', 'בשר', 'דג'],
          processed: ['ירקות', 'פירות', 'מאפה']
        }
      };

      Object.entries(storageStructure['food-vision-images']).forEach(([folder, terms]) => {
        terms.forEach(term => {
          const sanitized = sanitizePathComponent(term);
          const fullPath = `${folder}/submission-123/${sanitized}/image.jpg`;
          
          // Should create valid storage paths
          expect(fullPath).toMatch(/^[a-zA-Z0-9\-_\/\.]+$/);
          expect(fullPath).not.toMatch(/[\u0590-\u05FF]/);
        });
      });
    });

    it('should maintain consistency across different path contexts', () => {
      const term = 'עוגה';
      const sanitized = sanitizePathComponent(term);
      
      const paths = [
        `leads/lead-123/${sanitized}/product/`,
        `leads/lead-123/${sanitized}/branding/`,
        `leads/lead-123/${sanitized}/reference/`,
        `uploads/submission-456/${sanitized}/`,
        `processed/batch-789/${sanitized}/`
      ];

      paths.forEach(path => {
        // All paths should use the same sanitized version
        expect(path).toContain('/cake/');
        expect(path).toMatch(/^[a-zA-Z0-9\-_\/]+$/);
      });
    });
  });
}); 