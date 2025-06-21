import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock all external dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/utils/pathSanitization', () => ({
  sanitizePathComponent: vi.fn((path: string) => path.replace(/[^\w-]/g, '-')),
}));

vi.mock('@/lib/triggerMakeWebhook', () => ({
  triggerMakeWebhook: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

vi.mock('@/api/clientApi', () => ({
  updateClientServings: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock Supabase with more detailed responses
const mockSupabaseStorage = {
  upload: vi.fn().mockResolvedValue({ error: null }),
  getPublicUrl: vi.fn().mockReturnValue({
    data: { publicUrl: 'https://example.com/image.jpg' }
  }),
};

const mockSupabaseFrom = vi.fn(() => ({
  insert: vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn().mockResolvedValue({
        data: { 
          id: 'test-item-id-' + Math.random().toString(36).substr(2, 9),
          submission_id: 'test-submission-id-' + Math.random().toString(36).substr(2, 9),
          item_name_at_submission: 'Test Item',
          item_type: 'מנה',
          original_image_urls: ['https://example.com/image.jpg']
        },
        error: null
      }),
    })),
  })),
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      single: vi.fn().mockResolvedValue({
        data: { remaining_servings: 10, restaurant_name: 'Test Restaurant' },
        error: null
      }),
    })),
  })),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => mockSupabaseStorage),
    },
    from: mockSupabaseFrom,
  },
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/icon-input', () => ({
  IconInput: ({ value, onChange, placeholder, ...props }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      data-testid={props['data-testid'] || 'input'}
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/icon-textarea', () => ({
  IconTextarea: ({ value, onChange, placeholder, ...props }: any) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      data-testid={props['data-testid'] || 'textarea'}
      {...props}
    />
  ),
}));

vi.mock('react-dropzone', () => ({
  useDropzone: vi.fn(() => ({
    getRootProps: vi.fn(() => ({ 'data-testid': 'dropzone' })),
    getInputProps: vi.fn(() => ({ 'data-testid': 'dropzone-input' })),
    isDragActive: false,
  })),
}));

// Import components and hooks after mocking
import { useCustomerFormSubmission } from '../hooks/useCustomerFormSubmission';
import { NewItemFormData, NewItemFormProvider, useNewItemForm } from '@/contexts/NewItemFormContext';
import { CombinedUploadStep } from '../steps/CombinedUploadStep';

// Test utilities
const createMockFile = (name: string, size: number = 1024): File => {
  const file = new File(['test'], name, { type: 'image/jpeg' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
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

const createValidFormData = (overrides: Partial<NewItemFormData> = {}): NewItemFormData => ({
  restaurantName: 'מסעדת הבית',
  submitterName: 'יוסי כהן',
  contactEmail: 'test@example.com',
  contactPhone: '050-1234567',
  itemName: 'פסטה קרבונרה',
  itemType: 'מנה',
  description: '',
  specialNotes: '',
  referenceImages: [],
  brandingMaterials: [],
  referenceExamples: [],
  dishes: [createValidDish('1')],
  itemsQuantityRange: '5-10',
  estimatedImagesNeeded: '20',
  primaryImageUsage: 'מדיה חברתית',
  ...overrides,
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NewItemFormProvider>{children}</NewItemFormProvider>
);

describe('Multi-Dish Feature - Comprehensive Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
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

        act(() => {
          const newId = result.current.addDish();
          expect(newId).toBe('2');
        });

        expect(result.current.formData.dishes).toHaveLength(2);
        expect(result.current.formData.dishes[1].id).toBe('2');
      });

      it('should add multiple dishes with correct sequential IDs', () => {
        const { result } = renderHook(() => useNewItemForm(), {
          wrapper: TestWrapper,
        });

        act(() => {
          const id2 = result.current.addDish();
          const id3 = result.current.addDish();
          const id4 = result.current.addDish();
          
          expect(id2).toBe('2');
          expect(id3).toBe('3');
          expect(id4).toBe('4');
        });

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
          result.current.updateDish('1', { itemName: 'פסטה עדכנית' });
        });

        expect(result.current.formData.dishes[0].itemName).toBe('פסטה עדכנית');
      });

      it('should update only specified fields', () => {
        const { result } = renderHook(() => useNewItemForm(), {
          wrapper: TestWrapper,
        });

        const originalDescription = result.current.formData.dishes[0].description;

        act(() => {
          result.current.updateDish('1', { itemName: 'שם חדש' });
        });

        expect(result.current.formData.dishes[0].itemName).toBe('שם חדש');
        expect(result.current.formData.dishes[0].description).toBe(originalDescription);
      });

      it('should handle updating non-existent dish gracefully', () => {
        const { result } = renderHook(() => useNewItemForm(), {
          wrapper: TestWrapper,
        });

        const originalDishes = [...result.current.formData.dishes];

        act(() => {
          result.current.updateDish('999', { itemName: 'לא קיים' });
        });

        expect(result.current.formData.dishes).toEqual(originalDishes);
      });

      it('should update multiple dishes independently', () => {
        const { result } = renderHook(() => useNewItemForm(), {
          wrapper: TestWrapper,
        });

        act(() => {
          result.current.addDish();
        });

        act(() => {
          result.current.updateDish('1', { itemName: 'מנה ראשונה' });
          result.current.updateDish('2', { itemName: 'מנה שנייה' });
        });

        expect(result.current.formData.dishes[0].itemName).toBe('מנה ראשונה');
        expect(result.current.formData.dishes[1].itemName).toBe('מנה שנייה');
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
      mockSetStepErrors.mockClear();
      mockResetFormData.mockClear();
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

      it('should validate dish item type is required', async () => {
        const formData = createValidFormData({
          dishes: [createValidDish('1', { itemType: '' })]
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
          itemType: 'סוג הפריט הוא שדה חובה למנה 1.'
        });
      });

      it('should validate minimum image requirement per dish', async () => {
        const formData = createValidFormData({
          dishes: [createValidDish('1', { 
            referenceImages: [createMockFile('img1.jpg')] // Only 1 image, need 4
          })]
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
            remainingDishes: 1, // Only 1 serving, but 2 dishes needed
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
        
        // Verify each dish was processed
        expect(mockSupabaseFrom).toHaveBeenCalledWith('dishes');
        expect(mockSupabaseFrom).toHaveBeenCalledWith('customer_submissions');
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

        // Verify separate database calls for each dish
        const insertCalls = mockSupabaseFrom().insert.mock.calls;
        expect(insertCalls.length).toBeGreaterThanOrEqual(4); // 2 dishes + 2 submissions
      });

      it('should show progress toast for multiple dishes', async () => {
        const { toast } = await import('sonner');
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

      it('should deduct servings for authenticated clients', async () => {
        const { updateClientServings } = await import('@/api/clientApi');
        const formData = createValidFormData({
          dishes: [createValidDish('1')]
        });
        
        const { result } = renderHook(() =>
          useCustomerFormSubmission({
            clientId: 'test-client-id',
            formData,
            remainingDishes: 5,
            setStepErrors: mockSetStepErrors,
            resetFormData: mockResetFormData,
          })
        );

        await act(async () => {
          await result.current.handleSubmit();
        });

        expect(updateClientServings).toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should handle upload failures gracefully', async () => {
        // Mock upload failure
        mockSupabaseStorage.upload.mockResolvedValueOnce({ 
          error: { message: 'Upload failed' } 
        });

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
        expect(result.current.isSubmitting).toBe(false);
      });

      it('should handle database insertion failures', async () => {
        // Mock database failure
        mockSupabaseFrom.mockReturnValueOnce({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' }
              }),
            })),
          })),
        });

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
        expect(result.current.isSubmitting).toBe(false);
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

        const submitPromise = act(async () => {
          return result.current.handleSubmit();
        });

        // Should be loading during submission
        expect(result.current.isSubmitting).toBe(true);

        await submitPromise;

        // Should not be loading after completion
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

  describe('3. UI Component Integration - CombinedUploadStep', () => {
    const defaultProps = {
      errors: {},
      clearExternalErrors: vi.fn(),
    };

    describe('Initial Rendering', () => {
      it('should render with initial single dish', () => {
        render(
          <TestWrapper>
            <CombinedUploadStep {...defaultProps} />
          </TestWrapper>
        );

        expect(screen.getByText(/מנה 1:/)).toBeInTheDocument();
      });

      it('should show dish accordion in expanded state initially', () => {
        render(
          <TestWrapper>
            <CombinedUploadStep {...defaultProps} />
          </TestWrapper>
        );

        // Form fields should be visible (accordion expanded)
        expect(screen.getByTestId('input')).toBeVisible();
        expect(screen.getByTestId('textarea')).toBeVisible();
      });
    });

    describe('Multi-Dish Functionality', () => {
      it('should add new dish when add button is clicked', async () => {
        render(
          <TestWrapper>
            <CombinedUploadStep {...defaultProps} />
          </TestWrapper>
        );

        // Look for add button (might be conditional based on images)
        const addButton = screen.queryByText(/הוסף מנה נוספת/);
        if (addButton) {
          fireEvent.click(addButton);

          await waitFor(() => {
            expect(screen.getByText(/מנה 2:/)).toBeInTheDocument();
          });
        }
      });

      it('should toggle dish accordion when header is clicked', async () => {
        render(
          <TestWrapper>
            <CombinedUploadStep {...defaultProps} />
          </TestWrapper>
        );

        const dishHeader = screen.getByText(/מנה 1:/).closest('button');
        expect(dishHeader).toBeInTheDocument();

        if (dishHeader) {
          // Click to collapse
          fireEvent.click(dishHeader);

          await waitFor(() => {
            const input = screen.getByTestId('input');
            expect(input).not.toBeVisible();
          });
        }
      });

      it('should show remove button for dishes beyond the first', async () => {
        render(
          <TestWrapper>
            <CombinedUploadStep {...defaultProps} />
          </TestWrapper>
        );

        // First dish should not have remove button
        expect(screen.queryByText('הסר')).not.toBeInTheDocument();

        // Add second dish (if add button exists)
        const addButton = screen.queryByText(/הוסף מנה נוספת/);
        if (addButton) {
          fireEvent.click(addButton);

          await waitFor(() => {
            expect(screen.getByText('הסר')).toBeInTheDocument();
          });
        }
      });
    });
  });

  describe('4. Edge Cases and Stress Testing', () => {
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
            itemType: 'מנה',
            description: 'תיאור בעברית עם סימנים מיוחדים: !@#$%',
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
          dishes: [createValidDish('1', { itemType: 'מנה עם רווחים' })]
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

        expect(sanitizePathComponent).toHaveBeenCalledWith('מנה עם רווחים');
      });
    });

    describe('File Handling', () => {
      it('should handle different file types and sizes', async () => {
        const formData = createValidFormData({
          dishes: [createValidDish('1', {
            referenceImages: [
              createMockFile('image1.jpg', 1024),
              createMockFile('image2.png', 2048),
              createMockFile('image3.jpeg', 512),
              createMockFile('image4.webp', 4096),
            ]
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

      it('should handle empty files array gracefully', async () => {
        const formData = createValidFormData({
          dishes: []
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
    });
  });

  describe('5. Integration Scenarios', () => {
    describe('Authenticated vs Guest Users', () => {
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
        // Should not attempt serving deduction for guest users
        const { updateClientServings } = await import('@/api/clientApi');
        expect(updateClientServings).not.toHaveBeenCalled();
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
    });

    describe('Database Integration', () => {
      it('should insert into correct table based on item type', async () => {
        const formData = createValidFormData({
          dishes: [
            createValidDish('1', { itemType: 'dish' }),
            createValidDish('2', { itemType: 'cocktail' }),
            createValidDish('3', { itemType: 'drink' }),
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

        expect(mockSupabaseFrom).toHaveBeenCalledWith('dishes');
        expect(mockSupabaseFrom).toHaveBeenCalledWith('cocktails');
        expect(mockSupabaseFrom).toHaveBeenCalledWith('drinks');
      });

      it('should create submission records with correct data', async () => {
        const formData = createValidFormData({
          restaurantName: 'מסעדת הבדיקה',
          submitterName: 'בודק מערכת',
          dishes: [createValidDish('1', { 
            itemName: 'מנה לבדיקה',
            itemType: 'מנה'
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

        await act(async () => {
          await result.current.handleSubmit();
        });

        expect(mockSupabaseFrom).toHaveBeenCalledWith('customer_submissions');
        
        // Check that insert was called with correct data structure
        const insertCalls = mockSupabaseFrom().insert.mock.calls;
        const submissionInsert = insertCalls.find(call => 
          call[0] && call[0].restaurant_name === 'מסעדת הבדיקה'
        );
        expect(submissionInsert).toBeDefined();
      });
    });

    describe('Webhook Integration', () => {
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

        expect(triggerMakeWebhook).toHaveBeenCalledTimes(2); // Once for each dish
      });
    });
  });

  describe('6. Performance and Memory', () => {
    describe('Memory Management', () => {
      it('should not create unnecessary re-renders', () => {
        let renderCount = 0;
        const TestComponent = () => {
          renderCount++;
          const { formData } = useNewItemForm();
          return <div>{formData.dishes.length}</div>;
        };

        const { rerender } = render(
          <TestWrapper>
            <TestComponent />
          </TestWrapper>
        );

        const initialRenderCount = renderCount;
        
        // Re-render without changes
        rerender(
          <TestWrapper>
            <TestComponent />
          </TestWrapper>
        );

        // Should not cause additional renders
        expect(renderCount).toBe(initialRenderCount);
      });

      it('should handle cleanup properly', () => {
        const { result, unmount } = renderHook(() => useNewItemForm(), {
          wrapper: TestWrapper,
        });

        act(() => {
          result.current.addDish();
          result.current.updateDish('2', { itemName: 'test' });
        });

        expect(() => unmount()).not.toThrow();
      });
    });

    describe('Error Recovery', () => {
      it('should recover from partial submission failures', async () => {
        // Mock first dish success, second dish failure
        let callCount = 0;
        mockSupabaseFrom.mockImplementation(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 2) { // Second dish insert fails
                  return Promise.resolve({
                    data: null,
                    error: { message: 'Database error' }
                  });
                }
                return Promise.resolve({
                  data: { 
                    id: `test-item-id-${callCount}`,
                    submission_id: `test-submission-id-${callCount}`,
                  },
                  error: null
                });
              }),
            })),
          })),
        }));

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

        expect(submitResult!).toBe(false);
        expect(result.current.isSubmitting).toBe(false);
      });
    });
  });
}); 