import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { triggerMakeWebhook, MakeWebhookPayload } from '../triggerMakeWebhook';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods to verify logging
const mockConsoleLog = vi.fn();
const mockConsoleWarn = vi.fn();
const mockConsoleError = vi.fn();

describe('triggerMakeWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(mockConsoleLog);
    vi.spyOn(console, 'warn').mockImplementation(mockConsoleWarn);
    vi.spyOn(console, 'error').mockImplementation(mockConsoleError);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockValidPayload: MakeWebhookPayload = {
    submissionTimestamp: '2024-01-01T12:00:00.000Z',
    isAuthenticated: false,
    clientId: null,
    restaurantName: 'Test Restaurant',
    submitterName: 'John Doe',
    contactEmail: 'john@test.com',
    contactPhone: '1234567890',
    itemName: 'Test Dish',
    itemType: 'dish',
    description: 'Test description',
    specialNotes: 'Test notes',
    uploadedImageUrls: ['https://example.com/image1.jpg'],
    category: 'Main Course',
    ingredients: null,
    sourceForm: 'unified-public',
  };

  describe('Happy Path Tests', () => {
    it('should send webhook successfully with "Accepted" response', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'Accepted',
      });

      // Act
      await triggerMakeWebhook(mockValidPayload);

      // Assert
      expect(mockFetch).toHaveBeenCalledOnce();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hook.eu2.make.com/h15kqbjphouh5wvmsnvxopkl7tff8o7u',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockValidPayload),
        }
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[triggerMakeWebhook] Sending data to Make.com:',
        mockValidPayload
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[triggerMakeWebhook] Successfully sent data to Make.com. Response: Accepted'
      );
    });

    it('should handle authenticated user payload correctly', async () => {
      // Arrange
      const authenticatedPayload: MakeWebhookPayload = {
        ...mockValidPayload,
        isAuthenticated: true,
        clientId: 'client-123',
        sourceForm: 'unified-client',
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'Accepted',
      });

      // Act
      await triggerMakeWebhook(authenticatedPayload);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hook.eu2.make.com/h15kqbjphouh5wvmsnvxopkl7tff8o7u',
        expect.objectContaining({
          body: JSON.stringify(authenticatedPayload),
        })
      );
    });

    it('should handle cocktail payload with ingredients correctly', async () => {
      // Arrange
      const cocktailPayload: MakeWebhookPayload = {
        ...mockValidPayload,
        itemType: 'cocktail',
        category: null,
        ingredients: ['vodka', 'orange juice', 'ice'],
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'Accepted',
      });

      // Act
      await triggerMakeWebhook(cocktailPayload);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hook.eu2.make.com/h15kqbjphouh5wvmsnvxopkl7tff8o7u',
        expect.objectContaining({
          body: JSON.stringify(cocktailPayload),
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty optional fields gracefully', async () => {
      // Arrange
      const minimalPayload: MakeWebhookPayload = {
        submissionTimestamp: '2024-01-01T12:00:00.000Z',
        isAuthenticated: false,
        clientId: null,
        restaurantName: 'Test Restaurant',
        itemName: 'Test Item',
        itemType: 'dish',
        description: 'Test description',
        uploadedImageUrls: ['https://example.com/image1.jpg'],
        sourceForm: 'test-form',
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'Accepted',
      });

      // Act & Assert - Should not throw
      await expect(triggerMakeWebhook(minimalPayload)).resolves.toBeUndefined();
    });

    it('should handle non-"Accepted" successful response', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'OK',
      });

      // Act
      await triggerMakeWebhook(mockValidPayload);

      // Assert
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[triggerMakeWebhook] Sent data to Make.com, but response was not "Accepted". Response:',
        'OK'
      );
    });

    it('should handle multiple image URLs', async () => {
      // Arrange
      const multiImagePayload: MakeWebhookPayload = {
        ...mockValidPayload,
        uploadedImageUrls: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ],
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'Accepted',
      });

      // Act
      await triggerMakeWebhook(multiImagePayload);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hook.eu2.make.com/h15kqbjphouh5wvmsnvxopkl7tff8o7u',
        expect.objectContaining({
          body: JSON.stringify(multiImagePayload),
        })
      );
    });

    it('should handle special characters in text fields', async () => {
      // Arrange
      const specialCharsPayload: MakeWebhookPayload = {
        ...mockValidPayload,
        restaurantName: 'מסעדת הדג הזהב',
        itemName: 'בורגר מיוחד "הבית"',
        description: 'תיאור עם תווים מיוחדים: @#$%^&*()',
        specialNotes: 'הערות עם emojis 🍔🍟',
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'Accepted',
      });

      // Act
      await triggerMakeWebhook(specialCharsPayload);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hook.eu2.make.com/h15kqbjphouh5wvmsnvxopkl7tff8o7u',
        expect.objectContaining({
          body: JSON.stringify(specialCharsPayload),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error responses gracefully', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });

      // Act
      await triggerMakeWebhook(mockValidPayload);

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[triggerMakeWebhook] Error sending data to Make.com. Status: 400. Body:',
        'Bad Request'
      );
      // Should not throw - error should be logged only
    });

    it('should handle 500 server error gracefully', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      // Act
      await triggerMakeWebhook(mockValidPayload);

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[triggerMakeWebhook] Error sending data to Make.com. Status: 500. Body:',
        'Internal Server Error'
      );
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      // Act
      await triggerMakeWebhook(mockValidPayload);

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[triggerMakeWebhook] Network or other error sending data to Make.com:',
        networkError
      );
    });

    it('should handle fetch timeout gracefully', async () => {
      // Arrange
      const timeoutError = new Error('Timeout');
      timeoutError.name = 'TimeoutError';
      mockFetch.mockRejectedValueOnce(timeoutError);

      // Act
      await triggerMakeWebhook(mockValidPayload);

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[triggerMakeWebhook] Network or other error sending data to Make.com:',
        timeoutError
      );
    });

    it('should handle response.text() parsing errors', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => {
          throw new Error('Failed to parse response');
        },
      });

      // Act
      await triggerMakeWebhook(mockValidPayload);

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[triggerMakeWebhook] Network or other error sending data to Make.com:',
        expect.any(Error)
      );
    });
  });

  describe('Data Validation', () => {
    it('should handle payload serialization correctly', async () => {
      // Arrange
      const complexPayload: MakeWebhookPayload = {
        ...mockValidPayload,
        ingredients: ['ingredient1', 'ingredient2'],
        category: null,
        submitterName: undefined,
        contactEmail: undefined,
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'Accepted',
      });

      // Act
      await triggerMakeWebhook(complexPayload);

      // Assert
      const callArgs = mockFetch.mock.calls[0];
      const bodyString = callArgs[1].body;
      
      // Verify that the JSON is properly serialized
      expect(() => JSON.parse(bodyString)).not.toThrow();
      
      const parsedBody = JSON.parse(bodyString);
      expect(parsedBody).toEqual(complexPayload);
    });

    it('should maintain correct data types in payload', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'Accepted',
      });

      // Act
      await triggerMakeWebhook(mockValidPayload);

      // Assert
      const callArgs = mockFetch.mock.calls[0];
      const parsedBody = JSON.parse(callArgs[1].body);
      
      expect(typeof parsedBody.isAuthenticated).toBe('boolean');
      expect(Array.isArray(parsedBody.uploadedImageUrls)).toBe(true);
      expect(typeof parsedBody.submissionTimestamp).toBe('string');
    });
  });

  describe('URL and Headers Validation', () => {
    it('should use correct webhook URL', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'Accepted',
      });

      // Act
      await triggerMakeWebhook(mockValidPayload);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hook.eu2.make.com/h15kqbjphouh5wvmsnvxopkl7tff8o7u',
        expect.any(Object)
      );
    });

    it('should use correct HTTP method and headers', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'Accepted',
      });

      // Act
      await triggerMakeWebhook(mockValidPayload);

      // Assert
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].method).toBe('POST');
      expect(callArgs[1].headers).toEqual({
        'Content-Type': 'application/json',
      });
    });
  });
}); 