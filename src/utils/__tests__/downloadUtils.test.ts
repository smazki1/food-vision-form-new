import { describe, it, expect, beforeEach, vi } from 'vitest';
import { downloadImagesAsZip, downloadSingleImage, downloadLeadSubmissionsAsZip } from '../downloadUtils';

// Mock fetch for testing
global.fetch = vi.fn();
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock DOM methods
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    click: mockClick,
    href: '',
    download: '',
  })),
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
});

// Mock JSZip
vi.mock('jszip', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      file: vi.fn(),
      generateAsync: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/zip' }))
    }))
  };
});

describe('downloadUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['mock image'], { type: 'image/jpeg' })),
    });
  });

  describe('downloadImagesAsZip', () => {
    it('should handle empty image URLs array', async () => {
      const result = await downloadImagesAsZip([]);
      expect(result).toBe(true);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should download images and create zip file', async () => {
      const imageUrls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.png'
      ];

      const result = await downloadImagesAsZip(imageUrls, 'test-images.zip');
      
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith('https://example.com/image1.jpg');
      expect(fetch).toHaveBeenCalledWith('https://example.com/image2.png');
      expect(mockClick).toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));
      
      const imageUrls = ['https://example.com/image1.jpg'];
      const result = await downloadImagesAsZip(imageUrls);
      
      expect(result).toBe(true); // Should still complete despite individual failures
    });
  });

  describe('downloadSingleImage', () => {
    it('should download a single image', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      
      const result = await downloadSingleImage(imageUrl, 'test-image.jpg');
      
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(imageUrl);
      expect(mockClick).toHaveBeenCalled();
    });

    it('should generate filename if not provided', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      
      const result = await downloadSingleImage(imageUrl);
      
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(imageUrl);
    });

    it('should handle fetch errors', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));
      
      const imageUrl = 'https://example.com/image.jpg';
      
      await expect(downloadSingleImage(imageUrl)).rejects.toThrow('Network error');
    });
  });

  describe('downloadLeadSubmissionsAsZip', () => {
    const mockSubmissions = [
      {
        submission_id: 'sub-12345678',
        item_name_at_submission: 'פיצה מרגריטה',
        original_image_urls: [
          'https://example.com/pizza1.jpg',
          'https://example.com/pizza2.jpg'
        ]
      },
      {
        submission_id: 'sub-87654321',
        item_name_at_submission: 'המבורגר',
        original_image_urls: [
          'https://example.com/burger1.jpg'
        ]
      }
    ];

    const mockLeadInfo = {
      restaurant_name: 'מסעדת טעם',
      contact_name: 'יוסי כהן'
    };

    it('should download all submissions with organized folder structure', async () => {
      const result = await downloadLeadSubmissionsAsZip(mockSubmissions, mockLeadInfo);
      
      expect(result.success).toBe(true);
      expect(result.totalImages).toBe(3);
      expect(result.submissionsCount).toBe(2);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle empty submissions array', async () => {
      await expect(downloadLeadSubmissionsAsZip([])).rejects.toThrow('אין הגשות להורדה');
    });

    it('should handle submissions with no images', async () => {
      const submissionsWithoutImages = [
        {
          submission_id: 'sub-12345678',
          item_name_at_submission: 'פיצה מרגריטה',
          original_image_urls: []
        }
      ];

      await expect(downloadLeadSubmissionsAsZip(submissionsWithoutImages)).rejects.toThrow('אין תמונות מקור להורדה');
    });

    it('should handle submissions with missing image URLs', async () => {
      const submissionsWithNullImages = [
        {
          submission_id: 'sub-12345678',
          item_name_at_submission: 'פיצה מרגריטה',
          original_image_urls: null
        }
      ];

      await expect(downloadLeadSubmissionsAsZip(submissionsWithNullImages)).rejects.toThrow('אין תמונות מקור להורדה');
    });

    it('should continue with other images even if some fail to download', async () => {
      (fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' }))
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' }))
        });

      const result = await downloadLeadSubmissionsAsZip(mockSubmissions, mockLeadInfo);
      
      expect(result.success).toBe(true);
      expect(result.totalImages).toBe(3);
    });

    it('should generate proper filename with Hebrew date and restaurant name', async () => {
      const result = await downloadLeadSubmissionsAsZip(mockSubmissions, mockLeadInfo);
      
      expect(result.success).toBe(true);
      // Verify the download link was created properly
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should handle missing lead info gracefully', async () => {
      const result = await downloadLeadSubmissionsAsZip(mockSubmissions);
      
      expect(result.success).toBe(true);
      expect(result.totalImages).toBe(3);
    });

    it('should generate fallback folder names for submissions without names', async () => {
      const submissionsWithoutNames = [
        {
          submission_id: 'sub-12345678',
          item_name_at_submission: '',
          original_image_urls: ['https://example.com/image1.jpg']
        }
      ];

      const result = await downloadLeadSubmissionsAsZip(submissionsWithoutNames, mockLeadInfo);
      
      expect(result.success).toBe(true);
      expect(result.totalImages).toBe(1);
    });
  });
}); 