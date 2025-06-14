import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, test, expect } from 'vitest';

// Mock the AddProcessedImageModal component
const MockAddProcessedImageModal: React.FC<{
  submissionId: string;
  onImageAdded: () => void;
  isOverlay?: boolean;
}> = ({ isOverlay }) => {
  return (
    <button data-testid="add-image-button">
      {isOverlay ? '+' : 'הוסף תמונה מעובדת'}
    </button>
  );
};

// Test component that simulates the processed images section
const ProcessedImagesSection: React.FC<{
  hasImages: boolean;
  submissionId: string;
  onImageAdded: () => void;
  onDeleteImage: () => void;
}> = ({ hasImages, submissionId, onImageAdded, onDeleteImage }) => {
  return (
    <div>
      {hasImages ? (
        <div className="relative group">
          <img 
            src="test-image.jpg" 
            alt="תמונה מעובדת"
            data-testid="processed-image"
          />
          
          {/* Action buttons overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 pointer-events-none">
            <div className="pointer-events-auto">
              <MockAddProcessedImageModal 
                submissionId={submissionId}
                onImageAdded={onImageAdded}
                isOverlay={true}
              />
            </div>
            <button
              className="pointer-events-auto"
              onClick={onDeleteImage}
              data-testid="delete-button"
            >
              🗑️
            </button>
          </div>
        </div>
      ) : (
        <div className="aspect-square bg-green-100 rounded-lg flex items-center justify-center relative">
          <MockAddProcessedImageModal 
            submissionId={submissionId}
            onImageAdded={onImageAdded}
          />
        </div>
      )}
    </div>
  );
};

describe('Add Processed Image Button Functionality', () => {
  const mockSubmissionId = 'test-submission-123';
  const mockOnImageAdded = vi.fn();
  const mockOnDeleteImage = vi.fn();

  test('shows add image button when no images exist', () => {
    render(
      <ProcessedImagesSection
        hasImages={false}
        submissionId={mockSubmissionId}
        onImageAdded={mockOnImageAdded}
        onDeleteImage={mockOnDeleteImage}
      />
    );

    const addButton = screen.getByTestId('add-image-button');
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent('הוסף תמונה מעובדת');
  });

  test('shows both add and delete buttons when images exist', () => {
    render(
      <ProcessedImagesSection
        hasImages={true}
        submissionId={mockSubmissionId}
        onImageAdded={mockOnImageAdded}
        onDeleteImage={mockOnDeleteImage}
      />
    );

    const processedImage = screen.getByTestId('processed-image');
    const addButton = screen.getByTestId('add-image-button');
    const deleteButton = screen.getByTestId('delete-button');

    expect(processedImage).toBeInTheDocument();
    expect(addButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
    
    // Overlay button should show '+' symbol
    expect(addButton).toHaveTextContent('+');
  });

  test('add button has correct pointer-events-auto class', () => {
    render(
      <ProcessedImagesSection
        hasImages={true}
        submissionId={mockSubmissionId}
        onImageAdded={mockOnImageAdded}
        onDeleteImage={mockOnDeleteImage}
      />
    );

    const addButtonContainer = screen.getByTestId('add-image-button').parentElement;
    expect(addButtonContainer).toHaveClass('pointer-events-auto');
  });

  test('overlay has correct pointer-events-none class', () => {
    render(
      <ProcessedImagesSection
        hasImages={true}
        submissionId={mockSubmissionId}
        onImageAdded={mockOnImageAdded}
        onDeleteImage={mockOnDeleteImage}
      />
    );

    const overlay = screen.getByTestId('add-image-button').parentElement?.parentElement;
    expect(overlay).toHaveClass('pointer-events-none');
  });

  test('buttons are positioned correctly in overlay', () => {
    render(
      <ProcessedImagesSection
        hasImages={true}
        submissionId={mockSubmissionId}
        onImageAdded={mockOnImageAdded}
        onDeleteImage={mockOnDeleteImage}
      />
    );

    const overlay = screen.getByTestId('add-image-button').parentElement?.parentElement;
    expect(overlay).toHaveClass('flex', 'items-center', 'justify-center', 'gap-2');
  });
}); 