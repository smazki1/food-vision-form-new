import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { 
  NewItemFormProvider, 
  useNewItemForm, 
  DishData, 
  NewItemFormData 
} from '@/contexts/NewItemFormContext';
import CombinedUploadStep from '@/components/public/upload-form/steps/CombinedUploadStep';
import ReviewSubmitStep from '@/components/public/upload-form/steps/ReviewSubmitStep';
import { usePublicFormSubmission } from '@/hooks/usePublicFormSubmission';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://example.com/test-image.jpg' }
        }))
      }))
    }
  }
}));

vi.mock('@/lib/triggerMakeWebhook', () => ({
  triggerMakeWebhook: vi.fn()
}));

vi.mock('@/components/unified-upload/utils/imageUploadUtils', () => ({
  uploadImages: vi.fn(),
  uploadAdditionalFiles: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

// Test utilities
const createMockFile = (name: string, type: string = 'image/jpeg'): File => {
  return new File(['test'], name, { type });
};

const createMockDish = (id: string, overrides: Partial<DishData> = {}): DishData => ({
  id,
  itemType: 'dish',
  itemName: `Test Dish ${id}`,
  description: 'Test description',
  specialNotes: 'Test notes',
  referenceImages: [createMockFile(`dish-${id}.jpg`)],
  brandingMaterials: [],
  referenceExamples: [],
  isCustomItemType: false,
  customItemType: '',
  ...overrides
});

// Context test component
const ContextTestComponent: React.FC<{ onContextReady?: (context: any) => void }> = ({ onContextReady }) => {
  const context = useNewItemForm();
  
  React.useEffect(() => {
    if (onContextReady) {
      onContextReady(context);
    }
  }, [context, onContextReady]);

  return (
    <div>
      <div data-testid="dish-count">{context.formData.dishes.length}</div>
      <div data-testid="restaurant-name">{context.formData.restaurantName}</div>
      <div data-testid="first-dish-name">{context.formData.dishes[0]?.itemName || 'No dishes'}</div>
    </div>
  );
};

describe('Multiple Dishes Feature - Comprehensive Tests', () => {
  let mockSetStepErrors: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetStepErrors = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Context Management - Happy Path', () => {
    it('should initialize with correct default state', () => {
      render(
        <NewItemFormProvider>
          <ContextTestComponent />
        </NewItemFormProvider>
      );

      expect(screen.getByTestId('dish-count')).toHaveTextContent('1');
      expect(screen.getByTestId('restaurant-name')).toHaveTextContent('');
      expect(screen.getByTestId('first-dish-name')).toHaveTextContent('');
    });

    it('should add multiple dishes correctly with proper IDs', async () => {
      let contextRef: any;
      
      render(
        <NewItemFormProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </NewItemFormProvider>
      );

      await act(async () => {
        const id1 = contextRef.addDish();
        const id2 = contextRef.addDish();
        const id3 = contextRef.addDish();
        
        expect(id1).toBe('2');
        expect(id2).toBe('3');
        expect(id3).toBe('4');
      });

      expect(screen.getByTestId('dish-count')).toHaveTextContent('4');
    });

    it('should update specific dishes without affecting others', async () => {
      let contextRef: any;
      
      render(
        <NewItemFormProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </NewItemFormProvider>
      );

      await act(async () => {
        contextRef.addDish();
        contextRef.addDish();
        
        contextRef.updateDish('1', { itemName: 'First Dish' });
        contextRef.updateDish('2', { itemName: 'Second Dish' });
        contextRef.updateDish('3', { itemName: 'Third Dish' });
      });

      const dish1 = contextRef.getDish('1');
      const dish2 = contextRef.getDish('2');
      const dish3 = contextRef.getDish('3');

      expect(dish1?.itemName).toBe('First Dish');
      expect(dish2?.itemName).toBe('Second Dish');
      expect(dish3?.itemName).toBe('Third Dish');
      
      // IDs should remain unchanged
      expect(dish1?.id).toBe('1');
      expect(dish2?.id).toBe('2');
      expect(dish3?.id).toBe('3');
    });

    it('should remove dishes correctly and maintain proper structure', async () => {
      let contextRef: any;
      
      render(
        <NewItemFormProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </NewItemFormProvider>
      );

      await act(async () => {
        contextRef.addDish(); // 2 dishes
        contextRef.addDish(); // 3 dishes
        contextRef.addDish(); // 4 dishes
        
        contextRef.updateDish('1', { itemName: 'Keep Me 1' });
        contextRef.updateDish('2', { itemName: 'Remove Me' });
        contextRef.updateDish('3', { itemName: 'Keep Me 3' });
        contextRef.updateDish('4', { itemName: 'Keep Me 4' });
        
        contextRef.removeDish('2'); // Remove middle dish
      });

      expect(screen.getByTestId('dish-count')).toHaveTextContent('3');
      
      const remainingDishes = contextRef.formData.dishes;
      expect(remainingDishes.find((d: DishData) => d.id === '1')?.itemName).toBe('Keep Me 1');
      expect(remainingDishes.find((d: DishData) => d.id === '2')).toBeUndefined();
      expect(remainingDishes.find((d: DishData) => d.id === '3')?.itemName).toBe('Keep Me 3');
      expect(remainingDishes.find((d: DishData) => d.id === '4')?.itemName).toBe('Keep Me 4');
    });

    it('should handle complex dish data with files correctly', async () => {
      let contextRef: any;
      
      render(
        <NewItemFormProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </NewItemFormProvider>
      );

      const mockFiles = {
        reference: [createMockFile('ref1.jpg'), createMockFile('ref2.jpg')],
        branding: [createMockFile('logo.png')],
        examples: [createMockFile('example.jpg')]
      };

      await act(async () => {
        contextRef.updateDish('1', {
          itemName: 'Complex Dish',
          itemType: 'dish',
          description: 'A very complex dish with lots of details',
          specialNotes: 'Special preparation required',
          referenceImages: mockFiles.reference,
          brandingMaterials: mockFiles.branding,
          referenceExamples: mockFiles.examples,
          isCustomItemType: true,
          customItemType: 'fusion'
        });
      });

      const dish = contextRef.getDish('1');
      expect(dish?.itemName).toBe('Complex Dish');
      expect(dish?.description).toBe('A very complex dish with lots of details');
      expect(dish?.referenceImages).toHaveLength(2);
      expect(dish?.brandingMaterials).toHaveLength(1);
      expect(dish?.referenceExamples).toHaveLength(1);
      expect(dish?.isCustomItemType).toBe(true);
      expect(dish?.customItemType).toBe('fusion');
    });
  });

  describe('Context Management - Edge Cases', () => {
    it('should handle removing non-existent dishes gracefully', async () => {
      let contextRef: any;
      
      render(
        <NewItemFormProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </NewItemFormProvider>
      );

      const initialCount = contextRef.formData.dishes.length;

      await act(async () => {
        contextRef.removeDish('999'); // Non-existent ID
        contextRef.removeDish('abc'); // Invalid ID
        contextRef.removeDish(''); // Empty ID
      });

      expect(contextRef.formData.dishes.length).toBe(initialCount);
    });

    it('should handle updating non-existent dishes gracefully', async () => {
      let contextRef: any;
      
      render(
        <NewItemFormProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </NewItemFormProvider>
      );

      await act(async () => {
        contextRef.updateDish('999', { itemName: 'Should not exist' });
      });

      const dish = contextRef.getDish('999');
      expect(dish).toBeUndefined();
      
      // Original dish should remain unchanged
      const originalDish = contextRef.getDish('1');
      expect(originalDish?.itemName).toBe('');
    });

    it('should maintain data integrity during rapid operations', async () => {
      let contextRef: any;
      
      render(
        <NewItemFormProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </NewItemFormProvider>
      );

      await act(async () => {
        // Perform many rapid operations
        for (let i = 0; i < 10; i++) {
          const id = contextRef.addDish();
          contextRef.updateDish(id, { itemName: `Dish ${id}` });
        }
        
        // Remove every other dish
        for (let i = 2; i <= 11; i += 2) {
          contextRef.removeDish(i.toString());
        }
      });

      // Should have 1 original + 5 remaining = 6 dishes
      expect(screen.getByTestId('dish-count')).toHaveTextContent('6');
      
      // Verify data integrity
      const dishes = contextRef.formData.dishes;
      const oddDishes = dishes.filter((d: DishData) => parseInt(d.id) % 2 === 1);
      expect(oddDishes).toHaveLength(6); // 1, 3, 5, 7, 9, 11
    });

    it('should handle form data reset correctly', async () => {
      let contextRef: any;
      
      render(
        <NewItemFormProvider>
          <ContextTestComponent onContextReady={(ctx) => { contextRef = ctx; }} />
        </NewItemFormProvider>
      );

      await act(async () => {
        // Set up complex state
        contextRef.updateFormData({ 
          restaurantName: 'Test Restaurant',
          submitterName: 'Test User' 
        });
        
        contextRef.addDish();
        contextRef.addDish();
        
        contextRef.updateDish('1', { itemName: 'First' });
        contextRef.updateDish('2', { itemName: 'Second' });
        contextRef.updateDish('3', { itemName: 'Third' });
        
        // Reset everything
        contextRef.resetFormData();
      });

      expect(screen.getByTestId('dish-count')).toHaveTextContent('1');
      expect(screen.getByTestId('restaurant-name')).toHaveTextContent('');
      expect(screen.getByTestId('first-dish-name')).toHaveTextContent('');
    });
  });

  describe('UI Components - CombinedUploadStep', () => {
    it('should render with initial dish and add button', () => {
      render(
        <NewItemFormProvider>
          <CombinedUploadStep />
        </NewItemFormProvider>
      );

      expect(screen.getByText(/מנה 1/)).toBeInTheDocument();
      expect(screen.getByText('הוספת מנה נוספת')).toBeInTheDocument();
    });

    it('should add new dishes when button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <NewItemFormProvider>
          <CombinedUploadStep />
        </NewItemFormProvider>
      );

      const addButton = screen.getByText('הוספת מנה נוספת');
      
      await user.click(addButton);
      expect(screen.getByText(/מנה 2/)).toBeInTheDocument();
      
      await user.click(addButton);
      expect(screen.getByText(/מנה 3/)).toBeInTheDocument();
    });

    it('should handle custom item type selection', async () => {
      const user = userEvent.setup();
      
      render(
        <NewItemFormProvider>
          <CombinedUploadStep />
        </NewItemFormProvider>
      );

      // Look for the "אחר" checkbox
      const otherCheckbox = screen.getByRole('checkbox', { name: /אחר/ });
      await user.click(otherCheckbox);

      // Custom input should appear
      expect(screen.getByPlaceholderText('לדוגמה: קינוח, חטיף, ממתק')).toBeInTheDocument();
    });

    it('should maintain form data when switching between dishes', async () => {
      const user = userEvent.setup();
      
      render(
        <NewItemFormProvider>
          <CombinedUploadStep />
        </NewItemFormProvider>
      );

      // Fill out first dish
      const itemNameInput = screen.getByLabelText(/שם הפריט/);
      await user.type(itemNameInput, 'First Dish Name');

      // Add second dish
      const addButton = screen.getByText('הוספת מנה נוספת');
      await user.click(addButton);

      // Switch back to first dish
      const dish1Button = screen.getByText(/מנה 1/);
      await user.click(dish1Button);

      // First dish data should be preserved
      expect(screen.getByDisplayValue('First Dish Name')).toBeInTheDocument();
    });
  });

  describe('Review Component - ReviewSubmitStep', () => {
    const createMockFormDataWithDishes = (dishes: DishData[]): NewItemFormData => ({
      restaurantName: 'Test Restaurant',
      submitterName: 'Test Submitter',
      contactEmail: 'test@example.com',
      contactPhone: '123456789',
      itemName: '',
      itemType: '',
      description: '',
      specialNotes: '',
      referenceImages: [],
      brandingMaterials: [],
      referenceExamples: [],
      dishes,
      itemsQuantityRange: '',
      estimatedImagesNeeded: '',
      primaryImageUsage: ''
    });

    it('should display correct aggregated statistics', async () => {
      const mockDishes = [
        createMockDish('1', { 
          itemType: 'dish',
          referenceImages: [createMockFile('1.jpg'), createMockFile('2.jpg')]
        }),
        createMockDish('2', { 
          itemType: 'cocktail',
          referenceImages: [createMockFile('3.jpg')]
        }),
        createMockDish('3', { 
          itemType: 'dish',
          referenceImages: [createMockFile('4.jpg'), createMockFile('5.jpg'), createMockFile('6.jpg')]
        })
      ];

      const MockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const context = useNewItemForm();
        
        React.useEffect(() => {
          context.updateFormData(createMockFormDataWithDishes(mockDishes));
        }, []);

        return <>{children}</>;
      };

      render(
        <NewItemFormProvider>
          <MockProvider>
            <ReviewSubmitStep />
          </MockProvider>
        </NewItemFormProvider>
      );

      // Total dishes: 3
      expect(screen.getByText('3')).toBeInTheDocument();
      
      // Total images: 2 + 1 + 3 = 6
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('should display dish type breakdown correctly', async () => {
      const mockDishes = [
        createMockDish('1', { itemType: 'dish' }),
        createMockDish('2', { itemType: 'dish' }),
        createMockDish('3', { itemType: 'cocktail' }),
        createMockDish('4', { itemType: 'drink' }),
        createMockDish('5', { itemType: 'cocktail' })
      ];

      const MockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const context = useNewItemForm();
        
        React.useEffect(() => {
          context.updateFormData(createMockFormDataWithDishes(mockDishes));
        }, []);

        return <>{children}</>;
      };

      render(
        <NewItemFormProvider>
          <MockProvider>
            <ReviewSubmitStep />
          </MockProvider>
        </NewItemFormProvider>
      );

      // Should show breakdown by type
      expect(screen.getByText('2 מנות')).toBeInTheDocument(); // 2 dishes
      expect(screen.getByText('2 מנות')).toBeInTheDocument(); // 2 cocktails  
      expect(screen.getByText('1 מנות')).toBeInTheDocument(); // 1 drink
    });

    it('should display individual dish details correctly', async () => {
      const mockDishes = [
        createMockDish('1', {
          itemName: 'Special Pasta',
          itemType: 'dish',
          description: 'Delicious pasta with special sauce',
          specialNotes: 'Extra spicy, gluten-free option available'
        })
      ];

      const MockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const context = useNewItemForm();
        
        React.useEffect(() => {
          context.updateFormData(createMockFormDataWithDishes(mockDishes));
        }, []);

        return <>{children}</>;
      };

      render(
        <NewItemFormProvider>
          <MockProvider>
            <ReviewSubmitStep />
          </MockProvider>
        </NewItemFormProvider>
      );

      expect(screen.getByText('Special Pasta')).toBeInTheDocument();
      expect(screen.getByText('Delicious pasta with special sauce')).toBeInTheDocument();
      expect(screen.getByText(/Extra spicy, gluten-free option available/)).toBeInTheDocument();
    });

    it('should handle empty dishes array gracefully', async () => {
      const MockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const context = useNewItemForm();
        
        React.useEffect(() => {
          context.updateFormData(createMockFormDataWithDishes([]));
        }, []);

        return <>{children}</>;
      };

      render(
        <NewItemFormProvider>
          <MockProvider>
            <ReviewSubmitStep />
          </MockProvider>
        </NewItemFormProvider>
      );

      // Should show 0 dishes and 0 images
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Submission Logic - Validation', () => {
    it('should validate multiple dishes correctly', () => {
      const validFormData = {
        restaurantName: 'Test Restaurant',
        submitterName: 'Test User',
        dishes: [
          createMockDish('1', { 
            itemName: 'Valid Dish 1',
            itemType: 'dish',
            referenceImages: [createMockFile('valid1.jpg')]
          }),
          createMockDish('2', { 
            itemName: 'Valid Dish 2',
            itemType: 'cocktail',
            referenceImages: [createMockFile('valid2.jpg')]
          })
        ]
      };

      // Basic validation logic
      const isValidSubmission = 
        validFormData.restaurantName.trim() !== '' &&
        validFormData.submitterName.trim() !== '' &&
        validFormData.dishes.length > 0 &&
        validFormData.dishes.every(dish => 
          dish.itemName.trim() !== '' &&
          dish.itemType.trim() !== '' &&
          dish.referenceImages.length > 0
        );

      expect(isValidSubmission).toBe(true);
    });

    it('should reject dishes with missing required fields', () => {
      const invalidFormData = {
        restaurantName: 'Test Restaurant',
        submitterName: 'Test User',
        dishes: [
          createMockDish('1', { 
            itemName: '', // Missing name
            itemType: 'dish',
            referenceImages: [createMockFile('image.jpg')]
          }),
          createMockDish('2', { 
            itemName: 'Valid Name',
            itemType: '', // Missing type
            referenceImages: [createMockFile('image.jpg')]
          }),
          createMockDish('3', { 
            itemName: 'Valid Name',
            itemType: 'dish',
            referenceImages: [] // Missing images
          })
        ]
      };

      const isValidSubmission = 
        invalidFormData.restaurantName.trim() !== '' &&
        invalidFormData.submitterName.trim() !== '' &&
        invalidFormData.dishes.length > 0 &&
        invalidFormData.dishes.every(dish => 
          dish.itemName.trim() !== '' &&
          dish.itemType.trim() !== '' &&
          dish.referenceImages.length > 0
        );

      expect(isValidSubmission).toBe(false);
    });

    it('should handle empty dishes array', () => {
      const emptyDishesFormData = {
        restaurantName: 'Test Restaurant',
        submitterName: 'Test User',
        dishes: []
      };

      const isValidSubmission = 
        emptyDishesFormData.restaurantName.trim() !== '' &&
        emptyDishesFormData.submitterName.trim() !== '' &&
        emptyDishesFormData.dishes.length > 0;

      expect(isValidSubmission).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full workflow from context to review', async () => {
      let contextRef: any;
      
      const WorkflowTestComponent: React.FC = () => {
        const context = useNewItemForm();
        
        React.useEffect(() => {
          contextRef = context;
        }, [context]);

        return (
          <div>
            <div data-testid="workflow-dishes">{context.formData.dishes.length}</div>
            <div data-testid="workflow-restaurant">{context.formData.restaurantName}</div>
          </div>
        );
      };

      render(
        <NewItemFormProvider>
          <WorkflowTestComponent />
        </NewItemFormProvider>
      );

      // Step 1: Set up basic form data
      await act(async () => {
        contextRef.updateFormData({
          restaurantName: 'Integration Test Restaurant',
          submitterName: 'Integration Test User'
        });
      });

      // Step 2: Add and configure multiple dishes
      await act(async () => {
        const id1 = contextRef.addDish();
        const id2 = contextRef.addDish();
        
        contextRef.updateDish('1', {
          itemName: 'Integration Dish 1',
          itemType: 'dish',
          description: 'First test dish',
          referenceImages: [createMockFile('dish1.jpg')]
        });
        
        contextRef.updateDish(id1, {
          itemName: 'Integration Dish 2',
          itemType: 'cocktail',
          description: 'Second test dish',
          referenceImages: [createMockFile('cocktail.jpg')]
        });
        
        contextRef.updateDish(id2, {
          itemName: 'Integration Dish 3',
          itemType: 'drink',
          description: 'Third test dish',
          referenceImages: [createMockFile('drink.jpg')]
        });
      });

      // Step 3: Verify final state
      expect(screen.getByTestId('workflow-dishes')).toHaveTextContent('3');
      expect(screen.getByTestId('workflow-restaurant')).toHaveTextContent('Integration Test Restaurant');
      
      // Verify dish details
      const dish1 = contextRef.getDish('1');
      const dish2 = contextRef.getDish('2');
      const dish3 = contextRef.getDish('3');

      expect(dish1?.itemName).toBe('Integration Dish 1');
      expect(dish2?.itemName).toBe('Integration Dish 2');
      expect(dish3?.itemName).toBe('Integration Dish 3');
      
      expect(dish1?.itemType).toBe('dish');
      expect(dish2?.itemType).toBe('cocktail');
      expect(dish3?.itemType).toBe('drink');

      // Step 4: Verify submission readiness
      const isReadyForSubmission = 
        contextRef.formData.restaurantName &&
        contextRef.formData.submitterName &&
        contextRef.formData.dishes.length > 0 &&
        contextRef.formData.dishes.every((dish: DishData) => 
          dish.itemName && dish.itemType && dish.referenceImages.length > 0
        );

      expect(isReadyForSubmission).toBe(true);
    });

    it('should maintain performance with large numbers of dishes', async () => {
      let contextRef: any;
      
      const PerformanceTestComponent: React.FC = () => {
        const context = useNewItemForm();
        
        React.useEffect(() => {
          contextRef = context;
        }, [context]);

        return (
          <div>
            <div data-testid="perf-count">{context.formData.dishes.length}</div>
          </div>
        );
      };

      render(
        <NewItemFormProvider>
          <PerformanceTestComponent />
        </NewItemFormProvider>
      );

      const startTime = performance.now();

      await act(async () => {
        // Add 50 dishes
        for (let i = 0; i < 50; i++) {
          const id = contextRef.addDish();
          contextRef.updateDish(id, {
            itemName: `Performance Dish ${i}`,
            itemType: i % 3 === 0 ? 'dish' : i % 3 === 1 ? 'cocktail' : 'drink',
            referenceImages: [createMockFile(`perf${i}.jpg`)]
          });
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
      expect(screen.getByTestId('perf-count')).toHaveTextContent('51'); // 1 initial + 50 added
    });
  });
}); 