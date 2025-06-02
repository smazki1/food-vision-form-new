import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePublicFormSubmission } from '../usePublicFormSubmission';
import { NewItemFormData } from '@/contexts/NewItemFormContext';
import * as triggerWebhookModule from '@/lib/triggerMakeWebhook';

// Mock external dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

// Create proper mock types
const mockStorageFileApi = {
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
};

const mockSupabaseClient = {
  storage: {
    from: vi.fn(() => mockStorageFileApi),
  },
  rpc: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

vi.mock('@/lib/triggerMakeWebhook');

const mockTriggerMakeWebhook = vi.mocked(triggerWebhookModule.triggerMakeWebhook);

// Import mocked supabase after mocking
import { supabase } from '@/integrations/supabase/client';

describe('usePublicFormSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockFormData: NewItemFormData = {
    restaurantName: 'Test Restaurant',
    submitterName: 'John Doe',
    contactEmail: 'john@test.com',
    contactPhone: '1234567890',
    itemName: 'Test Dish',
    itemType: 'dish',
    description: 'Delicious main course',
    specialNotes: 'Please note allergens',
    referenceImages: [
      new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
    ],
  };

  const mockUploadResponse = {
    data: { path: 'test-path' },
    error: null,
  };

  const mockPublicUrlResponse = {
    data: {
      publicUrl: 'https://example.com/uploaded-image.jpg',
    },
  };

  const mockRpcSuccessResponse = {
    data: {
      success: true,
      client_found: true,
    },
    error: null,
    count: null,
    status: 200,
    statusText: 'OK',
  };

  describe('Hook Initialization', () => {
    it('should initialize with correct default state', () => {
      // Act
      const { result } = renderHook(() => usePublicFormSubmission());

      // Assert
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.showSuccessModal).toBe(false);
      expect(typeof result.current.submitForm).toBe('function');
      expect(typeof result.current.handleCloseSuccessModal).toBe('function');
    });
  });

  describe('Validation Tests', () => {
    it('should fail validation when restaurant name is missing', async () => {
      // Arrange
      const { result } = renderHook(() => usePublicFormSubmission());
      const invalidData = { ...mockFormData, restaurantName: '' };
      const mockSetStepErrors = vi.fn();

      // Act
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.submitForm(invalidData, mockSetStepErrors);
      });

      // Assert
      expect(submitResult!).toBe(false);
      expect(mockSetStepErrors).toHaveBeenCalledWith({
        restaurantName: 'שם המסעדה הוא שדה חובה.',
      });
    });

    it('should fail validation when submitter name is missing', async () => {
      // Arrange
      const { result } = renderHook(() => usePublicFormSubmission());
      const invalidData = { ...mockFormData, submitterName: '' };
      const mockSetStepErrors = vi.fn();

      // Act
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.submitForm(invalidData, mockSetStepErrors);
      });

      // Assert
      expect(submitResult!).toBe(false);
      expect(mockSetStepErrors).toHaveBeenCalledWith({
        submitterName: 'שם המגיש הוא שדה חובה.',
      });
    });

    it('should fail validation when item name is missing', async () => {
      // Arrange
      const { result } = renderHook(() => usePublicFormSubmission());
      const invalidData = { ...mockFormData, itemName: '' };
      const mockSetStepErrors = vi.fn();

      // Act
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.submitForm(invalidData, mockSetStepErrors);
      });

      // Assert
      expect(submitResult!).toBe(false);
      expect(mockSetStepErrors).toHaveBeenCalledWith({
        itemName: 'שם הפריט הוא שדה חובה.',
      });
    });

    it('should fail validation when no images are provided', async () => {
      // Arrange
      const { result } = renderHook(() => usePublicFormSubmission());
      const invalidData = { ...mockFormData, referenceImages: [] };
      const mockSetStepErrors = vi.fn();

      // Act
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.submitForm(invalidData, mockSetStepErrors);
      });

      // Assert
      expect(submitResult!).toBe(false);
      expect(mockSetStepErrors).toHaveBeenCalledWith({
        referenceImages: 'יש להעלות לפחות תמונה אחת.',
      });
    });
  });

  describe('Happy Path - Dish Submission', () => {
    it('should submit dish successfully and trigger webhook with correct payload', async () => {
      // Arrange
      const { result } = renderHook(() => usePublicFormSubmission());
      
      // Mock successful storage upload
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      
      // Mock successful RPC call
      (supabase.rpc as any).mockResolvedValueOnce(mockRpcSuccessResponse);
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.submitForm(mockFormData);
      });

      // Assert
      expect(submitResult!).toBe(true);
      expect(result.current.showSuccessModal).toBe(true);
      
      // Verify storage operations
      expect(supabase.storage.from).toHaveBeenCalledWith('food-vision-images');
      expect(mockStorageFileApi.upload).toHaveBeenCalledTimes(2); // Two images
      
      // Verify RPC call
      expect(supabase.rpc).toHaveBeenCalledWith(
        'public_submit_item_by_restaurant_name',
        expect.objectContaining({
          p_restaurant_name: 'Test Restaurant',
          p_item_type: 'dish',
          p_item_name: 'Test Dish',
          p_description: 'Delicious main course',
          p_category: 'Delicious main course',
          p_ingredients: null,
          p_contact_name: 'John Doe',
          p_contact_email: 'john@test.com',
          p_contact_phone: '1234567890',
        })
      );
      
      // Verify webhook call
      expect(mockTriggerMakeWebhook).toHaveBeenCalledWith({
        submissionTimestamp: expect.any(String),
        isAuthenticated: false,
        clientId: null,
        restaurantName: 'Test Restaurant',
        submitterName: 'John Doe',
        contactEmail: 'john@test.com',
        contactPhone: '1234567890',
        itemName: 'Test Dish',
        itemType: 'dish',
        description: 'Delicious main course',
        specialNotes: 'Please note allergens',
        uploadedImageUrls: [mockPublicUrlResponse.data.publicUrl, mockPublicUrlResponse.data.publicUrl],
        category: 'Delicious main course',
        ingredients: null,
        sourceForm: 'public-form-context',
      });
    });
  });

  describe('Happy Path - Cocktail Submission', () => {
    it('should submit cocktail successfully with ingredients processing', async () => {
      // Arrange
      const cocktailData: NewItemFormData = {
        ...mockFormData,
        itemType: 'cocktail',
        description: 'vodka, orange juice, ice cubes',
      };
      
      const { result } = renderHook(() => usePublicFormSubmission());
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      (supabase.rpc as any).mockResolvedValueOnce(mockRpcSuccessResponse);
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      await act(async () => {
        await result.current.submitForm(cocktailData);
      });

      // Assert
      expect(supabase.rpc).toHaveBeenCalledWith(
        'public_submit_item_by_restaurant_name',
        expect.objectContaining({
          p_item_type: 'cocktail',
          p_category: null,
          p_ingredients: ['vodka', 'orange juice', 'ice cubes'],
        })
      );
      
      expect(mockTriggerMakeWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          itemType: 'cocktail',
          category: null,
          ingredients: ['vodka', 'orange juice', 'ice cubes'],
        })
      );
    });

    it('should handle empty cocktail description gracefully', async () => {
      // Arrange
      const cocktailData: NewItemFormData = {
        ...mockFormData,
        itemType: 'cocktail',
        description: '',
      };
      
      const { result } = renderHook(() => usePublicFormSubmission());
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      (supabase.rpc as any).mockResolvedValueOnce(mockRpcSuccessResponse);
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      await act(async () => {
        await result.current.submitForm(cocktailData);
      });

      // Assert
      expect(mockTriggerMakeWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          category: null,
          ingredients: null,
        })
      );
    });
  });

  describe('RPC Response Handling', () => {
    it('should handle client found response', async () => {
      // Arrange
      const { result } = renderHook(() => usePublicFormSubmission());
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      
      const clientFoundResponse = {
        data: { success: true, client_found: true },
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      };
      (supabase.rpc as any).mockResolvedValueOnce(clientFoundResponse);
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      await act(async () => {
        await result.current.submitForm(mockFormData);
      });

      // Assert
      expect(result.current.showSuccessModal).toBe(true);
    });

    it('should handle lead created response', async () => {
      // Arrange
      const { result } = renderHook(() => usePublicFormSubmission());
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      
      const leadCreatedResponse = {
        data: { success: true, client_found: false, lead_created: true },
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      };
      (supabase.rpc as any).mockResolvedValueOnce(leadCreatedResponse);
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      await act(async () => {
        await result.current.submitForm(mockFormData);
      });

      // Assert
      expect(result.current.showSuccessModal).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle image upload errors gracefully', async () => {
      // Arrange
      const { result } = renderHook(() => usePublicFormSubmission());
      const mockSetStepErrors = vi.fn();
      
      mockStorageFileApi.upload.mockResolvedValueOnce({
        data: null,
        error: { message: 'Upload failed' },
      });

      // Act
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.submitForm(mockFormData, mockSetStepErrors);
      });

      // Assert
      expect(submitResult!).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
      expect(mockTriggerMakeWebhook).not.toHaveBeenCalled();
    });

    it('should handle RPC errors gracefully', async () => {
      // Arrange
      const { result } = renderHook(() => usePublicFormSubmission());
      const mockSetStepErrors = vi.fn();
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      
      const rpcError = {
        data: null,
        error: { message: 'RPC failed' },
        count: null,
        status: 500,
        statusText: 'Internal Server Error',
      };
      (supabase.rpc as any).mockResolvedValueOnce(rpcError);

      // Act
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.submitForm(mockFormData, mockSetStepErrors);
      });

      // Assert
      expect(submitResult!).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
      expect(mockTriggerMakeWebhook).not.toHaveBeenCalled();
      expect(mockSetStepErrors).toHaveBeenCalledWith({
        submit: expect.stringContaining('RPC failed'),
      });
    });

    it('should continue with success even if webhook fails', async () => {
      // Arrange
      const { result } = renderHook(() => usePublicFormSubmission());
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      (supabase.rpc as any).mockResolvedValueOnce(mockRpcSuccessResponse);
      
      const webhookError = new Error('Webhook failed');
      mockTriggerMakeWebhook.mockRejectedValueOnce(webhookError);

      // Act
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.submitForm(mockFormData);
      });

      // Assert
      expect(submitResult!).toBe(true); // Should still be successful
      expect(result.current.showSuccessModal).toBe(true);
      expect(mockTriggerMakeWebhook).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should manage isSubmitting state correctly', async () => {
      // Arrange
      const { result } = renderHook(() => usePublicFormSubmission());
      
      let resolveUpload: (value: any) => void;
      const uploadPromise = new Promise((resolve) => {
        resolveUpload = resolve;
      });
      
      mockStorageFileApi.upload.mockReturnValue(uploadPromise);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);

      // Act & Assert
      expect(result.current.isSubmitting).toBe(false);

      const submitPromise = act(async () => {
        return result.current.submitForm(mockFormData);
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      resolveUpload!(mockUploadResponse);
      (supabase.rpc as any).mockResolvedValueOnce(mockRpcSuccessResponse);
      await submitPromise;

      expect(result.current.isSubmitting).toBe(false);
    });

    it('should handle success modal state correctly', async () => {
      // Arrange
      const { result } = renderHook(() => usePublicFormSubmission());
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      (supabase.rpc as any).mockResolvedValueOnce(mockRpcSuccessResponse);
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      expect(result.current.showSuccessModal).toBe(false);

      // Act
      await act(async () => {
        await result.current.submitForm(mockFormData);
      });

      // Assert
      expect(result.current.showSuccessModal).toBe(true);

      // Test closing modal
      act(() => {
        result.current.handleCloseSuccessModal();
      });

      expect(result.current.showSuccessModal).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing optional contact fields', async () => {
      // Arrange
      const minimalFormData: NewItemFormData = {
        restaurantName: 'Test Restaurant',
        submitterName: 'John Doe',
        itemName: 'Test Dish',
        itemType: 'dish',
        description: 'Test description',
        specialNotes: '',
        referenceImages: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })],
      };
      
      const { result } = renderHook(() => usePublicFormSubmission());
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      (supabase.rpc as any).mockResolvedValueOnce(mockRpcSuccessResponse);
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      await act(async () => {
        await result.current.submitForm(minimalFormData);
      });

      // Assert
      expect(mockTriggerMakeWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          contactEmail: undefined,
          contactPhone: undefined,
        })
      );
    });

    it('should handle special characters in form data', async () => {
      // Arrange
      const specialCharsData: NewItemFormData = {
        ...mockFormData,
        restaurantName: 'מסעדת הדג הזהב',
        itemName: 'בורגר מיוחד "הבית"',
        description: 'תיאור עם תווים מיוחדים: @#$%^&*()',
        specialNotes: 'הערות עם emojis 🍔🍟',
      };
      
      const { result } = renderHook(() => usePublicFormSubmission());
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      (supabase.rpc as any).mockResolvedValueOnce(mockRpcSuccessResponse);
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      await act(async () => {
        await result.current.submitForm(specialCharsData);
      });

      // Assert
      expect(mockTriggerMakeWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurantName: 'מסעדת הדג הזהב',
          itemName: 'בורגר מיוחד "הבית"',
          description: 'תיאור עם תווים מיוחדים: @#$%^&*()',
          specialNotes: 'הערות עם emojis 🍔🍟',
        })
      );
    });
  });

  describe('Timestamp Validation', () => {
    it('should generate valid ISO timestamp for webhook', async () => {
      // Arrange
      const { result } = renderHook(() => usePublicFormSubmission());
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      (supabase.rpc as any).mockResolvedValueOnce(mockRpcSuccessResponse);
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      const beforeSubmission = new Date().toISOString();

      // Act
      await act(async () => {
        await result.current.submitForm(mockFormData);
      });

      const afterSubmission = new Date().toISOString();

      // Assert
      const webhookCall = mockTriggerMakeWebhook.mock.calls[0][0];
      const timestamp = webhookCall.submissionTimestamp;
      
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(timestamp >= beforeSubmission).toBe(true);
      expect(timestamp <= afterSubmission).toBe(true);
    });
  });
}); 