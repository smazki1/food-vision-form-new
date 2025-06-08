/// <reference types="vitest/globals" />

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useLightbox } from '../useLightbox';

describe('useLightbox Hook', () => {
  let result: any;

  beforeEach(() => {
    const { result: hookResult } = renderHook(() => useLightbox());
    result = hookResult;
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      expect(result.current.lightboxImage).toBeNull();
      expect(result.current.lightboxImages).toEqual([]);
      expect(result.current.currentImageIndex).toBe(0);
      expect(typeof result.current.setLightboxImage).toBe('function');
      expect(typeof result.current.navigateToIndex).toBe('function');
    });
  });

  describe('Happy Path Tests', () => {
    const mockImages = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      'https://example.com/image3.jpg'
    ];

    it('should set lightbox image with single image', () => {
      act(() => {
        result.current.setLightboxImage(mockImages[0]);
      });

      expect(result.current.lightboxImage).toBe(mockImages[0]);
      expect(result.current.lightboxImages).toEqual([mockImages[0]]);
      expect(result.current.currentImageIndex).toBe(0);
    });

    it('should set lightbox image with multiple images array', () => {
      act(() => {
        result.current.setLightboxImage(mockImages[1], mockImages);
      });

      expect(result.current.lightboxImage).toBe(mockImages[1]);
      expect(result.current.lightboxImages).toEqual(mockImages);
      expect(result.current.currentImageIndex).toBe(1);
    });

    it('should find correct index when image exists in array', () => {
      act(() => {
        result.current.setLightboxImage(mockImages[2], mockImages);
      });

      expect(result.current.currentImageIndex).toBe(2);
    });

    it('should navigate to next image correctly', () => {
      // Set up with multiple images
      act(() => {
        result.current.setLightboxImage(mockImages[0], mockImages);
      });

      // Navigate to next image
      act(() => {
        result.current.navigateToIndex(1);
      });

      expect(result.current.lightboxImage).toBe(mockImages[1]);
      expect(result.current.currentImageIndex).toBe(1);
    });

    it('should navigate to previous image correctly', () => {
      // Set up with multiple images at index 2
      act(() => {
        result.current.setLightboxImage(mockImages[2], mockImages);
      });

      // Navigate to previous image
      act(() => {
        result.current.navigateToIndex(1);
      });

      expect(result.current.lightboxImage).toBe(mockImages[1]);
      expect(result.current.currentImageIndex).toBe(1);
    });

    it('should navigate to specific index correctly', () => {
      // Set up with multiple images
      act(() => {
        result.current.setLightboxImage(mockImages[0], mockImages);
      });

      // Navigate to specific index
      act(() => {
        result.current.navigateToIndex(2);
      });

      expect(result.current.lightboxImage).toBe(mockImages[2]);
      expect(result.current.currentImageIndex).toBe(2);
    });

    it('should close lightbox correctly', () => {
      // Set up with image
      act(() => {
        result.current.setLightboxImage(mockImages[0], mockImages);
      });

      // Close lightbox
      act(() => {
        result.current.setLightboxImage(null);
      });

      expect(result.current.lightboxImage).toBeNull();
      expect(result.current.lightboxImages).toEqual([]);
      expect(result.current.currentImageIndex).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty images array gracefully', () => {
      act(() => {
        result.current.setLightboxImage('https://example.com/image.jpg', []);
      });

      expect(result.current.lightboxImage).toBe('https://example.com/image.jpg');
      expect(result.current.lightboxImages).toEqual(['https://example.com/image.jpg']);
      expect(result.current.currentImageIndex).toBe(0);
    });

    it('should handle image not found in array', () => {
      const mockImages = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
      const nonExistentImage = 'nonexistent.jpg';

      act(() => {
        result.current.setLightboxImage(nonExistentImage, mockImages);
      });

      expect(result.current.lightboxImage).toBe(nonExistentImage);
      expect(result.current.lightboxImages).toEqual(mockImages);
      expect(result.current.currentImageIndex).toBe(0); // Should fallback to 0
    });

    it('should handle navigation to invalid index (too high)', () => {
      const mockImages = ['image1.jpg', 'image2.jpg'];
      
      act(() => {
        result.current.setLightboxImage(mockImages[0], mockImages);
      });

      // Try to navigate beyond array bounds
      act(() => {
        result.current.navigateToIndex(5);
      });

      // Should remain unchanged
      expect(result.current.lightboxImage).toBe(mockImages[0]);
      expect(result.current.currentImageIndex).toBe(0);
    });

    it('should handle navigation to invalid index (negative)', () => {
      const mockImages = ['image1.jpg', 'image2.jpg'];
      
      act(() => {
        result.current.setLightboxImage(mockImages[1], mockImages);
      });

      // Try to navigate to negative index
      act(() => {
        result.current.navigateToIndex(-1);
      });

      // Should remain unchanged
      expect(result.current.lightboxImage).toBe(mockImages[1]);
      expect(result.current.currentImageIndex).toBe(1);
    });

    it('should handle navigation when images array is empty', () => {
      // Set up with single image (no array)
      act(() => {
        result.current.setLightboxImage('image.jpg');
      });

      // Try to navigate
      act(() => {
        result.current.navigateToIndex(1);
      });

      // Should remain unchanged since there's only one image
      expect(result.current.lightboxImage).toBe('image.jpg');
      expect(result.current.currentImageIndex).toBe(0);
    });

    it('should handle undefined images parameter', () => {
      act(() => {
        result.current.setLightboxImage('image.jpg', undefined);
      });

      expect(result.current.lightboxImage).toBe('image.jpg');
      expect(result.current.lightboxImages).toEqual(['image.jpg']);
      expect(result.current.currentImageIndex).toBe(0);
    });

    it('should handle setting same image multiple times', () => {
      const image = 'image.jpg';
      const images = [image, 'image2.jpg'];

      // Set image first time
      act(() => {
        result.current.setLightboxImage(image, images);
      });

      const firstState = {
        lightboxImage: result.current.lightboxImage,
        lightboxImages: result.current.lightboxImages,
        currentImageIndex: result.current.currentImageIndex
      };

      // Set same image again
      act(() => {
        result.current.setLightboxImage(image, images);
      });

      expect(result.current.lightboxImage).toBe(firstState.lightboxImage);
      expect(result.current.lightboxImages).toEqual(firstState.lightboxImages);
      expect(result.current.currentImageIndex).toBe(firstState.currentImageIndex);
    });
  });

  describe('Type Safety and Error Handling', () => {
    it('should handle null image URL correctly', () => {
      // Set up with image first
      act(() => {
        result.current.setLightboxImage('image.jpg');
      });

      // Then set to null
      act(() => {
        result.current.setLightboxImage(null);
      });

      expect(result.current.lightboxImage).toBeNull();
      expect(result.current.lightboxImages).toEqual([]);
      expect(result.current.currentImageIndex).toBe(0);
    });

    it('should handle empty string as image URL', () => {
      act(() => {
        result.current.setLightboxImage('');
      });

      expect(result.current.lightboxImage).toBe('');
      expect(result.current.lightboxImages).toEqual(['']);
      expect(result.current.currentImageIndex).toBe(0);
    });

    it('should maintain state consistency during rapid navigation', () => {
      const mockImages = ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg'];
      
      act(() => {
        result.current.setLightboxImage(mockImages[0], mockImages);
      });

      // Perform multiple rapid navigations
      act(() => {
        result.current.navigateToIndex(1);
        result.current.navigateToIndex(2);
        result.current.navigateToIndex(3);
        result.current.navigateToIndex(0);
      });

      expect(result.current.lightboxImage).toBe(mockImages[0]);
      expect(result.current.currentImageIndex).toBe(0);
      expect(result.current.lightboxImages).toEqual(mockImages);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle typical user workflow - open, navigate, close', () => {
      const mockImages = ['img1.jpg', 'img2.jpg', 'img3.jpg'];

      // 1. Open lightbox with first image
      act(() => {
        result.current.setLightboxImage(mockImages[0], mockImages);
      });

      expect(result.current.lightboxImage).toBe(mockImages[0]);
      expect(result.current.currentImageIndex).toBe(0);

      // 2. Navigate to next
      act(() => {
        result.current.navigateToIndex(1);
      });

      expect(result.current.lightboxImage).toBe(mockImages[1]);
      expect(result.current.currentImageIndex).toBe(1);

      // 3. Navigate to last
      act(() => {
        result.current.navigateToIndex(2);
      });

      expect(result.current.lightboxImage).toBe(mockImages[2]);
      expect(result.current.currentImageIndex).toBe(2);

      // 4. Close lightbox
      act(() => {
        result.current.setLightboxImage(null);
      });

      expect(result.current.lightboxImage).toBeNull();
      expect(result.current.lightboxImages).toEqual([]);
      expect(result.current.currentImageIndex).toBe(0);
    });

    it('should handle switching between different image sets', () => {
      const originalImages = ['orig1.jpg', 'orig2.jpg'];
      const processedImages = ['proc1.jpg', 'proc2.jpg', 'proc3.jpg'];

      // Start with original images
      act(() => {
        result.current.setLightboxImage(originalImages[0], originalImages);
      });

      expect(result.current.lightboxImages).toEqual(originalImages);
      expect(result.current.currentImageIndex).toBe(0);

      // Switch to processed images
      act(() => {
        result.current.setLightboxImage(processedImages[1], processedImages);
      });

      expect(result.current.lightboxImages).toEqual(processedImages);
      expect(result.current.lightboxImage).toBe(processedImages[1]);
      expect(result.current.currentImageIndex).toBe(1);
    });
  });
}); 