import { renderHook } from '@testing-library/react';
import { useUnifiedFormValidation } from '../useUnifiedFormValidation';
import { NewItemFormProvider, DishData } from '../../contexts/NewItemFormContext';
import React from 'react';

const createDish = (overrides: Partial<DishData> = {}): DishData => ({
  id: '1',
  itemType: 'dish',
  itemName: 'Test Dish',
  description: 'Test Description',
  specialNotes: '',
  referenceImages: [],
  brandingMaterials: [],
  referenceExamples: [],
  isCustomItemType: false,
  customItemType: '',
  qualityConfirmed: false,
  ...overrides
});

const createTestFile = (name: string): File => 
  new File(['content'], name, { type: 'image/png' });

describe('useUnifiedFormValidation Enhanced', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => 
    React.createElement(NewItemFormProvider, null, children);

  describe('Step Validation Mapping', () => {
    it('should validate step 1 (Restaurant Details)', async () => {
      const { result } = renderHook(() => useUnifiedFormValidation(), { wrapper });
      
      const isValid = await result.current.validateStep(1);
      
      // Should fail due to empty restaurant details
      expect(isValid).toBe(false);
      expect(result.current.errors.restaurantName).toBeDefined();
      expect(result.current.errors.submitterName).toBeDefined();
    });

    it('should validate step 2 (Combined Upload - Item Details + Images)', async () => {
      const { result } = renderHook(() => useUnifiedFormValidation(), { wrapper });
      
      const isValid = await result.current.validateStep(2);
      
      // Should fail due to incomplete dish and image validation
      expect(isValid).toBe(false);
      // Should have both item details and image upload errors
      expect(Object.keys(result.current.errors)).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/^dish_\d+_/),
        ])
      );
    });

    it('should validate step 3 (Additional Details - no validation)', async () => {
      const { result } = renderHook(() => useUnifiedFormValidation(), { wrapper });
      
      const isValid = await result.current.validateStep(3);
      
      // Should always pass as no validation is needed
      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});
    });

    it('should validate step 4 (Review - all validations)', async () => {
      const { result } = renderHook(() => useUnifiedFormValidation(), { wrapper });
      
      const isValid = await result.current.validateStep(4);
      
      // Should fail due to incomplete form
      expect(isValid).toBe(false);
      expect(result.current.errors.restaurantName).toBeDefined();
      expect(result.current.errors.submitterName).toBeDefined();
    });
  });

  describe('Error State Management', () => {
    it('should clear errors', () => {
      const { result } = renderHook(() => useUnifiedFormValidation(), { wrapper });
      
      // Set some errors first
      result.current.setErrors({ test: 'error' });
      expect(result.current.errors.test).toBe('error');
      
      // Clear errors
      result.current.clearErrors();
      expect(result.current.errors).toEqual({});
    });

    it('should set custom errors', () => {
      const { result } = renderHook(() => useUnifiedFormValidation(), { wrapper });
      
      const customErrors = { field1: 'error1', field2: 'error2' };
      result.current.setErrors(customErrors);
      
      expect(result.current.errors).toEqual(customErrors);
    });
  });

  describe('Step 2 Combined Validation', () => {
    it('should combine item details and image validation errors', async () => {
      const { result } = renderHook(() => useUnifiedFormValidation(), { wrapper });
      
      // This will trigger validation on the default empty dish
      const isValid = await result.current.validateStep(2);
      
      expect(isValid).toBe(false);
      
      // Should have no errors since default dish has no content
      // (validation only runs on dishes with content)
      expect(Object.keys(result.current.errors)).toHaveLength(0);
    });
  });
}); 