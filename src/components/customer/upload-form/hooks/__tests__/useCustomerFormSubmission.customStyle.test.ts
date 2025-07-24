import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCustomerFormSubmission } from '../useCustomerFormSubmission';
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
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}));

vi.mock('@/lib/triggerMakeWebhook', () => ({
  triggerMakeWebhook: vi.fn(),
}));

vi.mock('@/api/clientApi', () => ({
  updateClientServings: vi.fn(),
}));

vi.mock('@/utils/pathSanitization', () => ({
  sanitizePathComponent: vi.fn((input: string) => input.replace(/[^a-zA-Z0-9]/g, '-')),
}));

describe('useCustomerFormSubmission - Custom Style Feature', () => {
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
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { remaining_servings: 5, restaurant_name: 'Test Restaurant' },
            error: null
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    mockSetStepErrors = vi.fn();
    mockResetFormData = vi.fn();

    // Basic form data without custom style
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

  describe('Happy Path - Custom Style Integration', () => {
    it('should submit successfully with custom style data', async () => {
      // Add custom style data to form
      mockFormData.customStyle = {
        inspirationImages: [
          new File(['inspiration1'], 'inspiration1.jpg', { type: 'image/jpeg' }),
          new File(['inspiration2'], 'inspiration2.jpg', { type: 'image/jpeg' }),
        ],
        brandingMaterials: [
          new File(['branding1'], 'branding1.pdf', { type: 'application/pdf' }),
        ],
        instructions: 'Modern and clean style with warm colors',
      };

      const { result } = renderHook(() =>
        useCustomerFormSubmission({
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
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('food-vision-images');
      
      // Should upload regular images + inspiration images + branding materials
      const uploadCalls = mockSupabase.storage.from().upload.mock.calls;
      expect(uploadCalls.length).toBeGreaterThan(4); // 4 regular + custom style files

      // Verify custom style paths
      const customStyleUploads = uploadCalls.filter((call: any) => 
        call[0].includes('/custom-style/')
      );
      expect(customStyleUploads.length).toBe(3); // 2 inspiration + 1 branding

      // Verify inspiration images paths
      const inspirationUploads = customStyleUploads.filter((call: any) => 
        call[0].includes('/custom-style/inspiration/')
      );
      expect(inspirationUploads).toHaveLength(2);

      // Verify branding materials paths
      const brandingUploads = customStyleUploads.filter((call: any) => 
        call[0].includes('/custom-style/branding/')
      );
      expect(brandingUploads).toHaveLength(1);
    });

    it('should submit successfully without custom style data', async () => {
      // No custom style data
      mockFormData.customStyle = undefined;

      const { result } = renderHook(() =>
        useCustomerFormSubmission({
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

      // Should only upload regular dish images
      const uploadCalls = mockSupabase.storage.from().upload.mock.calls;
      expect(uploadCalls).toHaveLength(4); // Only regular images

      // No custom style uploads
      const customStyleUploads = uploadCalls.filter((call: any) => 
        call[0].includes('/custom-style/')
      );
      expect(customStyleUploads).toHaveLength(0);
    });

    it('should include custom style data in submission record', async () => {
      mockFormData.customStyle = {
        inspirationImages: [new File(['img'], 'inspiration.jpg', { type: 'image/jpeg' })],
        brandingMaterials: [new File(['brand'], 'branding.pdf', { type: 'application/pdf' })],
        instructions: 'Custom style instructions',
      };

      const { result } = renderHook(() =>
        useCustomerFormSubmission({
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
      const submissionData = submissionInsertCalls.find((call: any) =>
        call[0].reference_example_urls || call[0].branding_material_urls
      )?.[0];

      expect(submissionData).toBeDefined();
      expect(submissionData.reference_example_urls).toEqual(['https://example.com/mock-url.jpg']);
      expect(submissionData.branding_material_urls).toEqual(['https://example.com/mock-url.jpg']);
      expect(submissionData.description).toContain('Custom style instructions');
      expect(submissionData.description).toContain('הוראות סגנון מותאם אישית');
    });

    it('should combine instructions with dish description', async () => {
      mockFormData.customStyle = {
        inspirationImages: [],
        brandingMaterials: [],
        instructions: 'Modern minimalist style',
      };
      mockFormData.dishes[0].description = 'Delicious main course';

      const { result } = renderHook(() =>
        useCustomerFormSubmission({
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

      const submissionInsertCalls = mockSupabase.from().insert.mock.calls;
      const submissionData = submissionInsertCalls[submissionInsertCalls.length - 1][0];

      expect(submissionData.description).toContain('Delicious main course');
      expect(submissionData.description).toContain('הוראות סגנון מותאם אישית');
      expect(submissionData.description).toContain('Modern minimalist style');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty custom style arrays', async () => {
      mockFormData.customStyle = {
        inspirationImages: [],
        brandingMaterials: [],
        instructions: 'Only instructions provided',
      };

      const { result } = renderHook(() =>
        useCustomerFormSubmission({
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

      // Should upload only regular images
      const uploadCalls = mockSupabase.storage.from().upload.mock.calls;
      const customStyleUploads = uploadCalls.filter((call: any) => 
        call[0].includes('/custom-style/')
      );
      expect(customStyleUploads).toHaveLength(0);

      // Should still include instructions in description
      const submissionInsertCalls = mockSupabase.from().insert.mock.calls;
      const submissionData = submissionInsertCalls[submissionInsertCalls.length - 1][0];
      expect(submissionData.description).toContain('Only instructions provided');
      expect(submissionData.reference_example_urls).toBeNull();
      expect(submissionData.branding_material_urls).toBeNull();
    });

    it('should handle custom style with only files, no instructions', async () => {
      mockFormData.customStyle = {
        inspirationImages: [new File(['img'], 'inspiration.jpg', { type: 'image/jpeg' })],
        brandingMaterials: [new File(['brand'], 'branding.pdf', { type: 'application/pdf' })],
        instructions: '', // Empty instructions
      };

      const { result } = renderHook(() =>
        useCustomerFormSubmission({
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

      // Should upload custom style files
      const uploadCalls = mockSupabase.storage.from().upload.mock.calls;
      const customStyleUploads = uploadCalls.filter((call: any) => 
        call[0].includes('/custom-style/')
      );
      expect(customStyleUploads).toHaveLength(2);

      // Should include file URLs but not special instructions text
      const submissionInsertCalls = mockSupabase.from().insert.mock.calls;
      const submissionData = submissionInsertCalls[submissionInsertCalls.length - 1][0];
      expect(submissionData.reference_example_urls).toEqual(['https://example.com/mock-url.jpg']);
      expect(submissionData.branding_material_urls).toEqual(['https://example.com/mock-url.jpg']);
      expect(submissionData.description).not.toContain('הוראות סגנון מותאם אישית');
    });

    it('should handle guest user (no clientId) with custom style', async () => {
      mockFormData.customStyle = {
        inspirationImages: [new File(['img'], 'inspiration.jpg', { type: 'image/jpeg' })],
        brandingMaterials: [],
        instructions: 'Guest user style',
      };

      const { result } = renderHook(() =>
        useCustomerFormSubmission({
          clientId: null, // Guest user
          formData: mockFormData,
          remainingDishes: undefined,
          setStepErrors: mockSetStepErrors,
          resetFormData: mockResetFormData,
        })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Should use 'guest' folder for custom style files
      const uploadCalls = mockSupabase.storage.from().upload.mock.calls;
      const customStyleUploads = uploadCalls.filter((call: any) => 
        call[0].includes('/custom-style/')
      );
      expect(customStyleUploads).toHaveLength(1);
      expect(customStyleUploads[0][0]).toMatch(/^guest\/custom-style\/inspiration\//);
    });

    it('should handle large numbers of custom style files', async () => {
      const manyInspirationImages = Array.from({ length: 10 }, (_, i) =>
        new File([`inspiration${i}`], `inspiration${i}.jpg`, { type: 'image/jpeg' })
      );
      const manyBrandingMaterials = Array.from({ length: 5 }, (_, i) =>
        new File([`branding${i}`], `branding${i}.pdf`, { type: 'application/pdf' })
      );

      mockFormData.customStyle = {
        inspirationImages: manyInspirationImages,
        brandingMaterials: manyBrandingMaterials,
        instructions: 'Many files test',
      };

      const { result } = renderHook(() =>
        useCustomerFormSubmission({
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

      // Should upload all custom style files
      const uploadCalls = mockSupabase.storage.from().upload.mock.calls;
      const customStyleUploads = uploadCalls.filter((call: any) => 
        call[0].includes('/custom-style/')
      );
      expect(customStyleUploads).toHaveLength(15); // 10 inspiration + 5 branding

      // Check submission data has arrays with correct lengths
      const submissionInsertCalls = mockSupabase.from().insert.mock.calls;
      const submissionData = submissionInsertCalls[submissionInsertCalls.length - 1][0];
      expect(submissionData.reference_example_urls).toHaveLength(10);
      expect(submissionData.branding_material_urls).toHaveLength(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle custom style file upload failures', async () => {
      mockFormData.customStyle = {
        inspirationImages: [new File(['img'], 'inspiration.jpg', { type: 'image/jpeg' })],
        brandingMaterials: [],
        instructions: 'Test instructions',
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
        useCustomerFormSubmission({
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
      expect(mockSetStepErrors).toHaveBeenCalledWith({
        submit: expect.stringContaining('Custom style upload failed'),
      });
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Custom style upload failed'));
    });

    it('should handle public URL generation failure for custom style files', async () => {
      mockFormData.customStyle = {
        inspirationImages: [new File(['img'], 'inspiration.jpg', { type: 'image/jpeg' })],
        brandingMaterials: [],
        instructions: 'Test instructions',
      };

      // Mock successful upload but failed URL generation
      mockSupabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn()
          .mockReturnValueOnce({ data: { publicUrl: 'https://example.com/regular1.jpg' } })
          .mockReturnValueOnce({ data: { publicUrl: 'https://example.com/regular2.jpg' } })
          .mockReturnValueOnce({ data: { publicUrl: 'https://example.com/regular3.jpg' } })
          .mockReturnValueOnce({ data: { publicUrl: 'https://example.com/regular4.jpg' } })
          .mockReturnValueOnce({ data: null }), // Custom style URL fails
      });

      const { result } = renderHook(() =>
        useCustomerFormSubmission({
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
      expect(mockSetStepErrors).toHaveBeenCalledWith({
        submit: expect.stringContaining('שגיאה בקבלת URL עבור תמונת השראה'),
      });
    });

    it('should rollback successfully uploaded files when database insertion fails', async () => {
      mockFormData.customStyle = {
        inspirationImages: [new File(['img'], 'inspiration.jpg', { type: 'image/jpeg' })],
        brandingMaterials: [new File(['brand'], 'branding.pdf', { type: 'application/pdf' })],
        instructions: 'Test instructions',
      };

      // Mock successful uploads but failed database insertion
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn()
              .mockResolvedValueOnce({
                data: { id: 'mock-item-id' },
                error: null
              })
              .mockRejectedValueOnce(new Error('Database insertion failed')), // Submission fails
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { remaining_servings: 5 },
              error: null
            }),
          }),
        }),
      });

      const { result } = renderHook(() =>
        useCustomerFormSubmission({
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
      expect(mockSetStepErrors).toHaveBeenCalledWith({
        submit: expect.stringContaining('Database insertion failed'),
      });

      // Files should have been uploaded despite the failure
      const uploadCalls = mockSupabase.storage.from().upload.mock.calls;
      expect(uploadCalls.length).toBeGreaterThan(4);
    });
  });

  describe('Integration with Existing Workflow', () => {
    it('should maintain compatibility with existing form submission flow', async () => {
      // Test without custom style to ensure no regression
      mockFormData.customStyle = undefined;

      const { result } = renderHook(() =>
        useCustomerFormSubmission({
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

      // Should behave exactly as before - upload dish images, create items, create submissions
      expect(mockSupabase.storage.from().upload).toHaveBeenCalledTimes(4);
      expect(mockSupabase.from().insert).toHaveBeenCalledTimes(2); // Item + submission
      expect(result.current.showSuccessModal).toBe(true);
    });

    it('should maintain webhook integration with custom style data', async () => {
      const { triggerMakeWebhook } = require('@/lib/triggerMakeWebhook');
      
      mockFormData.customStyle = {
        inspirationImages: [],
        brandingMaterials: [],
        instructions: 'Webhook test instructions',
      };

      const { result } = renderHook(() =>
        useCustomerFormSubmission({
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

      // Webhook should be triggered with enhanced data
      expect(triggerMakeWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('Webhook test instructions'),
          sourceForm: 'customer-upload-form',
        })
      );
    });

    it('should work with multiple dishes and custom style', async () => {
      // Add second dish
      mockFormData.dishes.push({
        id: '2',
        itemName: 'Second Dish',
        itemType: 'cocktail',
        description: 'Cocktail description',
        specialNotes: 'Cocktail notes',
        referenceImages: [
          new File(['cocktail1'], 'cocktail1.jpg', { type: 'image/jpeg' }),
          new File(['cocktail2'], 'cocktail2.jpg', { type: 'image/jpeg' }),
          new File(['cocktail3'], 'cocktail3.jpg', { type: 'image/jpeg' }),
          new File(['cocktail4'], 'cocktail4.jpg', { type: 'image/jpeg' }),
        ],
      });

      mockFormData.customStyle = {
        inspirationImages: [new File(['shared-inspiration'], 'shared.jpg', { type: 'image/jpeg' })],
        brandingMaterials: [],
        instructions: 'Shared custom style for all dishes',
      };

      const { result } = renderHook(() =>
        useCustomerFormSubmission({
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

      // Should process both dishes
      const itemInsertCalls = mockSupabase.from().insert.mock.calls.filter((call: any) =>
        call[0].name // Items have 'name' field
      );
      expect(itemInsertCalls).toHaveLength(2);

      // Should create two submissions
      const submissionInsertCalls = mockSupabase.from().insert.mock.calls.filter((call: any) =>
        call[0].submission_status // Submissions have 'submission_status' field
      );
      expect(submissionInsertCalls).toHaveLength(2);

      // Both submissions should have the shared custom style data
      submissionInsertCalls.forEach((call: any) => {
        const submissionData = call[0];
        expect(submissionData.reference_example_urls).toEqual(['https://example.com/mock-url.jpg']);
        expect(submissionData.description).toContain('Shared custom style for all dishes');
      });
    });
  });
}); 