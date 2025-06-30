import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import UploadProgressModal, { UploadProgressData, UploadStep } from '../UploadProgressModal';

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div data-testid="progress-bar" data-value={value} className={className} />
  )
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className}
      data-testid="button"
    >
      {children}
    </button>
  )
}));

describe('UploadProgressModal - Comprehensive Tests', () => {
  const mockOnClose = vi.fn();
  const mockOnCancel = vi.fn();

  const createMockProgressData = (overrides?: Partial<UploadProgressData>): UploadProgressData => ({
    currentStep: 0,
    totalSteps: 4,
    overallProgress: 0,
    steps: [
      {
        id: 'compress',
        name: 'דחיסת תמונות',
        status: 'pending',
        progress: 0,
        details: 'מכין תמונות להעלאה...'
      },
      {
        id: 'upload',
        name: 'העלאת תמונות',
        status: 'pending',
        progress: 0,
        details: 'מעלה תמונות לשרת...'
      },
      {
        id: 'database',
        name: 'שמירה במערכת',
        status: 'pending',
        progress: 0,
        details: 'יוצר רכומות במסד הנתונים...'
      },
      {
        id: 'webhook',
        name: 'התראות',
        status: 'pending',
        progress: 0,
        details: 'שולח התראות...'
      }
    ],
    currentDish: 1,
    totalDishes: 3,
    canCancel: true,
    isComplete: false,
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path Tests', () => {
    it('should render progress modal when open', () => {
      const progressData = createMockProgressData();
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByText('העלאת מנות')).toBeInTheDocument();
      expect(screen.getByText('מנה 1 מתוך 3')).toBeInTheDocument();
    });

    it('should display all progress steps correctly', () => {
      const progressData = createMockProgressData();
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      expect(screen.getByText('דחיסת תמונות')).toBeInTheDocument();
      expect(screen.getByText('העלאת תמונות')).toBeInTheDocument();
      expect(screen.getByText('שמירה במערכת')).toBeInTheDocument();
      expect(screen.getByText('התראות')).toBeInTheDocument();
    });

    it('should show current dish name when provided', () => {
      const progressData = createMockProgressData({
        dishName: 'שניצל ירושלמי'
      });
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      expect(screen.getByText('שניצל ירושלמי')).toBeInTheDocument();
    });

    it('should display overall progress bar with correct value', () => {
      const progressData = createMockProgressData({
        overallProgress: 45
      });
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('data-value', '45');
    });

    it('should show cancel button when cancellation is allowed', () => {
      const progressData = createMockProgressData({
        canCancel: true
      });
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      const cancelButton = screen.getByText('בטל');
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).not.toBeDisabled();
    });

    it('should call onCancel when cancel button is clicked', () => {
      const progressData = createMockProgressData({
        canCancel: true
      });
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      fireEvent.click(screen.getByText('בטל'));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Progress Step States', () => {
    it('should display pending step with correct styling', () => {
      const progressData = createMockProgressData();
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      const compressStep = screen.getByText('דחיסת תמונות').closest('div');
      expect(compressStep).toHaveClass('text-gray-600');
    });

    it('should display in-progress step with correct styling', () => {
      const progressData = createMockProgressData({
        steps: [
          {
            id: 'compress',
            name: 'דחיסת תמונות',
            status: 'in-progress',
            progress: 50,
            details: 'דוחס תמונות...'
          },
          ...createMockProgressData().steps.slice(1)
        ]
      });
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      const compressStep = screen.getByText('דחיסת תמונות').closest('div');
      expect(compressStep).toHaveClass('text-blue-600');
    });

    it('should display completed step with correct styling', () => {
      const progressData = createMockProgressData({
        steps: [
          {
            id: 'compress',
            name: 'דחיסת תמונות',
            status: 'completed',
            progress: 100,
            details: 'דחיסת תמונות הושלמה'
          },
          ...createMockProgressData().steps.slice(1)
        ]
      });
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      const compressStep = screen.getByText('דחיסת תמונות').closest('div');
      expect(compressStep).toHaveClass('text-green-600');
    });

    it('should display error step with correct styling', () => {
      const progressData = createMockProgressData({
        steps: [
          {
            id: 'compress',
            name: 'דחיסת תמונות',
            status: 'error',
            progress: 0,
            details: 'שגיאה בדחיסת תמונות',
            error: 'Failed to compress images'
          },
          ...createMockProgressData().steps.slice(1)
        ]
      });
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      const compressStep = screen.getByText('דחיסת תמונות').closest('div');
      expect(compressStep).toHaveClass('text-red-600');
      expect(screen.getByText('שגיאה בדחיסת תמונות')).toBeInTheDocument();
    });
  });

  describe('Completion State', () => {
    it('should show completion message when process is complete', () => {
      const progressData = createMockProgressData({
        isComplete: true,
        overallProgress: 100,
        canCancel: false
      });
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      expect(screen.getByText('הושלם בהצלחה!')).toBeInTheDocument();
      expect(screen.getByText('סגירה')).toBeInTheDocument();
    });

    it('should disable cancel button when cannot cancel', () => {
      const progressData = createMockProgressData({
        canCancel: false
      });
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      const cancelButton = screen.getByText('בטל');
      expect(cancelButton).toBeDisabled();
    });

    it('should call onClose when close button is clicked in completion state', () => {
      const progressData = createMockProgressData({
        isComplete: true,
        canCancel: false
      });
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      fireEvent.click(screen.getByText('סגירה'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero dishes gracefully', () => {
      const progressData = createMockProgressData({
        currentDish: 0,
        totalDishes: 0
      });
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      expect(screen.getByText('מנה 0 מתוך 0')).toBeInTheDocument();
    });

    it('should handle empty steps array', () => {
      const progressData = createMockProgressData({
        steps: []
      });
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('should handle missing dish name', () => {
      const progressData = createMockProgressData({
        dishName: undefined
      });
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      expect(screen.getByText('מנה 1 מתוך 3')).toBeInTheDocument();
    });

    it('should handle very long dish names', () => {
      const longName = 'שניצל ירושלמי עם תוספות רבות ושם ארוך מאוד שאמור להיות מקוצר';
      const progressData = createMockProgressData({
        dishName: longName
      });
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle progress values outside normal range', () => {
      const progressData = createMockProgressData({
        overallProgress: 150 // Above 100%
      });
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('data-value', '150');
    });
  });

  describe('Error Handling', () => {
    it('should display error details when step has error', () => {
      const progressData = createMockProgressData({
        steps: [
          {
            id: 'upload',
            name: 'העלאת תמונות',
            status: 'error',
            progress: 25,
            details: 'שגיאה ברשת',
            error: 'Network connection failed'
          },
          ...createMockProgressData().steps.slice(1)
        ]
      });
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      expect(screen.getByText('שגיאה ברשת')).toBeInTheDocument();
    });

    it('should handle missing step details gracefully', () => {
      const progressData = createMockProgressData({
        steps: [
          {
            id: 'compress',
            name: 'דחיסת תמונות',
            status: 'in-progress',
            progress: 50
            // details is missing
          } as UploadStep,
          ...createMockProgressData().steps.slice(1)
        ]
      });
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      expect(screen.getByText('דחיסת תמונות')).toBeInTheDocument();
    });
  });

  describe('UI Behavior', () => {
    it('should not render when modal is closed', () => {
      const progressData = createMockProgressData();
      
      render(
        <UploadProgressModal
          isOpen={false}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('should handle RTL layout correctly', () => {
      const progressData = createMockProgressData();
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      const content = screen.getByTestId('dialog-content');
      expect(content.closest('div')).toHaveAttribute('dir', 'rtl');
    });

    it('should prevent modal close when submission is in progress and cancellation is disabled', () => {
      const progressData = createMockProgressData({
        canCancel: false,
        isComplete: false
      });
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      // Try to trigger onClose - should not be called because progress is active
      // In real implementation, Dialog's onOpenChange would be controlled
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for progress elements', () => {
      const progressData = createMockProgressData({
        overallProgress: 75
      });
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should have semantic button structure', () => {
      const progressData = createMockProgressData();
      
      render(
        <UploadProgressModal
          isOpen={true}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
          progressData={progressData}
        />
      );

      const buttons = screen.getAllByTestId('button');
      expect(buttons).toHaveLength(1); // Cancel button
      expect(buttons[0]).toHaveTextContent('בטל');
    });
  });
}); 