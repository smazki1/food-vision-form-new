import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEnhancedFormSubmission } from '../useEnhancedFormSubmission';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
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

vi.mock('@/lib/triggerMakeWebhook', () => ({
  triggerMakeWebhook: vi.fn(),
}));

vi.mock('@/utils/imageCompression', () => ({
  compressImagesBatch: vi.fn((images: File[]) => Promise.resolve(images)),
  formatFileSize: vi.fn((size: number) => `${size} bytes`),
}));

vi.mock('@/api/clientApi', () => ({
  updateClientServings: vi.fn(),
}));

describe('useEnhancedFormSubmission - Custom Style Feature', () => {
  let mockSupabase: any;
  let mockFormData: any;
  let mockSetStepErrors: any;
  let mockResetFormData: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Supabase
    const { supabase } = require('@/integrations/supabase/client');
    mockSupabase = supabase;

    // Mock successful storage operations
    mockSupabase.storage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/mock-url.jpg' }
      }),
    });

    // Mock successful database operations
    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'mock-item-id' },
            error: null
          }),
        }),
      }),
    });

    mockSetStepErrors = vi.fn();
    mockResetFormData = vi.fn();

    // Basic form data with dishes array
    mockFormData = {
      restaurantName: 'Test Restaurant',
      submitterName: 'Test User',
      dishes: [
        {
          id: '1',
          itemName: 'Test Dish',
          itemType: 'dish',
          description: 'Test description',
          specialNotes: 'Test notes',
          referenceImages: [
            new File(['image1'], 'image1.jpg', { type: 'image/jpeg' }),
            new File(['image2'], 'image2.jpg', { type: 'image/jpeg' }),
            new File(['image3'], 'image3.jpg', { type: 'image/jpeg' }),
            new File(['image4'], 'image4.jpg', { type: 'image/jpeg' }),
          ],
        },
      ],
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Happy Path - Custom Style Processing', () => {
    it('should process custom style files in enhanced submission workflow', async () => {
      mockFormData.customStyle = {
        inspirationImages: [
          new File(['inspiration1'], 'inspiration1.jpg', { type: 'image/jpeg' }),
          new File(['inspiration2'], 'inspiration2.jpg', { type: 'image/jpeg' }),
        ],
        brandingMaterials: [
          new File(['branding1'], 'branding1.pdf', { type: 'application/pdf' }),
        ],
        instructions: 'Enhanced workflow custom style',
      };

      const { result } = renderHook(() =>
        useEnhancedFormSubmission({
          clientId: 'test-client-id',
          formData: mockFormData,
          remainingDishes: 5,
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

      // Verify custom style files were uploaded
      const uploadCalls = mockSupabase.storage.from().upload.mock.calls;
      
      // Should upload regular images + inspiration images + branding materials
      expect(uploadCalls.length).toBeGreaterThan(4);
      
      // Verify custom style paths
      const customStyleUploads = uploadCalls.filter((call: any) => 
        call[0].includes('/custom-style/')
      );
      expect(customStyleUploads.length).toBe(3); // 2 inspiration + 1 branding
    });

    it('should show progress updates for custom style file uploads', async () => {
      mockFormData.customStyle = {
        inspirationImages: [new File(['inspiration'], 'inspiration.jpg', { type: 'image/jpeg' })],
        brandingMaterials: [new File(['branding'], 'branding.pdf', { type: 'application/pdf' })],
        instructions: 'Progress test',
      };

      const { result } = renderHook(() =>
        useEnhancedFormSubmission({
          clientId: 'test-client-id',
          formData: mockFormData,
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData,
        })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Should show progress modal during upload
      expect(result.current.showProgressModal).toBe(false); // Should be closed after completion
      
      // Progress data should indicate completion
      expect(result.current.progressData.isComplete).toBe(true);
      expect(result.current.progressData.overallProgress).toBe(100);
    });

    it('should integrate custom style data into database submission record', async () => {
      mockFormData.customStyle = {
        inspirationImages: [new File(['inspiration'], 'inspiration.jpg', { type: 'image/jpeg' })],
        brandingMaterials: [new File(['branding'], 'branding.pdf', { type: 'application/pdf' })],
        instructions: 'Database integration test',
      };

      const { result } = renderHook(() =>
        useEnhancedFormSubmission({
          clientId: 'test-client-id',
          formData: mockFormData,
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData,
        })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Verify submission data includes custom style fields
      const submissionInsertCalls = mockSupabase.from().insert.mock.calls;
      const submissionCall = submissionInsertCalls.find((call: any) =>
        call[0].submission_status === 'ממתינה לעיבוד'
      );

      expect(submissionCall).toBeDefined();
      const submissionData = submissionCall[0];
      
      expect(submissionData.branding_material_urls).toEqual(['https://example.com/mock-url.jpg']);
      expect(submissionData.reference_example_urls).toEqual(['https://example.com/mock-url.jpg']);
      expect(submissionData.description).toContain('Database integration test');
      expect(submissionData.description).toContain('הוראות סגנון מותאם אישית');
    });

    it('should handle cancellation during custom style upload', async () => {
      mockFormData.customStyle = {
        inspirationImages: [new File(['inspiration'], 'inspiration.jpg', { type: 'image/jpeg' })],
        brandingMaterials: [],
        instructions: 'Cancellation test',
      };

      const { result } = renderHook(() =>
        useEnhancedFormSubmission({
          clientId: 'test-client-id',
          formData: mockFormData,
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData,
        })
      );

      // Start submission
      act(() => {
        result.current.handleSubmit();
      });

      // Cancel immediately
      act(() => {
        result.current.handleCancel();
      });

      // Wait for any pending operations
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should handle cancellation gracefully
      expect(result.current.progressData.canCancel).toBe(false);
    });
  });

  describe('Error Handling in Enhanced Workflow', () => {
    it('should handle custom style upload errors with proper progress updates', async () => {
      mockFormData.customStyle = {
        inspirationImages: [new File(['inspiration'], 'inspiration.jpg', { type: 'image/jpeg' })],
        brandingMaterials: [],
        instructions: 'Error handling test',
      };

      // Mock upload failure for custom style files
      mockSupabase.storage.from.mockReturnValue({
        upload: vi.fn()
          .mockResolvedValueOnce({ error: null }) // Regular images succeed
          .mockResolvedValueOnce({ error: null })
          .mockResolvedValueOnce({ error: null })
          .mockResolvedValueOnce({ error: null })
          .mockRejectedValueOnce(new Error('Custom style upload failed')), // Custom style fails
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/mock-url.jpg' }
        }),
      });

      const { result } = renderHook(() =>
        useEnhancedFormSubmission({
          clientId: 'test-client-id',
          formData: mockFormData,
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData,
        })
      );

      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.handleSubmit();
      });

      expect(submitResult!).toBe(false);
      
      // Should show error in progress steps
      const errorStep = result.current.progressData.steps.find(step => step.status === 'error');
      expect(errorStep).toBeDefined();
      expect(errorStep?.error).toContain('Custom style upload failed');
      
      expect(mockSetStepErrors).toHaveBeenCalledWith({
        submit: expect.stringContaining('Custom style upload failed'),
      });
    });

    it('should handle database errors after successful custom style uploads', async () => {
      mockFormData.customStyle = {
        inspirationImages: [new File(['inspiration'], 'inspiration.jpg', { type: 'image/jpeg' })],
        brandingMaterials: [new File(['branding'], 'branding.pdf', { type: 'application/pdf' })],
        instructions: 'Database error test',
      };

      // Mock successful uploads but failed database operations
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn()
              .mockResolvedValueOnce({ data: { id: 'mock-item-id' }, error: null }) // Item insert succeeds
              .mockRejectedValueOnce(new Error('Submission database error')), // Submission insert fails
          }),
        }),
      });

      const { result } = renderHook(() =>
        useEnhancedFormSubmission({
          clientId: 'test-client-id',
          formData: mockFormData,
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData,
        })
      );

      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.handleSubmit();
      });

      expect(submitResult!).toBe(false);
      
      // Should show error in database step
      const databaseStep = result.current.progressData.steps.find(step => step.id === 'database');
      expect(databaseStep?.status).toBe('error');
      
      expect(mockSetStepErrors).toHaveBeenCalledWith({
        submit: expect.stringContaining('Submission database error'),
      });
    });

    it('should handle webhook errors without affecting custom style data', async () => {
      const { triggerMakeWebhook } = require('@/lib/triggerMakeWebhook');
      triggerMakeWebhook.mockRejectedValue(new Error('Webhook failed'));

      mockFormData.customStyle = {
        inspirationImages: [],
        brandingMaterials: [],
        instructions: 'Webhook error test',
      };

      const { result } = renderHook(() =>
        useEnhancedFormSubmission({
          clientId: 'test-client-id',
          formData: mockFormData,
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData,
        })
      );

      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.handleSubmit();
      });

      expect(submitResult!).toBe(false);
      
      // Should show error in webhook step
      const webhookStep = result.current.progressData.steps.find(step => step.id === 'webhook');
      expect(webhookStep?.status).toBe('error');
      
      // But custom style data should have been saved to database
      const submissionInsertCalls = mockSupabase.from().insert.mock.calls;
      const submissionCall = submissionInsertCalls.find((call: any) =>
        call[0].submission_status === 'ממתינה לעיבוד'
      );
      expect(submissionCall).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of custom style files efficiently', async () => {
      const manyInspirationImages = Array.from({ length: 20 }, (_, i) =>
        new File([`inspiration${i}`], `inspiration${i}.jpg`, { type: 'image/jpeg' })
      );
      const manyBrandingMaterials = Array.from({ length: 10 }, (_, i) =>
        new File([`branding${i}`], `branding${i}.pdf`, { type: 'application/pdf' })
      );

      mockFormData.customStyle = {
        inspirationImages: manyInspirationImages,
        brandingMaterials: manyBrandingMaterials,
        instructions: 'Large files performance test',
      };

      const { result } = renderHook(() =>
        useEnhancedFormSubmission({
          clientId: 'test-client-id',
          formData: mockFormData,
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData,
        })
      );

      const startTime = Date.now();
      await act(async () => {
        await result.current.handleSubmit();
      });
      const endTime = Date.now();

      // Should complete successfully
      expect(result.current.showSuccessModal).toBe(true);
      
      // Should upload all files
      const uploadCalls = mockSupabase.storage.from().upload.mock.calls;
      const customStyleUploads = uploadCalls.filter((call: any) => 
        call[0].includes('/custom-style/')
      );
      expect(customStyleUploads).toHaveLength(30); // 20 inspiration + 10 branding

      // Should complete in reasonable time (this is a mock test, so it should be fast)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle multiple dishes with shared custom style data', async () => {
      // Add multiple dishes
      mockFormData.dishes = [
        {
          id: '1',
          itemName: 'Dish 1',
          itemType: 'dish',
          description: 'First dish',
          specialNotes: 'Notes 1',
          referenceImages: Array.from({ length: 4 }, (_, i) => 
            new File([`dish1-${i}`], `dish1-${i}.jpg`, { type: 'image/jpeg' })
          ),
        },
        {
          id: '2',
          itemName: 'Dish 2',
          itemType: 'cocktail',
          description: 'Second dish',
          specialNotes: 'Notes 2',
          referenceImages: Array.from({ length: 4 }, (_, i) => 
            new File([`dish2-${i}`], `dish2-${i}.jpg`, { type: 'image/jpeg' })
          ),
        },
        {
          id: '3',
          itemName: 'Dish 3',
          itemType: 'drink',
          description: 'Third dish',
          specialNotes: 'Notes 3',
          referenceImages: Array.from({ length: 4 }, (_, i) => 
            new File([`dish3-${i}`], `dish3-${i}.jpg`, { type: 'image/jpeg' })
          ),
        },
      ];

      mockFormData.customStyle = {
        inspirationImages: [new File(['shared-inspiration'], 'shared.jpg', { type: 'image/jpeg' })],
        brandingMaterials: [new File(['shared-branding'], 'shared.pdf', { type: 'application/pdf' })],
        instructions: 'Shared style for all dishes',
      };

      const { result } = renderHook(() =>
        useEnhancedFormSubmission({
          clientId: 'test-client-id',
          formData: mockFormData,
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData,
        })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.showSuccessModal).toBe(true);

      // Should create submissions for all dishes
      const submissionInsertCalls = mockSupabase.from().insert.mock.calls.filter((call: any) =>
        call[0].submission_status === 'ממתינה לעיבוד'
      );
      expect(submissionInsertCalls).toHaveLength(3);

      // All submissions should have the shared custom style data
      submissionInsertCalls.forEach((call: any) => {
        const submissionData = call[0];
        expect(submissionData.reference_example_urls).toEqual(['https://example.com/mock-url.jpg']);
        expect(submissionData.branding_material_urls).toEqual(['https://example.com/mock-url.jpg']);
        expect(submissionData.description).toContain('Shared style for all dishes');
      });

      // Custom style files should only be uploaded once (shared across dishes)
      const uploadCalls = mockSupabase.storage.from().upload.mock.calls;
      const customStyleUploads = uploadCalls.filter((call: any) => 
        call[0].includes('/custom-style/')
      );
      expect(customStyleUploads).toHaveLength(2); // 1 inspiration + 1 branding (shared)
    });
  });

  describe('Progress Tracking and User Experience', () => {
    it('should provide detailed progress updates for custom style processing', async () => {
      mockFormData.customStyle = {
        inspirationImages: [new File(['inspiration'], 'inspiration.jpg', { type: 'image/jpeg' })],
        brandingMaterials: [new File(['branding'], 'branding.pdf', { type: 'application/pdf' })],
        instructions: 'Progress tracking test',
      };

      const { result } = renderHook(() =>
        useEnhancedFormSubmission({
          clientId: 'test-client-id',
          formData: mockFormData,
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData,
        })
      );

      // Check initial progress state
      expect(result.current.progressData.steps).toHaveLength(4);
      expect(result.current.progressData.steps.map(s => s.id)).toEqual([
        'compress', 'upload', 'database', 'webhook'
      ]);

      await act(async () => {
        await result.current.handleSubmit();
      });

      // All steps should be completed
      result.current.progressData.steps.forEach(step => {
        expect(step.status).toBe('completed');
        expect(step.progress).toBe(100);
      });
    });

    it('should show appropriate Hebrew messages for custom style processing', async () => {
      mockFormData.customStyle = {
        inspirationImages: [new File(['inspiration'], 'inspiration.jpg', { type: 'image/jpeg' })],
        brandingMaterials: [],
        instructions: 'Hebrew messages test',
      };

      const { result } = renderHook(() =>
        useEnhancedFormSubmission({
          clientId: 'test-client-id',
          formData: mockFormData,
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData,
        })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Should show Hebrew success message
      expect(toast.success).toHaveBeenCalledWith('1 הגשות הושלמו בהצלחה!');
    });

    it('should maintain consistent state throughout custom style submission process', async () => {
      mockFormData.customStyle = {
        inspirationImages: [new File(['inspiration'], 'inspiration.jpg', { type: 'image/jpeg' })],
        brandingMaterials: [new File(['branding'], 'branding.pdf', { type: 'application/pdf' })],
        instructions: 'State consistency test',
      };

      const { result } = renderHook(() =>
        useEnhancedFormSubmission({
          clientId: 'test-client-id',
          formData: mockFormData,
          remainingDishes: 5,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData,
        })
      );

      // Initial state
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.showSuccessModal).toBe(false);
      expect(result.current.showProgressModal).toBe(false);

      // Start submission
      let submitPromise: Promise<boolean>;
      act(() => {
        submitPromise = result.current.handleSubmit();
      });

      // During submission
      expect(result.current.isSubmitting).toBe(true);
      expect(result.current.showProgressModal).toBe(true);

      // Wait for completion
      await act(async () => {
        await submitPromise!;
      });

      // After completion
      expect(result.current.isSubmitting).toBe(false);
      // Progress modal should close and success modal should show after delay
      expect(result.current.progressData.isComplete).toBe(true);
    });
  });
}); 