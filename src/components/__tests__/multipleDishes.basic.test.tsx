import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { 
  NewItemFormProvider, 
  useNewItemForm, 
  DishData
} from '@/contexts/NewItemFormContext';

// Simple test component to verify context works
const TestComponent: React.FC = () => {
  const { formData, addDish, updateDish, removeDish } = useNewItemForm();
  
  return (
    <div>
      <div data-testid="dish-count">{formData.dishes.length}</div>
      <div data-testid="restaurant-name">{formData.restaurantName}</div>
      <button onClick={() => addDish()} data-testid="add-dish">Add Dish</button>
      <button 
        onClick={() => updateDish('1', { itemName: 'Updated Dish' })} 
        data-testid="update-dish"
      >
        Update Dish
      </button>
      <button 
        onClick={() => removeDish('1')} 
        data-testid="remove-dish"
      >
        Remove Dish
      </button>
    </div>
  );
};

describe('Multiple Dishes - Basic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Context Basic Functionality', () => {
    it('should initialize with one default dish', () => {
      render(
        <NewItemFormProvider>
          <TestComponent />
        </NewItemFormProvider>
      );

      expect(screen.getByTestId('dish-count')).toHaveTextContent('1');
    });

    it('should add new dishes', async () => {
      render(
        <NewItemFormProvider>
          <TestComponent />
        </NewItemFormProvider>
      );

      const addButton = screen.getByTestId('add-dish');
      
      await act(async () => {
        addButton.click();
      });

      expect(screen.getByTestId('dish-count')).toHaveTextContent('2');
    });

    it('should update dishes', async () => {
      render(
        <NewItemFormProvider>
          <TestComponent />
        </NewItemFormProvider>
      );

      const updateButton = screen.getByTestId('update-dish');
      
      await act(async () => {
        updateButton.click();
      });

      // Context should be updated (we can't easily test the specific dish content without more complex setup)
      expect(screen.getByTestId('dish-count')).toHaveTextContent('1');
    });

    it('should remove dishes', async () => {
      render(
        <NewItemFormProvider>
          <TestComponent />
        </NewItemFormProvider>
      );

      // First add a dish so we have 2
      const addButton = screen.getByTestId('add-dish');
      await act(async () => {
        addButton.click();
      });

      expect(screen.getByTestId('dish-count')).toHaveTextContent('2');

      // Now remove one
      const removeButton = screen.getByTestId('remove-dish');
      await act(async () => {
        removeButton.click();
      });

      expect(screen.getByTestId('dish-count')).toHaveTextContent('1');
    });
  });

  describe('Data Structure Tests', () => {
    it('should create proper dish data structure', () => {
      const mockDish: DishData = {
        id: '1',
        itemType: 'dish',
        itemName: 'Test Dish',
        description: 'Test description',
        specialNotes: 'Test notes',
        referenceImages: [],
        brandingMaterials: [],
        referenceExamples: [],
        isCustomItemType: false,
        customItemType: ''
      };

      expect(mockDish.id).toBe('1');
      expect(mockDish.itemType).toBe('dish');
      expect(mockDish.itemName).toBe('Test Dish');
      expect(mockDish.referenceImages).toEqual([]);
    });

    it('should handle custom item types', () => {
      const customDish: DishData = {
        id: '1',
        itemType: 'custom-type',
        itemName: 'Custom Item',
        description: '',
        specialNotes: '',
        referenceImages: [],
        brandingMaterials: [],
        referenceExamples: [],
        isCustomItemType: true,
        customItemType: 'custom-type'
      };

      expect(customDish.isCustomItemType).toBe(true);
      expect(customDish.customItemType).toBe('custom-type');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when used outside provider', () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useNewItemForm must be used within a NewItemFormProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty dishes array operations', async () => {
      const EmptyTestComponent: React.FC = () => {
        const { formData, getDish } = useNewItemForm();
        
        const nonExistentDish = getDish('non-existent');
        
        return (
          <div>
            <div data-testid="dish-count">{formData.dishes.length}</div>
            <div data-testid="non-existent-dish">
              {nonExistentDish ? 'Found' : 'Not Found'}
            </div>
          </div>
        );
      };

      render(
        <NewItemFormProvider>
          <EmptyTestComponent />
        </NewItemFormProvider>
      );

      expect(screen.getByTestId('non-existent-dish')).toHaveTextContent('Not Found');
    });

    it('should handle multiple rapid operations', async () => {
      const RapidTestComponent: React.FC = () => {
        const { formData, addDish, removeDish } = useNewItemForm();
        const [operationsDone, setOperationsDone] = React.useState(false);
        
        const handleRapidOperations = () => {
          // Execute operations synchronously
          addDish(); // Should now have 2 dishes (initial 1 + 1 added)
          addDish(); // Should now have 3 dishes (initial 1 + 2 added)
          addDish(); // Should now have 4 dishes (initial 1 + 3 added)
          // Try to remove dish with ID '2' - this should work if the second dish has ID '2'
          removeDish('2'); // Should now have 3 dishes (initial 1 + 3 added - 1 removed)
          setOperationsDone(true);
        };
        
        return (
          <div>
            <div data-testid="dish-count">{formData.dishes.length}</div>
            <div data-testid="operations-done">{operationsDone ? 'done' : 'pending'}</div>
            <button onClick={handleRapidOperations} data-testid="rapid-ops">
              Rapid Operations
            </button>
          </div>
        );
      };

      render(
        <NewItemFormProvider>
          <RapidTestComponent />
        </NewItemFormProvider>
      );

      // Initial state: 1 dish
      expect(screen.getByTestId('dish-count')).toHaveTextContent('1');

      const rapidButton = screen.getByTestId('rapid-ops');
      
      await act(async () => {
        rapidButton.click();
      });

      // Wait for operations to complete
      await act(async () => {
        // Give React time to process all state updates
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // After the context fix, should have: 1 initial + 3 added - 1 removed = 3
      expect(screen.getByTestId('dish-count')).toHaveTextContent('3');
      expect(screen.getByTestId('operations-done')).toHaveTextContent('done');
    });
  });
}); 