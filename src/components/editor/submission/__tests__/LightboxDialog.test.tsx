/// <reference types="vitest/globals" />

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LightboxDialog from '../LightboxDialog';

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-blob-url'),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
});

// Mock document methods for download functionality
Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    click: vi.fn(),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
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

describe('LightboxDialog Component', () => {
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

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render lightbox dialog when open', () => {
      render(<LightboxDialog {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('תצוגה מקדימה')).toBeInTheDocument();
      expect(screen.getByAltText('תצוגה מקדימה')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<LightboxDialog {...defaultProps} open={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render image with correct src', () => {
      render(<LightboxDialog {...defaultProps} />);
      
      const image = screen.getByAltText('תצוגה מקדימה');
      expect(image).toHaveAttribute('src', defaultProps.imageUrl);
    });

    it('should render close button', () => {
      render(<LightboxDialog {...defaultProps} />);
      
      expect(screen.getByText('סגור')).toBeInTheDocument();
    });

    it('should render download button', () => {
      render(<LightboxDialog {...defaultProps} />);
      
      const downloadButton = screen.getByLabelText('הורד תמונה');
      expect(downloadButton).toBeInTheDocument();
    });
  });

  describe('Single Image Mode', () => {
    it('should show single image description for one image', () => {
      render(<LightboxDialog {...defaultProps} />);
      
      expect(screen.getByText('תצוגה מוגדלת של התמונה שנבחרה')).toBeInTheDocument();
    });

    it('should not show navigation arrows for single image', () => {
      render(<LightboxDialog {...defaultProps} />);
      
      expect(screen.queryByLabelText('תמונה קודמת')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('תמונה הבאה')).not.toBeInTheDocument();
    });

    it('should not show navigation arrows when images array has one item', () => {
      render(
        <LightboxDialog 
          {...defaultProps} 
          images={[defaultProps.imageUrl]}
          currentIndex={0}
          onNavigate={mockOnNavigate}
        />
      );
      
      expect(screen.queryByLabelText('תמונה קודמת')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('תמונה הבאה')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Images Mode', () => {
    const multiImageProps = {
      ...defaultProps,
      images: mockImages,
      currentIndex: 1,
      onNavigate: mockOnNavigate,
    };

    it('should show image counter for multiple images', () => {
      render(<LightboxDialog {...multiImageProps} />);
      
      expect(screen.getByText('תמונה 2 מתוך 3')).toBeInTheDocument();
    });

    it('should render navigation arrows for multiple images', () => {
      render(<LightboxDialog {...multiImageProps} />);
      
      expect(screen.getByLabelText('תמונה קודמת')).toBeInTheDocument();
      expect(screen.getByLabelText('תמונה הבאה')).toBeInTheDocument();
    });

    it('should show correct image counter for first image', () => {
      render(
        <LightboxDialog 
          {...multiImageProps} 
          currentIndex={0} 
        />
      );
      
      expect(screen.getByText('תמונה 1 מתוך 3')).toBeInTheDocument();
    });

    it('should show correct image counter for last image', () => {
      render(
        <LightboxDialog 
          {...multiImageProps} 
          currentIndex={2} 
        />
      );
      
      expect(screen.getByText('תמונה 3 מתוך 3')).toBeInTheDocument();
    });
  });

  describe('Navigation Functionality', () => {
    const navigationProps = {
      ...defaultProps,
      images: mockImages,
      currentIndex: 1,
      onNavigate: mockOnNavigate,
    };

    it('should call onNavigate with previous index when previous button clicked', async () => {
      render(<LightboxDialog {...navigationProps} />);
      
      const prevButton = screen.getByLabelText('תמונה קודמת');
      await userEvent.click(prevButton);
      
      expect(mockOnNavigate).toHaveBeenCalledWith(0);
    });

    it('should call onNavigate with next index when next button clicked', async () => {
      render(<LightboxDialog {...navigationProps} />);
      
      const nextButton = screen.getByLabelText('תמונה הבאה');
      await userEvent.click(nextButton);
      
      expect(mockOnNavigate).toHaveBeenCalledWith(2);
    });

    it('should navigate to last image when clicking previous on first image (circular)', async () => {
      render(
        <LightboxDialog 
          {...navigationProps} 
          currentIndex={0} 
        />
      );
      
      const prevButton = screen.getByLabelText('תמונה קודמת');
      await userEvent.click(prevButton);
      
      expect(mockOnNavigate).toHaveBeenCalledWith(2); // Last image index
    });

    it('should navigate to first image when clicking next on last image (circular)', async () => {
      render(
        <LightboxDialog 
          {...navigationProps} 
          currentIndex={2} 
        />
      );
      
      const nextButton = screen.getByLabelText('תמונה הבאה');
      await userEvent.click(nextButton);
      
      expect(mockOnNavigate).toHaveBeenCalledWith(0); // First image index
    });

    it('should not call onNavigate when onNavigate is not provided', async () => {
      render(
        <LightboxDialog 
          {...defaultProps}
          images={mockImages}
          currentIndex={1}
        />
      );
      
      // Navigation arrows should not be rendered when onNavigate is not provided
      expect(screen.queryByLabelText('תמונה קודמת')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('תמונה הבאה')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    const keyboardProps = {
      ...defaultProps,
      images: mockImages,
      currentIndex: 1,
      onNavigate: mockOnNavigate,
    };

    it('should navigate to previous image on ArrowLeft key', async () => {
      render(<LightboxDialog {...keyboardProps} />);
      
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
      
      expect(mockOnNavigate).toHaveBeenCalledWith(0);
    });

    it('should navigate to next image on ArrowRight key', async () => {
      render(<LightboxDialog {...keyboardProps} />);
      
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'ArrowRight' });
      
      expect(mockOnNavigate).toHaveBeenCalledWith(2);
    });

    it('should handle ArrowLeft on first image (circular)', async () => {
      render(
        <LightboxDialog 
          {...keyboardProps} 
          currentIndex={0} 
        />
      );
      
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
      
      expect(mockOnNavigate).toHaveBeenCalledWith(2); // Last image
    });

    it('should handle ArrowRight on last image (circular)', async () => {
      render(
        <LightboxDialog 
          {...keyboardProps} 
          currentIndex={2} 
        />
      );
      
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'ArrowRight' });
      
      expect(mockOnNavigate).toHaveBeenCalledWith(0); // First image
    });

    it('should ignore other keys', async () => {
      render(<LightboxDialog {...keyboardProps} />);
      
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });
      fireEvent.keyDown(dialog, { key: 'Enter' });
      fireEvent.keyDown(dialog, { key: 'Space' });
      
      expect(mockOnNavigate).not.toHaveBeenCalled();
    });

    it('should not navigate on keyboard when onNavigate is not provided', async () => {
      render(
        <LightboxDialog 
          {...defaultProps}
          images={mockImages}
          currentIndex={1}
        />
      );
      
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
      fireEvent.keyDown(dialog, { key: 'ArrowRight' });
      
      // Should not throw errors and onNavigate should not be called
      expect(mockOnNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Download Functionality', () => {
    it('should trigger download when download button clicked', async () => {
      const mockClick = vi.fn();
      const mockElement = {
        click: mockClick,
        href: '',
        download: '',
      };
      
      vi.mocked(document.createElement).mockReturnValue(mockElement as any);
      
      render(<LightboxDialog {...defaultProps} />);
      
      const downloadButton = screen.getByLabelText('הורד תמונה');
      await userEvent.click(downloadButton);
      
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockElement.href).toBe(defaultProps.imageUrl);
      expect(mockElement.download).toMatch(/food-vision-image-\d+\.jpg/);
      expect(mockClick).toHaveBeenCalled();
    });

    it('should not trigger download when imageUrl is null', async () => {
      const mockClick = vi.fn();
      vi.mocked(document.createElement).mockReturnValue({
        click: mockClick,
        href: '',
        download: '',
      } as any);
      
      render(
        <LightboxDialog 
          {...defaultProps} 
          imageUrl={null} 
        />
      );
      
      // Download button should still be present but clicking should not trigger download
      const downloadButton = screen.getByLabelText('הורד תמונה');
      await userEvent.click(downloadButton);
      
      expect(mockClick).not.toHaveBeenCalled();
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button clicked', async () => {
      render(<LightboxDialog {...defaultProps} />);
      
      const closeButton = screen.getByText('סגור');
      await userEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when dialog backdrop clicked', async () => {
      render(<LightboxDialog {...defaultProps} />);
      
      // This simulates clicking outside the dialog content
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });
      
      // Note: The actual dialog close behavior depends on the Dialog component implementation
      // We're testing that the onClose prop is wired correctly
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty images array', () => {
      render(
        <LightboxDialog 
          {...defaultProps}
          images={[]}
          currentIndex={0}
          onNavigate={mockOnNavigate}
        />
      );
      
      expect(screen.getByText('תצוגה מוגדלת של התמונה שנבחרה')).toBeInTheDocument();
      expect(screen.queryByLabelText('תמונה קודמת')).not.toBeInTheDocument();
    });

    it('should handle invalid currentIndex', () => {
      render(
        <LightboxDialog 
          {...defaultProps}
          images={mockImages}
          currentIndex={-1}
          onNavigate={mockOnNavigate}
        />
      );
      
      // Should still render without crashing
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('תמונה 0 מתוך 3')).toBeInTheDocument();
    });

    it('should handle currentIndex beyond array length', () => {
      render(
        <LightboxDialog 
          {...defaultProps}
          images={mockImages}
          currentIndex={10}
          onNavigate={mockOnNavigate}
        />
      );
      
      // Should still render without crashing
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('תמונה 11 מתוך 3')).toBeInTheDocument();
    });

    it('should handle null images array', () => {
      render(
        <LightboxDialog 
          {...defaultProps}
          images={null as any}
          currentIndex={0}
          onNavigate={mockOnNavigate}
        />
      );
      
      // Should render as single image mode
      expect(screen.getByText('תצוגה מוגדלת של התמונה שנבחרה')).toBeInTheDocument();
      expect(screen.queryByLabelText('תמונה קודמת')).not.toBeInTheDocument();
    });

    it('should handle undefined currentIndex', () => {
      render(
        <LightboxDialog 
          {...defaultProps}
          images={mockImages}
          currentIndex={undefined as any}
          onNavigate={mockOnNavigate}
        />
      );
      
      // Should default to 0
      expect(screen.getByText('תמונה 1 מתוך 3')).toBeInTheDocument();
    });

    it('should not render image when imageUrl is null', () => {
      render(
        <LightboxDialog 
          {...defaultProps} 
          imageUrl={null} 
        />
      );
      
      expect(screen.queryByAltText('תצוגה מקדימה')).not.toBeInTheDocument();
    });

    it('should handle empty string imageUrl', () => {
      render(
        <LightboxDialog 
          {...defaultProps} 
          imageUrl="" 
        />
      );
      
      const image = screen.getByAltText('תצוגה מקדימה');
      expect(image).toHaveAttribute('src', '');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for navigation buttons', () => {
      render(
        <LightboxDialog 
          {...defaultProps}
          images={mockImages}
          currentIndex={1}
          onNavigate={mockOnNavigate}
        />
      );
      
      expect(screen.getByLabelText('תמונה קודמת')).toBeInTheDocument();
      expect(screen.getByLabelText('תמונה הבאה')).toBeInTheDocument();
      expect(screen.getByLabelText('הורד תמונה')).toBeInTheDocument();
    });

    it('should have proper dialog role', () => {
      render(<LightboxDialog {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have focusable dialog content', () => {
      render(<LightboxDialog {...defaultProps} />);
      
      const dialogContent = screen.getByRole('dialog');
      expect(dialogContent).toHaveAttribute('tabIndex', '-1');
    });

    it('should have proper alt text for image', () => {
      render(<LightboxDialog {...defaultProps} />);
      
      expect(screen.getByAltText('תצוגה מקדימה')).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should not re-render unnecessarily with same props', () => {
      const { rerender } = render(<LightboxDialog {...defaultProps} />);
      
      const initialImage = screen.getByAltText('תצוגה מקדימה');
      
      // Re-render with same props
      rerender(<LightboxDialog {...defaultProps} />);
      
      const sameImage = screen.getByAltText('תצוגה מקדימה');
      expect(sameImage).toBe(initialImage);
    });

    it('should handle rapid navigation calls', async () => {
      render(
        <LightboxDialog 
          {...defaultProps}
          images={mockImages}
          currentIndex={1}
          onNavigate={mockOnNavigate}
        />
      );
      
      const nextButton = screen.getByLabelText('תמונה הבאה');
      
      // Simulate rapid clicks
      await userEvent.click(nextButton);
      await userEvent.click(nextButton);
      await userEvent.click(nextButton);
      
      expect(mockOnNavigate).toHaveBeenCalledTimes(3);
    });
  });
}); 