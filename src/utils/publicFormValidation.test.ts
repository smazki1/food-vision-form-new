import {
  validateRestaurantDetailsStep,
  validateItemDetailsStep,
  validateImageUploadStep,
  validateReviewStep
} from './publicFormValidation';
import { NewItemFormData } from '../contexts/NewItemFormContext';

describe('publicFormValidation', () => {
  const createFormData = (overrides: Partial<NewItemFormData> = {}): NewItemFormData => ({
    restaurantName: '',
    submitterName: '',
    itemName: '',
    itemType: 'dish',
    description: '',
    specialNotes: '',
    referenceImages: [],
    ...overrides,
  });

  describe('validateRestaurantDetailsStep', () => {
    it('should return no errors for valid data', () => {
      const formData = createFormData({ restaurantName: 'Test Resto', submitterName: 'Test Submitter' });
      expect(validateRestaurantDetailsStep(formData)).toEqual({});
    });

    it('should return error for missing restaurantName', () => {
      const formData = createFormData({ submitterName: 'Test Submitter' });
      expect(validateRestaurantDetailsStep(formData)).toHaveProperty('restaurantName');
    });

    it('should return error for empty restaurantName (after trim)', () => {
      const formData = createFormData({ restaurantName: '   ', submitterName: 'Test Submitter' });
      expect(validateRestaurantDetailsStep(formData)).toHaveProperty('restaurantName');
    });

    it('should return error for missing submitterName', () => {
      const formData = createFormData({ restaurantName: 'Test Resto' });
      expect(validateRestaurantDetailsStep(formData)).toHaveProperty('submitterName');
    });

    it('should return error for empty submitterName (after trim)', () => {
      const formData = createFormData({ restaurantName: 'Test Resto', submitterName: '   ' });
      expect(validateRestaurantDetailsStep(formData)).toHaveProperty('submitterName');
    });
  });

  describe('validateItemDetailsStep', () => {
    it('should return no errors for valid data', () => {
      const formData = createFormData({
        itemName: 'Test Item',
        itemType: 'drink',
        description: 'Test Description',
      });
      expect(validateItemDetailsStep(formData)).toEqual({});
    });

    it('should return error for missing itemName', () => {
      const formData = createFormData({ itemType: 'cocktail', description: 'Desc' });
      expect(validateItemDetailsStep(formData)).toHaveProperty('itemName');
    });
    
    it('should return error for missing itemType', () => {
        const formData = createFormData({ itemName: 'Item', description: 'Desc', itemType: undefined as any }); // Force undefined
        expect(validateItemDetailsStep(formData)).toHaveProperty('itemType');
    });

    it('should return error for missing description', () => {
      const formData = createFormData({ itemName: 'Item', itemType: 'dish' });
      expect(validateItemDetailsStep(formData)).toHaveProperty('description');
    });
  });

  describe('validateImageUploadStep', () => {
    const testFile = (name: string) => new File(['content'], name, { type: 'image/png' });

    it('should return no errors for valid number of images (1)', () => {
      const formData = createFormData({ referenceImages: [testFile('img1.png')] });
      expect(validateImageUploadStep(formData)).toEqual({});
    });

    it('should return no errors for valid number of images (5)', () => {
        const images = Array(5).fill(null).map((_, i) => testFile(`img${i}.png`));
        const formData = createFormData({ referenceImages: images });
        expect(validateImageUploadStep(formData)).toEqual({});
    });

    it('should return no errors for max number of images (10)', () => {
        const images = Array(10).fill(null).map((_, i) => testFile(`img${i}.png`));
        const formData = createFormData({ referenceImages: images });
        expect(validateImageUploadStep(formData)).toEqual({});
    });

    it('should return error for no images', () => {
      const formData = createFormData({ referenceImages: [] });
      expect(validateImageUploadStep(formData)).toHaveProperty('referenceImages');
    });

    it('should return error for more than 10 images', () => {
      const images = Array(11).fill(null).map((_, i) => testFile(`img${i}.png`));
      const formData = createFormData({ referenceImages: images });
      expect(validateImageUploadStep(formData)).toHaveProperty('referenceImages');
    });
  });

  describe('validateReviewStep', () => {
    it('should return no errors if all previous steps are valid', () => {
      const formData = createFormData({
        restaurantName: 'R',
        submitterName: 'S',
        itemName: 'I',
        itemType: 'dish',
        description: 'D',
        referenceImages: [new File(['c'], 'f.png', { type: 'image/png' })],
      });
      expect(validateReviewStep(formData)).toEqual({});
    });

    it('should aggregate errors from all steps', () => {
      const formData = createFormData({ 
        restaurantName: undefined,
        submitterName: undefined,
        itemName: undefined,
        itemType: undefined as any, // Ensure itemType error is triggered
        description: undefined,
        // referenceImages: [] // default is [], which will trigger error
      }); 
      const errors = validateReviewStep(formData);
      expect(errors).toHaveProperty('restaurantName');
      expect(errors).toHaveProperty('submitterName');
      expect(errors).toHaveProperty('itemName');
      expect(errors).toHaveProperty('itemType');
      expect(errors).toHaveProperty('description');
      expect(errors).toHaveProperty('referenceImages');
    });

    it('should return errors only from relevant steps', () => {
      const formData = createFormData({
        restaurantName: 'R', // Valid step 1
        submitterName: 'S', // Valid step 1
        itemName: '', // Invalid step 2 -> itemName error
        // itemType is 'dish' by default and is valid
        description: '', // Invalid step 2 -> description error
        referenceImages: [], // Invalid step 3 -> referenceImages error
      });
      const errors = validateReviewStep(formData);
      expect(errors).not.toHaveProperty('restaurantName');
      expect(errors).not.toHaveProperty('submitterName');
      expect(errors).toHaveProperty('itemName');
      expect(errors).not.toHaveProperty('itemType'); // itemType is 'dish' from default, so no error here
      expect(errors).toHaveProperty('description');
      expect(errors).toHaveProperty('referenceImages');
    });
  });
}); 