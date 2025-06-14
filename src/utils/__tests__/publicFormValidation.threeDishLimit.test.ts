import { describe, it, expect } from 'vitest';
import { validateItemDetailsStep } from '../publicFormValidation';
import { NewItemFormData } from '@/contexts/NewItemFormContext';

describe('Three Dish Limit for New Leads', () => {
  const createDish = (id: string, name: string) => ({
    id,
    itemType: 'מנה עיקרית',
    itemName: name,
    description: 'תיאור מנה',
    specialNotes: '',
    referenceImages: [],
    brandingMaterials: [],
    referenceExamples: [],
    isCustomItemType: false,
    customItemType: '',
    qualityConfirmed: false
  });

  const baseFormData: Partial<NewItemFormData> = {
    restaurantName: 'Test Restaurant',
    submitterName: 'Test Contact'
  };

  describe('New Leads (isLead: true)', () => {
    it('should allow 1 dish for new leads', () => {
      const formData = {
        ...baseFormData,
        isLead: true,
        dishes: [createDish('1', 'מנה 1')]
      } as NewItemFormData;

      const errors = validateItemDetailsStep(formData);
      
      expect(errors.dishCount).toBeUndefined();
    });

    it('should allow 2 dishes for new leads', () => {
      const formData = {
        ...baseFormData,
        isLead: true,
        dishes: [
          createDish('1', 'מנה 1'),
          createDish('2', 'מנה 2')
        ]
      } as NewItemFormData;

      const errors = validateItemDetailsStep(formData);
      
      expect(errors.dishCount).toBeUndefined();
    });

    it('should allow exactly 3 dishes for new leads', () => {
      const formData = {
        ...baseFormData,
        isLead: true,
        dishes: [
          createDish('1', 'מנה 1'),
          createDish('2', 'מנה 2'),
          createDish('3', 'מנה 3')
        ]
      } as NewItemFormData;

      const errors = validateItemDetailsStep(formData);
      
      expect(errors.dishCount).toBeUndefined();
    });

    it('should reject 4 dishes for new leads', () => {
      const formData = {
        ...baseFormData,
        isLead: true,
        dishes: [
          createDish('1', 'מנה 1'),
          createDish('2', 'מנה 2'),
          createDish('3', 'מנה 3'),
          createDish('4', 'מנה 4')
        ]
      } as NewItemFormData;

      const errors = validateItemDetailsStep(formData);
      
      expect(errors.dishCount).toBe('ליד חדש יכול להעלות עד 3 מנות בלבד');
    });

    it('should reject 5+ dishes for new leads', () => {
      const formData = {
        ...baseFormData,
        isLead: true,
        dishes: [
          createDish('1', 'מנה 1'),
          createDish('2', 'מנה 2'),
          createDish('3', 'מנה 3'),
          createDish('4', 'מנה 4'),
          createDish('5', 'מנה 5')
        ]
      } as NewItemFormData;

      const errors = validateItemDetailsStep(formData);
      
      expect(errors.dishCount).toBe('ליד חדש יכול להעלות עד 3 מנות בלבד');
    });
  });

  describe('Existing Businesses (isLead: false or undefined)', () => {
    it('should allow unlimited dishes for existing businesses', () => {
      const formData = {
        ...baseFormData,
        isLead: false,
        dishes: [
          createDish('1', 'מנה 1'),
          createDish('2', 'מנה 2'),
          createDish('3', 'מנה 3'),
          createDish('4', 'מנה 4'),
          createDish('5', 'מנה 5')
        ]
      } as NewItemFormData;

      const errors = validateItemDetailsStep(formData);
      
      expect(errors.dishCount).toBeUndefined();
    });

    it('should allow unlimited dishes when isLead is undefined', () => {
      const formData = {
        ...baseFormData,
        dishes: [
          createDish('1', 'מנה 1'),
          createDish('2', 'מנה 2'),
          createDish('3', 'מנה 3'),
          createDish('4', 'מנה 4'),
          createDish('5', 'מנה 5'),
          createDish('6', 'מנה 6')
        ]
      } as NewItemFormData;

      const errors = validateItemDetailsStep(formData);
      
      expect(errors.dishCount).toBeUndefined();
    });
  });

  describe('Integration with Other Validations', () => {
    it('should validate dish count alongside other field validations', () => {
      const formData = {
        ...baseFormData,
        isLead: true,
        dishes: [
          createDish('1', ''), // Missing name
          createDish('2', 'מנה 2'),
          createDish('3', 'מנה 3'),
          createDish('4', 'מנה 4') // Too many dishes
        ]
      } as NewItemFormData;

      const errors = validateItemDetailsStep(formData);
      
      expect(errors.dishCount).toBe('ליד חדש יכול להעלות עד 3 מנות בלבד');
      expect(errors['dish_1_itemName']).toBe('חסר שם מנה 1');
    });

    it('should not validate dish count for empty dishes array', () => {
      const formData = {
        ...baseFormData,
        isLead: true,
        dishes: []
      } as NewItemFormData;

      const errors = validateItemDetailsStep(formData);
      
      expect(errors.dishCount).toBeUndefined();
    });
  });

  describe('Business Type Integration', () => {
    it('should properly handle new business that becomes lead', () => {
      const formData = {
        ...baseFormData,
        isNewBusiness: true,
        isLead: true, // Set correctly by RestaurantDetailsStep
        dishes: [
          createDish('1', 'מנה 1'),
          createDish('2', 'מנה 2'),
          createDish('3', 'מנה 3'),
          createDish('4', 'מנה 4') // Should be rejected
        ]
      } as NewItemFormData;

      const errors = validateItemDetailsStep(formData);
      
      expect(errors.dishCount).toBe('ליד חדש יכול להעלות עד 3 מנות בלבד');
    });

    it('should properly handle existing business that is not lead', () => {
      const formData = {
        ...baseFormData,
        isNewBusiness: false,
        isLead: false, // Set correctly by RestaurantDetailsStep
        dishes: [
          createDish('1', 'מנה 1'),
          createDish('2', 'מנה 2'),
          createDish('3', 'מנה 3'),
          createDish('4', 'מנה 4'),
          createDish('5', 'מנה 5') // Should be allowed
        ]
      } as NewItemFormData;

      const errors = validateItemDetailsStep(formData);
      
      expect(errors.dishCount).toBeUndefined();
    });
  });
}); 