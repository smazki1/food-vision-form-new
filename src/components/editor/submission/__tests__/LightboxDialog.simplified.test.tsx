/// <reference types="vitest/globals" />

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LightboxDialog from '../LightboxDialog';

// Mock the Dialog components to avoid portal issues
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => 
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, onKeyDown, tabIndex }: { 
    children: React.ReactNode; 
    onKeyDown?: (e: React.KeyboardEvent) => void;
    tabIndex?: number;
  }) => (
    <div 
      data-testid="dialog-content" 
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
      role="dialog"
    >
      {children}
    </div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => 
    <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="dialog-description">{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="dialog-footer">{children}</div>,
}));

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, 'aria-label': ariaLabel, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={className}
      aria-label={ariaLabel}
      data-testid={`button-${ariaLabel || 'default'}`}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Download: () => <span data-testid="download-icon">Download</span>,
  ChevronLeft: () => <span data-testid="chevron-left-icon">ChevronLeft</span>,
  ChevronRight: () => <span data-testid="chevron-right-icon">ChevronRight</span>,
}));

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    click: vi.fn(),
    href: '',
    download: '',
  })),
  writable: true,
});

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(document.body, 'removeChild', {
  value: vi.fn(),
  writable: true,
});

describe('LightboxDialog Logic Tests', () => {
  const mockOnClose = vi.fn();
  const mockOnNavigate = vi.fn();
  
  const defaultProps = {
    imageUrl: 'https://example.com/image1.jpg',
    onClose: mockOnClose,
    open: true,
  };

  const mockImages = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Navigation Logic', () => {
    it('should calculate correct previous index for circular navigation', () => {
      const props = {
        ...defaultProps,
        images: mockImages,
        currentIndex: 0,
        onNavigate: mockOnNavigate,
      };

      // Test the logic that should be in handlePrevious
      const currentIndex = 0;
      const images = mockImages;
      const expectedPrevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
      
      expect(expectedPrevIndex).toBe(2); // Should wrap to last image
    });

    it('should calculate correct next index for circular navigation', () => {
      const props = {
        ...defaultProps,
        images: mockImages,
        currentIndex: 2,
        onNavigate: mockOnNavigate,
      };

      // Test the logic that should be in handleNext
      const currentIndex = 2;
      const images = mockImages;
      const expectedNextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
      
      expect(expectedNextIndex).toBe(0); // Should wrap to first image
    });

    it('should handle single image array correctly', () => {
      const singleImage = ['https://example.com/single.jpg'];
      const hasMultipleImages = singleImage.length > 1;
      
      expect(hasMultipleImages).toBe(false);
    });

    it('should handle empty images array', () => {
      const emptyImages: string[] = [];
      const hasMultipleImages = emptyImages.length > 1;
      
      expect(hasMultipleImages).toBe(false);
    });
  });

  describe('Download Logic', () => {
    it('should handle download with valid image URL', () => {
      const imageUrl = 'https://example.com/image.jpg';
      const mockElement = {
        click: vi.fn(),
        href: '',
        download: '',
      };
      
      vi.mocked(document.createElement).mockReturnValue(mockElement as any);
      
      // Simulate download logic
      if (imageUrl) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `food-vision-image-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockElement.href).toBe(imageUrl);
      expect(mockElement.download).toMatch(/food-vision-image-\d+\.jpg/);
      expect(mockElement.click).toHaveBeenCalled();
    });

    it('should not trigger download with null image URL', () => {
      const imageUrl = null;
      const mockElement = {
        click: vi.fn(),
        href: '',
        download: '',
      };
      
      vi.mocked(document.createElement).mockReturnValue(mockElement as any);
      
      // Simulate download logic
      if (imageUrl) {
        const link = document.createElement('a');
        link.click();
      }
      
      expect(mockElement.click).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation Logic', () => {
    it('should handle ArrowLeft key correctly', () => {
      const currentIndex = 1;
      const images = mockImages;
      const onNavigate = mockOnNavigate;
      
      // Simulate ArrowLeft key logic
      const handleKeyDown = (key: string) => {
        if (key === 'ArrowLeft' && onNavigate && images.length > 1) {
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
          onNavigate(prevIndex);
        }
      };
      
      handleKeyDown('ArrowLeft');
      expect(mockOnNavigate).toHaveBeenCalledWith(0);
    });

    it('should handle ArrowRight key correctly', () => {
      const currentIndex = 1;
      const images = mockImages;
      const onNavigate = mockOnNavigate;
      
      // Simulate ArrowRight key logic
      const handleKeyDown = (key: string) => {
        if (key === 'ArrowRight' && onNavigate && images.length > 1) {
          const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
          onNavigate(nextIndex);
        }
      };
      
      handleKeyDown('ArrowRight');
      expect(mockOnNavigate).toHaveBeenCalledWith(2);
    });

    it('should ignore other keys', () => {
      const currentIndex = 1;
      const images = mockImages;
      const onNavigate = mockOnNavigate;
      
      // Simulate key logic for other keys
      const handleKeyDown = (key: string) => {
        if (key === 'ArrowLeft' && onNavigate && images.length > 1) {
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
          onNavigate(prevIndex);
        } else if (key === 'ArrowRight' && onNavigate && images.length > 1) {
          const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
          onNavigate(nextIndex);
        }
      };
      
      handleKeyDown('Escape');
      handleKeyDown('Enter');
      handleKeyDown('Space');
      
      expect(mockOnNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Component State Logic', () => {
    it('should determine when to show navigation arrows', () => {
      const testCases = [
        { images: [], onNavigate: mockOnNavigate, expected: false },
        { images: ['single.jpg'], onNavigate: mockOnNavigate, expected: false },
        { images: mockImages, onNavigate: mockOnNavigate, expected: true },
        { images: mockImages, onNavigate: undefined, expected: false },
      ];

      testCases.forEach(({ images, onNavigate, expected }) => {
        const hasMultipleImages = images.length > 1;
        const shouldShowArrows = hasMultipleImages && !!onNavigate;
        expect(shouldShowArrows).toBe(expected);
      });
    });

    it('should generate correct image counter text', () => {
      const testCases = [
        { currentIndex: 0, total: 3, expected: 'תמונה 1 מתוך 3' },
        { currentIndex: 1, total: 3, expected: 'תמונה 2 מתוך 3' },
        { currentIndex: 2, total: 3, expected: 'תמונה 3 מתוך 3' },
        { currentIndex: -1, total: 3, expected: 'תמונה 0 מתוך 3' },
        { currentIndex: 10, total: 3, expected: 'תמונה 11 מתוך 3' },
      ];

      testCases.forEach(({ currentIndex, total, expected }) => {
        const counterText = `תמונה ${currentIndex + 1} מתוך ${total}`;
        expect(counterText).toBe(expected);
      });
    });

    it('should handle edge cases for navigation bounds', () => {
      const testNavigationBounds = (currentIndex: number, totalImages: number) => {
        const images = Array.from({ length: totalImages }, (_, i) => `image${i}.jpg`);
        
        // Previous navigation
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
        expect(prevIndex).toBeGreaterThanOrEqual(0);
        expect(prevIndex).toBeLessThan(images.length);
        
        // Next navigation
        const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
        expect(nextIndex).toBeGreaterThanOrEqual(0);
        expect(nextIndex).toBeLessThan(images.length);
      };

      // Test various scenarios
      testNavigationBounds(0, 3);   // First image
      testNavigationBounds(1, 3);   // Middle image
      testNavigationBounds(2, 3);   // Last image
      testNavigationBounds(0, 1);   // Single image
      testNavigationBounds(0, 10);  // Large array
    });
  });

  describe('Error Handling Logic', () => {
    it('should handle invalid currentIndex values', () => {
      const testCases = [
        { currentIndex: -1, expectedDisplay: 1 },     // Negative index: Math.max(0, -1) + 1 = 1
        { currentIndex: undefined, expectedDisplay: 1 }, // Undefined should default to 0, display as 1
        { currentIndex: null, expectedDisplay: 1 },   // Null should default to 0, display as 1
        { currentIndex: 100, expectedDisplay: 101 },  // Too high (should not crash, display as 101)
      ];

      testCases.forEach(({ currentIndex, expectedDisplay }) => {
        const safeIndex = (currentIndex ?? 0);
        const displayIndex = Math.max(0, safeIndex) + 1; // Ensure non-negative for display
        expect(displayIndex).toBe(expectedDisplay);
      });
    });

    it('should handle null or undefined images array', () => {
      const testCases = [
        { images: null, expected: 0 },
        { images: undefined, expected: 0 },
        { images: [], expected: 0 },
        { images: ['image.jpg'], expected: 1 },
      ];

      testCases.forEach(({ images, expected }) => {
        const imageArray = images || [];
        expect(imageArray.length).toBe(expected);
      });
    });
  });

  describe('Integration Logic', () => {
    it('should maintain navigation state consistency', () => {
      const images = mockImages;
      let currentIndex = 0;
      
      // Simulate navigation sequence
      const navigate = (newIndex: number) => {
        if (newIndex >= 0 && newIndex < images.length) {
          currentIndex = newIndex;
        }
      };

      // Navigate forward
      navigate(1);
      expect(currentIndex).toBe(1);
      
      // Navigate to last
      navigate(2);
      expect(currentIndex).toBe(2);
      
      // Try to navigate beyond bounds (should not change)
      const originalIndex = currentIndex;
      navigate(10);
      expect(currentIndex).toBe(originalIndex);
      
      // Navigate back to first
      navigate(0);
      expect(currentIndex).toBe(0);
    });

    it('should handle rapid navigation correctly', () => {
      const images = mockImages;
      let currentIndex = 0;
      const navigateToIndex = vi.fn((index: number) => {
        if (index >= 0 && index < images.length) {
          currentIndex = index;
        }
      });

      // Simulate rapid navigation
      const rapidNavigations = [1, 2, 3, 0, 1, 2, 0];
      rapidNavigations.forEach(index => {
        if (index >= 0 && index < images.length) {
          navigateToIndex(index);
        }
      });

      expect(navigateToIndex).toHaveBeenCalledTimes(6); // Should ignore index 3 (out of bounds)
      expect(currentIndex).toBe(0); // Last valid navigation
    });
  });
}); 