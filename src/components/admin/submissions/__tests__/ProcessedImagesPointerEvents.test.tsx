/// <reference types="vitest/globals" />

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { SubmissionViewer } from '../SubmissionViewer';

// Mock dependencies
vi.mock('@/hooks/useAdminSubmissions', () => ({
  useAdminSubmission: vi.fn(),
  useAdminSubmissionComments: vi.fn(),
  useAdminUpdateSubmissionStatus: vi.fn(),
  useAdminUpdateSubmissionLora: vi.fn(),
  useAdminAddSubmissionComment: vi.fn(),
}));

vi.mock('@/components/editor/submission-processing/hooks/useLightbox', () => ({
  useLightbox: vi.fn(),
}));

vi.mock('@/components/editor/submission/LightboxDialog', () => ({
  default: vi.fn(() => <div data-testid="lightbox-dialog">Lightbox Dialog</div>),
}));

vi.mock('@/utils/downloadUtils', () => ({
  downloadImagesAsZip: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: { from: vi.fn(() => ({ upload: vi.fn(), getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'test' } })) })) },
    from: vi.fn(() => ({ update: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })) })),
  },
}));

import { useAdminSubmission } from '@/hooks/useAdminSubmissions';
import { useLightbox } from '@/components/editor/submission-processing/hooks/useLightbox';

describe('ProcessedImages Pointer Events Fix Tests', () => {
  const mockSubmission = {
    submission_id: 'test-id',
    item_type: 'מנה',
    item_name_at_submission: 'Test',
    uploaded_at: '2024-01-01T00:00:00Z',
    submission_status: 'pending',
    processed_image_urls: [
      'https://example.com/processed1.jpg',
      'https://example.com/processed2.jpg',
    ],
    main_processed_image_url: 'https://example.com/processed1.jpg',
  };

  const mockLightbox = {
    lightboxImage: null,
    lightboxImages: [],
    currentImageIndex: 0,
    setLightboxImage: vi.fn(),
    navigateToIndex: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useAdminSubmission as Mock).mockReturnValue({
      data: mockSubmission,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    (useLightbox as Mock).mockReturnValue(mockLightbox);
    
    vi.mocked(require('@/hooks/useAdminSubmissions').useAdminSubmissionComments).mockReturnValue({ data: [] });
    vi.mocked(require('@/hooks/useAdminSubmissions').useAdminUpdateSubmissionStatus).mockReturnValue({ mutate: vi.fn(), isPending: false });
    vi.mocked(require('@/hooks/useAdminSubmissions').useAdminUpdateSubmissionLora).mockReturnValue({ mutate: vi.fn(), isPending: false });
    vi.mocked(require('@/hooks/useAdminSubmissions').useAdminAddSubmissionComment).mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  describe('Pointer Events CSS Classes', () => {
    it('should apply pointer-events-none to overlay div', () => {
      const { container } = render(
        <SubmissionViewer
          submissionId="test-id"
          viewMode="admin"
          context="full-page"
        />
      );

      // Find overlay div with pointer-events-none class
      const overlayDiv = container.querySelector('.absolute.inset-0.pointer-events-none');
      expect(overlayDiv).toBeTruthy();
      expect(overlayDiv).toHaveClass('pointer-events-none');
    });

    it('should apply pointer-events-auto to download button', () => {
      const { container } = render(
        <SubmissionViewer
          submissionId="test-id"
          viewMode="admin"
          context="full-page"
        />
      );

      // Find download button with pointer-events-auto class
      const downloadButton = container.querySelector('button.pointer-events-auto');
      expect(downloadButton).toBeTruthy();
      expect(downloadButton).toHaveClass('pointer-events-auto');
    });

    it('should have correct overlay structure', () => {
      const { container } = render(
        <SubmissionViewer
          submissionId="test-id"
          viewMode="admin"
          context="full-page"
        />
      );

      // Verify overlay structure: overlay div contains button
      const overlayDiv = container.querySelector('.absolute.inset-0.pointer-events-none');
      const buttonInsideOverlay = overlayDiv?.querySelector('button.pointer-events-auto');
      
      expect(overlayDiv).toBeTruthy();
      expect(buttonInsideOverlay).toBeTruthy();
    });
  });

  describe('Click Event Handling', () => {
    it('should trigger image click despite overlay presence', async () => {
      render(
        <SubmissionViewer
          submissionId="test-id"
          viewMode="admin"
          context="full-page"
        />
      );

      const processedImage = screen.getAllByAltText(/תמונה מעובדת/)[0];
      await userEvent.click(processedImage);

      expect(mockLightbox.setLightboxImage).toHaveBeenCalledWith(
        'https://example.com/processed1.jpg',
        ['https://example.com/processed1.jpg', 'https://example.com/processed2.jpg']
      );
    });

    it('should handle stopPropagation correctly', () => {
      render(
        <SubmissionViewer
          submissionId="test-id"
          viewMode="admin"
          context="full-page"
        />
      );

      const processedImage = screen.getAllByAltText(/תמונה מעובדת/)[0];
      
      // Create a mock event with stopPropagation
      const mockEvent = {
        stopPropagation: vi.fn(),
        target: processedImage,
        currentTarget: processedImage,
      };

      fireEvent.click(processedImage, mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should prevent overlay from blocking image clicks', () => {
      const { container } = render(
        <SubmissionViewer
          submissionId="test-id"
          viewMode="admin"
          context="full-page"
        />
      );

      // Find the overlay that was previously blocking clicks
      const overlayDiv = container.querySelector('.absolute.inset-0');
      
      // Verify it has pointer-events-none to allow clicks through
      expect(overlayDiv).toHaveClass('pointer-events-none');
      
      // Verify the overlay spans the full image area
      expect(overlayDiv).toHaveClass('inset-0');
    });
  });

  describe('Download Button Functionality', () => {
    it('should maintain download button clickability', () => {
      const { container } = render(
        <SubmissionViewer
          submissionId="test-id"
          viewMode="admin"
          context="full-page"
        />
      );

      // Find download button
      const downloadButton = container.querySelector('button.pointer-events-auto');
      expect(downloadButton).toBeTruthy();
      
      // Verify it has pointer-events-auto to maintain clickability
      expect(downloadButton).toHaveClass('pointer-events-auto');
    });

    it('should not trigger lightbox when download button is clicked', async () => {
      const { container } = render(
        <SubmissionViewer
          submissionId="test-id"
          viewMode="admin"
          context="full-page"
        />
      );

      // Mock download functionality
      const mockClick = vi.fn();
      const mockLink = { click: mockClick, href: '', download: '' };
      global.document.createElement = vi.fn().mockReturnValue(mockLink);
      global.document.body.appendChild = vi.fn();
      global.document.body.removeChild = vi.fn();

      const downloadButton = container.querySelector('button.pointer-events-auto');
      expect(downloadButton).toBeTruthy();

      if (downloadButton) {
        // Create event with stopPropagation to verify it prevents bubbling
        const mockEvent = new MouseEvent('click', { bubbles: true });
        const stopPropagationSpy = vi.spyOn(mockEvent, 'stopPropagation');
        
        fireEvent.click(downloadButton, mockEvent);
        
        expect(stopPropagationSpy).toHaveBeenCalled();
        expect(mockLightbox.setLightboxImage).not.toHaveBeenCalled();
      }
    });
  });

  describe('Hover State Behavior', () => {
    it('should show download button on hover with proper opacity classes', () => {
      const { container } = render(
        <SubmissionViewer
          submissionId="test-id"
          viewMode="admin"
          context="full-page"
        />
      );

      // Find download button - should have opacity transition classes
      const downloadButton = container.querySelector('button.pointer-events-auto');
      expect(downloadButton).toHaveClass('opacity-0');
      expect(downloadButton).toHaveClass('group-hover:opacity-100');
      expect(downloadButton).toHaveClass('transition-opacity');
    });

    it('should apply hover effects to overlay background', () => {
      const { container } = render(
        <SubmissionViewer
          submissionId="test-id"
          viewMode="admin"
          context="full-page"
        />
      );

      // Find overlay div - should have hover opacity classes
      const overlayDiv = container.querySelector('.absolute.inset-0.pointer-events-none');
      expect(overlayDiv).toHaveClass('bg-opacity-0');
      expect(overlayDiv).toHaveClass('group-hover:bg-opacity-30');
      expect(overlayDiv).toHaveClass('transition-all');
    });
  });

  describe('Image Container Structure', () => {
    it('should have proper group class for hover effects', () => {
      const { container } = render(
        <SubmissionViewer
          submissionId="test-id"
          viewMode="admin"
          context="full-page"
        />
      );

      // Find image containers with group class
      const groupContainers = container.querySelectorAll('.group');
      expect(groupContainers.length).toBeGreaterThan(0);
      
      // Each should contain the image and overlay
      groupContainers.forEach(container => {
        const image = container.querySelector('img');
        const overlay = container.querySelector('.absolute.inset-0.pointer-events-none');
        
        expect(image).toBeTruthy();
        expect(overlay).toBeTruthy();
      });
    });

    it('should maintain proper z-index stacking', () => {
      const { container } = render(
        <SubmissionViewer
          submissionId="test-id"
          viewMode="admin"
          context="full-page"
        />
      );

      // Find relative positioned container
      const imageContainer = container.querySelector('.relative.aspect-square');
      expect(imageContainer).toBeTruthy();
      
      // Should contain image and absolute positioned overlay
      const image = imageContainer?.querySelector('img');
      const overlay = imageContainer?.querySelector('.absolute.inset-0');
      
      expect(image).toBeTruthy();
      expect(overlay).toBeTruthy();
      expect(overlay).toHaveClass('absolute');
    });
  });

  describe('CSS Class Integration', () => {
    it('should have all required CSS classes for the fix', () => {
      const { container } = render(
        <SubmissionViewer
          submissionId="test-id"
          viewMode="admin"
          context="full-page"
        />
      );

      // Check complete class structure
      const overlayDiv = container.querySelector(
        '.absolute.inset-0.bg-black.bg-opacity-0.group-hover\\:bg-opacity-30.transition-all.flex.items-center.justify-center.pointer-events-none'
      );
      
      expect(overlayDiv).toBeTruthy();
      
      const downloadButton = overlayDiv?.querySelector(
        'button.opacity-0.group-hover\\:opacity-100.transition-opacity.pointer-events-auto'
      );
      
      expect(downloadButton).toBeTruthy();
    });

    it('should maintain backward compatibility with existing classes', () => {
      const { container } = render(
        <SubmissionViewer
          submissionId="test-id"
          viewMode="admin"
          context="full-page"
        />
      );

      // Verify existing classes still present
      const imageContainer = container.querySelector('.relative.aspect-square.bg-white.rounded-lg.border-2.overflow-hidden.hover\\:scale-105.transition-transform.group');
      expect(imageContainer).toBeTruthy();
      
      const image = container.querySelector('img.w-full.h-full.object-cover.cursor-pointer');
      expect(image).toBeTruthy();
    });
  });

  describe('Multiple Images Handling', () => {
    it('should apply pointer events fix to all processed images', () => {
      const { container } = render(
        <SubmissionViewer
          submissionId="test-id"
          viewMode="admin"
          context="full-page"
        />
      );

      // Should have multiple overlays with pointer-events-none
      const overlays = container.querySelectorAll('.absolute.inset-0.pointer-events-none');
      expect(overlays.length).toBe(2); // Two processed images
      
      // Should have multiple download buttons with pointer-events-auto
      const downloadButtons = container.querySelectorAll('button.pointer-events-auto');
      expect(downloadButtons.length).toBe(2);
    });

    it('should handle click events independently for each image', async () => {
      render(
        <SubmissionViewer
          submissionId="test-id"
          viewMode="admin"
          context="full-page"
        />
      );

      const images = screen.getAllByAltText(/תמונה מעובדת/);
      
      // Click first image
      await userEvent.click(images[0]);
      expect(mockLightbox.setLightboxImage).toHaveBeenCalledWith(
        'https://example.com/processed1.jpg',
        ['https://example.com/processed1.jpg', 'https://example.com/processed2.jpg']
      );

      // Reset and click second image
      mockLightbox.setLightboxImage.mockClear();
      await userEvent.click(images[1]);
      expect(mockLightbox.setLightboxImage).toHaveBeenCalledWith(
        'https://example.com/processed2.jpg',
        ['https://example.com/processed1.jpg', 'https://example.com/processed2.jpg']
      );
    });
  });
}); 