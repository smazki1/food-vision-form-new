import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFormSubmission } from '../useFormSubmission';
import * as triggerWebhookModule from '@/lib/triggerMakeWebhook';

// Mock external dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-123'),
}));

// Create proper mock types for Supabase
const mockStorageFileApi = {
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
};

const mockSupabaseClient = {
  storage: {
    from: vi.fn(() => mockStorageFileApi),
  },
  from: vi.fn(() => ({
    insert: vi.fn(),
    select: vi.fn(),
  })),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

vi.mock('@/lib/triggerMakeWebhook');

const mockTriggerMakeWebhook = vi.mocked(triggerWebhookModule.triggerMakeWebhook);

// Import mocked supabase after mocking
import { supabase } from '@/integrations/supabase/client';

describe('useFormSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Mock form data that matches what the hook expects
  const mockFormData = {
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

  const mockInsertChain = {
    insert: vi.fn(() => mockInsertChain),
    select: vi.fn(() => Promise.resolve({ data: [{ id: 'submission-123' }], error: null })),
  };

  describe('Hook Initialization', () => {
    it('should initialize with correct default state', () => {
      // Act
      const { result } = renderHook(() => useFormSubmission());

      // Assert
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.showSuccessModal).toBe(false);
      expect(typeof result.current.handleSubmit).toBe('function');
      expect(typeof result.current.handleCloseSuccessModal).toBe('function');
    });
  });

  describe('Happy Path - Authenticated User Submission', () => {
    it('should submit dish successfully for authenticated user and trigger webhook', async () => {
      // Arrange
      const { result } = renderHook(() => useFormSubmission());
      
      // Mock successful storage operations
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      
      // Mock successful database insertion
      (supabase.from as any).mockReturnValue(mockInsertChain);
      mockInsertChain.select.mockResolvedValue({ data: [{ id: 'submission-123' }], error: null });
      
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.handleSubmit(
          mockFormData,
          'client-123',
          5, // remaining dishes
          vi.fn(), // setStepErrors
          'Test Restaurant',
          'John Doe'
        );
      });

      // Assert
      expect(submitResult!).toBe(true);
      expect(result.current.showSuccessModal).toBe(true);
      
      // Verify storage operations
      expect(supabase.storage.from).toHaveBeenCalledWith('food-vision-images');
      expect(mockStorageFileApi.upload).toHaveBeenCalledTimes(2); // Two images
      
      // Verify database operations
      expect(supabase.from).toHaveBeenCalledWith('submissions');
      expect(mockInsertChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: 'client-123',
          item_name: 'Test Dish',
          item_type: 'dish',
          description: 'Delicious main course',
          notes: 'Please note allergens',
          image_urls: [mockPublicUrlResponse.data.publicUrl, mockPublicUrlResponse.data.publicUrl],
        })
      );
      
      // Verify webhook call
      expect(mockTriggerMakeWebhook).toHaveBeenCalledWith({
        submissionTimestamp: expect.any(String),
        isAuthenticated: true,
        clientId: 'client-123',
        restaurantName: 'Test Restaurant',
        submitterName: 'John Doe',
        contactEmail: undefined,
        contactPhone: undefined,
        itemName: 'Test Dish',
        itemType: 'dish',
        description: 'Delicious main course',
        specialNotes: 'Please note allergens',
        uploadedImageUrls: [mockPublicUrlResponse.data.publicUrl, mockPublicUrlResponse.data.publicUrl],
        category: 'Delicious main course',
        ingredients: null,
        sourceForm: 'legacy-customer',
      });
    });
  });

  describe('Happy Path - Public User Submission', () => {
    it('should submit dish successfully for public user and trigger webhook', async () => {
      // Arrange
      const { result } = renderHook(() => useFormSubmission());
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      (supabase.from as any).mockReturnValue(mockInsertChain);
      mockInsertChain.select.mockResolvedValue({ data: [{ id: 'submission-123' }], error: null });
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.handleSubmit(
          mockFormData,
          null, // No client ID for public user
          undefined, // No remaining dishes count
          vi.fn(),
          'Public Restaurant',
          'Jane Doe'
        );
      });

      // Assert
      expect(submitResult!).toBe(true);
      expect(result.current.showSuccessModal).toBe(true);
      
      // Verify webhook call for public user
      expect(mockTriggerMakeWebhook).toHaveBeenCalledWith({
        submissionTimestamp: expect.any(String),
        isAuthenticated: false,
        clientId: null,
        restaurantName: 'Public Restaurant',
        submitterName: 'Jane Doe',
        contactEmail: undefined,
        contactPhone: undefined,
        itemName: 'Test Dish',
        itemType: 'dish',
        description: 'Delicious main course',
        specialNotes: 'Please note allergens',
        uploadedImageUrls: [mockPublicUrlResponse.data.publicUrl, mockPublicUrlResponse.data.publicUrl],
        category: 'Delicious main course',
        ingredients: null,
        sourceForm: 'legacy-customer',
      });
    });
  });

  describe('Cocktail Submissions', () => {
    it('should handle cocktail submission with ingredients correctly', async () => {
      // Arrange
      const cocktailFormData = {
        ...mockFormData,
        itemType: 'cocktail',
        description: 'vodka, orange juice, ice',
      };
      
      const { result } = renderHook(() => useFormSubmission());
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      (supabase.from as any).mockReturnValue(mockInsertChain);
      mockInsertChain.select.mockResolvedValue({ data: [{ id: 'submission-123' }], error: null });
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      await act(async () => {
        await result.current.handleSubmit(
          cocktailFormData,
          'client-123',
          5,
          vi.fn(),
          'Test Restaurant',
          'John Doe'
        );
      });

      // Assert
      expect(mockTriggerMakeWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          itemType: 'cocktail',
          category: null,
          ingredients: ['vodka', 'orange juice', 'ice'],
        })
      );
    });

    it('should handle empty cocktail description gracefully', async () => {
      // Arrange
      const cocktailFormData = {
        ...mockFormData,
        itemType: 'cocktail',
        description: '',
      };
      
      const { result } = renderHook(() => useFormSubmission());
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      (supabase.from as any).mockReturnValue(mockInsertChain);
      mockInsertChain.select.mockResolvedValue({ data: [{ id: 'submission-123' }], error: null });
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      await act(async () => {
        await result.current.handleSubmit(
          cocktailFormData,
          'client-123',
          5,
          vi.fn(),
          'Test Restaurant',
          'John Doe'
        );
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

  describe('Error Handling', () => {
    it('should handle image upload errors gracefully', async () => {
      // Arrange
      const { result } = renderHook(() => useFormSubmission());
      const mockSetStepErrors = vi.fn();
      
      mockStorageFileApi.upload.mockResolvedValueOnce({
        data: null,
        error: { message: 'Upload failed' },
      });

      // Act
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.handleSubmit(
          mockFormData,
          'client-123',
          5,
          mockSetStepErrors,
          'Test Restaurant',
          'John Doe'
        );
      });

      // Assert
      expect(submitResult!).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
      expect(mockTriggerMakeWebhook).not.toHaveBeenCalled();
    });

    it('should handle database insertion errors gracefully', async () => {
      // Arrange
      const { result } = renderHook(() => useFormSubmission());
      const mockSetStepErrors = vi.fn();
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      
      const errorInsertChain = {
        insert: vi.fn(() => errorInsertChain),
        select: vi.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'Database error' } 
        })),
      };
      (supabase.from as any).mockReturnValue(errorInsertChain);

      // Act
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.handleSubmit(
          mockFormData,
          'client-123',
          5,
          mockSetStepErrors,
          'Test Restaurant',
          'John Doe'
        );
      });

      // Assert
      expect(submitResult!).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
      expect(mockTriggerMakeWebhook).not.toHaveBeenCalled();
    });

    it('should continue with success even if webhook fails', async () => {
      // Arrange
      const { result } = renderHook(() => useFormSubmission());
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      (supabase.from as any).mockReturnValue(mockInsertChain);
      mockInsertChain.select.mockResolvedValue({ data: [{ id: 'submission-123' }], error: null });
      
      const webhookError = new Error('Webhook failed');
      mockTriggerMakeWebhook.mockRejectedValueOnce(webhookError);

      // Act
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.handleSubmit(
          mockFormData,
          'client-123',
          5,
          vi.fn(),
          'Test Restaurant',
          'John Doe'
        );
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
      const { result } = renderHook(() => useFormSubmission());
      
      let resolveUpload: (value: any) => void;
      const uploadPromise = new Promise((resolve) => {
        resolveUpload = resolve;
      });
      
      mockStorageFileApi.upload.mockReturnValue(uploadPromise);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);

      // Act & Assert
      expect(result.current.isSubmitting).toBe(false);

      const submitPromise = act(async () => {
        return result.current.handleSubmit(
          mockFormData,
          'client-123',
          5,
          vi.fn(),
          'Test Restaurant',
          'John Doe'
        );
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      resolveUpload!(mockUploadResponse);
      (supabase.from as any).mockReturnValue(mockInsertChain);
      mockInsertChain.select.mockResolvedValue({ data: [{ id: 'submission-123' }], error: null });
      await submitPromise;

      expect(result.current.isSubmitting).toBe(false);
    });

    it('should handle success modal state correctly', async () => {
      // Arrange
      const { result } = renderHook(() => useFormSubmission());
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      (supabase.from as any).mockReturnValue(mockInsertChain);
      mockInsertChain.select.mockResolvedValue({ data: [{ id: 'submission-123' }], error: null });
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      expect(result.current.showSuccessModal).toBe(false);

      // Act
      await act(async () => {
        await result.current.handleSubmit(
          mockFormData,
          'client-123',
          5,
          vi.fn(),
          'Test Restaurant',
          'John Doe'
        );
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
    it('should handle missing optional parameters gracefully', async () => {
      // Arrange
      const { result } = renderHook(() => useFormSubmission());
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      (supabase.from as any).mockReturnValue(mockInsertChain);
      mockInsertChain.select.mockResolvedValue({ data: [{ id: 'submission-123' }], error: null });
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act - Call without optional restaurant name and submitter name
      await act(async () => {
        await result.current.handleSubmit(
          mockFormData,
          'client-123',
          5,
          vi.fn()
          // No restaurantName and submitterName
        );
      });

      // Assert
      expect(mockTriggerMakeWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurantName: undefined,
          submitterName: undefined,
        })
      );
    });

    it('should handle special characters in form data', async () => {
      // Arrange
      const specialCharsData = {
        ...mockFormData,
        itemName: 'בורגר מיוחד "הבית"',
        description: 'תיאור עם תווים מיוחדים: @#$%^&*()',
        specialNotes: 'הערות עם emojis 🍔🍟',
      };
      
      const { result } = renderHook(() => useFormSubmission());
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      (supabase.from as any).mockReturnValue(mockInsertChain);
      mockInsertChain.select.mockResolvedValue({ data: [{ id: 'submission-123' }], error: null });
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      await act(async () => {
        await result.current.handleSubmit(
          specialCharsData,
          'client-123',
          5,
          vi.fn(),
          'מסעדת הדג הזהב',
          'יוחנן כהן'
        );
      });

      // Assert
      expect(mockTriggerMakeWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurantName: 'מסעדת הדג הזהב',
          submitterName: 'יוחנן כהן',
          itemName: 'בורגר מיוחד "הבית"',
          description: 'תיאור עם תווים מיוחדים: @#$%^&*()',
          specialNotes: 'הערות עם emojis 🍔🍟',
        })
      );
    });

    it('should handle empty form fields gracefully', async () => {
      // Arrange
      const minimalFormData = {
        itemName: 'Test Dish',
        itemType: 'dish',
        description: '',
        specialNotes: '',
        referenceImages: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })],
      };
      
      const { result } = renderHook(() => useFormSubmission());
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      (supabase.from as any).mockReturnValue(mockInsertChain);
      mockInsertChain.select.mockResolvedValue({ data: [{ id: 'submission-123' }], error: null });
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      await act(async () => {
        await result.current.handleSubmit(
          minimalFormData,
          'client-123',
          5,
          vi.fn(),
          'Test Restaurant',
          'John Doe'
        );
      });

      // Assert
      expect(mockTriggerMakeWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          description: '',
          specialNotes: '',
          category: '',
          ingredients: null,
        })
      );
    });
  });

  describe('Timestamp Validation', () => {
    it('should generate valid ISO timestamp for webhook', async () => {
      // Arrange
      const { result } = renderHook(() => useFormSubmission());
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      (supabase.from as any).mockReturnValue(mockInsertChain);
      mockInsertChain.select.mockResolvedValue({ data: [{ id: 'submission-123' }], error: null });
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      const beforeSubmission = new Date().toISOString();

      // Act
      await act(async () => {
        await result.current.handleSubmit(
          mockFormData,
          'client-123',
          5,
          vi.fn(),
          'Test Restaurant',
          'John Doe'
        );
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

  describe('Database Integration', () => {
    it('should generate unique IDs for submissions', async () => {
      // Arrange
      const { result } = renderHook(() => useFormSubmission());
      
      mockStorageFileApi.upload.mockResolvedValue(mockUploadResponse);
      mockStorageFileApi.getPublicUrl.mockReturnValue(mockPublicUrlResponse);
      (supabase.from as any).mockReturnValue(mockInsertChain);
      mockInsertChain.select.mockResolvedValue({ data: [{ id: 'submission-123' }], error: null });
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      await act(async () => {
        await result.current.handleSubmit(
          mockFormData,
          'client-123',
          5,
          vi.fn(),
          'Test Restaurant',
          'John Doe'
        );
      });

      // Assert
      expect(mockInsertChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'mock-uuid-123',
          client_id: 'client-123',
        })
      );
    });
  });
}); 