import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';

// Mock the ImageLightbox component
const MockImageLightbox: React.FC<{
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  images?: string[];
  currentIndex?: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
}> = ({ imageUrl, isOpen, onClose, images = [], currentIndex = 0, onNavigate }) => {
  if (!isOpen) return null;

  const hasMultipleImages = images.length > 1;

  return (
    <div data-testid="lightbox-modal">
      <button data-testid="close-button" onClick={onClose}>
        ✕
      </button>
      
      <img 
        src={imageUrl} 
        alt="תמונה מוגדלת"
        data-testid="lightbox-image"
      />
      
      {hasMultipleImages && onNavigate && (
        <>
          <button 
            data-testid="prev-button"
            onClick={() => onNavigate('prev')}
          >
            ←
          </button>
          <button 
            data-testid="next-button"
            onClick={() => onNavigate('next')}
          >
            →
          </button>
          <div data-testid="image-counter">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

// Test component that simulates the lightbox functionality
const LightboxTestComponent: React.FC = () => {
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [lightboxImages, setLightboxImages] = React.useState<string[]>([]);
  const [lightboxCurrentIndex, setLightboxCurrentIndex] = React.useState(0);
  const [lightboxType, setLightboxType] = React.useState<'original' | 'processed'>('original');

  const originalImages = ['original1.jpg', 'original2.jpg', 'original3.jpg'];
  const processedImages = ['processed1.jpg', 'processed2.jpg'];

  const openLightbox = (imageUrl: string, type: 'original' | 'processed' = 'original') => {
    let images: string[] = [];
    let currentIndex = 0;

    if (type === 'original') {
      images = originalImages;
      currentIndex = images.indexOf(imageUrl);
    } else {
      images = processedImages;
      currentIndex = images.indexOf(imageUrl);
    }

    setLightboxImage(imageUrl);
    setLightboxImages(images);
    setLightboxCurrentIndex(Math.max(0, currentIndex));
    setLightboxType(type);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setLightboxImage(null);
    setLightboxImages([]);
    setLightboxCurrentIndex(0);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (lightboxImages.length <= 1) return;

    let newIndex: number;
    if (direction === 'prev') {
      newIndex = lightboxCurrentIndex === 0 ? lightboxImages.length - 1 : lightboxCurrentIndex - 1;
    } else {
      newIndex = lightboxCurrentIndex === lightboxImages.length - 1 ? 0 : lightboxCurrentIndex + 1;
    }

    setLightboxCurrentIndex(newIndex);
    setLightboxImage(lightboxImages[newIndex]);
  };

  return (
    <div>
      <div data-testid="original-images">
        {originalImages.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Original ${index + 1}`}
            data-testid={`original-image-${index}`}
            onClick={() => openLightbox(img, 'original')}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </div>
      
      <div data-testid="processed-images">
        {processedImages.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Processed ${index + 1}`}
            data-testid={`processed-image-${index}`}
            onClick={() => openLightbox(img, 'processed')}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </div>

      {lightboxImage && (
        <MockImageLightbox
          imageUrl={lightboxImage}
          isOpen={isLightboxOpen}
          onClose={closeLightbox}
          images={lightboxImages}
          currentIndex={lightboxCurrentIndex}
          onNavigate={navigateLightbox}
        />
      )}
    </div>
  );
};

describe('Lightbox Navigation Functionality', () => {
  beforeEach(() => {
    // Reset any state before each test
  });

  test('opens lightbox when clicking on original image', () => {
    render(<LightboxTestComponent />);
    
    const firstOriginalImage = screen.getByTestId('original-image-0');
    fireEvent.click(firstOriginalImage);
    
    expect(screen.getByTestId('lightbox-modal')).toBeInTheDocument();
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute('src', 'original1.jpg');
  });

  test('opens lightbox when clicking on processed image', () => {
    render(<LightboxTestComponent />);
    
    const firstProcessedImage = screen.getByTestId('processed-image-0');
    fireEvent.click(firstProcessedImage);
    
    expect(screen.getByTestId('lightbox-modal')).toBeInTheDocument();
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute('src', 'processed1.jpg');
  });

  test('shows navigation arrows for multiple original images', () => {
    render(<LightboxTestComponent />);
    
    const firstOriginalImage = screen.getByTestId('original-image-0');
    fireEvent.click(firstOriginalImage);
    
    expect(screen.getByTestId('prev-button')).toBeInTheDocument();
    expect(screen.getByTestId('next-button')).toBeInTheDocument();
    expect(screen.getByTestId('image-counter')).toHaveTextContent('1 / 3');
  });

  test('shows navigation arrows for multiple processed images', () => {
    render(<LightboxTestComponent />);
    
    const firstProcessedImage = screen.getByTestId('processed-image-0');
    fireEvent.click(firstProcessedImage);
    
    expect(screen.getByTestId('prev-button')).toBeInTheDocument();
    expect(screen.getByTestId('next-button')).toBeInTheDocument();
    expect(screen.getByTestId('image-counter')).toHaveTextContent('1 / 2');
  });

  test('navigates to next image when clicking next button', () => {
    render(<LightboxTestComponent />);
    
    const firstOriginalImage = screen.getByTestId('original-image-0');
    fireEvent.click(firstOriginalImage);
    
    const nextButton = screen.getByTestId('next-button');
    fireEvent.click(nextButton);
    
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute('src', 'original2.jpg');
    expect(screen.getByTestId('image-counter')).toHaveTextContent('2 / 3');
  });

  test('navigates to previous image when clicking prev button', () => {
    render(<LightboxTestComponent />);
    
    const secondOriginalImage = screen.getByTestId('original-image-1');
    fireEvent.click(secondOriginalImage);
    
    const prevButton = screen.getByTestId('prev-button');
    fireEvent.click(prevButton);
    
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute('src', 'original1.jpg');
    expect(screen.getByTestId('image-counter')).toHaveTextContent('1 / 3');
  });

  test('wraps around to last image when clicking prev on first image', () => {
    render(<LightboxTestComponent />);
    
    const firstOriginalImage = screen.getByTestId('original-image-0');
    fireEvent.click(firstOriginalImage);
    
    const prevButton = screen.getByTestId('prev-button');
    fireEvent.click(prevButton);
    
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute('src', 'original3.jpg');
    expect(screen.getByTestId('image-counter')).toHaveTextContent('3 / 3');
  });

  test('wraps around to first image when clicking next on last image', () => {
    render(<LightboxTestComponent />);
    
    const lastOriginalImage = screen.getByTestId('original-image-2');
    fireEvent.click(lastOriginalImage);
    
    const nextButton = screen.getByTestId('next-button');
    fireEvent.click(nextButton);
    
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute('src', 'original1.jpg');
    expect(screen.getByTestId('image-counter')).toHaveTextContent('1 / 3');
  });

  test('closes lightbox when clicking close button', () => {
    render(<LightboxTestComponent />);
    
    const firstOriginalImage = screen.getByTestId('original-image-0');
    fireEvent.click(firstOriginalImage);
    
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    
    expect(screen.queryByTestId('lightbox-modal')).not.toBeInTheDocument();
  });

  test('opens correct image when clicking different original images', () => {
    render(<LightboxTestComponent />);
    
    const thirdOriginalImage = screen.getByTestId('original-image-2');
    fireEvent.click(thirdOriginalImage);
    
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute('src', 'original3.jpg');
    expect(screen.getByTestId('image-counter')).toHaveTextContent('3 / 3');
  });

  test('maintains separate navigation for original vs processed images', () => {
    render(<LightboxTestComponent />);
    
    // Open processed image
    const firstProcessedImage = screen.getByTestId('processed-image-0');
    fireEvent.click(firstProcessedImage);
    
    expect(screen.getByTestId('image-counter')).toHaveTextContent('1 / 2');
    
    // Navigate to next processed image
    const nextButton = screen.getByTestId('next-button');
    fireEvent.click(nextButton);
    
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute('src', 'processed2.jpg');
    expect(screen.getByTestId('image-counter')).toHaveTextContent('2 / 2');
  });
}); 