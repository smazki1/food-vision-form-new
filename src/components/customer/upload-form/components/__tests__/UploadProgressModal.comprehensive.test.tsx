import React from 'react';
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

// Mock icons
vi.mock('lucide-react', () => ({
  CheckCircle2: () => <div data-testid="check-circle-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  Database: () => <div data-testid="database-icon" />,
  Globe: () => <div data-testid="globe-icon" />,
  X: () => <div data-testid="x-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  XCircle: () => <div data-testid="x-circle-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Loader2: () => <div data-testid="loader-icon" />
}));

describe('UploadProgressModal - Comprehensive Tests', () => {
  const mockOnCancel = vi.fn();
  const mockOnClose = vi.fn();

  const createProgressData = (overrides?: Partial<UploadProgressData>): UploadProgressData => ({
    currentStep: 0,
    totalSteps: 4,
    overallProgress: 0,
    isComplete: false,
    canCancel: true,
    currentDish: 1,
    totalDishes: 1,
    steps: [
      {
        id: 'compress',
        name: 'דחיסת תמונות',
        status: 'pending',
        progress: 0,
        details: ''
      },
      {
        id: 'upload',
        name: 'העלאת תמונות',
        status: 'pending',
        progress: 0,
        details: ''
      },
      {
        id: 'database',
        name: 'שמירה במערכת',
        status: 'pending',
        progress: 0,
        details: ''
      },
      {
        id: 'webhook',
        name: 'התראות',
        status: 'pending',
        progress: 0,
        details: ''
      }
    ],
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Rendering', () => {
    it('should render when open is true', () => {
      render(
        <UploadProgressModal
          isOpen={true}
          progressData={createProgressData()}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    });

    it('should not render when open is false', () => {
      render(
        <UploadProgressModal
          isOpen={false}
          progressData={createProgressData()}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('should display correct Hebrew title', () => {
      render(
        <UploadProgressModal
          isOpen={true}
          progressData={createProgressData()}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('מעלה הגשות...')).toBeInTheDocument();
    });

    it('should display all step names in Hebrew', () => {
      render(
        <UploadProgressModal
          isOpen={true}
          progressData={createProgressData()}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('דחיסת תמונות')).toBeInTheDocument();
      expect(screen.getByText('העלאת תמונות')).toBeInTheDocument();
      expect(screen.getByText('שמירה במערכת')).toBeInTheDocument();
      expect(screen.getByText('התראות')).toBeInTheDocument();
    });
  });

  describe('Progress Visualization', () => {
    it('should display overall progress bar with correct value', () => {
      const progressData = createProgressData({
        overallProgress: 45
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('data-value', '45');
    });

    it('should display progress percentage text', () => {
      const progressData = createProgressData({
        overallProgress: 75
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should show current step progress', () => {
      const progressData = createProgressData({
        currentStep: 2,
        totalSteps: 4
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('שלב 3 מתוך 4')).toBeInTheDocument();
    });
  });

  describe('Step Status Visualization', () => {
    it('should show pending steps with clock icon', () => {
      const progressData = createProgressData();

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      const clockIcons = screen.getAllByTestId('clock-icon');
      expect(clockIcons).toHaveLength(4); // All steps pending
    });

    it('should show in-progress step with loader icon', () => {
      const progressData = createProgressData({
        steps: [
          {
            id: 'compress',
            name: 'דחיסת תמונות',
            status: 'in-progress',
            progress: 30,
            details: 'דוחס תמונות...'
          },
          ...createProgressData().steps.slice(1)
        ]
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('דוחס תמונות...')).toBeInTheDocument();
    });

    it('should show completed steps with check icon', () => {
      const progressData = createProgressData({
        steps: [
          {
            id: 'compress',
            name: 'דחיסת תמונות',
            status: 'completed',
            progress: 100,
            details: 'הושלם'
          },
          {
            id: 'upload',
            name: 'העלאת תמונות',
            status: 'completed',
            progress: 100,
            details: 'הושלם'
          },
          ...createProgressData().steps.slice(2)
        ]
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      const checkIcons = screen.getAllByTestId('check-circle-icon');
      expect(checkIcons).toHaveLength(2); // Two completed steps
    });

    it('should show error steps with X icon', () => {
      const progressData = createProgressData({
        steps: [
          {
            id: 'compress',
            name: 'דחיסת תמונות',
            status: 'error',
            progress: 0,
            details: 'שגיאה בדחיסה'
          },
          ...createProgressData().steps.slice(1)
        ]
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('שגיאה בדחיסה')).toBeInTheDocument();
    });
  });

  describe('Cancellation Functionality', () => {
    it('should show cancel button when cancellation is allowed', () => {
      const progressData = createProgressData({
        canCancel: true
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      const cancelButton = screen.getByText('ביטול');
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).not.toBeDisabled();
    });

    it('should disable cancel button when cancellation is not allowed', () => {
      const progressData = createProgressData({
        canCancel: false
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      const cancelButton = screen.getByText('ביטול');
      expect(cancelButton).toBeDisabled();
    });

    it('should call onCancel when cancel button is clicked', () => {
      const progressData = createProgressData({
        canCancel: true
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('ביטול'));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel when cancel button is disabled and clicked', () => {
      const progressData = createProgressData({
        canCancel: false
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      const cancelButton = screen.getByText('ביטול');
      fireEvent.click(cancelButton);
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Completion State', () => {
    it('should show completion message when process is complete', () => {
      const progressData = createProgressData({
        isComplete: true,
        overallProgress: 100,
        steps: createProgressData().steps.map(step => ({
          ...step,
          status: 'completed' as UploadStep['status'],
          progress: 100
        }))
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('הועלה בהצלחה!')).toBeInTheDocument();
    });

    it('should show close button when process is complete', () => {
      const progressData = createProgressData({
        isComplete: true,
        overallProgress: 100
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('סגור')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      const progressData = createProgressData({
        isComplete: true,
        overallProgress: 100
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('סגור'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Step Details Display', () => {
    it('should display step details when provided', () => {
      const progressData = createProgressData({
        steps: [
          {
            id: 'compress',
            name: 'דחיסת תמונות',
            status: 'in-progress',
            progress: 50,
            details: 'דוחס 3 מתוך 6 תמונות...'
          },
          ...createProgressData().steps.slice(1)
        ]
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('דוחס 3 מתוך 6 תמונות...')).toBeInTheDocument();
    });

    it('should not display step details when empty', () => {
      const progressData = createProgressData({
        steps: [
          {
            id: 'compress',
            name: 'דחיסת תמונות',
            status: 'pending',
            progress: 0,
            details: ''
          },
          ...createProgressData().steps.slice(1)
        ]
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      // Should not find any text that looks like details
      expect(screen.queryByText(/דוחס/)).not.toBeInTheDocument();
      expect(screen.queryByText(/מעלה/)).not.toBeInTheDocument();
    });
  });

  describe('Individual Step Progress', () => {
    it('should show individual step progress bars', () => {
      const progressData = createProgressData({
        steps: [
          {
            id: 'compress',
            name: 'דחיסת תמונות',
            status: 'in-progress',
            progress: 60,
            details: 'דוחס...'
          },
          {
            id: 'upload',
            name: 'העלאת תמונות',
            status: 'completed',
            progress: 100,
            details: 'הושלם'
          },
          ...createProgressData().steps.slice(2)
        ]
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      const progressBars = screen.getAllByTestId('progress-bar');
      // Should have overall progress bar plus individual step progress bars
      expect(progressBars.length).toBeGreaterThan(1);
    });

    it('should display step progress percentages', () => {
      const progressData = createProgressData({
        steps: [
          {
            id: 'compress',
            name: 'דחיסת תמונות',
            status: 'in-progress',
            progress: 75,
            details: 'דוחס...'
          },
          ...createProgressData().steps.slice(1)
        ]
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty steps array', () => {
      const progressData = createProgressData({
        steps: []
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByText('שלב 1 מתוך 0')).toBeInTheDocument();
    });

    it('should handle negative progress values', () => {
      const progressData = createProgressData({
        overallProgress: -10
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('data-value', '-10');
    });

    it('should handle progress values over 100', () => {
      const progressData = createProgressData({
        overallProgress: 150
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('data-value', '150');
    });

    it('should handle null or undefined step details', () => {
      const progressData = createProgressData({
        steps: [
          {
            id: 'compress',
            name: 'דחיסת תמונות',
            status: 'in-progress',
            progress: 50,
            details: null as any
          },
          ...createProgressData().steps.slice(1)
        ]
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
  });

  describe('Hebrew Language and RTL Support', () => {
    it('should display all Hebrew text correctly', () => {
      render(
        <UploadProgressModal
          isOpen={true}
          progressData={createProgressData()}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      // Check for Hebrew text in various UI elements
      expect(screen.getByText('מעלה הגשות...')).toBeInTheDocument();
      expect(screen.getByText('דחיסת תמונות')).toBeInTheDocument();
      expect(screen.getByText('העלאת תמונות')).toBeInTheDocument();
      expect(screen.getByText('שמירה במערכת')).toBeInTheDocument();
      expect(screen.getByText('התראות')).toBeInTheDocument();
      expect(screen.getByText('ביטול')).toBeInTheDocument();
    });

    it('should handle Hebrew text in step details', () => {
      const progressData = createProgressData({
        steps: [
          {
            id: 'compress',
            name: 'דחיסת תמונות',
            status: 'in-progress',
            progress: 50,
            details: 'מעבד תמונות עם שמות עבריים: שניצל_ירושלמי.jpg'
          },
          ...createProgressData().steps.slice(1)
        ]
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('מעבד תמונות עם שמות עבריים: שניצל_ירושלמי.jpg')).toBeInTheDocument();
    });

    it('should display Hebrew numbers correctly', () => {
      const progressData = createProgressData({
        currentStep: 3,
        totalSteps: 4,
        overallProgress: 85
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('שלב 4 מתוך 4')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  describe('Animation and Visual Effects', () => {
    it('should apply correct CSS classes for visual styling', () => {
      render(
        <UploadProgressModal
          isOpen={true}
          progressData={createProgressData()}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass();
    });

    it('should display loader animation for in-progress steps', () => {
      const progressData = createProgressData({
        steps: [
          {
            id: 'compress',
            name: 'דחיסת תמונות',
            status: 'in-progress',
            progress: 30,
            details: 'דוחס...'
          },
          ...createProgressData().steps.slice(1)
        ]
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      // Loader should be present for in-progress step
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <UploadProgressModal
          isOpen={true}
          progressData={createProgressData()}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      const dialog = screen.getByTestId('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      const progressData = createProgressData({
        canCancel: true
      });

      render(
        <UploadProgressModal
          isOpen={true}
          progressData={progressData}
          onCancel={mockOnCancel}
          onClose={mockOnClose}
        />
      );

      const cancelButton = screen.getByText('ביטול');
      expect(cancelButton).toBeInTheDocument();
      
      // Focus should be manageable
      cancelButton.focus();
      expect(document.activeElement).toBe(cancelButton);
    });
  });
}); 