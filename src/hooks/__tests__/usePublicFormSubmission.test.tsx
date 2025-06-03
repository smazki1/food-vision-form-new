/// <reference types="vitest/globals" />

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { usePublicFormSubmission } from '../usePublicFormSubmission';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NewItemFormData } from '@/contexts/NewItemFormContext';

// Mocking Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnThis(), // Allows chaining .from().upload() etc.
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

// Mocking sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Helper to create a File mock
const createMockFile = (name = 'test.png', type = 'image/png', size = 1024): File => {
  const blob = new Blob([''], { type }); // Empty blob for mock
  return new File([blob], name, { type, lastModified: Date.now() });
};

const getBaseMockFormData = (): NewItemFormData => ({
  restaurantName: 'Test Restaurant',
  submitterName: 'Test Submitter',
  itemName: 'Test Item',
  itemType: 'dish', // itemType is 'dish' | 'cocktail' | 'drink'
  description: 'Test Description for Dish', // General description
  referenceImages: [createMockFile('dish.png')],
  specialNotes: 'Test Special Notes',
});


describe('usePublicFormSubmission', () => {
  let mockSetStepErrors: Mock;

  beforeEach(() => {
    vi.resetAllMocks();
    mockSetStepErrors = vi.fn();

    // Revised mocks for successful Supabase operations
    const mockUpload = vi.fn().mockResolvedValue({
      data: { path: 'public-submissions/test-image.png' },
      error: null,
    });
    const mockGetPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: 'http://example.com/public-submissions/test-image.png' },
    });

    (supabase.storage.from as Mock).mockImplementation((bucketName: string) => {
      if (bucketName === 'food-vision-images') {
        return {
          upload: mockUpload,
          getPublicUrl: mockGetPublicUrl,
        };
      }
      // Fallback for other bucket names if any, though not expected in this hook
      return { 
        upload: vi.fn().mockResolvedValue({ data: null, error: { message: 'Unexpected bucket'} }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: ''}}),
      };
    });

    (supabase.rpc as Mock).mockResolvedValue({
      data: { success: true, client_found: true, message: 'Success!' },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation Logic', () => {
    const requiredFields: (keyof NewItemFormData)[] = [
      'restaurantName',
      'submitterName',
      'itemName',
      'itemType',
    ];

    requiredFields.forEach((field) => {
      it(`should return false and show error if ${field} is missing`, async () => {
        const formData = { ...getBaseMockFormData(), [field]: '' as any }; // Use 'as any' for general field blanking
        const { result } = renderHook(() => usePublicFormSubmission());
        
        let submissionResult = false;
        await act(async () => {
          submissionResult = await result.current.submitForm(formData, mockSetStepErrors);
        });

        expect(submissionResult).toBe(false);
        expect(toast.error).toHaveBeenCalledWith(expect.any(String));
        if (mockSetStepErrors) {
            expect(mockSetStepErrors).toHaveBeenCalledWith({ [field]: expect.any(String) });
        }
      });
    });

    it('should return false and show error if referenceImages is empty', async () => {
      const formData = { ...getBaseMockFormData(), referenceImages: [] };
      const { result } = renderHook(() => usePublicFormSubmission());

      let submissionResult = false;
      await act(async () => {
        submissionResult = await result.current.submitForm(formData, mockSetStepErrors);
      });

      expect(submissionResult).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('יש להעלות לפחות 4 תמונות.');
      if (mockSetStepErrors) {
        expect(mockSetStepErrors).toHaveBeenCalledWith({ referenceImages: 'יש להעלות לפחות 4 תמונות.' });
      }
    });
  });

  describe('Image Uploads', () => {
    it('should successfully upload images and get public URLs', async () => {
      const mockFile1 = createMockFile('image1.png');
      const mockFile2 = createMockFile('image2.jpg');
      const formData = { ...getBaseMockFormData(), referenceImages: [mockFile1, mockFile2] };
      
      (supabase.storage.from('food-vision-images').upload as Mock)
        .mockResolvedValueOnce({ data: { path: 'public-submissions/image1.png' }, error: null })
        .mockResolvedValueOnce({ data: { path: 'public-submissions/image2.jpg' }, error: null });
      
      (supabase.storage.from('food-vision-images').getPublicUrl as Mock)
        .mockReturnValueOnce({ data: { publicUrl: 'url/image1.png' } })
        .mockReturnValueOnce({ data: { publicUrl: 'url/image2.jpg' } });

      const { result } = renderHook(() => usePublicFormSubmission());
      await act(async () => {
        await result.current.submitForm(formData, mockSetStepErrors);
      });

      expect(supabase.storage.from).toHaveBeenCalledWith('food-vision-images');
      expect(supabase.storage.from('food-vision-images').upload).toHaveBeenCalledTimes(2);
      expect(supabase.storage.from('food-vision-images').upload).toHaveBeenCalledWith(expect.stringContaining('public-submissions/'), mockFile1);
      expect(supabase.storage.from('food-vision-images').upload).toHaveBeenCalledWith(expect.stringContaining('public-submissions/'), mockFile2);
      expect(supabase.storage.from('food-vision-images').getPublicUrl).toHaveBeenCalledTimes(2);
      expect(supabase.rpc).toHaveBeenCalledWith(
        'public_submit_item_by_restaurant_name',
        expect.objectContaining({ p_reference_image_urls: ['url/image1.png', 'url/image2.jpg'] })
      );
    });

    it('should handle image upload failure', async () => {
      const formData = { ...getBaseMockFormData(), referenceImages: [createMockFile()] };
      const uploadError = { message: 'Upload failed miserably', name: 'UploadError', stack: 'stack' };
      (supabase.storage.from('food-vision-images').upload as Mock).mockRejectedValueOnce(uploadError);
      // Fallback for mockRejectedValueOnce, if it doesn't work as expected for chained calls.
      // (supabase.storage.from('food-vision-images').upload as Mock).mockImplementationOnce(() => Promise.reject(uploadError));


      const { result } = renderHook(() => usePublicFormSubmission());
      let submissionResult = true; // Expect it to become false
      await act(async () => {
        submissionResult = await result.current.submitForm(formData, mockSetStepErrors);
      });
      
      await waitFor(() => expect(result.current.isSubmitting).toBe(false));

      expect(submissionResult).toBe(false);
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining(uploadError.message));
      if (mockSetStepErrors) {
        expect(mockSetStepErrors).toHaveBeenCalledWith({ submit: expect.stringContaining(uploadError.message) });
      }
    });
  });

  describe('RPC Calls - Happy Paths', () => {
    it('should successfully submit a "dish" item', async () => {
      const formData: NewItemFormData = {
        ...getBaseMockFormData(),
        itemType: 'dish',
        description: 'A delicious dish category', // This becomes category for dish
      };
      (supabase.rpc as Mock).mockResolvedValue({ data: { success: true, client_found: true, message:'Dish submitted!' }, error: null });
      
      const { result } = renderHook(() => usePublicFormSubmission());
      let submissionResult = false;
      await act(async () => {
        submissionResult = await result.current.submitForm(formData, mockSetStepErrors);
      });

      expect(submissionResult).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith(
        'public_submit_item_by_restaurant_name',
        expect.objectContaining({
          p_restaurant_name: formData.restaurantName,
          p_item_type: 'dish',
          p_item_name: formData.itemName,
          p_description: formData.description, // For dish, description is passed as p_description
          p_category: formData.description, // And also as p_category
          p_ingredients: undefined, // No ingredients for dish from description, so hook sends undefined
          p_reference_image_urls: ['http://example.com/public-submissions/test-image.png'], // Specific URL from mock
        })
      );
      expect(toast.success).toHaveBeenCalledWith('הפריט הוגש בהצלחה ושויך למסעדה!');
    });

    it('should successfully submit a "cocktail" item with ingredients from description', async () => {
      const formData: NewItemFormData = {
        ...getBaseMockFormData(),
        itemType: 'cocktail',
        description: 'Vodka, Orange Juice, Ice', // This becomes ingredients for cocktail
      };
      (supabase.rpc as Mock).mockResolvedValue({ data: { success: true, client_found: false, message:'Cocktail submitted!' }, error: null });

      const { result } = renderHook(() => usePublicFormSubmission());
      let submissionResult = false;
      await act(async () => {
        submissionResult = await result.current.submitForm(formData, mockSetStepErrors);
      });

      expect(submissionResult).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith(
        'public_submit_item_by_restaurant_name',
        expect.objectContaining({
          p_item_type: 'cocktail',
          p_description: formData.description, 
          p_category: undefined, // Expect undefined for cocktail
          p_ingredients: ['Vodka', 'Orange Juice', 'Ice'],
        })
      );
      expect(toast.success).toHaveBeenCalledWith('הפריט הוגש בהצלחה! המסעדה לא נמצאה במערכת, הפריט ממתין לשיוך ידני.');
    });
    
    it('should parse ingredients correctly for cocktail, filtering empty strings', async () => {
      const formData: NewItemFormData = {
        ...getBaseMockFormData(),
        itemType: 'cocktail',
        description: 'Rum, Coke, , Lime, ', // Empty strings should be filtered
      };
      const { result } = renderHook(() => usePublicFormSubmission());
      await act(async () => {
        await result.current.submitForm(formData, mockSetStepErrors);
      });
      expect(supabase.rpc).toHaveBeenCalledWith(
        'public_submit_item_by_restaurant_name',
        expect.objectContaining({
          p_ingredients: ['Rum', 'Coke', 'Lime'],
        })
      );
    });
  });

  describe('RPC Calls - Error Handling', () => {
    it('should handle RPC call failure (network/supabase error)', async () => {
      const formData = getBaseMockFormData();
      const rpcError = { message: 'RPC failed', name: 'RPCError', stack: 'stack', details: 'details', hint: 'hint', code: 'PGRSTError' };
      (supabase.rpc as Mock).mockRejectedValueOnce(rpcError);
      // (supabase.rpc as Mock).mockImplementationOnce(() => Promise.reject(rpcError));


      const { result } = renderHook(() => usePublicFormSubmission());
      let submissionResult = true;
      await act(async () => {
        submissionResult = await result.current.submitForm(formData, mockSetStepErrors);
      });

      await waitFor(() => expect(result.current.isSubmitting).toBe(false));
      expect(submissionResult).toBe(false);
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining(rpcError.message));
      if (mockSetStepErrors) {
        expect(mockSetStepErrors).toHaveBeenCalledWith({ submit: expect.stringContaining(rpcError.message) });
      }
    });

    it('should handle RPC call returning success: false', async () => {
      const formData = getBaseMockFormData();
      (supabase.rpc as Mock).mockResolvedValue({
        data: { success: false, message: 'Custom submission failure' },
        error: null,
      });
      const { result } = renderHook(() => usePublicFormSubmission());
      let submissionResult = true;
      await act(async () => {
        submissionResult = await result.current.submitForm(formData, mockSetStepErrors);
      });
      expect(submissionResult).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Custom submission failure');
    });
    
    it('should handle RPC call returning non-standard error in data object', async () => {
        const formData = getBaseMockFormData();
        (supabase.rpc as Mock).mockResolvedValue({
          // data might be null or an object without a message field if things go really wrong
          data: { error_message: 'Another custom failure type' }, 
          error: null, 
        });
        const { result } = renderHook(() => usePublicFormSubmission());
        let submissionResult = true;
        await act(async () => {
          submissionResult = await result.current.submitForm(formData, mockSetStepErrors);
        });
        expect(submissionResult).toBe(false);
        // Default error message when specific structure is missing
        expect(toast.error).toHaveBeenCalledWith('הגשה נכשלה - אנא נסו שוב'); 
      });

    it('should handle RPC call returning an error object directly', async () => {
      const formData = getBaseMockFormData();
      const rpcErrorObject = { message: 'Direct error from RPC', code: '123' };
      (supabase.rpc as Mock).mockResolvedValue({ data: null, error: rpcErrorObject });
      
      const { result } = renderHook(() => usePublicFormSubmission());
      let submissionResult = true;
      await act(async () => {
        submissionResult = await result.current.submitForm(formData, mockSetStepErrors);
      });

      expect(submissionResult).toBe(false);
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining(rpcErrorObject.message));
    });
  });

  describe('State Management (isSubmitting)', () => {
    it('should set isSubmitting to true during submission and false on success', async () => {
      const formData = getBaseMockFormData();
      const { result } = renderHook(() => usePublicFormSubmission());

      let submitPromise: Promise<boolean> | undefined;
      act(() => {
        submitPromise = result.current.submitForm(formData, mockSetStepErrors);
      });
      
      // Check that isSubmitting becomes true after the info toast
      await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith("מעלה תמונות ושומר הגשה...");
        expect(result.current.isSubmitting).toBe(true);
      });

      await act(async () => { 
        if (submitPromise) await submitPromise; 
      }); 
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should set isSubmitting to false on validation failure', async () => {
      const formData = { ...getBaseMockFormData(), restaurantName: '' }; 
      const { result } = renderHook(() => usePublicFormSubmission());
      
      await act(async () => {
        await result.current.submitForm(formData, mockSetStepErrors);
      });
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should set isSubmitting to false on image upload failure', async () => {
      const formData = { ...getBaseMockFormData(), referenceImages: [createMockFile()] };
      (supabase.storage.from('food-vision-images').upload as Mock).mockRejectedValueOnce(new Error('Upload failed'));

      const { result } = renderHook(() => usePublicFormSubmission());
      await act(async () => {
        await result.current.submitForm(formData, mockSetStepErrors);
      });
      
      expect(result.current.isSubmitting).toBe(false);
    });

     it('should set isSubmitting to false on RPC failure', async () => {
      const formData = getBaseMockFormData();
      (supabase.rpc as Mock).mockRejectedValueOnce(new Error('RPC failed'));
      
      const { result } = renderHook(() => usePublicFormSubmission());
      await act(async () => {
        await result.current.submitForm(formData, mockSetStepErrors);
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });
}); 