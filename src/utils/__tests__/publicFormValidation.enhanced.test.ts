import {
  validateRestaurantDetailsStep,
  validateItemDetailsStep,
  validateImageUploadStep,
  validateReviewStep
} from '../publicFormValidation';
import { NewItemFormData, DishData } from '../../contexts/NewItemFormContext';

describe('Enhanced Public Form Validation', () => {
  const createTestFile = (name: string): File => 
    new File(['content'], name, { type: 'image/png' });

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

  const createFormData = (overrides: Partial<NewItemFormData> = {}): NewItemFormData => ({
    restaurantName: 'Test Restaurant',
    submitterName: 'Test User',
    contactEmail: 'test@example.com',
    contactPhone: '050-1234567',
    itemName: 'Test Item',
    itemType: 'dish',
    description: 'Test Description',
    specialNotes: '',
    referenceImages: [],
    brandingMaterials: [],
    referenceExamples: [],
    dishes: [createDish()],
    itemsQuantityRange: '',
    estimatedImagesNeeded: '',
    primaryImageUsage: '',
    isNewBusiness: false,
    isLead: false,
    ...overrides
  });

  describe('validateRestaurantDetailsStep', () => {
    it('should pass for existing business with basic info', () => {
      const formData = createFormData({
        restaurantName: 'Great Restaurant',
        submitterName: 'John Doe',
        isNewBusiness: false
      });
      
      expect(validateRestaurantDetailsStep(formData)).toEqual({});
    });

    it('should pass for new business with complete info', () => {
      const formData = createFormData({
        restaurantName: 'New Restaurant',
        submitterName: 'Jane Smith',
        contactEmail: 'jane@newrest.com',
        contactPhone: '050-9876543',
        isNewBusiness: true
      });
      
      expect(validateRestaurantDetailsStep(formData)).toEqual({});
    });

    it('should require business registration selection', () => {
      const formData = createFormData({
        restaurantName: 'Restaurant',
        submitterName: 'John',
        isNewBusiness: undefined
      });
      
      const errors = validateRestaurantDetailsStep(formData);
      expect(errors.isNewBusiness).toBe('חובה לבחור האם העסק רשום במערכת');
    });

    it('should require email for new business', () => {
      const formData = createFormData({
        restaurantName: 'Restaurant',
        submitterName: 'John',
        contactEmail: '',
        isNewBusiness: true
      });
      
      const errors = validateRestaurantDetailsStep(formData);
      expect(errors.contactEmail).toBe('חסר מייל');
    });

    it('should require phone for new business', () => {
      const formData = createFormData({
        restaurantName: 'Restaurant',
        submitterName: 'John',
        contactPhone: '',
        isNewBusiness: true
      });
      
      const errors = validateRestaurantDetailsStep(formData);
      expect(errors.contactPhone).toBe('חסר טלפון');
    });
  });

  describe('validateItemDetailsStep', () => {
    it('should pass for valid dish', () => {
      const dish = createDish({
        itemName: 'Pasta',
        itemType: 'dish',
        description: 'Delicious pasta'
      });
      const formData = createFormData({ dishes: [dish] });
      
      expect(validateItemDetailsStep(formData)).toEqual({});
    });

    it('should return errors for missing dish fields', () => {
      const dish = createDish({
        itemName: '',
        itemType: '',
        description: 'Has description'
      });
      const formData = createFormData({ dishes: [dish] });
      
      const errors = validateItemDetailsStep(formData);
      expect(errors['dish_1_itemName']).toBe('חסר שם מנה 1');
      expect(errors['dish_1_itemType']).toBe('חסר סוג מוצר במנה 1');
    });
  });

  describe('validateImageUploadStep', () => {
    it('should pass for 4+ images with quality confirmed', () => {
      const dish = createDish({
        itemName: 'Valid dish',
        referenceImages: Array(4).fill(null).map((_, i) => createTestFile(`img${i}.png`)),
        qualityConfirmed: true
      });
      const formData = createFormData({ dishes: [dish] });
      
      expect(validateImageUploadStep(formData)).toEqual({});
    });

    it('should require 4+ images', () => {
      const dish = createDish({
        itemName: 'Valid dish',
        referenceImages: Array(3).fill(null).map((_, i) => createTestFile(`img${i}.png`))
      });
      const formData = createFormData({ dishes: [dish] });
      
      const errors = validateImageUploadStep(formData);
      expect(errors['dish_1_referenceImages']).toBe('חסרות תמונות במנה 1');
    });

    it('should require quality confirmation', () => {
      const dish = createDish({
        itemName: 'Valid dish',
        referenceImages: Array(4).fill(null).map((_, i) => createTestFile(`img${i}.png`)),
        qualityConfirmed: false
      });
      const formData = createFormData({ dishes: [dish] });
      
      const errors = validateImageUploadStep(formData);
      expect(errors['dish_1_qualityConfirmed']).toBe('חסר אישור איכות במנה 1');
    });
  });
}); 