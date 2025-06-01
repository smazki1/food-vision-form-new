import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUnifiedFormSubmission } from '../useUnifiedFormSubmission';
import * as uploadImagesModule from '../../utils/imageUploadUtils';
import * as authenticatedSubmissionModule from '../../services/authenticatedSubmissionService';
import * as publicSubmissionModule from '../../services/publicSubmissionService';
import * as triggerWebhookModule from '@/lib/triggerMakeWebhook';

// Create mock navigate function
const mockNavigate = vi.fn();

// Mock all external dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../utils/imageUploadUtils');
vi.mock('../../services/authenticatedSubmissionService');
vi.mock('../../services/publicSubmissionService');
vi.mock('@/lib/triggerMakeWebhook');

const mockUploadImages = vi.mocked(uploadImagesModule.uploadImages);
const mockHandleAuthenticatedSubmission = vi.mocked(authenticatedSubmissionModule.handleAuthenticatedSubmission);
const mockHandlePublicSubmission = vi.mocked(publicSubmissionModule.handlePublicSubmission);
const mockTriggerMakeWebhook = vi.mocked(triggerWebhookModule.triggerMakeWebhook);

describe('useUnifiedFormSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockFormData = {
    restaurantName: 'Test Restaurant',
    contactEmail: 'test@example.com',
    contactPhone: '1234567890',
    itemName: 'Test Dish',
    itemType: 'dish' as const,
    description: 'Test description',
    specialNotes: 'Test notes',
    referenceImages: [
      new File(['test'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['test'], 'test2.jpg', { type: 'image/jpeg' }),
    ],
    submitterName: 'John Doe',
  };

  const mockUploadedUrls = [
    'https://example.com/uploaded1.jpg',
    'https://example.com/uploaded2.jpg',
  ];

  describe('Hook Initialization', () => {
    it('should initialize with correct default state', () => {
      // Act
      const { result } = renderHook(() => useUnifiedFormSubmission());

      // Assert
      expect(result.current.isSubmitting).toBe(false);
      expect(typeof result.current.submitForm).toBe('function');
    });
  });

  describe('Authenticated User Submission', () => {
    it('should handle authenticated submission successfully and trigger webhook', async () => {
      // Arrange
      const { result } = renderHook(() => useUnifiedFormSubmission());
      
      mockUploadImages.mockResolvedValueOnce(mockUploadedUrls);
      mockHandleAuthenticatedSubmission.mockResolvedValueOnce(undefined);
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.submitForm(
          mockFormData,
          true, // isAuthenticated
          'client-123'
        );
      });

      // Assert
      expect(submitResult!).toBe(true);
      expect(mockUploadImages).toHaveBeenCalledWith(
        mockFormData.referenceImages,
        true,
        'client-123',
        'dish'
      );
      expect(mockHandleAuthenticatedSubmission).toHaveBeenCalledWith(
        mockFormData,
        'client-123',
        mockUploadedUrls
      );
      expect(mockNavigate).toHaveBeenCalledWith('/customer/home');
      
      // Verify webhook was triggered with correct payload
      expect(mockTriggerMakeWebhook).toHaveBeenCalledWith({
        submissionTimestamp: expect.any(String),
        isAuthenticated: true,
        clientId: 'client-123',
        restaurantName: 'Test Restaurant',
        submitterName: 'John Doe',
        contactEmail: 'test@example.com',
        contactPhone: '1234567890',
        itemName: 'Test Dish',
        itemType: 'dish',
        description: 'Test description',
        specialNotes: 'Test notes',
        uploadedImageUrls: mockUploadedUrls,
        category: 'Test description',
        ingredients: null,
        sourceForm: 'unified-client',
      });
    });
  });

  describe('Public User Submission', () => {
    it('should handle public submission successfully and trigger webhook', async () => {
      // Arrange
      const { result } = renderHook(() => useUnifiedFormSubmission());
      
      mockUploadImages.mockResolvedValueOnce(mockUploadedUrls);
      mockHandlePublicSubmission.mockResolvedValueOnce(undefined);
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.submitForm(
          mockFormData,
          false, // isAuthenticated
          null // clientId
        );
      });

      // Assert
      expect(submitResult!).toBe(true);
      expect(mockUploadImages).toHaveBeenCalledWith(
        mockFormData.referenceImages,
        false,
        null,
        'dish'
      );
      expect(mockHandlePublicSubmission).toHaveBeenCalledWith(
        mockFormData,
        mockUploadedUrls
      );
      expect(mockNavigate).toHaveBeenCalledWith('/');
      
      // Verify webhook was triggered with correct payload
      expect(mockTriggerMakeWebhook).toHaveBeenCalledWith({
        submissionTimestamp: expect.any(String),
        isAuthenticated: false,
        clientId: null,
        restaurantName: 'Test Restaurant',
        submitterName: 'John Doe',
        contactEmail: 'test@example.com',
        contactPhone: '1234567890',
        itemName: 'Test Dish',
        itemType: 'dish',
        description: 'Test description',
        specialNotes: 'Test notes',
        uploadedImageUrls: mockUploadedUrls,
        category: 'Test description',
        ingredients: null,
        sourceForm: 'unified-public',
      });
    });
  });

  describe('Cocktail Submissions', () => {
    it('should handle cocktail submission with ingredients correctly', async () => {
      // Arrange
      const cocktailFormData = {
        ...mockFormData,
        itemType: 'cocktail' as const,
        description: 'vodka, orange juice, ice',
      };
      
      const { result } = renderHook(() => useUnifiedFormSubmission());
      
      mockUploadImages.mockResolvedValueOnce(mockUploadedUrls);
      mockHandlePublicSubmission.mockResolvedValueOnce(undefined);
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      await act(async () => {
        await result.current.submitForm(cocktailFormData, false, null);
      });

      // Assert
      expect(mockTriggerMakeWebhook).toHaveBeenCalledWith({
        submissionTimestamp: expect.any(String),
        isAuthenticated: false,
        clientId: null,
        restaurantName: 'Test Restaurant',
        submitterName: 'John Doe',
        contactEmail: 'test@example.com',
        contactPhone: '1234567890',
        itemName: 'Test Dish',
        itemType: 'cocktail',
        description: 'vodka, orange juice, ice',
        specialNotes: 'Test notes',
        uploadedImageUrls: mockUploadedUrls,
        category: null,
        ingredients: ['vodka', 'orange juice', 'ice'],
        sourceForm: 'unified-public',
      });
    });

    it('should handle empty cocktail description gracefully', async () => {
      // Arrange
      const cocktailFormData = {
        ...mockFormData,
        itemType: 'cocktail' as const,
        description: '',
      };
      
      const { result } = renderHook(() => useUnifiedFormSubmission());
      
      mockUploadImages.mockResolvedValueOnce(mockUploadedUrls);
      mockHandlePublicSubmission.mockResolvedValueOnce(undefined);
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      await act(async () => {
        await result.current.submitForm(cocktailFormData, false, null);
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
    it('should handle upload errors gracefully', async () => {
      // Arrange
      const { result } = renderHook(() => useUnifiedFormSubmission());
      
      const uploadError = new Error('Upload failed');
      mockUploadImages.mockRejectedValueOnce(uploadError);

      // Act
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.submitForm(mockFormData, false, null);
      });

      // Assert
      expect(submitResult!).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
      expect(mockHandlePublicSubmission).not.toHaveBeenCalled();
      expect(mockTriggerMakeWebhook).not.toHaveBeenCalled();
    });

    it('should handle authenticated submission service errors gracefully', async () => {
      // Arrange
      const { result } = renderHook(() => useUnifiedFormSubmission());
      
      mockUploadImages.mockResolvedValueOnce(mockUploadedUrls);
      const submissionError = new Error('Submission failed');
      mockHandleAuthenticatedSubmission.mockRejectedValueOnce(submissionError);

      // Act
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.submitForm(mockFormData, true, 'client-123');
      });

      // Assert
      expect(submitResult!).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
      expect(mockTriggerMakeWebhook).not.toHaveBeenCalled();
    });

    it('should handle public submission service errors gracefully', async () => {
      // Arrange
      const { result } = renderHook(() => useUnifiedFormSubmission());
      
      mockUploadImages.mockResolvedValueOnce(mockUploadedUrls);
      const submissionError = new Error('Public submission failed');
      mockHandlePublicSubmission.mockRejectedValueOnce(submissionError);

      // Act
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.submitForm(mockFormData, false, null);
      });

      // Assert
      expect(submitResult!).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
      expect(mockTriggerMakeWebhook).not.toHaveBeenCalled();
    });

    it('should continue with success even if webhook fails', async () => {
      // Arrange
      const { result } = renderHook(() => useUnifiedFormSubmission());
      
      mockUploadImages.mockResolvedValueOnce(mockUploadedUrls);
      mockHandlePublicSubmission.mockResolvedValueOnce(undefined);
      const webhookError = new Error('Webhook failed');
      mockTriggerMakeWebhook.mockRejectedValueOnce(webhookError);

      // Act
      let submitResult: boolean;
      await act(async () => {
        submitResult = await result.current.submitForm(mockFormData, false, null);
      });

      // Assert
      expect(submitResult!).toBe(true); // Should still be successful
      expect(result.current.isSubmitting).toBe(false);
      expect(mockHandlePublicSubmission).toHaveBeenCalled();
      expect(mockTriggerMakeWebhook).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing optional fields in form data', async () => {
      // Arrange
      const minimalFormData = {
        restaurantName: 'Test Restaurant',
        contactEmail: 'test@example.com',
        contactPhone: '1234567890',
        itemName: 'Test Dish',
        itemType: 'dish' as const,
        description: 'Test description',
        specialNotes: '',
        referenceImages: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })],
      };
      
      const { result } = renderHook(() => useUnifiedFormSubmission());
      
      mockUploadImages.mockResolvedValueOnce(['https://example.com/test.jpg']);
      mockHandlePublicSubmission.mockResolvedValueOnce(undefined);
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      await act(async () => {
        await result.current.submitForm(minimalFormData, false, null);
      });

      // Assert
      expect(mockTriggerMakeWebhook).toHaveBeenCalledWith({
        submissionTimestamp: expect.any(String),
        isAuthenticated: false,
        clientId: null,
        restaurantName: 'Test Restaurant',
        submitterName: undefined,
        contactEmail: 'test@example.com',
        contactPhone: '1234567890',
        itemName: 'Test Dish',
        itemType: 'dish',
        description: 'Test description',
        specialNotes: '',
        uploadedImageUrls: ['https://example.com/test.jpg'],
        category: 'Test description',
        ingredients: null,
        sourceForm: 'unified-public',
      });
    });

    it('should handle whitespace-only descriptions for cocktails', async () => {
      // Arrange
      const cocktailFormData = {
        ...mockFormData,
        itemType: 'cocktail' as const,
        description: '   \n\t   ',
      };
      
      const { result } = renderHook(() => useUnifiedFormSubmission());
      
      mockUploadImages.mockResolvedValueOnce(mockUploadedUrls);
      mockHandlePublicSubmission.mockResolvedValueOnce(undefined);
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      // Act
      await act(async () => {
        await result.current.submitForm(cocktailFormData, false, null);
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

  describe('Timestamp Validation', () => {
    it('should generate valid ISO timestamp', async () => {
      // Arrange
      const { result } = renderHook(() => useUnifiedFormSubmission());
      
      mockUploadImages.mockResolvedValueOnce(mockUploadedUrls);
      mockHandlePublicSubmission.mockResolvedValueOnce(undefined);
      mockTriggerMakeWebhook.mockResolvedValueOnce(undefined);

      const beforeSubmission = new Date().toISOString();

      // Act
      await act(async () => {
        await result.current.submitForm(mockFormData, false, null);
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