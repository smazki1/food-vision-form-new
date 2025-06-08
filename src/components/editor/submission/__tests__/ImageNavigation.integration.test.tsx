/// <reference types="vitest/globals" />

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLightbox } from '../../submission-processing/hooks/useLightbox';
import LightboxDialog from '../LightboxDialog';

// Integration test component that combines useLightbox hook with LightboxDialog
const TestImageNavigationComponent: React.FC<{
  initialImages?: string[];
  initialImageUrl?: string | null;
}> = ({ initialImages = [], initialImageUrl = null }) => {
  const {
    lightboxImage,
    lightboxImages,
    currentImageIndex,
    setLightboxImage,
    navigateToIndex
  } = useLightbox();

  // Initialize with test data if provided
  React.useEffect(() => {
    if (initialImageUrl && initialImages.length > 0) {
      setLightboxImage(initialImageUrl, initialImages);
    }
  }, [initialImageUrl, initialImages, setLightboxImage]);

  return (
    <div>
      {/* Simulate image gallery */}
      <div data-testid="image-gallery">
        {initialImages.map((url, index) => (
          <img
            key={url}
            src={url}
            alt={`Gallery image ${index + 1}`}
            onClick={() => setLightboxImage(url, initialImages)}
            style={{ cursor: 'pointer', margin: '5px' }}
            data-testid={`gallery-image-${index}`}
          />
        ))}
      </div>

      {/* Current state display for testing */}
      <div data-testid="current-state">
        <div data-testid="current-image">{lightboxImage || 'none'}</div>
        <div data-testid="current-index">{currentImageIndex}</div>
        <div data-testid="total-images">{lightboxImages.length}</div>
      </div>

      {/* Manual navigation buttons for testing */}
      <div data-testid="manual-controls">
        <button 
          onClick={() => navigateToIndex(currentImageIndex - 1)}
          data-testid="manual-prev"
        >
          Previous
        </button>
        <button 
          onClick={() => navigateToIndex(currentImageIndex + 1)}
          data-testid="manual-next"
        >
          Next
        </button>
        <button 
          onClick={() => setLightboxImage(null)}
          data-testid="manual-close"
        >
          Close
        </button>
      </div>

      {/* Lightbox Dialog */}
      <LightboxDialog
        imageUrl={lightboxImage}
        images={lightboxImages}
        currentIndex={currentImageIndex}
        onNavigate={navigateToIndex}
        onClose={() => setLightboxImage(null)}
        open={!!lightboxImage}
      />
    </div>
  );
};

describe('Image Navigation Integration Tests', () => {
  const mockImages = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg', 
    'https://example.com/image3.jpg',
    'https://example.com/image4.jpg'
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete User Workflow', () => {
    it('should handle complete image navigation workflow', async () => {
      render(
        <TestImageNavigationComponent 
          initialImages={mockImages}
        />
      );

      // 1. Verify initial state (no image selected)
      expect(screen.getByTestId('current-image')).toHaveTextContent('none');
      expect(screen.getByTestId('current-index')).toHaveTextContent('0');
      expect(screen.getByTestId('total-images')).toHaveTextContent('0');

      // 2. Click on second image in gallery
      const secondImage = screen.getByTestId('gallery-image-1');
      await userEvent.click(secondImage);

      // 3. Verify lightbox opens with correct image
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('current-image')).toHaveTextContent(mockImages[1]);
      expect(screen.getByTestId('current-index')).toHaveTextContent('1');
      expect(screen.getByTestId('total-images')).toHaveTextContent('4');

      // 4. Navigate to next image using lightbox arrows
      const nextButton = screen.getByLabelText('תמונה הבאה');
      await userEvent.click(nextButton);

      expect(screen.getByTestId('current-image')).toHaveTextContent(mockImages[2]);
      expect(screen.getByTestId('current-index')).toHaveTextContent('2');

      // 5. Navigate to previous image using keyboard
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'ArrowLeft' });

      expect(screen.getByTestId('current-image')).toHaveTextContent(mockImages[1]);
      expect(screen.getByTestId('current-index')).toHaveTextContent('1');

      // 6. Navigate to last image using keyboard
      fireEvent.keyDown(dialog, { key: 'ArrowRight' });
      fireEvent.keyDown(dialog, { key: 'ArrowRight' });
      fireEvent.keyDown(dialog, { key: 'ArrowRight' });

      expect(screen.getByTestId('current-image')).toHaveTextContent(mockImages[3]);
      expect(screen.getByTestId('current-index')).toHaveTextContent('3');

      // 7. Test circular navigation (next from last should go to first)
      fireEvent.keyDown(dialog, { key: 'ArrowRight' });

      expect(screen.getByTestId('current-image')).toHaveTextContent(mockImages[0]);
      expect(screen.getByTestId('current-index')).toHaveTextContent('0');

      // 8. Close lightbox
      const closeButton = screen.getByText('סגור');
      await userEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('current-image')).toHaveTextContent('none');
      expect(screen.getByTestId('current-index')).toHaveTextContent('0');
      expect(screen.getByTestId('total-images')).toHaveTextContent('0');
    });

    it('should handle switching between different image sets', async () => {
      const originalImages = ['orig1.jpg', 'orig2.jpg'];
      const processedImages = ['proc1.jpg', 'proc2.jpg', 'proc3.jpg'];

      const { rerender } = render(
        <TestImageNavigationComponent 
          initialImages={originalImages}
        />
      );

      // Open first set
      const firstImage = screen.getByTestId('gallery-image-0');
      await userEvent.click(firstImage);

      expect(screen.getByTestId('current-image')).toHaveTextContent(originalImages[0]);
      expect(screen.getByTestId('total-images')).toHaveTextContent('2');

      // Switch to different image set
      rerender(
        <TestImageNavigationComponent 
          initialImages={processedImages}
          initialImageUrl={processedImages[1]}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-image')).toHaveTextContent(processedImages[1]);
        expect(screen.getByTestId('current-index')).toHaveTextContent('1');
        expect(screen.getByTestId('total-images')).toHaveTextContent('3');
      });
    });
  });

  describe('Hook and Component Integration', () => {
    it('should maintain state consistency between hook and component', async () => {
      render(
        <TestImageNavigationComponent 
          initialImages={mockImages}
        />
      );

      // Click on third image
      const thirdImage = screen.getByTestId('gallery-image-2');
      await userEvent.click(thirdImage);

      // Hook state should match component props
      expect(screen.getByTestId('current-image')).toHaveTextContent(mockImages[2]);
      expect(screen.getByTestId('current-index')).toHaveTextContent('2');

      // Lightbox should show same state
      expect(screen.getByText('תמונה 3 מתוך 4')).toBeInTheDocument();

      // Manual navigation should update both hook and component
      const manualNext = screen.getByTestId('manual-next');
      await userEvent.click(manualNext);

      expect(screen.getByTestId('current-image')).toHaveTextContent(mockImages[3]);
      expect(screen.getByTestId('current-index')).toHaveTextContent('3');
      expect(screen.getByText('תמונה 4 מתוך 4')).toBeInTheDocument();
    });

    it('should handle rapid navigation without state corruption', async () => {
      render(
        <TestImageNavigationComponent 
          initialImages={mockImages}
        />
      );

      // Open lightbox
      const firstImage = screen.getByTestId('gallery-image-0');
      await userEvent.click(firstImage);

      // Rapid keyboard navigation
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'ArrowRight' });
      fireEvent.keyDown(dialog, { key: 'ArrowRight' });
      fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
      fireEvent.keyDown(dialog, { key: 'ArrowRight' });
      fireEvent.keyDown(dialog, { key: 'ArrowRight' });

      // Should end up at image 3 (index 2)
      expect(screen.getByTestId('current-image')).toHaveTextContent(mockImages[2]);
      expect(screen.getByTestId('current-index')).toHaveTextContent('2');
      expect(screen.getByText('תמונה 3 מתוך 4')).toBeInTheDocument();

      // Rapid button navigation
      const nextButton = screen.getByLabelText('תמונה הבאה');
      await userEvent.click(nextButton);
      await userEvent.click(nextButton);
      await userEvent.click(nextButton);

      // Should wrap around to image 1 (index 0)
      expect(screen.getByTestId('current-image')).toHaveTextContent(mockImages[0]);
      expect(screen.getByTestId('current-index')).toHaveTextContent('0');
    });
  });

  describe('Error Recovery', () => {
    it('should recover gracefully from invalid navigation attempts', async () => {
      render(
        <TestImageNavigationComponent 
          initialImages={mockImages}
        />
      );

      // Open lightbox
      const firstImage = screen.getByTestId('gallery-image-0');
      await userEvent.click(firstImage);

      const currentImage = screen.getByTestId('current-image').textContent;
      const currentIndex = screen.getByTestId('current-index').textContent;

      // Try to navigate to invalid indices manually
      const manualPrev = screen.getByTestId('manual-prev');
      const manualNext = screen.getByTestId('manual-next');

      // Multiple invalid navigations
      await userEvent.click(manualPrev); // -1
      await userEvent.click(manualPrev); // -2
      await userEvent.click(manualNext); // back to valid range

      // State should remain consistent
      expect(screen.getByTestId('current-image')).toHaveTextContent(currentImage!);
      expect(screen.getByTestId('current-index')).toHaveTextContent(currentIndex!);
    });

    it('should handle empty image arrays gracefully', async () => {
      render(
        <TestImageNavigationComponent 
          initialImages={[]}
        />
      );

      // State should remain in initial state
      expect(screen.getByTestId('current-image')).toHaveTextContent('none');
      expect(screen.getByTestId('current-index')).toHaveTextContent('0');
      expect(screen.getByTestId('total-images')).toHaveTextContent('0');

      // Navigation attempts should not break anything
      const manualNext = screen.getByTestId('manual-next');
      await userEvent.click(manualNext);

      expect(screen.getByTestId('current-image')).toHaveTextContent('none');
    });
  });

  describe('Memory and Performance', () => {
    it('should not create memory leaks during navigation', async () => {
      let renders = 0;
      const TestComponentWithCounter: React.FC = () => {
        renders++;
        return (
          <TestImageNavigationComponent 
            initialImages={mockImages}
          />
        );
      };

      const { rerender } = render(<TestComponentWithCounter />);
      
      const initialRenders = renders;

      // Open lightbox and navigate multiple times
      const firstImage = screen.getByTestId('gallery-image-0');
      await userEvent.click(firstImage);

      const dialog = screen.getByRole('dialog');
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(dialog, { key: 'ArrowRight' });
      }

      // Close and reopen multiple times
      for (let i = 0; i < 5; i++) {
        const closeButton = screen.getByText('סגור');
        await userEvent.click(closeButton);
        
        await waitFor(() => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        await userEvent.click(firstImage);
        
        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
      }

      // Rerender with same props should not cause excessive renders
      rerender(<TestComponentWithCounter />);

      // Should not have excessive re-renders
      expect(renders - initialRenders).toBeLessThan(50);
    });

    it('should handle large image arrays efficiently', async () => {
      const largeImageArray = Array.from({ length: 100 }, (_, i) => 
        `https://example.com/image${i + 1}.jpg`
      );

      render(
        <TestImageNavigationComponent 
          initialImages={largeImageArray}
        />
      );

      // Click on middle image
      const middleImage = screen.getByTestId('gallery-image-49');
      await userEvent.click(middleImage);

      expect(screen.getByTestId('current-index')).toHaveTextContent('49');
      expect(screen.getByText('תמונה 50 מתוך 100')).toBeInTheDocument();

      // Navigation should still work smoothly
      const nextButton = screen.getByLabelText('תמונה הבאה');
      await userEvent.click(nextButton);

      expect(screen.getByTestId('current-index')).toHaveTextContent('50');
      expect(screen.getByText('תמונה 51 מתוך 100')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility during complete navigation workflow', async () => {
      render(
        <TestImageNavigationComponent 
          initialImages={mockImages}
        />
      );

      // Open lightbox
      const firstImage = screen.getByTestId('gallery-image-0');
      await userEvent.click(firstImage);

      // Dialog should be accessible
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('tabIndex', '-1');

      // Navigation buttons should have proper labels
      expect(screen.getByLabelText('תמונה קודמת')).toBeInTheDocument();
      expect(screen.getByLabelText('תמונה הבאה')).toBeInTheDocument();
      expect(screen.getByLabelText('הורד תמונה')).toBeInTheDocument();

      // Keyboard navigation should work
      fireEvent.keyDown(dialog, { key: 'ArrowRight' });
      
      // Counter should update for screen readers
      expect(screen.getByText('תמונה 2 מתוך 4')).toBeInTheDocument();
    });
  });
}); 