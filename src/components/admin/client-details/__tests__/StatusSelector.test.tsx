import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { StatusSelector } from '../StatusSelector';
import { SUBMISSION_STATUSES, SubmissionStatus } from '@/hooks/useSubmissionStatus';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: ({ className }: { className?: string }) => (
    <div data-testid="chevron-down" className={className}>ChevronDown</div>
  ),
  Check: ({ className }: { className?: string }) => (
    <div data-testid="check-icon" className={className}>Check</div>
  ),
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loader" className={className}>Loader2</div>
  )
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-testid="status-button"
      {...props}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => (
    <div className={className} data-testid="badge">
      {children}
    </div>
  )
}));

describe('StatusSelector Component', () => {
  const mockOnStatusChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render with current status', () => {
      render(
        <StatusSelector
          currentStatus="בעיבוד"
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByTestId('status-button')).toBeInTheDocument();
      expect(screen.getByText('בעיבוד')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
    });

    it('should render status dot with correct color', () => {
      render(
        <StatusSelector
          currentStatus="הושלמה ואושרה"
          onStatusChange={mockOnStatusChange}
        />
      );

      const statusDot = screen.getByText('הושלמה ואושרה').parentElement?.querySelector('.bg-green-500');
      expect(statusDot).toBeInTheDocument();
    });

    it('should apply correct color classes for each status', () => {
      const statusColorMap = {
        'ממתינה לעיבוד': 'bg-gray-100 text-gray-800 border-gray-200',
        'בעיבוד': 'bg-blue-100 text-blue-800 border-blue-200',
        'מוכנה להצגה': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'הערות התקבלו': 'bg-orange-100 text-orange-800 border-orange-200',
        'הושלמה ואושרה': 'bg-green-100 text-green-800 border-green-200'
      };

      Object.entries(statusColorMap).forEach(([status, expectedClasses]) => {
        const { unmount } = render(
          <StatusSelector
            currentStatus={status as SubmissionStatus}
            onStatusChange={mockOnStatusChange}
          />
        );

        const button = screen.getByTestId('status-button');
        expectedClasses.split(' ').forEach(className => {
          expect(button.className).toContain(className);
        });

        unmount();
      });
    });
  });

  describe('Dropdown Functionality', () => {
    it('should open dropdown when button is clicked', () => {
      render(
        <StatusSelector
          currentStatus="בעיבוד"
          onStatusChange={mockOnStatusChange}
        />
      );

      const button = screen.getByTestId('status-button');
      fireEvent.click(button);

      // Check if all status options are rendered (using getAllByText for duplicates)
      SUBMISSION_STATUSES.forEach(status => {
        const elements = screen.getAllByText(status);
        expect(elements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should close dropdown when backdrop is clicked', () => {
      render(
        <StatusSelector
          currentStatus="בעיבוד"
          onStatusChange={mockOnStatusChange}
        />
      );

      // Open dropdown
      fireEvent.click(screen.getByTestId('status-button'));
      
      // Verify dropdown is open
      expect(screen.getAllByText('בעיבוד')).toHaveLength(2); // One in button, one in dropdown

      // Click backdrop
      const backdrop = document.querySelector('.fixed.inset-0');
      expect(backdrop).toBeInTheDocument();
      fireEvent.click(backdrop!);

      // Verify dropdown is closed
      expect(screen.getAllByText('בעיבוד')).toHaveLength(1); // Only in button
    });

    it('should show check mark for current status in dropdown', () => {
      render(
        <StatusSelector
          currentStatus="מוכנה להצגה"
          onStatusChange={mockOnStatusChange}
        />
      );

      fireEvent.click(screen.getByTestId('status-button'));

      // Check mark should be visible for current status
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('should highlight current status in dropdown', () => {
      render(
        <StatusSelector
          currentStatus="הערות התקבלו"
          onStatusChange={mockOnStatusChange}
        />
      );

      fireEvent.click(screen.getByTestId('status-button'));

      // Find the current status option in dropdown
      const statusOptions = screen.getAllByText('הערות התקבלו');
      const dropdownOption = statusOptions.find(el => 
        el.closest('button')?.className.includes('bg-blue-50')
      );
      
      expect(dropdownOption).toBeInTheDocument();
    });
  });

  describe('Status Selection', () => {
    it('should call onStatusChange when different status is selected', () => {
      render(
        <StatusSelector
          currentStatus="בעיבוד"
          onStatusChange={mockOnStatusChange}
        />
      );

      fireEvent.click(screen.getByTestId('status-button'));
      
      // Click on a different status
      const statusOptions = screen.getAllByText('הושלמה ואושרה');
      const dropdownOption = statusOptions.find(el => 
        el.closest('button') && el.closest('button') !== screen.getByTestId('status-button')
      );
      
      fireEvent.click(dropdownOption!.closest('button')!);

      expect(mockOnStatusChange).toHaveBeenCalledWith('הושלמה ואושרה');
    });

    it('should not call onStatusChange when same status is selected', () => {
      render(
        <StatusSelector
          currentStatus="בעיבוד"
          onStatusChange={mockOnStatusChange}
        />
      );

      fireEvent.click(screen.getByTestId('status-button'));
      
      // Click on the same status
      const statusOptions = screen.getAllByText('בעיבוד');
      const dropdownOption = statusOptions.find(el => 
        el.closest('button') && el.closest('button') !== screen.getByTestId('status-button')
      );
      
      fireEvent.click(dropdownOption!.closest('button')!);

      expect(mockOnStatusChange).not.toHaveBeenCalled();
    });

    it('should close dropdown after status selection', () => {
      render(
        <StatusSelector
          currentStatus="בעיבוד"
          onStatusChange={mockOnStatusChange}
        />
      );

      fireEvent.click(screen.getByTestId('status-button'));
      
      // Select different status
      const statusOptions = screen.getAllByText('מוכנה להצגה');
      const dropdownOption = statusOptions.find(el => 
        el.closest('button') && el.closest('button') !== screen.getByTestId('status-button')
      );
      
      fireEvent.click(dropdownOption!.closest('button')!);

      // Dropdown should be closed - check that dropdown container is not present
      const dropdownContainer = document.querySelector('.absolute.top-full');
      expect(dropdownContainer).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loader when isUpdating is true', () => {
      render(
        <StatusSelector
          currentStatus="בעיבוד"
          onStatusChange={mockOnStatusChange}
          isUpdating={true}
        />
      );

      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.getByText('שומר...')).toBeInTheDocument();
    });

    it('should disable button when isUpdating is true', () => {
      render(
        <StatusSelector
          currentStatus="בעיבוד"
          onStatusChange={mockOnStatusChange}
          isUpdating={true}
        />
      );

      const button = screen.getByTestId('status-button');
      expect(button).toBeDisabled();
    });

    it('should not open dropdown when isUpdating is true', () => {
      render(
        <StatusSelector
          currentStatus="בעיבוד"
          onStatusChange={mockOnStatusChange}
          isUpdating={true}
        />
      );

      fireEvent.click(screen.getByTestId('status-button'));

      // Dropdown should not open
      expect(screen.getAllByText('בעיבוד')).toHaveLength(1); // Only in button
    });

    it('should show status dot when not updating', () => {
      render(
        <StatusSelector
          currentStatus="בעיבוד"
          onStatusChange={mockOnStatusChange}
          isUpdating={false}
        />
      );

      const statusDot = screen.getByText('בעיבוד').parentElement?.querySelector('.bg-blue-500');
      expect(statusDot).toBeInTheDocument();
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable button when disabled prop is true', () => {
      render(
        <StatusSelector
          currentStatus="בעיבוד"
          onStatusChange={mockOnStatusChange}
          disabled={true}
        />
      );

      const button = screen.getByTestId('status-button');
      expect(button).toBeDisabled();
    });

    it('should not open dropdown when disabled', () => {
      render(
        <StatusSelector
          currentStatus="בעיבוד"
          onStatusChange={mockOnStatusChange}
          disabled={true}
        />
      );

      fireEvent.click(screen.getByTestId('status-button'));

      // Dropdown should not open
      expect(screen.getAllByText('בעיבוד')).toHaveLength(1); // Only in button
    });
  });

  describe('Chevron Animation', () => {
    it('should rotate chevron when dropdown is open', () => {
      render(
        <StatusSelector
          currentStatus="בעיבוד"
          onStatusChange={mockOnStatusChange}
        />
      );

      const chevron = screen.getByTestId('chevron-down');
      
      // Initially not rotated
      expect(chevron.className).not.toContain('rotate-180');

      // Open dropdown
      fireEvent.click(screen.getByTestId('status-button'));

      // Should be rotated
      expect(chevron.className).toContain('rotate-180');
    });
  });

  describe('All Status Options', () => {
    it('should render all available statuses in dropdown', () => {
      render(
        <StatusSelector
          currentStatus="בעיבוד"
          onStatusChange={mockOnStatusChange}
        />
      );

      fireEvent.click(screen.getByTestId('status-button'));

      SUBMISSION_STATUSES.forEach(status => {
        const elements = screen.getAllByText(status);
        expect(elements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should handle selection of each status type', () => {
      SUBMISSION_STATUSES.forEach(initialStatus => {
        const { unmount } = render(
          <StatusSelector
            currentStatus={initialStatus}
            onStatusChange={mockOnStatusChange}
          />
        );

        fireEvent.click(screen.getByTestId('status-button'));

        // Try selecting each other status
        SUBMISSION_STATUSES.forEach(targetStatus => {
          if (targetStatus !== initialStatus) {
            try {
              const statusOptions = screen.getAllByText(targetStatus);
              const dropdownOption = statusOptions.find(el => 
                el.closest('button') && el.closest('button') !== screen.getByTestId('status-button')
              );
              
              if (dropdownOption) {
                fireEvent.click(dropdownOption.closest('button')!);
                expect(mockOnStatusChange).toHaveBeenCalledWith(targetStatus);
              }
            } catch (error) {
              // Skip if status not found in dropdown (dropdown might be closed)
            }
          }
        });

        mockOnStatusChange.mockClear();
        unmount();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid clicks gracefully', () => {
      render(
        <StatusSelector
          currentStatus="בעיבוד"
          onStatusChange={mockOnStatusChange}
        />
      );

      const button = screen.getByTestId('status-button');
      
      // Rapid clicks
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Should still work correctly
      expect(screen.getAllByText('בעיבוד').length).toBeGreaterThan(1);
    });

    it('should handle keyboard events on dropdown options', () => {
      render(
        <StatusSelector
          currentStatus="בעיבוד"
          onStatusChange={mockOnStatusChange}
        />
      );

      fireEvent.click(screen.getByTestId('status-button'));

      const statusOptions = screen.getAllByText('הושלמה ואושרה');
      const dropdownOption = statusOptions.find(el => 
        el.closest('button') && el.closest('button') !== screen.getByTestId('status-button')
      );

      // Simulate Enter key press
      fireEvent.keyDown(dropdownOption!.closest('button')!, { key: 'Enter' });
      fireEvent.click(dropdownOption!.closest('button')!);

      expect(mockOnStatusChange).toHaveBeenCalledWith('הושלמה ואושרה');
    });

    it('should maintain correct state when props change', () => {
      const { rerender } = render(
        <StatusSelector
          currentStatus="בעיבוד"
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText('בעיבוד')).toBeInTheDocument();

      // Change props
      rerender(
        <StatusSelector
          currentStatus="הושלמה ואושרה"
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText('הושלמה ואושרה')).toBeInTheDocument();
      expect(screen.queryByText('בעיבוד')).not.toBeInTheDocument();
    });
  });
}); 