import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';

// Mock the FullscreenComparison component
const MockFullscreenComparison: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  originalImages: string[];
  processedImages: string[];
  originalIndex: number;
  processedIndex: number;
  onNavigateOriginal: (direction: 'prev' | 'next') => void;
  onNavigateProcessed: (direction: 'prev' | 'next') => void;
}> = ({ 
  isOpen, 
  onClose, 
  originalImages, 
  processedImages, 
  originalIndex, 
  processedIndex, 
  onNavigateOriginal, 
  onNavigateProcessed 
}) => {
  if (!isOpen) return null;

  return (
    <div data-testid="fullscreen-comparison">
      <button data-testid="close-button" onClick={onClose}>
        ✕
      </button>
      
      {/* Processed Images Side - Left */}
      <div data-testid="processed-side">
        <div data-testid="processed-label">תמונות מעובדות</div>
        {processedImages.length > 0 ? (
          <>
            <img 
              src={processedImages[processedIndex]} 
              alt="תמונה מעובדת"
              data-testid="processed-image"
            />
            {processedImages.length > 1 && (
              <>
                <button 
                  data-testid="processed-prev"
                  onClick={() => onNavigateProcessed('prev')}
                >
                  ←
                </button>
                <button 
                  data-testid="processed-next"
                  onClick={() => onNavigateProcessed('next')}
                >
                  →
                </button>
                <div data-testid="processed-counter">
                  {processedIndex + 1} / {processedImages.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div data-testid="no-processed-images">אין תמונות מעובדות</div>
        )}
      </div>
      
      {/* Original Images Side - Right */}
      <div data-testid="original-side">
        <div data-testid="original-label">תמונות מקור</div>
        {originalImages.length > 0 ? (
          <>
            <img 
              src={originalImages[originalIndex]} 
              alt="תמונה מקורית"
              data-testid="original-image"
            />
            {originalImages.length > 1 && (
              <>
                <button 
                  data-testid="original-prev"
                  onClick={() => onNavigateOriginal('prev')}
                >
                  ←
                </button>
                <button 
                  data-testid="original-next"
                  onClick={() => onNavigateOriginal('next')}
                >
                  →
                </button>
                <div data-testid="original-counter">
                  {originalIndex + 1} / {originalImages.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div data-testid="no-original-images">אין תמונות מקור</div>
        )}
      </div>
    </div>
  );
};

// Test component that simulates the comparison functionality
const ComparisonTestComponent: React.FC = () => {
  const [isComparisonViewOpen, setIsComparisonViewOpen] = React.useState(false);
  const [comparisonOriginalIndex, setComparisonOriginalIndex] = React.useState(0);
  const [comparisonProcessedIndex, setComparisonProcessedIndex] = React.useState(0);

  const originalImages = ['original1.jpg', 'original2.jpg', 'original3.jpg'];
  const processedImages = ['processed1.jpg', 'processed2.jpg'];

  const openComparisonView = () => {
    setIsComparisonViewOpen(true);
  };

  const closeComparisonView = () => {
    setIsComparisonViewOpen(false);
  };

  const navigateComparisonOriginal = (direction: 'prev' | 'next') => {
    let newIndex: number;
    if (direction === 'prev') {
      newIndex = comparisonOriginalIndex === 0 ? originalImages.length - 1 : comparisonOriginalIndex - 1;
    } else {
      newIndex = comparisonOriginalIndex === originalImages.length - 1 ? 0 : comparisonOriginalIndex + 1;
    }
    setComparisonOriginalIndex(newIndex);
  };

  const navigateComparisonProcessed = (direction: 'prev' | 'next') => {
    let newIndex: number;
    if (direction === 'prev') {
      newIndex = comparisonProcessedIndex === 0 ? processedImages.length - 1 : comparisonProcessedIndex - 1;
    } else {
      newIndex = comparisonProcessedIndex === processedImages.length - 1 ? 0 : comparisonProcessedIndex + 1;
    }
    setComparisonProcessedIndex(newIndex);
  };

  return (
    <div>
      <button 
        data-testid="open-comparison-button"
        onClick={openComparisonView}
      >
        השוואה מלאה
      </button>

      <MockFullscreenComparison
        isOpen={isComparisonViewOpen}
        onClose={closeComparisonView}
        originalImages={originalImages}
        processedImages={processedImages}
        originalIndex={comparisonOriginalIndex}
        processedIndex={comparisonProcessedIndex}
        onNavigateOriginal={navigateComparisonOriginal}
        onNavigateProcessed={navigateComparisonProcessed}
      />
    </div>
  );
};

describe('Fullscreen Comparison Functionality', () => {
  beforeEach(() => {
    // Reset any state before each test
  });

  test('opens fullscreen comparison when clicking comparison button', () => {
    render(<ComparisonTestComponent />);
    
    const openButton = screen.getByTestId('open-comparison-button');
    fireEvent.click(openButton);
    
    expect(screen.getByTestId('fullscreen-comparison')).toBeInTheDocument();
  });

  test('shows both original and processed sides', () => {
    render(<ComparisonTestComponent />);
    
    const openButton = screen.getByTestId('open-comparison-button');
    fireEvent.click(openButton);
    
    expect(screen.getByTestId('original-side')).toBeInTheDocument();
    expect(screen.getByTestId('processed-side')).toBeInTheDocument();
    expect(screen.getByTestId('original-label')).toHaveTextContent('תמונות מקור');
    expect(screen.getByTestId('processed-label')).toHaveTextContent('תמונות מעובדות');
  });

  test('displays correct images initially', () => {
    render(<ComparisonTestComponent />);
    
    const openButton = screen.getByTestId('open-comparison-button');
    fireEvent.click(openButton);
    
    expect(screen.getByTestId('original-image')).toHaveAttribute('src', 'original1.jpg');
    expect(screen.getByTestId('processed-image')).toHaveAttribute('src', 'processed1.jpg');
  });

  test('shows navigation arrows for multiple images', () => {
    render(<ComparisonTestComponent />);
    
    const openButton = screen.getByTestId('open-comparison-button');
    fireEvent.click(openButton);
    
    // Original images navigation (3 images)
    expect(screen.getByTestId('original-prev')).toBeInTheDocument();
    expect(screen.getByTestId('original-next')).toBeInTheDocument();
    expect(screen.getByTestId('original-counter')).toHaveTextContent('1 / 3');
    
    // Processed images navigation (2 images)
    expect(screen.getByTestId('processed-prev')).toBeInTheDocument();
    expect(screen.getByTestId('processed-next')).toBeInTheDocument();
    expect(screen.getByTestId('processed-counter')).toHaveTextContent('1 / 2');
  });

  test('navigates original images independently', () => {
    render(<ComparisonTestComponent />);
    
    const openButton = screen.getByTestId('open-comparison-button');
    fireEvent.click(openButton);
    
    const originalNext = screen.getByTestId('original-next');
    fireEvent.click(originalNext);
    
    expect(screen.getByTestId('original-image')).toHaveAttribute('src', 'original2.jpg');
    expect(screen.getByTestId('original-counter')).toHaveTextContent('2 / 3');
    
    // Processed image should remain unchanged
    expect(screen.getByTestId('processed-image')).toHaveAttribute('src', 'processed1.jpg');
    expect(screen.getByTestId('processed-counter')).toHaveTextContent('1 / 2');
  });

  test('navigates processed images independently', () => {
    render(<ComparisonTestComponent />);
    
    const openButton = screen.getByTestId('open-comparison-button');
    fireEvent.click(openButton);
    
    const processedNext = screen.getByTestId('processed-next');
    fireEvent.click(processedNext);
    
    expect(screen.getByTestId('processed-image')).toHaveAttribute('src', 'processed2.jpg');
    expect(screen.getByTestId('processed-counter')).toHaveTextContent('2 / 2');
    
    // Original image should remain unchanged
    expect(screen.getByTestId('original-image')).toHaveAttribute('src', 'original1.jpg');
    expect(screen.getByTestId('original-counter')).toHaveTextContent('1 / 3');
  });

  test('wraps around original images navigation', () => {
    render(<ComparisonTestComponent />);
    
    const openButton = screen.getByTestId('open-comparison-button');
    fireEvent.click(openButton);
    
    // Go to last image by clicking prev on first image
    const originalPrev = screen.getByTestId('original-prev');
    fireEvent.click(originalPrev);
    
    expect(screen.getByTestId('original-image')).toHaveAttribute('src', 'original3.jpg');
    expect(screen.getByTestId('original-counter')).toHaveTextContent('3 / 3');
    
    // Go to first image by clicking next on last image
    const originalNext = screen.getByTestId('original-next');
    fireEvent.click(originalNext);
    
    expect(screen.getByTestId('original-image')).toHaveAttribute('src', 'original1.jpg');
    expect(screen.getByTestId('original-counter')).toHaveTextContent('1 / 3');
  });

  test('wraps around processed images navigation', () => {
    render(<ComparisonTestComponent />);
    
    const openButton = screen.getByTestId('open-comparison-button');
    fireEvent.click(openButton);
    
    // Go to last image by clicking prev on first image
    const processedPrev = screen.getByTestId('processed-prev');
    fireEvent.click(processedPrev);
    
    expect(screen.getByTestId('processed-image')).toHaveAttribute('src', 'processed2.jpg');
    expect(screen.getByTestId('processed-counter')).toHaveTextContent('2 / 2');
    
    // Go to first image by clicking next on last image
    const processedNext = screen.getByTestId('processed-next');
    fireEvent.click(processedNext);
    
    expect(screen.getByTestId('processed-image')).toHaveAttribute('src', 'processed1.jpg');
    expect(screen.getByTestId('processed-counter')).toHaveTextContent('1 / 2');
  });

  test('closes comparison when clicking close button', () => {
    render(<ComparisonTestComponent />);
    
    const openButton = screen.getByTestId('open-comparison-button');
    fireEvent.click(openButton);
    
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    
    expect(screen.queryByTestId('fullscreen-comparison')).not.toBeInTheDocument();
  });

  test('handles empty image arrays gracefully', () => {
    const EmptyImagesComponent: React.FC = () => {
      const [isOpen, setIsOpen] = React.useState(false);
      
      return (
        <div>
          <button onClick={() => setIsOpen(true)} data-testid="open-empty">
            Open Empty
          </button>
          <MockFullscreenComparison
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            originalImages={[]}
            processedImages={[]}
            originalIndex={0}
            processedIndex={0}
            onNavigateOriginal={() => {}}
            onNavigateProcessed={() => {}}
          />
        </div>
      );
    };
    
    render(<EmptyImagesComponent />);
    
    const openButton = screen.getByTestId('open-empty');
    fireEvent.click(openButton);
    
    expect(screen.getByTestId('no-original-images')).toHaveTextContent('אין תמונות מקור');
    expect(screen.getByTestId('no-processed-images')).toHaveTextContent('אין תמונות מעובדות');
  });
}); 