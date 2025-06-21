import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Simple mocks without external variables
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
  triggerMakeWebhook: vi.fn(),
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid'),
}));

vi.mock('@/api/clientApi', () => ({
  updateClientServings: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/image.jpg' }
        }),
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { 
              id: 'test-item-id', 
              submission_id: 'test-submission-id',
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
    })),
  },
}));

import { useCustomerFormSubmission } from '../useCustomerFormSubmission';
import { NewItemFormData } from '@/contexts/NewItemFormContext';

const createMockFile = (name: string): File => {
  return new File(['test'], name, { type: 'image/jpeg' });
};

const createValidMultiDishFormData = (overrides: Partial<NewItemFormData> = {}): NewItemFormData => ({
  restaurantName: 'מסעדת הבית',
  submitterName: 'יוסי כהן',
  contactEmail: 'test@example.com',
  contactPhone: '050-1234567',
  itemName: 'פסטה קרבונרה', // Legacy field
  itemType: 'מנה', // Legacy field
  description: '',
  specialNotes: '',
  referenceImages: [],
  brandingMaterials: [],
  referenceExamples: [],
  dishes: [
    {
      id: '1',
      itemName: 'פסטה קרבונרה',
      itemType: 'מנה',
      description: 'פסטה עם ביצים וגבינה',
      specialNotes: 'ללא בצל',
      referenceImages: [
        createMockFile('pasta1.jpg'),
        createMockFile('pasta2.jpg'),
        createMockFile('pasta3.jpg'),
        createMockFile('pasta4.jpg'),
      ],
      brandingMaterials: [],
      referenceExamples: [],
      isCustomItemType: false,
      customItemType: '',
      qualityConfirmed: true,
    },
    {
      id: '2',
      itemName: 'סלט יווני',
      itemType: 'מנה',
      description: 'סלט עם גבינת פטה ועגבניות',
      specialNotes: 'עם זיתים',
      referenceImages: [
        createMockFile('salad1.jpg'),
        createMockFile('salad2.jpg'),
        createMockFile('salad3.jpg'),
        createMockFile('salad4.jpg'),
      ],
      brandingMaterials: [],
      referenceExamples: [],
      isCustomItemType: false,
      customItemType: '',
      qualityConfirmed: true,
    },
  ],
  itemsQuantityRange: '5-10',
  estimatedImagesNeeded: '20',
  primaryImageUsage: 'מדיה חברתית',
  ...overrides,
});

describe('useCustomerFormSubmission - Multi-Dish Feature', () => {
  const mockSetStepErrors = vi.fn();
  const mockResetFormData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Multi-Dish Validation', () => {
    it('should validate restaurant name is required', async () => {
      const formData = createValidMultiDishFormData({ restaurantName: '' });
      
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

    it('should validate each dish individually', async () => {
      const formData = createValidMultiDishFormData({
        dishes: [
          { ...createValidMultiDishFormData().dishes[0], itemName: '' }, // Empty name
          createValidMultiDishFormData().dishes[1], // Valid dish
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

    it('should validate sufficient remaining servings for authenticated clients', async () => {
      const formData = createValidMultiDishFormData(); // 2 dishes
      
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

  describe('Multi-Dish Submission', () => {
    it('should successfully submit multiple dishes', async () => {
      const formData = createValidMultiDishFormData();
      
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
      const formData = createValidMultiDishFormData();
      
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

      const { toast } = await import('sonner');
      expect(toast.info).toHaveBeenCalledWith('מעלה תמונות ושומר 2 הגשות...');
    });

    it('should process each dish as separate submission', async () => {
      const formData = createValidMultiDishFormData();
      
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

      const { supabase } = await import('@/integrations/supabase/client');
      
      // Should create entries for each dish (2 dishes = 4 database calls: 2 items + 2 submissions)
      expect(supabase.from).toHaveBeenCalledWith('dishes');
      expect(supabase.from).toHaveBeenCalledWith('customer_submissions');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty dishes array', async () => {
      const formData = createValidMultiDishFormData({ dishes: [] });
      
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
      
      const { toast } = await import('sonner');
      expect(toast.success).toHaveBeenCalledWith('0 הגשות הושלמו בהצלחה!');
    });

    it('should handle single dish', async () => {
      const formData = createValidMultiDishFormData({
        dishes: [createValidMultiDishFormData().dishes[0]] // Only first dish
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
      
      const { toast } = await import('sonner');
      expect(toast.success).toHaveBeenCalledWith('1 הגשות הושלמו בהצלחה!');
    });

    it('should handle Hebrew characters in item names and types', async () => {
      const formData = createValidMultiDishFormData({
        dishes: [
          {
            ...createValidMultiDishFormData().dishes[0],
            itemName: 'פסטה עם ביצים וגבינה',
            itemType: 'מנה עיקרית חמה',
          }
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
      
      const { sanitizePathComponent } = await import('@/utils/pathSanitization');
      expect(sanitizePathComponent).toHaveBeenCalledWith('מנה עיקרית חמה');
    });
  });

  describe('Error Handling', () => {
    it('should handle upload failures gracefully', async () => {
      // Mock upload failure
      const { supabase } = await import('@/integrations/supabase/client');
      const mockStorageFrom = supabase.storage.from as Mock;
      mockStorageFrom.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: { message: 'Upload failed' } }),
        getPublicUrl: vi.fn(),
      });

      const formData = createValidMultiDishFormData();
      
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
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as Mock;
      mockFrom.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            }),
          })),
        })),
      });

      const formData = createValidMultiDishFormData();
      
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
    });
  });

  describe('State Management', () => {
    it('should manage loading state correctly', async () => {
      const formData = createValidMultiDishFormData();
      
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

      expect(result.current.isSubmitting).toBe(true);

      await submitPromise;

      expect(result.current.isSubmitting).toBe(false);
    });

    it('should manage success modal state', async () => {
      const formData = createValidMultiDishFormData();
      
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