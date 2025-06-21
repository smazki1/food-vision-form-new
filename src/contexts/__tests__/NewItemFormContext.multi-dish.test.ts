import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NewItemFormProvider, useNewItemForm, DishData } from '../NewItemFormContext';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement(NewItemFormProvider, null, children);

describe('NewItemFormContext - Multi-Dish Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with one empty dish', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      expect(result.current.formData.dishes).toHaveLength(1);
      expect(result.current.formData.dishes[0].id).toBe('1');
      expect(result.current.formData.dishes[0].itemName).toBe('');
      expect(result.current.formData.dishes[0].itemType).toBe('');
      expect(result.current.formData.dishes[0].referenceImages).toHaveLength(0);
    });

    it('should have all required initial properties', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      const initialDish = result.current.formData.dishes[0];
      expect(initialDish).toHaveProperty('id');
      expect(initialDish).toHaveProperty('itemName');
      expect(initialDish).toHaveProperty('itemType');
      expect(initialDish).toHaveProperty('description');
      expect(initialDish).toHaveProperty('specialNotes');
      expect(initialDish).toHaveProperty('referenceImages');
      expect(initialDish).toHaveProperty('brandingMaterials');
      expect(initialDish).toHaveProperty('referenceExamples');
      expect(initialDish).toHaveProperty('isCustomItemType');
      expect(initialDish).toHaveProperty('customItemType');
      expect(initialDish).toHaveProperty('qualityConfirmed');
    });
  });

  describe('Adding Dishes', () => {
    it('should add a new dish with incremented ID', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      let newDishId: string;
      act(() => {
        newDishId = result.current.addDish();
      });

      expect(newDishId!).toBe('2');
      expect(result.current.formData.dishes).toHaveLength(2);
      expect(result.current.formData.dishes[1].id).toBe('2');
    });

    it('should add multiple dishes with correct IDs', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.addDish(); // ID: 2
        result.current.addDish(); // ID: 3
        result.current.addDish(); // ID: 4
      });

      expect(result.current.formData.dishes).toHaveLength(4);
      expect(result.current.formData.dishes.map(d => d.id)).toEqual(['1', '2', '3', '4']);
    });

    it('should return the correct new dish ID', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      let firstNewId: string;
      let secondNewId: string;

      act(() => {
        firstNewId = result.current.addDish();
      });

      act(() => {
        secondNewId = result.current.addDish();
      });

      expect(firstNewId!).toBe('2');
      expect(secondNewId!).toBe('3');
    });

    it('should initialize new dish with default values', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.addDish();
      });

      const newDish = result.current.formData.dishes[1];
      expect(newDish.itemName).toBe('');
      expect(newDish.itemType).toBe('');
      expect(newDish.description).toBe('');
      expect(newDish.specialNotes).toBe('');
      expect(newDish.referenceImages).toHaveLength(0);
      expect(newDish.brandingMaterials).toHaveLength(0);
      expect(newDish.referenceExamples).toHaveLength(0);
      expect(newDish.isCustomItemType).toBe(false);
      expect(newDish.customItemType).toBe('');
      expect(newDish.qualityConfirmed).toBe(false);
    });
  });

  describe('Removing Dishes', () => {
    it('should remove a dish by ID', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      // Add some dishes
      act(() => {
        result.current.addDish(); // ID: 2
        result.current.addDish(); // ID: 3
      });

      expect(result.current.formData.dishes).toHaveLength(3);

      // Remove middle dish
      act(() => {
        result.current.removeDish('2');
      });

      expect(result.current.formData.dishes).toHaveLength(2);
      expect(result.current.formData.dishes.map(d => d.id)).toEqual(['1', '3']);
    });

    it('should handle removing non-existent dish gracefully', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      const initialLength = result.current.formData.dishes.length;

      act(() => {
        result.current.removeDish('999');
      });

      expect(result.current.formData.dishes).toHaveLength(initialLength);
    });

    it('should remove the correct dish when multiple dishes exist', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      // Add dishes and update them
      act(() => {
        result.current.addDish(); // ID: 2
        result.current.addDish(); // ID: 3
        
        result.current.updateDish('1', { itemName: 'פסטה' });
        result.current.updateDish('2', { itemName: 'סלט' });
        result.current.updateDish('3', { itemName: 'מרק' });
      });

      // Remove middle dish
      act(() => {
        result.current.removeDish('2');
      });

      expect(result.current.formData.dishes).toHaveLength(2);
      expect(result.current.formData.dishes[0].itemName).toBe('פסטה');
      expect(result.current.formData.dishes[1].itemName).toBe('מרק');
    });
  });

  describe('Updating Dishes', () => {
    it('should update a dish by ID', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      const updateData: Partial<DishData> = {
        itemName: 'פסטה קרבונרה',
        itemType: 'מנה עיקרית',
        description: 'פסטה עם ביצים וגבינה',
      };

      act(() => {
        result.current.updateDish('1', updateData);
      });

      const updatedDish = result.current.formData.dishes[0];
      expect(updatedDish.itemName).toBe('פסטה קרבונרה');
      expect(updatedDish.itemType).toBe('מנה עיקרית');
      expect(updatedDish.description).toBe('פסטה עם ביצים וגבינה');
    });

    it('should update only specified fields', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      // First update
      act(() => {
        result.current.updateDish('1', { itemName: 'פסטה', itemType: 'מנה' });
      });

      // Second update (partial)
      act(() => {
        result.current.updateDish('1', { description: 'תיאור חדש' });
      });

      const dish = result.current.formData.dishes[0];
      expect(dish.itemName).toBe('פסטה'); // Should remain
      expect(dish.itemType).toBe('מנה'); // Should remain
      expect(dish.description).toBe('תיאור חדש'); // Should be updated
    });

    it('should handle updating non-existent dish gracefully', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      const originalDishes = result.current.formData.dishes;

      act(() => {
        result.current.updateDish('999', { itemName: 'לא קיים' });
      });

      expect(result.current.formData.dishes).toEqual(originalDishes);
    });

    it('should update multiple dishes independently', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      // Add another dish
      act(() => {
        result.current.addDish();
      });

      // Update both dishes
      act(() => {
        result.current.updateDish('1', { itemName: 'פסטה', itemType: 'מנה' });
        result.current.updateDish('2', { itemName: 'סלט', itemType: 'סלט' });
      });

      expect(result.current.formData.dishes[0].itemName).toBe('פסטה');
      expect(result.current.formData.dishes[0].itemType).toBe('מנה');
      expect(result.current.formData.dishes[1].itemName).toBe('סלט');
      expect(result.current.formData.dishes[1].itemType).toBe('סלט');
    });

    it('should handle file arrays in updates', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      const mockFiles = [
        new File(['test1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'image2.jpg', { type: 'image/jpeg' }),
      ];

      act(() => {
        result.current.updateDish('1', { referenceImages: mockFiles });
      });

      expect(result.current.formData.dishes[0].referenceImages).toHaveLength(2);
      expect(result.current.formData.dishes[0].referenceImages[0].name).toBe('image1.jpg');
      expect(result.current.formData.dishes[0].referenceImages[1].name).toBe('image2.jpg');
    });
  });

  describe('Getting Dishes', () => {
    it('should get a dish by ID', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.updateDish('1', { itemName: 'פסטה קרבונרה' });
      });

      const dish = result.current.getDish('1');
      expect(dish).toBeDefined();
      expect(dish!.itemName).toBe('פסטה קרבונרה');
      expect(dish!.id).toBe('1');
    });

    it('should return undefined for non-existent dish', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      const dish = result.current.getDish('999');
      expect(dish).toBeUndefined();
    });

    it('should get correct dish after adding multiple', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.addDish(); // ID: 2
        result.current.addDish(); // ID: 3
        
        result.current.updateDish('2', { itemName: 'סלט יווני' });
        result.current.updateDish('3', { itemName: 'מרק עגבניות' });
      });

      const dish2 = result.current.getDish('2');
      const dish3 = result.current.getDish('3');

      expect(dish2!.itemName).toBe('סלט יווני');
      expect(dish3!.itemName).toBe('מרק עגבניות');
    });
  });

  describe('Form Data Integration', () => {
    it('should maintain legacy fields alongside dishes array', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.updateFormData({
          restaurantName: 'מסעדת הבית',
          submitterName: 'יוסי כהן',
          itemName: 'פסטה', // Legacy field
        });
      });

      expect(result.current.formData.restaurantName).toBe('מסעדת הבית');
      expect(result.current.formData.submitterName).toBe('יוסי כהן');
      expect(result.current.formData.itemName).toBe('פסטה');
      expect(result.current.formData.dishes).toHaveLength(1); // Should still have dishes array
    });

    it('should reset form data including dishes', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      // Add data and dishes
      act(() => {
        result.current.addDish();
        result.current.updateFormData({ restaurantName: 'מסעדה' });
        result.current.updateDish('1', { itemName: 'פסטה' });
      });

      // Reset
      act(() => {
        result.current.resetFormData();
      });

      expect(result.current.formData.restaurantName).toBe('');
      expect(result.current.formData.dishes).toHaveLength(1);
      expect(result.current.formData.dishes[0].id).toBe('1');
      expect(result.current.formData.dishes[0].itemName).toBe('');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle adding, updating, and removing dishes in sequence', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      // Add multiple dishes
      act(() => {
        result.current.addDish(); // ID: 2
        result.current.addDish(); // ID: 3
        result.current.addDish(); // ID: 4
      });

      // Update all dishes
      act(() => {
        result.current.updateDish('1', { itemName: 'מנה 1' });
        result.current.updateDish('2', { itemName: 'מנה 2' });
        result.current.updateDish('3', { itemName: 'מנה 3' });
        result.current.updateDish('4', { itemName: 'מנה 4' });
      });

      // Remove middle dishes
      act(() => {
        result.current.removeDish('2');
        result.current.removeDish('3');
      });

      expect(result.current.formData.dishes).toHaveLength(2);
      expect(result.current.formData.dishes[0].itemName).toBe('מנה 1');
      expect(result.current.formData.dishes[1].itemName).toBe('מנה 4');
    });

    it('should handle large number of dishes', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      // Add 10 dishes
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addDish();
        }
      });

      expect(result.current.formData.dishes).toHaveLength(11); // 1 initial + 10 added

      // Update all dishes
      act(() => {
        result.current.formData.dishes.forEach((dish) => {
          result.current.updateDish(dish.id, { itemName: `מנה ${dish.id}` });
        });
      });

      // Verify all updates
      result.current.formData.dishes.forEach((dish) => {
        expect(dish.itemName).toBe(`מנה ${dish.id}`);
      });
    });

    it('should maintain dish data integrity during complex operations', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      // Add dish with complete data
      act(() => {
        result.current.addDish(); // ID: 2
        result.current.updateDish('2', {
          itemName: 'פסטה מלאה',
          itemType: 'מנה עיקרית',
          description: 'תיאור מלא',
          specialNotes: 'הערות מיוחדות',
          referenceImages: [mockFile],
          isCustomItemType: true,
          customItemType: 'סוג מותאם',
          qualityConfirmed: true,
        });
      });

      // Add another dish and remove the first
      act(() => {
        result.current.addDish(); // ID: 3
        result.current.removeDish('1');
      });

      // Verify the complete dish data is preserved
      const preservedDish = result.current.getDish('2');
      expect(preservedDish!.itemName).toBe('פסטה מלאה');
      expect(preservedDish!.itemType).toBe('מנה עיקרית');
      expect(preservedDish!.description).toBe('תיאור מלא');
      expect(preservedDish!.specialNotes).toBe('הערות מיוחדות');
      expect(preservedDish!.referenceImages).toHaveLength(1);
      expect(preservedDish!.isCustomItemType).toBe(true);
      expect(preservedDish!.customItemType).toBe('סוג מותאם');
      expect(preservedDish!.qualityConfirmed).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle context usage outside provider', () => {
      expect(() => {
        renderHook(() => useNewItemForm());
      }).toThrow('useNewItemForm must be used within a NewItemFormProvider');
    });
  });

  describe('Performance', () => {
    it('should not recreate dishes array unnecessarily', () => {
      const { result, rerender } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      const initialDishes = result.current.formData.dishes;

      // Rerender without changes
      rerender();

      // Should be the same reference (React optimization)
      expect(result.current.formData.dishes).toBe(initialDishes);
    });

    it('should handle rapid successive operations', () => {
      const { result } = renderHook(() => useNewItemForm(), {
        wrapper: TestWrapper,
      });

      act(() => {
        // Rapid operations
        for (let i = 0; i < 5; i++) {
          const dishId = result.current.addDish();
          result.current.updateDish(dishId, { itemName: `מנה ${i}` });
        }
      });

      expect(result.current.formData.dishes).toHaveLength(6); // 1 initial + 5 added
      result.current.formData.dishes.slice(1).forEach((dish, index) => {
        expect(dish.itemName).toBe(`מנה ${index}`);
      });
    });
  });
}); 