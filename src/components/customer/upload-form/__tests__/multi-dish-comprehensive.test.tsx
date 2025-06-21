import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { NewItemFormProvider, useNewItemForm } from '@/contexts/NewItemFormContext';
import { useCustomerFormSubmission } from '@/components/customer/upload-form/hooks/useCustomerFormSubmission';
import CombinedUploadStep from '@/components/customer/upload-form/steps/CombinedUploadStep';
import React from 'react';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => ({ error: null })),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://example.com/image.jpg' }
        }))
      }))
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'test-item-id',
              submission_id: 'test-submission-id',
              item_name_at_submission: 'Test Item',
              item_type: 'מנה',
              original_image_urls: ['https://example.com/image.jpg']
            },
            error: null
          }))
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { remaining_servings: 10, restaurant_name: 'Test Restaurant' },
            error: null
          }))
        }))
      }))
    }))
  }
}));

vi.mock('@/lib/triggerMakeWebhook', () => ({
  triggerMakeWebhook: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/utils/pathSanitization', () => ({
  sanitizePathComponent: vi.fn((text: string) => text.replace(/[^a-zA-Z0-9]/g, '-')),
}));

vi.mock('@/api/clientApi', () => ({
  updateClientServings: vi.fn(() => Promise.resolve()),
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-123'),
}));

// Mock UI components to avoid complex rendering issues
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  CardContent: ({ children }: any) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardHeader: ({ children }: any) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: any) => (
    <h3 data-testid="card-title">{children}</h3>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props} data-testid="button">
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, ...props }: any) => (
    <input
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      data-testid="input"
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, placeholder, ...props }: any) => (
    <textarea
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      data-testid="textarea"
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select">
      <select value={value} onChange={(e) => onValueChange(e.target.value)}>
        {children}
      </select>
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <option value={value} data-testid="select-item">{children}</option>
  ),
  SelectTrigger: ({ children }: any) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: ({ placeholder }: any) => (
    <span data-testid="select-value">{placeholder}</span>
  ),
}));

vi.mock('@/components/ui/accordion', () => ({
  Accordion: ({ children }: any) => <div data-testid="accordion">{children}</div>,
  AccordionContent: ({ children }: any) => <div data-testid="accordion-content">{children}</div>,
  AccordionItem: ({ children, value }: any) => (
    <div data-testid="accordion-item" data-value={value}>{children}</div>
  ),
  AccordionTrigger: ({ children }: any) => (
    <button data-testid="accordion-trigger">{children}</button>
  ),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NewItemFormProvider>
    {children}
  </NewItemFormProvider>
);

// Helper functions
const createMockFile = (name: string, type: string = 'image/jpeg'): File => {
  return new File(['test content'], name, { type });
};

const createValidDish = (id: string, overrides: any = {}) => ({
  id,
  itemName: `מנה ${id}`,
  itemType: 'מנה',
  description: `תיאור מנה ${id}`,
  specialNotes: `הערות מיוחדות למנה ${id}`,
  referenceImages: [
    createMockFile(`dish${id}_1.jpg`),
    createMockFile(`dish${id}_2.jpg`),
    createMockFile(`dish${id}_3.jpg`),
    createMockFile(`dish${id}_4.jpg`),
  ],
  brandingMaterials: [],
  referenceExamples: [],
  isCustomItemType: false,
  customItemType: '',
  qualityConfirmed: true,
  ...overrides,
});

const createValidFormData = (overrides: any = {}) => ({
  restaurantName: 'מסעדת בדיקה',
  submitterName: 'איש קשר לבדיקה',
  contactEmail: 'test@example.com',
  contactPhone: '050-1234567',
  itemName: '',
  itemType: '',
  description: '',
  specialNotes: '',
  referenceImages: [],
  brandingMaterials: [],
  referenceExamples: [],
  dishes: [createValidDish('1')],
  itemsQuantityRange: '',
  estimatedImagesNeeded: '',
  primaryImageUsage: '',
  ...overrides,
});

describe('Multi-Dish Feature - Comprehensive Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Context Management - NewItemFormContext', () => {
    describe('Initial State', () => {
      it('should initialize with one empty dish', () => {
        const { result } = renderHook(() => useNewItemForm(), {
          wrapper: TestWrapper,
        });

        expect(result.current.formData.dishes).toHaveLength(1);
        expect(result.current.formData.dishes[0].id).toBe('1');
        expect(result.current.formData.dishes[0].itemName).toBe('');
      });

      it('should have all required dish properties', () => {
        const { result } = renderHook(() => useNewItemForm(), {
          wrapper: TestWrapper,
        });

        const dish = result.current.formData.dishes[0];
        expect(dish).toHaveProperty('id');
        expect(dish).toHaveProperty('itemName');
        expect(dish).toHaveProperty('itemType');
        expect(dish).toHaveProperty('description');
        expect(dish).toHaveProperty('specialNotes');
        expect(dish).toHaveProperty('referenceImages');
        expect(dish).toHaveProperty('brandingMaterials');
        expect(dish).toHaveProperty('referenceExamples');
        expect(dish).toHaveProperty('isCustomItemType');
        expect(dish).toHaveProperty('customItemType');
        expect(dish).toHaveProperty('qualityConfirmed');
      });
    });

    describe('Adding Dishes', () => {
      it('should add new dish with incremented ID', () => {
        const { result } = renderHook(() => useNewItemForm(), {
          wrapper: TestWrapper,
        });

        let newId: string;
        act(() => {
          newId = result.current.addDish();
        });

        expect(newId!).toBe('2');
        expect(result.current.formData.dishes).toHaveLength(2);
        expect(result.current.formData.dishes[1].id).toBe('2');
      });

      it('should add multiple dishes with correct sequential IDs', () => {
        const { result } = renderHook(() => useNewItemForm(), {
          wrapper: TestWrapper,
        });

        let id2: string, id3: string, id4: string;
        act(() => {
          id2 = result.current.addDish();
        });
        act(() => {
          id3 = result.current.addDish();
        });
        act(() => {
          id4 = result.current.addDish();
        });

        expect(id2).toBe('2');
        expect(id3).toBe('3');
        expect(id4).toBe('4');
        expect(result.current.formData.dishes).toHaveLength(4);
        
        const ids = result.current.formData.dishes.map(d => d.id);
        expect(ids).toEqual(['1', '2', '3', '4']);
      });

      it('should initialize new dishes with default values', () => {
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
        expect(newDish.referenceImages).toEqual([]);
        expect(newDish.qualityConfirmed).toBe(false);
      });
    });

    describe('Removing Dishes', () => {
      it('should remove dish by ID', () => {
        const { result } = renderHook(() => useNewItemForm(), {
          wrapper: TestWrapper,
        });

        act(() => {
          result.current.addDish(); // Add second dish
        });

        expect(result.current.formData.dishes).toHaveLength(2);

        act(() => {
          result.current.removeDish('2');
        });

        expect(result.current.formData.dishes).toHaveLength(1);
        expect(result.current.formData.dishes[0].id).toBe('1');
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

      it('should remove correct dish when multiple exist', () => {
        const { result } = renderHook(() => useNewItemForm(), {
          wrapper: TestWrapper,
        });

        act(() => {
          result.current.addDish(); // Add dish '2'
          result.current.addDish(); // Add dish '3'
        });

        expect(result.current.formData.dishes).toHaveLength(3);

        act(() => {
          result.current.removeDish('2'); // Remove middle dish
        });

        expect(result.current.formData.dishes).toHaveLength(2);
        const remainingIds = result.current.formData.dishes.map(d => d.id);
        expect(remainingIds).toEqual(['1', '3']);
      });
    });

    describe('Updating Dishes', () => {
      it('should update dish by ID', () => {
        const { result } = renderHook(() => useNewItemForm(), {
          wrapper: TestWrapper,
        });

        act(() => {
          result.current.updateDish('1', { itemName: 'פסטה מעודכנת' });
        });

        expect(result.current.formData.dishes[0].itemName).toBe('פסטה מעודכנת');
      });

      it('should update only specified fields', () => {
        const { result } = renderHook(() => useNewItemForm(), {
          wrapper: TestWrapper,
        });

        act(() => {
          result.current.updateDish('1', { itemName: 'פסטה חדשה' });
        });

        expect(result.current.formData.dishes[0].itemName).toBe('פסטה חדשה');
        expect(result.current.formData.dishes[0].itemType).toBe(''); // Should remain unchanged
        expect(result.current.formData.dishes[0].description).toBe(''); // Should remain unchanged
      });

      it('should handle updating non-existent dish gracefully', () => {
        const { result } = renderHook(() => useNewItemForm(), {
          wrapper: TestWrapper,
        });

        const initialDish = { ...result.current.formData.dishes[0] };

        act(() => {
          result.current.updateDish('999', { itemName: 'לא קיים' });
        });

        expect(result.current.formData.dishes[0]).toEqual(initialDish);
      });

      it('should update multiple dishes independently', () => {
        const { result } = renderHook(() => useNewItemForm(), {
          wrapper: TestWrapper,
        });

        act(() => {
          result.current.addDish();
        });

        act(() => {
          result.current.updateDish('1', { itemName: 'פסטה', itemType: 'מנה' });
          result.current.updateDish('2', { itemName: 'סלט', itemType: 'סלט' });
        });

        expect(result.current.formData.dishes[0].itemName).toBe('פסטה');
        expect(result.current.formData.dishes[0].itemType).toBe('מנה');
        expect(result.current.formData.dishes[1].itemName).toBe('סלט');
        expect(result.current.formData.dishes[1].itemType).toBe('סלט');
      });
    });

    describe('Getting Dishes', () => {
      it('should get dish by ID', () => {
        const { result } = renderHook(() => useNewItemForm(), {
          wrapper: TestWrapper,
        });

        act(() => {
          result.current.updateDish('1', { itemName: 'מנה לבדיקה' });
        });

        const dish = result.current.getDish('1');
        expect(dish?.itemName).toBe('מנה לבדיקה');
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
          result.current.addDish();
          result.current.updateDish('2', { itemName: 'מנה שנייה מיוחדת' });
        });

        const dish = result.current.getDish('2');
        expect(dish?.itemName).toBe('מנה שנייה מיוחדת');
      });
    });
  });

  describe('2. Form Submission Logic - useCustomerFormSubmission', () => {
    const mockSetStepErrors = vi.fn();
    const mockResetFormData = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('Validation', () => {
      it('should validate restaurant name is required', async () => {
        const formData = createValidFormData({ restaurantName: '' });
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: null,
            formData,
            remainingDishes: undefined,
            setStepErrors: mockSetStepErrors,
            resetFormData: mockResetFormData,
          })
        );

        let submitResult: boolean;
        await act(async () => {
          submitResult = await result.current.handleSubmit();
        });

        expect(submitResult!).toBe(false);
        expect(mockSetStepErrors).toHaveBeenCalledWith({
          restaurantName: 'שם המסעדה הוא שדה חובה.'
        });
      });

      it('should validate submitter name is required', async () => {
        const formData = createValidFormData({ submitterName: '' });
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: null,
            formData,
            remainingDishes: undefined,
            setStepErrors: mockSetStepErrors,
            resetFormData: mockResetFormData,
          })
        );

        let submitResult: boolean;
        await act(async () => {
          submitResult = await result.current.handleSubmit();
        });

        expect(submitResult!).toBe(false);
        expect(mockSetStepErrors).toHaveBeenCalledWith({
          submitterName: 'שם איש הקשר הוא שדה חובה.'
        });
      });

      it('should validate each dish individually', async () => {
        const formData = createValidFormData({
          dishes: [
            createValidDish('1', { itemName: '' }), // Invalid dish
            createValidDish('2'), // Valid dish
          ]
        });
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: null,
            formData,
            remainingDishes: undefined,
            setStepErrors: mockSetStepErrors,
            resetFormData: mockResetFormData,
          })
        );

        let submitResult: boolean;
        await act(async () => {
          submitResult = await result.current.handleSubmit();
        });

        expect(submitResult!).toBe(false);
        expect(mockSetStepErrors).toHaveBeenCalledWith({
          itemName: 'שם הפריט הוא שדה חובה למנה 1.'
        });
      });

      it('should validate minimum image requirement per dish', async () => {
        const formData = createValidFormData({
          dishes: [createValidDish('1', { referenceImages: [createMockFile('test.jpg')] })] // Only 1 image
        });
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: null,
            formData,
            remainingDishes: undefined,
            setStepErrors: mockSetStepErrors,
            resetFormData: mockResetFormData,
          })
        );

        let submitResult: boolean;
        await act(async () => {
          submitResult = await result.current.handleSubmit();
        });

        expect(submitResult!).toBe(false);
        expect(mockSetStepErrors).toHaveBeenCalledWith({
          referenceImages: 'יש להעלות לפחות 4 תמונות למנה 1.'
        });
      });

      it('should validate sufficient remaining servings for authenticated clients', async () => {
        const formData = createValidFormData({
          dishes: [createValidDish('1'), createValidDish('2')] // 2 dishes
        });
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: 'test-client-id',
            formData,
            remainingDishes: 1, // Only 1 serving remaining, need 2
            setStepErrors: mockSetStepErrors,
            resetFormData: mockResetFormData,
          })
        );

        let submitResult: boolean;
        await act(async () => {
          submitResult = await result.current.handleSubmit();
        });

        expect(submitResult!).toBe(false);
        expect(mockSetStepErrors).toHaveBeenCalledWith({
          submit: 'אין לכם/ן מספיק מנות נותרות בחבילה. נדרשות 2 מנות, נותרות 1.'
        });
      });
    });

    describe('Successful Submission', () => {
      it('should successfully submit single dish', async () => {
        const formData = createValidFormData();
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: null,
            formData,
            remainingDishes: undefined,
            setStepErrors: mockSetStepErrors,
            resetFormData: mockResetFormData,
          })
        );

        let submitResult: boolean;
        await act(async () => {
          submitResult = await result.current.handleSubmit();
        });

        expect(submitResult!).toBe(true);
        expect(result.current.showSuccessModal).toBe(true);
      });

      it('should successfully submit multiple dishes', async () => {
        const formData = createValidFormData({
          dishes: [
            createValidDish('1', { itemName: 'פסטה קרבונרה' }),
            createValidDish('2', { itemName: 'סלט יווני' }),
          ]
        });
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: null,
            formData,
            remainingDishes: undefined,
            setStepErrors: mockSetStepErrors,
            resetFormData: mockResetFormData,
          })
        );

        let submitResult: boolean;
        await act(async () => {
          submitResult = await result.current.handleSubmit();
        });

        expect(submitResult!).toBe(true);
        expect(result.current.showSuccessModal).toBe(true);
      });

      it('should show progress toast for multiple dishes', async () => {
        const formData = createValidFormData({
          dishes: [createValidDish('1'), createValidDish('2')]
        });
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: null,
            formData,
            remainingDishes: undefined,
            setStepErrors: mockSetStepErrors,
            resetFormData: mockResetFormData,
          })
        );

        await act(async () => {
          await result.current.handleSubmit();
        });

        expect(toast.info).toHaveBeenCalledWith('מעלה תמונות ושומר 2 הגשות...');
      });

      it('should process each dish as separate submission', async () => {
        const formData = createValidFormData({
          dishes: [
            createValidDish('1', { itemName: 'מנה ראשונה' }),
            createValidDish('2', { itemName: 'מנה שנייה' }),
          ]
        });
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: null,
            formData,
            remainingDishes: undefined,
            setStepErrors: mockSetStepErrors,
            resetFormData: mockResetFormData,
          })
        );

        await act(async () => {
          await result.current.handleSubmit();
        });

        // Verify successful submission
        expect(result.current.showSuccessModal).toBe(true);
      });
    });

    describe('Error Handling', () => {
      it('should handle upload failures gracefully', async () => {
        // Mock upload failure
        const mockSupabase = await import('@/integrations/supabase/client');
        vi.mocked(mockSupabase.supabase.storage.from).mockReturnValue({
          upload: vi.fn(() => ({ error: { message: 'Upload failed' } })),
          getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'test-url' } }))
        } as any);

        const formData = createValidFormData();
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: null,
            formData,
            remainingDishes: undefined,
            setStepErrors: mockSetStepErrors,
            resetFormData: mockResetFormData,
          })
        );

        let submitResult: boolean;
        await act(async () => {
          submitResult = await result.current.handleSubmit();
        });

        expect(submitResult!).toBe(false);
        expect(result.current.showSuccessModal).toBe(false);
      });

      it('should handle database insertion failures', async () => {
        // Mock database failure
        const mockSupabase = await import('@/integrations/supabase/client');
        vi.mocked(mockSupabase.supabase.from).mockReturnValue({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: { message: 'Database error' }
              }))
            }))
          })),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: { remaining_servings: 10 },
                error: null
              }))
            }))
          }))
        } as any);

        const formData = createValidFormData();
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: null,
            formData,
            remainingDishes: undefined,
            setStepErrors: mockSetStepErrors,
            resetFormData: mockResetFormData,
          })
        );

        let submitResult: boolean;
        await act(async () => {
          submitResult = await result.current.handleSubmit();
        });

        expect(submitResult!).toBe(false);
        expect(result.current.showSuccessModal).toBe(false);
      });
    });

    describe('State Management', () => {
      it('should manage loading state correctly', async () => {
        const formData = createValidFormData();
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: null,
            formData,
            remainingDishes: undefined,
            setStepErrors: mockSetStepErrors,
            resetFormData: mockResetFormData,
          })
        );

        expect(result.current.isSubmitting).toBe(false);

        // Start submission and immediately check loading state
        let submitPromise: Promise<boolean>;
        act(() => {
          submitPromise = result.current.handleSubmit();
        });

        // Check loading state is set
        expect(result.current.isSubmitting).toBe(true);

        // Wait for completion
        await act(async () => {
          await submitPromise!;
        });

        // Check final state
        expect(result.current.isSubmitting).toBe(false);
      });

      it('should manage success modal state', async () => {
        const formData = createValidFormData();
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: null,
            formData,
            remainingDishes: undefined,
            setStepErrors: mockSetStepErrors,
            resetFormData: mockResetFormData,
          })
        );

        expect(result.current.showSuccessModal).toBe(false);

        await act(async () => {
          await result.current.handleSubmit();
        });

        expect(result.current.showSuccessModal).toBe(true);

        act(() => {
          result.current.handleCloseSuccessModal();
        });

        expect(result.current.showSuccessModal).toBe(false);
      });
    });
  });

  describe('3. Edge Cases and Integration', () => {
    describe('Large Scale Operations', () => {
      it('should handle large number of dishes', () => {
        const { result } = renderHook(() => useNewItemForm(), {
          wrapper: TestWrapper,
        });

        act(() => {
          // Add 10 dishes
          for (let i = 0; i < 10; i++) {
            result.current.addDish();
          }
        });

        expect(result.current.formData.dishes).toHaveLength(11); // 1 initial + 10 added
        
        // Verify IDs are sequential
        const ids = result.current.formData.dishes.map(d => d.id);
        expect(ids).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']);
      });

      it('should handle rapid successive operations', () => {
        const { result } = renderHook(() => useNewItemForm(), {
          wrapper: TestWrapper,
        });

        act(() => {
          // Rapid add/remove/update operations
          const id2 = result.current.addDish();
          const id3 = result.current.addDish();
          result.current.updateDish(id2, { itemName: 'מנה מהירה' });
          result.current.removeDish(id3);
          const id4 = result.current.addDish();
          result.current.updateDish(id4, { itemName: 'מנה אחרונה' });
        });

        expect(result.current.formData.dishes).toHaveLength(3);
        expect(result.current.formData.dishes[1].itemName).toBe('מנה מהירה');
        expect(result.current.formData.dishes[2].itemName).toBe('מנה אחרונה');
      });
    });

    describe('Hebrew Language Support', () => {
      it('should handle Hebrew characters in all dish fields', async () => {
        const formData = createValidFormData({
          dishes: [createValidDish('1', {
            itemName: 'פסטה עם ביצים וגבינה',
            itemType: 'מנה עיקרית',
            description: 'תיאור בעברית עם תווים מיוחדים',
            specialNotes: 'הערות מיוחדות בעברית'
          })]
        });
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: null,
            formData,
            remainingDishes: undefined,
            setStepErrors: vi.fn(),
            resetFormData: vi.fn(),
          })
        );

        let submitResult: boolean;
        await act(async () => {
          submitResult = await result.current.handleSubmit();
        });

        expect(submitResult!).toBe(true);
      });

      it('should sanitize Hebrew paths correctly', async () => {
        const { sanitizePathComponent } = await import('@/utils/pathSanitization');
        
        const formData = createValidFormData({
          dishes: [createValidDish('1', { itemType: 'עוגה' })]
        });
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: null,
            formData,
            remainingDishes: undefined,
            setStepErrors: vi.fn(),
            resetFormData: vi.fn(),
          })
        );

        await act(async () => {
          await result.current.handleSubmit();
        });

        expect(sanitizePathComponent).toHaveBeenCalledWith('עוגה');
      });
    });

    describe('Integration Scenarios', () => {
      it('should handle guest user submission', async () => {
        const formData = createValidFormData();
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: null, // Guest user
            formData,
            remainingDishes: undefined,
            setStepErrors: vi.fn(),
            resetFormData: vi.fn(),
          })
        );

        let submitResult: boolean;
        await act(async () => {
          submitResult = await result.current.handleSubmit();
        });

        expect(submitResult!).toBe(true);
      });

      it('should handle authenticated user with sufficient servings', async () => {
        const formData = createValidFormData({
          dishes: [createValidDish('1'), createValidDish('2')]
        });
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: 'test-client-id',
            formData,
            remainingDishes: 5, // Sufficient servings
            setStepErrors: vi.fn(),
            resetFormData: vi.fn(),
          })
        );

        let submitResult: boolean;
        await act(async () => {
          submitResult = await result.current.handleSubmit();
        });

        expect(submitResult!).toBe(true);
      });

      it('should trigger webhook for each submission', async () => {
        const { triggerMakeWebhook } = await import('@/lib/triggerMakeWebhook');
        
        const formData = createValidFormData({
          dishes: [createValidDish('1'), createValidDish('2')]
        });
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: null,
            formData,
            remainingDishes: undefined,
            setStepErrors: vi.fn(),
            resetFormData: vi.fn(),
          })
        );

        await act(async () => {
          await result.current.handleSubmit();
        });

        expect(triggerMakeWebhook).toHaveBeenCalledTimes(2); // Once per dish
      });

      it('should insert into correct table based on item type', async () => {
        const mockSupabase = await import('@/integrations/supabase/client');
        const mockFrom = vi.mocked(mockSupabase.supabase.from);
        
        const formData = createValidFormData({
          dishes: [
            createValidDish('1', { itemType: 'dish' }),
            createValidDish('2', { itemType: 'cocktail' }),
          ]
        });
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: null,
            formData,
            remainingDishes: undefined,
            setStepErrors: vi.fn(),
            resetFormData: vi.fn(),
          })
        );

        await act(async () => {
          await result.current.handleSubmit();
        });

        expect(mockFrom).toHaveBeenCalledWith('dishes');
        expect(mockFrom).toHaveBeenCalledWith('cocktails');
      });
    });

    describe('Error Recovery', () => {
      it('should handle empty dishes array gracefully', async () => {
        const formData = createValidFormData({ dishes: [] });
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: null,
            formData,
            remainingDishes: undefined,
            setStepErrors: vi.fn(),
            resetFormData: vi.fn(),
          })
        );

        let submitResult: boolean;
        await act(async () => {
          submitResult = await result.current.handleSubmit();
        });

        expect(submitResult!).toBe(true); // Should handle empty array
      });

      it('should recover from partial submission failures', async () => {
        // Mock first dish success, second dish failure
        const mockSupabase = await import('@/integrations/supabase/client');
        let callCount = 0;
        vi.mocked(mockSupabase.supabase.storage.from).mockReturnValue({
          upload: vi.fn(() => {
            callCount++;
            if (callCount > 4) { // First dish has 4 images, fail on second dish
              return { error: { message: 'Upload failed' } };
            }
            return { error: null };
          }),
          getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'test-url' } }))
        } as any);

        const formData = createValidFormData({
          dishes: [createValidDish('1'), createValidDish('2')]
        });
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: null,
            formData,
            remainingDishes: undefined,
            setStepErrors: vi.fn(),
            resetFormData: vi.fn(),
          })
        );

        let submitResult: boolean;
        await act(async () => {
          submitResult = await result.current.handleSubmit();
        });

        expect(submitResult!).toBe(false); // Should fail gracefully
      });
    });
  });
}); 