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
    from: vi.fn(() => {
      const mockQuery = {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: { submission_id: 'test-submission-id' }, 
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
          eq: vi.fn(() => Promise.resolve({ 
            data: [{ count: 5 }], 
            error: null 
          }))
        }))
      };
      return mockQuery;
    })
  }
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

describe('useEnhancedFormSubmission - Comprehensive Tests', () => {
  const mockClientId = 'test-client-123';
  const mockSetStepErrors = vi.fn();
  const mockResetFormData = vi.fn();

  const createMockFormData = (overrides?: Partial<NewItemFormData>): NewItemFormData => ({
    dishes: [
      {
        id: '1',
        itemType: 'מנה',
        itemName: 'שניצל ירושלמי',
        description: 'שניצל עסיסי עם תוספות',
        specialNotes: 'ללא גלוטן',
        referenceImages: [
          new File(['image1'], 'image1.jpg', { type: 'image/jpeg' }),
          new File(['image2'], 'image2.jpg', { type: 'image/jpeg' }),
          new File(['image3'], 'image3.jpg', { type: 'image/jpeg' }),
          new File(['image4'], 'image4.jpg', { type: 'image/jpeg' })
        ],
        brandingMaterials: [
          new File(['branding'], 'logo.png', { type: 'image/png' })
        ],
        referenceExamples: [
          new File(['example'], 'example.jpg', { type: 'image/jpeg' })
        ],
        isCustomItemType: false,
        customItemType: '',
        qualityConfirmed: true
      }
    ],
    restaurantName: 'מסעדת הבדיקה',
    submitterName: 'יוסי כהן',
    phone: '0501234567',
    email: 'test@restaurant.co.il',
    // Legacy fields for backward compatibility
    itemName: 'Legacy Item',
    itemType: 'main',
    description: 'Legacy description',
    specialNotes: 'Legacy notes',
    referenceImages: [
      new File(['ref1'], 'ref1.jpg', { type: 'image/jpeg' }),
      new File(['ref2'], 'ref2.jpg', { type: 'image/jpeg' }),
      new File(['ref3'], 'ref3.jpg', { type: 'image/jpeg' }),
      new File(['ref4'], 'ref4.jpg', { type: 'image/jpeg' })
    ],
    brandingMaterials: [],
    referenceExamples: [],
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: createMockFormData(),
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.showSuccessModal).toBe(false);
      expect(result.current.showProgressModal).toBe(false);
      expect(result.current.progressData.currentStep).toBe(0);
      expect(result.current.progressData.totalSteps).toBe(4);
      expect(result.current.progressData.overallProgress).toBe(0);
      expect(result.current.progressData.steps).toHaveLength(4);
      expect(result.current.progressData.canCancel).toBe(true);
      expect(result.current.progressData.isComplete).toBe(false);
    });

    it('should initialize progress steps with correct Hebrew names', () => {
      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: createMockFormData(),
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      const stepNames = result.current.progressData.steps.map(step => step.name);
      expect(stepNames).toEqual([
        'דחיסת תמונות',
        'העלאת תמונות',
        'שמירה במערכת',
        'התראות'
      ]);
    });
  });

  describe('Happy Path - Full Submission Flow', () => {
    it('should complete successful submission with all steps', async () => {
      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: createMockFormData(),
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      // Start submission
      const submitPromise = result.current.handleSubmit();

      // Verify submission started
      expect(result.current.isSubmitting).toBe(true);
      expect(result.current.showProgressModal).toBe(true);

      // Wait for completion
      const success = await submitPromise;

      expect(success).toBe(true);
      expect(toast.success).toHaveBeenCalledWith('1 הגשות הושלמו בהצלחה!');
    });

    it('should process multiple dishes correctly', async () => {
      const formDataWithMultipleDishes = createMockFormData({
        dishes: [
          {
            id: '1',
            itemType: 'מנה',
            itemName: 'שניצל',
            description: 'שניצל טעים',
            specialNotes: '',
            referenceImages: [
              new File(['img1'], 'img1.jpg', { type: 'image/jpeg' }),
              new File(['img1b'], 'img1b.jpg', { type: 'image/jpeg' }),
              new File(['img1c'], 'img1c.jpg', { type: 'image/jpeg' }),
              new File(['img1d'], 'img1d.jpg', { type: 'image/jpeg' })
            ],
            brandingMaterials: [],
            referenceExamples: [],
            isCustomItemType: false,
            customItemType: '',
            qualityConfirmed: true
          },
          {
            id: '2',
            itemType: 'שתיה',
            itemName: 'קוקטייל',
            description: 'קוקטייל מרענן',
            specialNotes: '',
            referenceImages: [
              new File(['img2'], 'img2.jpg', { type: 'image/jpeg' }),
              new File(['img2b'], 'img2b.jpg', { type: 'image/jpeg' }),
              new File(['img2c'], 'img2c.jpg', { type: 'image/jpeg' }),
              new File(['img2d'], 'img2d.jpg', { type: 'image/jpeg' })
            ],
            brandingMaterials: [],
            referenceExamples: [],
            isCustomItemType: false,
            customItemType: '',
            qualityConfirmed: true
          }
        ]
      });

      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: formDataWithMultipleDishes,
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      const success = await result.current.handleSubmit();

      expect(success).toBe(true);
      expect(toast.success).toHaveBeenCalledWith('2 הגשות הושלמו בהצלחה!');
    });

    it('should show completion modal after successful submission', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: createMockFormData(),
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      await result.current.handleSubmit();

      // Fast-forward time to trigger success modal
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(result.current.showProgressModal).toBe(false);
        expect(result.current.showSuccessModal).toBe(true);
      });

      vi.useRealTimers();
    });
  });

  describe('Progress Tracking', () => {
    it('should update progress correctly during compression step', async () => {
      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: createMockFormData(),
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      const submitPromise = result.current.handleSubmit();

      // Check initial compression step
      await waitFor(() => {
        const compressStep = result.current.progressData.steps.find(s => s.id === 'compress');
        expect(compressStep?.status).toBe('in-progress');
      });

      await submitPromise;
    });

    it('should mark steps as completed in sequence', async () => {
      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: createMockFormData(),
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      await result.current.handleSubmit();

      await waitFor(() => {
        const steps = result.current.progressData.steps;
        expect(steps.find(s => s.id === 'compress')?.status).toBe('completed');
        expect(steps.find(s => s.id === 'upload')?.status).toBe('completed');
        expect(steps.find(s => s.id === 'database')?.status).toBe('completed');
        expect(steps.find(s => s.id === 'webhook')?.status).toBe('completed');
      });
    });

    it('should update overall progress to 100% when complete', async () => {
      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: createMockFormData(),
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      await result.current.handleSubmit();

      await waitFor(() => {
        expect(result.current.progressData.overallProgress).toBe(100);
        expect(result.current.progressData.isComplete).toBe(true);
        expect(result.current.progressData.canCancel).toBe(false);
      });
    });
  });

  describe('Cancellation Functionality', () => {
    it('should handle cancellation during submission', async () => {
      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: createMockFormData(),
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      // Start submission
      const submitPromise = result.current.handleSubmit();

      // Cancel during processing
      result.current.handleCancel();

      expect(toast.info).toHaveBeenCalledWith('מבטל העלאה...');
      expect(result.current.progressData.canCancel).toBe(false);

      // Submission should fail due to cancellation
      const success = await submitPromise;
      expect(success).toBe(false);
    });

    it('should disable cancel button after cancellation', () => {
      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: createMockFormData(),
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      result.current.handleCancel();

      expect(result.current.progressData.canCancel).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle compression errors gracefully', async () => {
      const { compressImagesBatch } = await import('@/utils/imageCompression');
      (compressImagesBatch as Mock).mockRejectedValueOnce(new Error('Compression failed'));

      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: createMockFormData(),
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      const success = await result.current.handleSubmit();

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalled();
      expect(mockSetStepErrors).toHaveBeenCalledWith({
        submit: expect.stringContaining('Compression failed')
      });
    });

    it('should handle upload errors gracefully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockUpload = vi.fn(() => Promise.resolve({ 
        data: null, 
        error: { message: 'Upload failed' } 
      }));
      (supabase.storage.from as Mock).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'test-url' } }))
      });

      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: createMockFormData(),
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      const success = await result.current.handleSubmit();

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockInsert = vi.fn(() => Promise.resolve({ 
        data: null, 
        error: { message: 'Database error' } 
      }));
      (supabase.from as Mock).mockReturnValue({
        insert: mockInsert
      });

      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: createMockFormData(),
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      const success = await result.current.handleSubmit();

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalled();
    });

    it('should update progress to show error state on failure', async () => {
      const { compressImagesBatch } = await import('@/utils/imageCompression');
      (compressImagesBatch as Mock).mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: createMockFormData(),
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      await result.current.handleSubmit();

      await waitFor(() => {
        const errorStep = result.current.progressData.steps.find(
          step => step.status === 'error'
        );
        expect(errorStep).toBeDefined();
        expect(result.current.progressData.canCancel).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty dishes array', async () => {
      const formDataWithNoDishes = createMockFormData({
        dishes: []
      });

      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: formDataWithNoDishes,
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      const success = await result.current.handleSubmit();

      expect(success).toBe(true);
      expect(toast.success).toHaveBeenCalledWith('0 הגשות הושלמו בהצלחה!');
    });

    it('should handle dishes with no images', async () => {
      const formDataWithNoImages = createMockFormData({
        dishes: [{
          id: '1',
          itemType: 'מנה',
          itemName: 'מנה ללא תמונות',
          description: 'מנה בלי תמונות',
          specialNotes: '',
          referenceImages: [],
          brandingMaterials: [],
          referenceExamples: [],
          isCustomItemType: false,
          customItemType: '',
          qualityConfirmed: true
        }]
      });

      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: formDataWithNoImages,
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      const success = await result.current.handleSubmit();

      expect(success).toBe(true);
    });

    it('should handle null clientId', async () => {
      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: null,
          formData: createMockFormData(),
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      const success = await result.current.handleSubmit();

      expect(success).toBe(true);
    });
  });

  describe('Modal Management', () => {
    it('should handle success modal close', () => {
      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: createMockFormData(),
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      result.current.handleCloseSuccessModal();

      expect(result.current.showSuccessModal).toBe(false);
    });

    it('should prevent progress modal close during submission', () => {
      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: createMockFormData(),
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      // Start submission
      result.current.handleSubmit();

      // Try to close progress modal during submission
      result.current.handleCloseProgressModal();

      // Should still be open
      expect(result.current.showProgressModal).toBe(true);
    });

    it('should allow progress modal close when submission is complete', async () => {
      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: createMockFormData(),
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      await result.current.handleSubmit();

      // Should be able to close after completion
      result.current.handleCloseProgressModal();

      expect(result.current.showProgressModal).toBe(false);
    });
  });

  describe('Hebrew Language Support', () => {
    it('should display Hebrew success messages', async () => {
      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: createMockFormData(),
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      await result.current.handleSubmit();

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('הגשות הושלמו בהצלחה')
      );
    });

    it('should handle Hebrew item names correctly', async () => {
      const hebrewFormData = createMockFormData({
        dishes: [{
          id: '1',
          itemType: 'מנה עברית',
          itemName: 'שניצל ירושלמי עם חומוס וטחינה',
          description: 'מנה ישראלית מסורתית עם טעמים מזרח תיכוניים',
          specialNotes: 'חלב וביצים - נא לציין אלרגיות',
          referenceImages: [new File(['test'], 'hebrew-dish.jpg', { type: 'image/jpeg' })],
          brandingMaterials: [],
          referenceExamples: [],
          isCustomItemType: true,
          customItemType: 'מנה מיוחדת',
          qualityConfirmed: true
        }]
      });

      const { result } = renderHook(() => 
        useEnhancedFormSubmission({
          clientId: mockClientId,
          formData: hebrewFormData,
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData
        })
      );

      const success = await result.current.handleSubmit();

      expect(success).toBe(true);
    });
  });
}); 