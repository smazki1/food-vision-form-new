import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  sanitizePathComponent: vi.fn((path: string) => path),
}));

vi.mock('@/lib/triggerMakeWebhook', () => ({
  triggerMakeWebhook: vi.fn(),
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid'),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

import { useCustomerFormSubmission } from './useCustomerFormSubmission';
import { NewItemFormData } from '@/contexts/NewItemFormContext';

const createMockFile = (name: string): File => {
  return new File(['test'], name, { type: 'image/jpeg' });
};

const createValidFormData = (overrides: Partial<NewItemFormData> = {}): NewItemFormData => ({
  itemType: 'dish',
  itemName: 'Test Dish',
  description: 'Test Description',
  specialNotes: 'Test Notes',
  referenceImages: [
    createMockFile('1.jpg'),
    createMockFile('2.jpg'),
    createMockFile('3.jpg'),
    createMockFile('4.jpg'),
  ],
  restaurantName: 'Test Restaurant',
  submitterName: 'Test Submitter',
  brandingMaterials: [],
  referenceExamples: [],
  dishes: [],
  itemsQuantityRange: '',
  estimatedImagesNeeded: '',
  primaryImageUsage: '',
  ...overrides,
});

describe('useCustomerFormSubmission', () => {
  const mockSetStepErrors = vi.fn();
  const mockResetFormData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  describe('Hook Initialization', () => {
    it('should initialize with correct default state', () => {
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
      expect(result.current.showSuccessModal).toBe(false);
      expect(typeof result.current.handleSubmit).toBe('function');
      expect(typeof result.current.handleCloseSuccessModal).toBe('function');
    });

    it('should handle success modal close', () => {
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

      act(() => {
        result.current.handleCloseSuccessModal();
      });
      
      expect(result.current.showSuccessModal).toBe(false);
    });
  });

  describe('Form Validation', () => {
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
        restaurantName: 'שם המסעדה הוא שדה חובה.',
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
        submitterName: 'שם איש הקשר הוא שדה חובה.',
      });
    });

    it('should validate item name is required', async () => {
      const formData = createValidFormData({ itemName: '' });
      
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
        itemName: 'שם הפריט הוא שדה חובה.',
      });
    });

    it('should validate item type is required', async () => {
      const formData = createValidFormData({ itemType: '' as any });
      
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
        itemType: 'סוג הפריט הוא שדה חובה.',
      });
    });

    it('should validate minimum 4 images required', async () => {
      const formData = createValidFormData({
        referenceImages: [createMockFile('1.jpg')],
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
        referenceImages: 'יש להעלות לפחות 4 תמונות.',
      });
    });

    it('should validate image quality confirmation', async () => {
      const formData = createValidFormData();
      
      (window.localStorage.getItem as any).mockReturnValue(null);
      
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
        imageQuality: 'יש לאשר את איכות התמונות לפני ההגשה.',
      });
    });

    it('should validate remaining dishes for authenticated users', async () => {
      const formData = createValidFormData();
      
      // Set image quality confirmed to pass that validation first
      (window.localStorage.getItem as any).mockReturnValue('true');
      
      const { result } = renderHook(() =>
        useCustomerFormSubmission({
          clientId: 'test-client-id',
          formData,
          remainingDishes: 0,
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
        submit: 'אין לכם/ן מספיק מנות נותרות בחבילה כדי לבצע הגשה זו.',
      });
    });
  });

  describe('State Management', () => {
    it('should manage submission state correctly', async () => {
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
      
      // Test validation failure (missing image quality confirmation)
      (window.localStorage.getItem as any).mockReturnValue(null);
      
      await act(async () => {
        await result.current.handleSubmit();
      });
      
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should handle success modal state transitions', () => {
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
      
      act(() => {
        result.current.handleCloseSuccessModal();
      });
      
      expect(result.current.showSuccessModal).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined remaining dishes for guest users', async () => {
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

      // This should not fail due to remaining dishes check since clientId is null
      (window.localStorage.getItem as any).mockReturnValue(null);
      
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.handleSubmit();
      });

      // Should fail due to image quality confirmation, not remaining dishes
      expect(submitResult!).toBe(false);
      expect(mockSetStepErrors).toHaveBeenCalledWith({
        imageQuality: 'יש לאשר את איכות התמונות לפני ההגשה.',
      });
    });

    it('should handle whitespace-only input validation', async () => {
      const formData = createValidFormData({ 
        restaurantName: '   ',
        submitterName: '   ',
        itemName: '   ',
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
      // Should fail on first validation (restaurant name)
      expect(mockSetStepErrors).toHaveBeenCalledWith({
        restaurantName: 'שם המסעדה הוא שדה חובה.',
      });
    });
  });

  describe('Integration Points', () => {
    it('should handle different item types', () => {
      const cocktailFormData = createValidFormData({ itemType: 'cocktail' });
      const drinkFormData = createValidFormData({ itemType: 'drink' });
      
      const { result: cocktailResult } = renderHook(() =>
        useCustomerFormSubmission({
          clientId: null,
          formData: cocktailFormData,
          remainingDishes: undefined,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData,
        })
      );

      const { result: drinkResult } = renderHook(() =>
        useCustomerFormSubmission({
          clientId: null,
          formData: drinkFormData,
          remainingDishes: undefined,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData,
        })
      );

      expect(cocktailResult.current.handleSubmit).toBeDefined();
      expect(drinkResult.current.handleSubmit).toBeDefined();
    });

    it('should handle Hebrew characters in form data', () => {
      const hebrewFormData = createValidFormData({
        restaurantName: 'מסעדת הטעמים',
        submitterName: 'יוסי כהן',
        itemName: 'חמבורגר מיוחד',
        description: 'תיאור בעברית',
        specialNotes: 'הערות מיוחדות',
      });
      
      const { result } = renderHook(() =>
        useCustomerFormSubmission({
          clientId: null,
          formData: hebrewFormData,
          remainingDishes: undefined,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData,
        })
      );

      expect(result.current.handleSubmit).toBeDefined();
      expect(result.current.isSubmitting).toBe(false);
    });
  });
}); 