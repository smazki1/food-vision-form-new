import {
  validateRestaurantDetailsStep,
  validateItemDetailsStep,
  validateImageUploadStep,
  validateReviewStep
} from '../publicFormValidation';
import { NewItemFormData, DishData } from '../../contexts/NewItemFormContext';

describe('Comprehensive Business Registration Validation Tests', () => {
  const createTestFile = (name: string, size: number = 1024): File => 
    new File(['content'], name, { type: 'image/png', lastModified: Date.now() });

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

  describe('validateRestaurantDetailsStep - Happy Path Tests', () => {
    it('should pass for existing business with minimal required fields', () => {
      const formData = createFormData({
        restaurantName: 'Existing Restaurant',
        submitterName: 'Owner Name',
        isNewBusiness: false,
        contactEmail: '', // Should not be required for existing business
        contactPhone: '' // Should not be required for existing business
      });
      
      expect(validateRestaurantDetailsStep(formData)).toEqual({});
    });

    it('should pass for new business with all required fields', () => {
      const formData = createFormData({
        restaurantName: 'New Restaurant',
        submitterName: 'New Owner',
        contactEmail: 'newowner@email.com',
        contactPhone: '052-9876543',
        isNewBusiness: true
      });
      
      expect(validateRestaurantDetailsStep(formData)).toEqual({});
    });

    it('should pass for existing business with optional contact info', () => {
      const formData = createFormData({
        restaurantName: 'Restaurant With Contact',
        submitterName: 'Owner',
        contactEmail: 'optional@email.com',
        contactPhone: '053-1111111',
        isNewBusiness: false
      });
      
      expect(validateRestaurantDetailsStep(formData)).toEqual({});
    });
  });

  describe('validateRestaurantDetailsStep - Edge Cases', () => {
    it('should handle whitespace-only restaurant name', () => {
      const formData = createFormData({
        restaurantName: '   ',
        submitterName: 'Valid Name',
        isNewBusiness: false
      });
      
      const errors = validateRestaurantDetailsStep(formData);
      expect(errors.restaurantName).toBe('חסר שם מסעדה');
    });

    it('should handle whitespace-only submitter name', () => {
      const formData = createFormData({
        restaurantName: 'Valid Restaurant',
        submitterName: '\t\n  ',
        isNewBusiness: false
      });
      
      const errors = validateRestaurantDetailsStep(formData);
      expect(errors.submitterName).toBe('חסר שם איש קשר');
    });

    it('should handle whitespace-only email for new business', () => {
      const formData = createFormData({
        restaurantName: 'New Restaurant',
        submitterName: 'Owner',
        contactEmail: '  \t  ',
        contactPhone: '050-1234567',
        isNewBusiness: true
      });
      
      const errors = validateRestaurantDetailsStep(formData);
      expect(errors.contactEmail).toBe('חסר מייל');
    });

    it('should handle whitespace-only phone for new business', () => {
      const formData = createFormData({
        restaurantName: 'New Restaurant',
        submitterName: 'Owner',
        contactEmail: 'owner@email.com',
        contactPhone: '   ',
        isNewBusiness: true
      });
      
      const errors = validateRestaurantDetailsStep(formData);
      expect(errors.contactPhone).toBe('חסר טלפון');
    });

    it('should handle null/undefined values gracefully', () => {
      const formData = createFormData({
        restaurantName: undefined as any,
        submitterName: null as any,
        contactEmail: null,
        contactPhone: undefined,
        isNewBusiness: true
      });
      
      const errors = validateRestaurantDetailsStep(formData);
      expect(errors.restaurantName).toBe('חסר שם מסעדה');
      expect(errors.submitterName).toBe('חסר שם איש קשר');
      expect(errors.contactEmail).toBe('חסר מייל');
      expect(errors.contactPhone).toBe('חסר טלפון');
    });
  });

  describe('validateRestaurantDetailsStep - Error Handling', () => {
    it('should require business registration selection', () => {
      const formData = createFormData({
        restaurantName: 'Valid Restaurant',
        submitterName: 'Valid Name',
        isNewBusiness: undefined
      });
      
      const errors = validateRestaurantDetailsStep(formData);
      expect(errors.isNewBusiness).toBe('חובה לבחור האם העסק רשום במערכת');
    });

    it('should return multiple errors for multiple missing fields', () => {
      const formData = createFormData({
        restaurantName: '',
        submitterName: '',
        contactEmail: '',
        contactPhone: '',
        isNewBusiness: undefined
      });
      
      const errors = validateRestaurantDetailsStep(formData);
      expect(Object.keys(errors)).toHaveLength(3); // isNewBusiness, restaurantName, submitterName
      expect(errors.isNewBusiness).toBe('חובה לבחור האם העסק רשום במערכת');
      expect(errors.restaurantName).toBe('חסר שם מסעדה');
      expect(errors.submitterName).toBe('חסר שם איש קשר');
    });

    it('should return contact errors only for new business', () => {
      const formData = createFormData({
        restaurantName: 'Valid Restaurant',
        submitterName: 'Valid Name',
        contactEmail: '',
        contactPhone: '',
        isNewBusiness: true
      });
      
      const errors = validateRestaurantDetailsStep(formData);
      expect(errors.contactEmail).toBe('חסר מייל');
      expect(errors.contactPhone).toBe('חסר טלפון');
    });

    it('should not return contact errors for existing business', () => {
      const formData = createFormData({
        restaurantName: 'Valid Restaurant',
        submitterName: 'Valid Name',
        contactEmail: '',
        contactPhone: '',
        isNewBusiness: false
      });
      
      const errors = validateRestaurantDetailsStep(formData);
      expect(errors.contactEmail).toBeUndefined();
      expect(errors.contactPhone).toBeUndefined();
    });
  });

  describe('validateImageUploadStep - Integration with Business Registration', () => {
    it('should validate images regardless of business registration status', () => {
      const dishWithFewImages = createDish({
        itemName: 'Valid Dish',
        referenceImages: [createTestFile('img1.png'), createTestFile('img2.png')],
        qualityConfirmed: false
      });
      
      const formDataExisting = createFormData({
        dishes: [dishWithFewImages],
        isNewBusiness: false
      });
      
      const formDataNew = createFormData({
        dishes: [dishWithFewImages],
        isNewBusiness: true
      });
      
      const errorsExisting = validateImageUploadStep(formDataExisting);
      const errorsNew = validateImageUploadStep(formDataNew);
      
      // Both should have same image validation errors
      expect(errorsExisting['dish_1_referenceImages']).toBe('חסרות תמונות במנה 1');
      expect(errorsNew['dish_1_referenceImages']).toBe('חסרות תמונות במנה 1');
    });

    it('should require quality confirmation for both business types', () => {
      const dishWithoutQuality = createDish({
        itemName: 'Valid Dish',
        referenceImages: Array(4).fill(null).map((_, i) => createTestFile(`img${i}.png`)),
        qualityConfirmed: false
      });
      
      const formDataExisting = createFormData({
        dishes: [dishWithoutQuality],
        isNewBusiness: false
      });
      
      const formDataNew = createFormData({
        dishes: [dishWithoutQuality],
        isNewBusiness: true
      });
      
      const errorsExisting = validateImageUploadStep(formDataExisting);
      const errorsNew = validateImageUploadStep(formDataNew);
      
      expect(errorsExisting['dish_1_qualityConfirmed']).toBe('חסר אישור איכות במנה 1');
      expect(errorsNew['dish_1_qualityConfirmed']).toBe('חסר אישור איכות במנה 1');
    });
  });

  describe('Cross-Step Validation Integration', () => {
    it('should validate complete form flow for new business', () => {
      const validDish = createDish({
        itemName: 'Complete Dish',
        itemType: 'dish',
        description: 'Valid description',
        referenceImages: Array(4).fill(null).map((_, i) => createTestFile(`img${i}.png`)),
        qualityConfirmed: true
      });
      
      const completeFormData = createFormData({
        restaurantName: 'New Restaurant',
        submitterName: 'Owner Name',
        contactEmail: 'owner@newrestaurant.com',
        contactPhone: '050-1234567',
        dishes: [validDish],
        isNewBusiness: true
      });
      
      // All validation steps should pass
      expect(validateRestaurantDetailsStep(completeFormData)).toEqual({});
      expect(validateItemDetailsStep(completeFormData)).toEqual({});
      expect(validateImageUploadStep(completeFormData)).toEqual({});
    });

    it('should validate complete form flow for existing business', () => {
      const validDish = createDish({
        itemName: 'Complete Dish',
        itemType: 'dish',
        description: 'Valid description',
        referenceImages: Array(4).fill(null).map((_, i) => createTestFile(`img${i}.png`)),
        qualityConfirmed: true
      });
      
      const completeFormData = createFormData({
        restaurantName: 'Existing Restaurant',
        submitterName: 'Manager Name',
        // No email/phone required for existing business
        dishes: [validDish],
        isNewBusiness: false
      });
      
      // All validation steps should pass
      expect(validateRestaurantDetailsStep(completeFormData)).toEqual({});
      expect(validateItemDetailsStep(completeFormData)).toEqual({});
      expect(validateImageUploadStep(completeFormData)).toEqual({});
    });
  });

  describe('Performance and Robustness Tests', () => {
    it('should handle large number of dishes efficiently', () => {
      const manyDishes = Array(50).fill(null).map((_, i) => createDish({
        id: (i + 1).toString(),
        itemName: `Dish ${i + 1}`,
        itemType: 'dish',
        description: `Description ${i + 1}`,
        referenceImages: Array(4).fill(null).map((_, j) => createTestFile(`dish${i}_img${j}.png`)),
        qualityConfirmed: true
      }));
      
      const formData = createFormData({
        dishes: manyDishes,
        isNewBusiness: false
      });
      
      const startTime = performance.now();
      const errors = validateImageUploadStep(formData);
      const endTime = performance.now();
      
      // Should complete quickly (under 100ms for 50 dishes)
      expect(endTime - startTime).toBeLessThan(100);
      expect(errors).toEqual({});
    });

    it('should handle form data with missing dishes array', () => {
      const formData = createFormData({
        dishes: [],
        isNewBusiness: false
      });
      
      // Should not throw, should handle gracefully
      expect(() => validateItemDetailsStep(formData)).not.toThrow();
      expect(() => validateImageUploadStep(formData)).not.toThrow();
    });
  });
}); 