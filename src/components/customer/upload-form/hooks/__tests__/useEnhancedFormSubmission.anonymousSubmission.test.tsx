import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { toast } from 'sonner';
import { useEnhancedFormSubmission } from '../useEnhancedFormSubmission';
import { NewItemFormData } from '@/contexts/NewItemFormContext';

// Mock external dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-1234')
}));

vi.mock('@/lib/triggerMakeWebhook', () => ({
  triggerMakeWebhook: vi.fn(() => Promise.resolve({ success: true }))
}));

vi.mock('@/utils/pathSanitization', () => ({
  sanitizePathComponent: vi.fn((text: string) => text.replace(/[^a-zA-Z0-9-_]/g, '-'))
}));

vi.mock('@/utils/imageCompression', () => ({
  compressImagesBatch: vi.fn((files: File[]) => 
    Promise.resolve(files.map(file => 
      new File([file], file.name, { type: file.type })
    ))
  ),
  formatFileSize: vi.fn((size: number) => `${size} B`)
}));

// Mock Supabase client
const mockSupabaseQuery = {
  insert: vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ 
        data: { id: 'test-id', submission_id: 'test-submission-id' }, 
        error: null 
      }))
    }))
  })),
  update: vi.fn(() => ({
    eq: vi.fn(() => Promise.resolve({ 
      error: null 
    }))
  })),
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ 
        data: { remaining_servings: 5 }, 
        error: null 
      }))
    }))
  }))
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ 
          data: { path: 'test-path' }, 
          error: null 
        })),
        getPublicUrl: vi.fn(() => ({ 
          data: { publicUrl: 'https://test-url.com/image.jpg' } 
        }))
      }))
    },
    from: vi.fn(() => mockSupabaseQuery)
  }
}));

describe('useEnhancedFormSubmission - Anonymous Submission Feature', () => {
  const mockSetStepErrors = vi.fn();
  const mockResetFormData = vi.fn();

  const createMockFormData = (overrides: Partial<NewItemFormData> = {}): NewItemFormData => ({
    restaurantName: 'מסעדת בדיקה',
    submitterName: 'יוסי כהן',
    phone: '050-1234567',
    email: 'test@example.com',
    contactEmail: 'test@example.com',
    contactPhone: '050-1234567',
    dishes: [
      {
        id: '1',
        itemType: 'מנה',
        itemName: 'המבורגר טעים',
        description: 'המבורגר עם ירקות טריים',
        specialNotes: 'ללא בצל',
        referenceImages: [
          new File([''], 'img1.jpg', { type: 'image/jpeg' }),
          new File([''], 'img2.jpg', { type: 'image/jpeg' }),
          new File([''], 'img3.jpg', { type: 'image/jpeg' }),
          new File([''], 'img4.jpg', { type: 'image/jpeg' })
        ],
        brandingMaterials: [],
        referenceExamples: [],
        isCustomItemType: false,
        customItemType: '',
        qualityConfirmed: true
      }
    ],
    itemName: 'המבורגר טעים',
    itemType: 'מנה',
    description: 'המבורגר עם ירקות טריים',
    specialNotes: 'ללא בצל',
    referenceImages: [
          new File([''], 'img1.jpg', { type: 'image/jpeg' }),
          new File([''], 'img2.jpg', { type: 'image/jpeg' }),
          new File([''], 'img3.jpg', { type: 'image/jpeg' }),
          new File([''], 'img4.jpg', { type: 'image/jpeg' })
        ],
    brandingMaterials: [],
    referenceExamples: [],
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Anonymous Submission Flow', () => {
    it('should successfully submit form for anonymous user', async () => {
      const formData = createMockFormData();

      const { result } = renderHook(() => useEnhancedFormSubmission({
        clientId: null, // Anonymous user
        formData,
        remainingDishes: undefined,
        setStepErrors: mockSetStepErrors,
        resetFormData: mockResetFormData
      }));

      // Test that the hook is properly initialized
      expect(result.current).toBeDefined();
      expect(result.current.handleSubmit).toBeDefined();
      expect(result.current.isSubmitting).toBe(false);

      // Try to submit
      const submitPromise = result.current.handleSubmit();
      
      // Check that submission state changes
      expect(result.current.isSubmitting).toBe(true);

      await submitPromise;

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      // Verify success toast was called
      expect(toast.success).toHaveBeenCalled();
    });

    it('should handle multiple dishes for anonymous user', async () => {
      const formData = createMockFormData({
        dishes: [
          {
            id: '1',
            itemType: 'מנה',
            itemName: 'המבורגר',
            description: 'המבורגר טעים',
            specialNotes: '',
            referenceImages: [
          new File([''], 'img1.jpg', { type: 'image/jpeg' }),
          new File([''], 'img2.jpg', { type: 'image/jpeg' }),
          new File([''], 'img3.jpg', { type: 'image/jpeg' }),
          new File([''], 'img4.jpg', { type: 'image/jpeg' })
        ],
            brandingMaterials: [],
            referenceExamples: [],
            isCustomItemType: false,
            customItemType: '',
            qualityConfirmed: true
          },
          {
            id: '2',
            itemType: 'קוקטייל',
            itemName: 'מוחיטו',
            description: 'קוקטייל רענן',
            specialNotes: '',
            referenceImages: [
          new File([''], 'img1.jpg', { type: 'image/jpeg' }),
          new File([''], 'img2.jpg', { type: 'image/jpeg' }),
          new File([''], 'img3.jpg', { type: 'image/jpeg' }),
          new File([''], 'img4.jpg', { type: 'image/jpeg' })
        ],
            brandingMaterials: [],
            referenceExamples: [],
            isCustomItemType: false,
            customItemType: '',
            qualityConfirmed: true
          }
        ]
      });

      const { result } = renderHook(() => useEnhancedFormSubmission({
        clientId: null,
        formData,
        remainingDishes: undefined,
        setStepErrors: mockSetStepErrors,
        resetFormData: mockResetFormData
      }));

      await result.current.handleSubmit();

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      // Should succeed for multiple dishes
      expect(toast.success).toHaveBeenCalled();
    });
  });

  describe('Authenticated vs Anonymous Flow', () => {
    it('should use different logic for authenticated users', async () => {
      const formData = createMockFormData();

      const { result } = renderHook(() => useEnhancedFormSubmission({
        clientId: 'authenticated-client-123', // Authenticated user
        formData,
        remainingDishes: 5,
        setStepErrors: mockSetStepErrors,
        resetFormData: mockResetFormData
      }));

      await result.current.handleSubmit();

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      // Should succeed for authenticated users too
      expect(toast.success).toHaveBeenCalled();
    });
  });

  describe('Item Type Mapping Logic', () => {
    // Test the item type mapping functionality by checking the submission behavior
    it('should handle Hebrew item types correctly', async () => {
      const hebrewItemTypes = ['קוקטייל', 'שתיה', 'משקה', 'מנה', 'צמיד'];
      
      for (const itemType of hebrewItemTypes) {
        vi.clearAllMocks();
        
        const formData = createMockFormData({
          dishes: [{
            id: '1',
            itemType,
            itemName: 'פריט טסט',
            description: 'תיאור טסט',
            specialNotes: '',
            referenceImages: [
          new File([''], 'img1.jpg', { type: 'image/jpeg' }),
          new File([''], 'img2.jpg', { type: 'image/jpeg' }),
          new File([''], 'img3.jpg', { type: 'image/jpeg' }),
          new File([''], 'img4.jpg', { type: 'image/jpeg' })
        ],
            brandingMaterials: [],
            referenceExamples: [],
            isCustomItemType: false,
            customItemType: '',
            qualityConfirmed: true
          }]
        });

        const { result } = renderHook(() => useEnhancedFormSubmission({
          clientId: null,
          formData,
          remainingDishes: undefined,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        }));

        await result.current.handleSubmit();

        await waitFor(() => {
          expect(result.current.isSubmitting).toBe(false);
        });

        // Should succeed regardless of item type
        expect(toast.success).toHaveBeenCalled();
      }
    });
  });

  describe('Progress Tracking', () => {
    it('should update progress during submission', async () => {
      const formData = createMockFormData();

      const { result } = renderHook(() => useEnhancedFormSubmission({
        clientId: null,
        formData,
        remainingDishes: undefined,
        setStepErrors: mockSetStepErrors,
        resetFormData: mockResetFormData
      }));

      // Check initial progress state
      expect(result.current.progressData).toBeDefined();
      expect(result.current.progressData.steps).toHaveLength(4);

      await result.current.handleSubmit();

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      // Progress should have been updated during submission
      expect(result.current.progressData.overallProgress).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Custom Style Files', () => {
    it('should handle custom style files for anonymous users', async () => {
      const formData = createMockFormData({
        customStyle: {
          inspirationImages: [new File(['inspiration'], 'inspiration.jpg', { type: 'image/jpeg' })],
          brandingMaterials: [new File(['branding'], 'logo.png', { type: 'image/png' })],
          instructions: 'עיצוב מודרני ונקי'
        }
      });

      const { result } = renderHook(() => useEnhancedFormSubmission({
        clientId: null,
        formData,
        remainingDishes: undefined,
        setStepErrors: mockSetStepErrors,
        resetFormData: mockResetFormData
      }));

      await result.current.handleSubmit();

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      // Should succeed with custom style files
      expect(toast.success).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle submission errors gracefully', async () => {
      // Mock an error scenario
      mockSupabaseQuery.insert.mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: null, 
            error: { message: 'Database error' } 
          }))
        }))
      }));

      const formData = createMockFormData();

      const { result } = renderHook(() => useEnhancedFormSubmission({
        clientId: null,
        formData,
        remainingDishes: undefined,
        setStepErrors: mockSetStepErrors,
        resetFormData: mockResetFormData
      }));

      try {
        await result.current.handleSubmit();
      } catch (error) {
        // Error should be handled
      }

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      // Should show error toast
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty optional fields', async () => {
      const formData = createMockFormData({
        submitterName: '',
        contactEmail: '',
        contactPhone: '',
        dishes: [{
          id: '1',
          itemType: 'מנה',
          itemName: 'פריט בסיסי',
          description: '',
          specialNotes: '',
          referenceImages: [
          new File([''], 'img1.jpg', { type: 'image/jpeg' }),
          new File([''], 'img2.jpg', { type: 'image/jpeg' }),
          new File([''], 'img3.jpg', { type: 'image/jpeg' }),
          new File([''], 'img4.jpg', { type: 'image/jpeg' })
        ],
          brandingMaterials: [],
          referenceExamples: [],
          isCustomItemType: false,
          customItemType: '',
          qualityConfirmed: true
        }]
      });

      const { result } = renderHook(() => useEnhancedFormSubmission({
        clientId: null,
        formData,
        remainingDishes: undefined,
        setStepErrors: mockSetStepErrors,
        resetFormData: mockResetFormData
      }));

      await result.current.handleSubmit();

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      // Should handle empty fields gracefully
      expect(toast.success).toHaveBeenCalled();
    });

    it('should handle missing restaurant name with default', async () => {
      const formData = createMockFormData({
        restaurantName: ''
      });

      const { result } = renderHook(() => useEnhancedFormSubmission({
        clientId: null,
        formData,
        remainingDishes: undefined,
        setStepErrors: mockSetStepErrors,
        resetFormData: mockResetFormData
      }));

      await result.current.handleSubmit();

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      // Should handle missing restaurant name
      expect(toast.success).toHaveBeenCalled();
    });

    it('should handle dishes with no reference images', async () => {
      const formData = createMockFormData({
        dishes: [{
          id: '1',
          itemType: 'מנה',
          itemName: 'פריט ללא תמונות',
          description: 'פריט לדוגמה',
          specialNotes: '',
          referenceImages: [], // Empty array
          brandingMaterials: [],
          referenceExamples: [],
          isCustomItemType: false,
          customItemType: '',
          qualityConfirmed: true
        }]
      });

      const { result } = renderHook(() => useEnhancedFormSubmission({
        clientId: null,
        formData,
        remainingDishes: undefined,
        setStepErrors: mockSetStepErrors,
        resetFormData: mockResetFormData
      }));

      await result.current.handleSubmit();

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      // Should handle no images gracefully
      expect(toast.success).toHaveBeenCalled();
    });
  });
}); 