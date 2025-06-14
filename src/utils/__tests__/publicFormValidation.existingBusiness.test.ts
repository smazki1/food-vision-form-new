import { describe, it, expect } from 'vitest';
import { validateRestaurantDetailsStep } from '../publicFormValidation';
import { NewItemFormData } from '@/contexts/NewItemFormContext';

describe('Existing Business Validation', () => {
  const baseFormData: Partial<NewItemFormData> = {
    restaurantName: 'Test Restaurant',
    submitterName: 'Test Contact'
  };

  describe('Business Registration Selection', () => {
    it('should require business registration selection', () => {
      const formData = { ...baseFormData } as NewItemFormData;
      const errors = validateRestaurantDetailsStep(formData);
      
      expect(errors.isNewBusiness).toBe('חובה לבחור האם העסק רשום במערכת');
    });

    it('should not require business registration if already selected', () => {
      const formData = { ...baseFormData, isNewBusiness: false } as NewItemFormData;
      const errors = validateRestaurantDetailsStep(formData);
      
      expect(errors.isNewBusiness).toBeUndefined();
    });
  });

  describe('Email and Phone for New Businesses', () => {
    it('should require email and phone for new businesses', () => {
      const formData = { 
        ...baseFormData, 
        isNewBusiness: true 
      } as NewItemFormData;
      
      const errors = validateRestaurantDetailsStep(formData);
      
      expect(errors.contactEmail).toBe('חסר מייל');
      expect(errors.contactPhone).toBe('חסר טלפון');
    });

    it('should not require email and phone for existing businesses', () => {
      const formData = { 
        ...baseFormData, 
        isNewBusiness: false 
      } as NewItemFormData;
      
      const errors = validateRestaurantDetailsStep(formData);
      
      expect(errors.contactEmail).toBeUndefined();
      expect(errors.contactPhone).toBeUndefined();
    });

    it('should validate properly when email and phone are provided for new businesses', () => {
      const formData = { 
        ...baseFormData, 
        isNewBusiness: true,
        contactEmail: 'test@example.com',
        contactPhone: '050-1234567'
      } as NewItemFormData;
      
      const errors = validateRestaurantDetailsStep(formData);
      
      expect(errors.contactEmail).toBeUndefined();
      expect(errors.contactPhone).toBeUndefined();
    });
  });

  describe('Core Validation Preservation', () => {
    it('should still require restaurant name for all business types', () => {
      const formData = { 
        submitterName: 'Test Contact',
        isNewBusiness: false 
      } as NewItemFormData;
      
      const errors = validateRestaurantDetailsStep(formData);
      
      expect(errors.restaurantName).toBe('חסר שם מסעדה');
    });

    it('should still require submitter name for all business types', () => {
      const formData = { 
        restaurantName: 'Test Restaurant',
        isNewBusiness: false 
      } as NewItemFormData;
      
      const errors = validateRestaurantDetailsStep(formData);
      
      expect(errors.submitterName).toBe('חסר שם איש קשר');
    });

    it('should validate completely for new businesses with all fields', () => {
      const formData = { 
        restaurantName: 'Test Restaurant',
        submitterName: 'Test Contact',
        isNewBusiness: true,
        contactEmail: 'test@example.com',
        contactPhone: '050-1234567'
      } as NewItemFormData;
      
      const errors = validateRestaurantDetailsStep(formData);
      
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('should validate completely for existing businesses with core fields only', () => {
      const formData = { 
        restaurantName: 'Test Restaurant',
        submitterName: 'Test Contact',
        isNewBusiness: false
      } as NewItemFormData;
      
      const errors = validateRestaurantDetailsStep(formData);
      
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });
}); 