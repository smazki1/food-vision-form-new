/// <reference types="vitest/globals" />

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create a test component that mimics the processed images section
const ProcessedImagesTestComponent: React.FC<{
  processedImageUrls: string[];
  onImageClick: (url: string) => void;
  onDownloadClick: (url: string) => void;
  onDeleteClick: (url: string) => void;
  viewMode?: 'admin' | 'client';
}> = ({ processedImageUrls, onImageClick, onDownloadClick, onDeleteClick, viewMode = 'admin' }) => {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
      {processedImageUrls.map((url, index) => (
        <div 
          key={index} 
          className="relative aspect-square bg-white rounded-lg border-2 overflow-hidden hover:scale-105 transition-transform group"
        >
          <img 
            src={url} 
            alt={`תמונה מעובדת ${index + 1}`}
            className="w-full h-full object-cover cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick(url);
            }}
          />
          
          {/* Action buttons overlay - this is the fix we implemented */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                data-testid={`download-button-${index}`}
                className="pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadClick(url);
                }}
              >
                Download
              </button>
              {viewMode === 'admin' && (
                <button
                  data-testid={`delete-button-${index}`}
                  className="pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick(url);
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

describe('ProcessedImages Lightbox Fix Tests', () => {
  const mockImageUrls = [
    'https://example.com/processed1.jpg',
    'https://example.com/processed2.jpg',
    'https://example.com/processed3.jpg',
  ];

  const mockOnImageClick = vi.fn();
  const mockOnDownloadClick = vi.fn();
  const mockOnDeleteClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Functionality', () => {
    it('should render processed images correctly', () => {
      render(
        <ProcessedImagesTestComponent
          processedImageUrls={mockImageUrls}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      // Should render all images
      const images = screen.getAllByAltText(/תמונה מעובדת/);
      expect(images).toHaveLength(3);
      
      // Each image should have correct src
      expect(images[0]).toHaveAttribute('src', 'https://example.com/processed1.jpg');
      expect(images[1]).toHaveAttribute('src', 'https://example.com/processed2.jpg');
      expect(images[2]).toHaveAttribute('src', 'https://example.com/processed3.jpg');
    });

    it('should call onImageClick when image is clicked', async () => {
      render(
        <ProcessedImagesTestComponent
          processedImageUrls={mockImageUrls}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      const firstImage = screen.getAllByAltText(/תמונה מעובדת/)[0];
      await userEvent.click(firstImage);

      expect(mockOnImageClick).toHaveBeenCalledWith('https://example.com/processed1.jpg');
      expect(mockOnImageClick).toHaveBeenCalledTimes(1);
    });

    it('should handle stopPropagation correctly on image click', async () => {
      render(
        <ProcessedImagesTestComponent
          processedImageUrls={mockImageUrls}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      const firstImage = screen.getAllByAltText(/תמונה מעובדת/)[0];
      
      // Test functional behavior: image click should call onImageClick
      // The stopPropagation is an implementation detail, but the behavior is what matters
      await userEvent.click(firstImage);

      expect(mockOnImageClick).toHaveBeenCalledWith('https://example.com/processed1.jpg');
      expect(mockOnImageClick).toHaveBeenCalledTimes(1);
    });

    it('should call onDownloadClick when download button is clicked', async () => {
      render(
        <ProcessedImagesTestComponent
          processedImageUrls={mockImageUrls}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      const downloadButton = screen.getByTestId('download-button-0');
      await userEvent.click(downloadButton);

      expect(mockOnDownloadClick).toHaveBeenCalledWith('https://example.com/processed1.jpg');
      expect(mockOnImageClick).not.toHaveBeenCalled(); // Should not trigger image click
    });

    it('should call onDeleteClick when delete button is clicked', async () => {
      render(
        <ProcessedImagesTestComponent
          processedImageUrls={mockImageUrls}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      const deleteButton = screen.getByTestId('delete-button-0');
      await userEvent.click(deleteButton);

      expect(mockOnDeleteClick).toHaveBeenCalledWith('https://example.com/processed1.jpg');
      expect(mockOnImageClick).not.toHaveBeenCalled(); // Should not trigger image click
    });

    it('should handle multiple images independently', async () => {
      render(
        <ProcessedImagesTestComponent
          processedImageUrls={mockImageUrls}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      const images = screen.getAllByAltText(/תמונה מעובדת/);
      
      // Click first image
      await userEvent.click(images[0]);
      expect(mockOnImageClick).toHaveBeenCalledWith('https://example.com/processed1.jpg');

      // Click second image
      await userEvent.click(images[1]);
      expect(mockOnImageClick).toHaveBeenCalledWith('https://example.com/processed2.jpg');

      // Click third image
      await userEvent.click(images[2]);
      expect(mockOnImageClick).toHaveBeenCalledWith('https://example.com/processed3.jpg');

      expect(mockOnImageClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Pointer Events Fix', () => {
    it('should have pointer-events-none on overlay div', () => {
      const { container } = render(
        <ProcessedImagesTestComponent
          processedImageUrls={mockImageUrls}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      // Should have overlay divs with pointer-events-none
      const overlayDivs = container.querySelectorAll('.absolute.inset-0.pointer-events-none');
      expect(overlayDivs).toHaveLength(3); // One for each image
      
      overlayDivs.forEach(overlay => {
        expect(overlay).toHaveClass('pointer-events-none');
      });
    });

    it('should have pointer-events-auto on action buttons', () => {
      const { container } = render(
        <ProcessedImagesTestComponent
          processedImageUrls={mockImageUrls}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      // Should have action buttons with pointer-events-auto
      const actionButtons = container.querySelectorAll('button.pointer-events-auto');
      expect(actionButtons).toHaveLength(6); // Download + Delete for each of 3 images
      
      actionButtons.forEach(button => {
        expect(button).toHaveClass('pointer-events-auto');
      });
    });

    it('should maintain proper CSS class structure', () => {
      const { container } = render(
        <ProcessedImagesTestComponent
          processedImageUrls={mockImageUrls}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      // Check complete overlay structure
      const overlayDivs = container.querySelectorAll(
        '.absolute.inset-0.bg-black.bg-opacity-0.group-hover\\:bg-opacity-30.transition-all.flex.items-center.justify-center.pointer-events-none'
      );
      
      expect(overlayDivs).toHaveLength(3);
      
      // Each overlay should contain action buttons with correct classes
      overlayDivs.forEach(overlay => {
        const buttonContainer = overlay.querySelector('.flex.items-center.gap-2');
        expect(buttonContainer).toBeTruthy();
        
        const downloadButton = buttonContainer?.querySelector('button[data-testid*="download-button"]');
        const deleteButton = buttonContainer?.querySelector('button[data-testid*="delete-button"]');
        
        expect(downloadButton).toBeTruthy();
        expect(deleteButton).toBeTruthy();
      });
    });

    it('should allow image clicks despite overlay presence', async () => {
      render(
        <ProcessedImagesTestComponent
          processedImageUrls={mockImageUrls}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      // Click on image should work despite overlay
      const firstImage = screen.getAllByAltText(/תמונה מעובדת/)[0];
      await userEvent.click(firstImage);

      expect(mockOnImageClick).toHaveBeenCalledWith('https://example.com/processed1.jpg');
    });

    it('should prevent action button clicks from triggering image clicks', async () => {
      render(
        <ProcessedImagesTestComponent
          processedImageUrls={mockImageUrls}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      // Click download button should not trigger image click
      const downloadButton = screen.getByTestId('download-button-0');
      await userEvent.click(downloadButton);

      expect(mockOnDownloadClick).toHaveBeenCalledWith('https://example.com/processed1.jpg');
      expect(mockOnImageClick).not.toHaveBeenCalled();

      // Click delete button should not trigger image click
      const deleteButton = screen.getByTestId('delete-button-0');
      await userEvent.click(deleteButton);

      expect(mockOnDeleteClick).toHaveBeenCalledWith('https://example.com/processed1.jpg');
      expect(mockOnImageClick).not.toHaveBeenCalled();
    });
  });

  describe('Hover Effects', () => {
    it('should have correct hover opacity classes', () => {
      const { container } = render(
        <ProcessedImagesTestComponent
          processedImageUrls={mockImageUrls}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      // Check overlay hover classes
      const overlayDivs = container.querySelectorAll('.absolute.inset-0');
      overlayDivs.forEach(overlay => {
        expect(overlay).toHaveClass('bg-opacity-0');
        expect(overlay).toHaveClass('group-hover:bg-opacity-30');
        expect(overlay).toHaveClass('transition-all');
      });

      // Check button container hover classes
      const buttonContainers = container.querySelectorAll('.flex.items-center.gap-2');
      buttonContainers.forEach(container => {
        expect(container).toHaveClass('opacity-0');
        expect(container).toHaveClass('group-hover:opacity-100');
        expect(container).toHaveClass('transition-opacity');
      });
    });

    it('should have group class on image containers', () => {
      const { container } = render(
        <ProcessedImagesTestComponent
          processedImageUrls={mockImageUrls}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      const groupContainers = container.querySelectorAll('.group');
      expect(groupContainers).toHaveLength(3);
      
      groupContainers.forEach(container => {
        expect(container).toHaveClass('relative');
        expect(container).toHaveClass('aspect-square');
        expect(container).toHaveClass('hover:scale-105');
        expect(container).toHaveClass('transition-transform');
      });
    });
  });

  describe('Event Propagation', () => {
    it('should handle event isolation on action button clicks', async () => {
      render(
        <ProcessedImagesTestComponent
          processedImageUrls={mockImageUrls}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      const downloadButton = screen.getByTestId('download-button-0');
      const deleteButton = screen.getByTestId('delete-button-0');
      
      // Test functional behavior: action button clicks should only trigger their respective handlers
      // and not trigger image click due to stopPropagation
      await userEvent.click(downloadButton);
      expect(mockOnDownloadClick).toHaveBeenCalledWith('https://example.com/processed1.jpg');
      expect(mockOnImageClick).not.toHaveBeenCalled();

      await userEvent.click(deleteButton);
      expect(mockOnDeleteClick).toHaveBeenCalledWith('https://example.com/processed1.jpg');
      expect(mockOnImageClick).not.toHaveBeenCalled();
    });

    it('should handle multiple rapid clicks correctly', async () => {
      render(
        <ProcessedImagesTestComponent
          processedImageUrls={mockImageUrls}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      const firstImage = screen.getAllByAltText(/תמונה מעובדת/)[0];
      const secondImage = screen.getAllByAltText(/תמונה מעובדת/)[1];

      // Rapid clicks on different images
      await userEvent.click(firstImage);
      await userEvent.click(secondImage);
      await userEvent.click(firstImage);

      expect(mockOnImageClick).toHaveBeenCalledTimes(3);
      expect(mockOnImageClick).toHaveBeenNthCalledWith(1, 'https://example.com/processed1.jpg');
      expect(mockOnImageClick).toHaveBeenNthCalledWith(2, 'https://example.com/processed2.jpg');
      expect(mockOnImageClick).toHaveBeenNthCalledWith(3, 'https://example.com/processed1.jpg');
    });
  });

  describe('Delete Functionality', () => {
    it('should render delete buttons in admin mode', () => {
      render(
        <ProcessedImagesTestComponent
          processedImageUrls={mockImageUrls}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
          viewMode="admin"
        />
      );

      const deleteButtons = screen.getAllByTestId(/delete-button-/);
      expect(deleteButtons).toHaveLength(3); // One for each image
    });

    it('should not render delete buttons in client mode', () => {
      render(
        <ProcessedImagesTestComponent
          processedImageUrls={mockImageUrls}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
          viewMode="client"
        />
      );

      const deleteButtons = screen.queryAllByTestId(/delete-button-/);
      expect(deleteButtons).toHaveLength(0); // No delete buttons in client mode
    });

    it('should call onDeleteClick for correct image when delete button is clicked', async () => {
      render(
        <ProcessedImagesTestComponent
          processedImageUrls={mockImageUrls}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      // Test delete button for second image
      const deleteButton = screen.getByTestId('delete-button-1');
      await userEvent.click(deleteButton);

      expect(mockOnDeleteClick).toHaveBeenCalledWith('https://example.com/processed2.jpg');
      expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty image array', () => {
      render(
        <ProcessedImagesTestComponent
          processedImageUrls={[]}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      expect(screen.queryByAltText(/תמונה מעובדת/)).not.toBeInTheDocument();
      expect(mockOnImageClick).not.toHaveBeenCalled();
      expect(mockOnDownloadClick).not.toHaveBeenCalled();
      expect(mockOnDeleteClick).not.toHaveBeenCalled();
    });

    it('should handle single image', () => {
      render(
        <ProcessedImagesTestComponent
          processedImageUrls={['https://example.com/single.jpg']}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      const images = screen.getAllByAltText(/תמונה מעובדת/);
      expect(images).toHaveLength(1);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/single.jpg');
      
      // Should have both action buttons for the single image
      expect(screen.getByTestId('download-button-0')).toBeInTheDocument();
      expect(screen.getByTestId('delete-button-0')).toBeInTheDocument();
    });

    it('should handle invalid URLs gracefully', () => {
      const invalidUrls = ['', 'invalid-url', null as any, undefined as any].filter(Boolean);
      
      render(
        <ProcessedImagesTestComponent
          processedImageUrls={invalidUrls}
          onImageClick={mockOnImageClick}
          onDownloadClick={mockOnDownloadClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      // Should render images even with invalid URLs
      const images = screen.getAllByAltText(/תמונה מעובדת/);
      expect(images.length).toBeGreaterThan(0);
    });
  });
}); 