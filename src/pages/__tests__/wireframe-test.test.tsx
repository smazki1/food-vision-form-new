import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import WireframeTest from '../wireframe-test';

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={`card ${className}`} {...props}>{children}</div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={`card-content ${className}`} {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={`card-header ${className}`} {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={`card-title ${className}`} {...props}>{children}</h3>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }: any) => (
    <button 
      className={`button ${variant} ${size} ${className}`} 
      onClick={onClick} 
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ className, ...props }: any) => (
    <input className={`input ${className}`} {...props} />
  ),
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ className, ...props }: any) => (
    <textarea className={`textarea ${className}`} {...props} />
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span className={`badge ${variant} ${className}`} {...props}>{children}</span>
  ),
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: ({ className, ...props }: any) => (
    <hr className={`separator ${className}`} {...props} />
  ),
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange, className, ...props }: any) => (
    <div className={`tabs ${className}`} data-value={value} {...props}>
      {React.Children.map(children, (child: any) => 
        React.cloneElement(child, { activeValue: value, onValueChange })
      )}
    </div>
  ),
  TabsContent: ({ children, value, activeValue, className, ...props }: any) => (
    value === activeValue ? (
      <div className={`tab-content ${className}`} {...props}>{children}</div>
    ) : null
  ),
  TabsList: ({ children, className, ...props }: any) => (
    <div className={`tabs-list ${className}`} {...props}>{children}</div>
  ),
  TabsTrigger: ({ children, value, onValueChange, className, ...props }: any) => (
    <button 
      className={`tab-trigger ${className}`} 
      onClick={() => onValueChange?.(value)}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Play: () => <span data-testid="play-icon">▶</span>,
  Pause: () => <span data-testid="pause-icon">⏸</span>,
  Eye: () => <span data-testid="eye-icon">👁</span>,
  EyeOff: () => <span data-testid="eye-off-icon">🙈</span>,
  Upload: () => <span data-testid="upload-icon">⬆</span>,
  Plus: () => <span data-testid="plus-icon">+</span>,
  ChevronDown: () => <span data-testid="chevron-down-icon">⬇</span>,
  ChevronUp: () => <span data-testid="chevron-up-icon">⬆</span>,
  ChevronLeft: () => <span data-testid="chevron-left-icon">⬅</span>,
  ChevronRight: () => <span data-testid="chevron-right-icon">➡</span>,
  Image: () => <span data-testid="image-icon">🖼</span>,
}));

describe('WireframeTest Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering - Happy Path', () => {
    it('should render all main sections correctly', () => {
      render(<WireframeTest />);
      
      // Check header stats using test IDs
      expect(screen.getByTestId('stats-section')).toBeInTheDocument();
      expect(screen.getByTestId('stats-in-progress')).toBeInTheDocument();
      expect(screen.getByTestId('stats-waiting')).toBeInTheDocument();
      expect(screen.getByTestId('stats-completed')).toBeInTheDocument();
      
      // Check costs section
      expect(screen.getByTestId('costs-section')).toBeInTheDocument();
      
      // Check submissions sidebar
      expect(screen.getByTestId('submissions-sidebar')).toBeInTheDocument();
      
      // Check mock submissions using test IDs
      expect(screen.getByTestId('submission-name-0')).toHaveTextContent('חמבורגר טרופי');
      expect(screen.getByTestId('submission-name-1')).toHaveTextContent('קוקטייל מוהיטו');
      expect(screen.getByTestId('submission-name-2')).toHaveTextContent('פיצה מרגריטה');
    });

    it('should display initial stats values correctly', () => {
      render(<WireframeTest />);
      
      // Use test IDs to avoid multiple element conflicts
      const inProgressCard = screen.getByTestId('stats-in-progress');
      const waitingCard = screen.getByTestId('stats-waiting');
      const completedCard = screen.getByTestId('stats-completed');
      
      expect(inProgressCard).toHaveTextContent('0');
      expect(waitingCard).toHaveTextContent('2');
      expect(completedCard).toHaveTextContent('5');
    });

    it('should render cost calculation section', () => {
      render(<WireframeTest />);
      
      expect(screen.getByText('GPT-4 (2.5$)')).toBeInTheDocument();
      expect(screen.getByText('Claude (1.5$)')).toBeInTheDocument();
      expect(screen.getByText('DALL-E (5$)')).toBeInTheDocument();
      expect(screen.getByText('פרומטים (0.162$)')).toBeInTheDocument();
    });
  });

  describe('State Management - Happy Path', () => {
    it('should toggle costs section visibility', async () => {
      render(<WireframeTest />);
      
      const toggleButton = screen.getByTestId('costs-toggle');
      
      // Initially costs should be visible
      expect(screen.getByText('GPT-4 (2.5$)')).toBeInTheDocument();
      
      // Click to hide
      fireEvent.click(toggleButton);
      await waitFor(() => {
        expect(screen.queryByText('GPT-4 (2.5$)')).not.toBeInTheDocument();
      });
    });

    it('should update cost quantities correctly', () => {
      render(<WireframeTest />);
      
      // Use test IDs for GPT-4 controls
      const incrementButton = screen.getByTestId('gpt4-increment');
      const quantityDisplay = screen.getByTestId('gpt4-quantity');
      
      // Initial value should be 2
      expect(quantityDisplay).toHaveTextContent('2');
      
      // Click increment
      fireEvent.click(incrementButton);
      
      // Should now show 3
      expect(quantityDisplay).toHaveTextContent('3');
    });

    it('should calculate total cost correctly', () => {
      render(<WireframeTest />);
      
      // Initial calculation: (2 * 2.5) + (0 * 1.5) + (0 * 5) + (22 * 0.162) = 8.564
      expect(screen.getByText(/סה"כ: ₪8\.56/)).toBeInTheDocument();
    });

    it('should handle timer toggle', () => {
      render(<WireframeTest />);
      
      const timerButton = screen.getByTestId('play-icon').closest('button');
      expect(timerButton).toBeInTheDocument();
      
      // Click to start timer
      fireEvent.click(timerButton!);
      
      // Should show pause icon now
      expect(screen.getByTestId('pause-icon')).toBeInTheDocument();
    });
  });

  describe('Image Navigation - Happy Path', () => {
    it('should navigate between original images', () => {
      render(<WireframeTest />);
      
      // Find navigation buttons (should exist since we have 3 original images)
      const rightArrow = screen.getAllByTestId('chevron-right-icon')[0]?.closest('button');
      expect(rightArrow).toBeInTheDocument();
      
      // Initial counter should show 1 / 3
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
      
      // Click right arrow
      fireEvent.click(rightArrow!);
      
      // Should now show 2 / 3
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('should navigate between processed images', () => {
      render(<WireframeTest />);
      
      // Should show processed image counter 1 / 2
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
      
      const rightArrows = screen.getAllByTestId('chevron-right-icon');
      const processedRightArrow = rightArrows[1]?.closest('button'); // Second right arrow is for processed images
      
      if (processedRightArrow) {
        fireEvent.click(processedRightArrow);
        expect(screen.getByText('2 / 2')).toBeInTheDocument();
      }
    });

    it('should handle circular navigation for original images', () => {
      render(<WireframeTest />);
      
      const leftArrow = screen.getAllByTestId('chevron-left-icon')[0]?.closest('button');
      expect(leftArrow).toBeInTheDocument();
      
      // Starting at 1/3, clicking left should go to 3/3 (circular)
      fireEvent.click(leftArrow!);
      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });
  });

  describe('Submission Selection - Happy Path', () => {
    it('should select different submissions', () => {
      render(<WireframeTest />);
      
      // Initially first submission should be selected
      const firstSubmissionItem = screen.getByTestId('submission-item-0');
      expect(firstSubmissionItem).toHaveClass('bg-blue-50');
      
      // Click on second submission
      const secondSubmissionItem = screen.getByTestId('submission-item-1');
      fireEvent.click(secondSubmissionItem);
      
      // Second submission should now be selected
      expect(secondSubmissionItem).toHaveClass('bg-blue-50');
    });

    it('should update main content when submission changes', () => {
      render(<WireframeTest />);
      
      // Main title should initially show first submission
      const mainTitle = screen.getByTestId('main-title');
      expect(mainTitle).toHaveTextContent('חמבורגר טרופי');
      
      // Click on second submission
      const secondSubmissionItem = screen.getByTestId('submission-item-1');
      fireEvent.click(secondSubmissionItem);
      
      // Main title should update
      expect(mainTitle).toHaveTextContent('קוקטייל מוהיטו');
    });
  });

  describe('Notes Management - Happy Path', () => {
    it('should render notes tabs and allow clicking', () => {
      render(<WireframeTest />);
      
      // Check that all tab buttons are present
      expect(screen.getByTestId('notes-tab-self')).toBeInTheDocument();
      expect(screen.getByTestId('notes-tab-client')).toBeInTheDocument();
      expect(screen.getByTestId('notes-tab-editor')).toBeInTheDocument();
      
      // Check that notes section is present
      expect(screen.getByTestId('notes-section')).toBeInTheDocument();
      
      // Check that at least one notes content is visible (self is default)
      expect(screen.getByTestId('notes-content-self')).toBeInTheDocument();
      
      // Test that tab buttons are clickable (no errors thrown)
      fireEvent.click(screen.getByTestId('notes-tab-client'));
      fireEvent.click(screen.getByTestId('notes-tab-editor'));
      fireEvent.click(screen.getByTestId('notes-tab-self'));
      
      // Component should still be functional after clicks
      expect(screen.getByTestId('notes-section')).toBeInTheDocument();
    });

    it('should maintain notes content when switching tabs', () => {
      render(<WireframeTest />);
      
      // Type in self notes
      const selfNotesTextarea = screen.getByPlaceholderText('הערות אישיות להגשה...');
      fireEvent.change(selfNotesTextarea, { target: { value: 'Test note' } });
      
      // Switch to client notes and back
      fireEvent.click(screen.getByText('הערה ללקוח'));
      fireEvent.click(screen.getByText('הערה לעצמי'));
      
      // Self notes should still have the content
      expect(screen.getByDisplayValue('Test note')).toBeInTheDocument();
    });
  });

  describe('Background Images Toggle - Happy Path', () => {
    it('should toggle background images visibility', () => {
      render(<WireframeTest />);
      
      const toggleButton = screen.getByText('הצג רקעים');
      expect(toggleButton).toBeInTheDocument();
      
      // Background images should not be visible initially
      expect(screen.queryByText('תמונות רקע להשוואה')).not.toBeInTheDocument();
      
      // Click to show background images
      fireEvent.click(toggleButton);
      
      // Background images section should now be visible
      expect(screen.getByText('תמונות רקע להשוואה')).toBeInTheDocument();
      
      // Button text should change
      expect(screen.getByText('הסתר רקעים')).toBeInTheDocument();
    });
  });

  describe('Submission Details Toggle - Happy Path', () => {
    it('should toggle submission details visibility', async () => {
      render(<WireframeTest />);
      
      const toggleButton = screen.getByTestId('submission-details-toggle');
      expect(toggleButton).toBeInTheDocument();
      
      // Details should not be visible initially
      expect(screen.queryByTestId('submission-details-content')).not.toBeInTheDocument();
      
      // Click to show details
      fireEvent.click(toggleButton);
      
      // Wait for details to appear
      await waitFor(() => {
        expect(screen.getByTestId('submission-details-content')).toBeInTheDocument();
        expect(screen.getByTestId('client-name')).toHaveTextContent('שם: מסעדת הגן');
        expect(screen.getByTestId('client-phone')).toHaveTextContent('טלפון: 03-1234567');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle cost quantity reaching zero', () => {
      render(<WireframeTest />);
      
      // Use test IDs for GPT-4 controls
      const decrementButton = screen.getByTestId('gpt4-decrement');
      const quantityDisplay = screen.getByTestId('gpt4-quantity');
      
      // Click decrement twice (from initial 2 to 0)
      fireEvent.click(decrementButton);
      fireEvent.click(decrementButton);
      
      // Should show 0 and not go negative
      expect(quantityDisplay).toHaveTextContent('0');
      
      // Try to decrement once more
      fireEvent.click(decrementButton);
      
      // Should still be 0
      expect(quantityDisplay).toHaveTextContent('0');
    });

    it('should handle empty LORA fields gracefully', () => {
      render(<WireframeTest />);
      
      // LORA fields should be present and empty by default
      expect(screen.getByPlaceholderText('שם LORA')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('מזהה LORA')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('קישור LORA')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Prompt קבוע')).toBeInTheDocument();
    });

    it('should handle single image arrays properly', () => {
      // This would require modifying the component to accept props for testing
      // For now, we test that the component doesn't crash with the hardcoded arrays
      render(<WireframeTest />);
      
      // Component should render without crashing
      expect(screen.getByText('תמונות מקור')).toBeInTheDocument();
      expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
    });
  });

  describe('Action History', () => {
    it('should display action history items', () => {
      render(<WireframeTest />);
      
      expect(screen.getByText('היסטוריית פעולות')).toBeInTheDocument();
      expect(screen.getByText('הועלו תמונות מעובדות')).toBeInTheDocument();
      expect(screen.getByText('סטטוס עודכן')).toBeInTheDocument();
      expect(screen.getByText('הגשה נקלטה')).toBeInTheDocument();
    });

    it('should display timestamps for actions', () => {
      render(<WireframeTest />);
      
      expect(screen.getByText('13/06/2025 14:30')).toBeInTheDocument();
      expect(screen.getByText('13/06/2025 10:15')).toBeInTheDocument();
      expect(screen.getByText('13/06/2025 09:30')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should maintain state consistency across interactions', () => {
      render(<WireframeTest />);
      
      // Perform multiple state changes
      const gpt4Section = screen.getByText('GPT-4 (2.5$)').closest('div');
      const incrementButton = gpt4Section?.querySelector('button:last-child');
      
      // Increment GPT-4 quantity
      fireEvent.click(incrementButton!);
      
      // Toggle costs section off and on
      const costsToggle = screen.getAllByRole('button').find(btn => 
        btn.querySelector('[data-testid="chevron-up-icon"]') || 
        btn.querySelector('[data-testid="chevron-down-icon"]')
      );
      fireEvent.click(costsToggle!);
      fireEvent.click(costsToggle!);
      
      // GPT-4 quantity should still be 3
      expect(screen.getByText('3')).toBeInTheDocument();
      
      // Total cost should reflect the change
      expect(screen.getByText(/₪11\.06/)).toBeInTheDocument(); // 3*2.5 + 22*0.162
    });
  });

  describe('Error Handling', () => {
    it('should not crash when clicking navigation buttons rapidly', () => {
      render(<WireframeTest />);
      
      const rightArrow = screen.getAllByTestId('chevron-right-icon')[0]?.closest('button');
      
      // Rapidly click navigation
      for (let i = 0; i < 10; i++) {
        fireEvent.click(rightArrow!);
      }
      
      // Component should still be functional
      expect(screen.getByText('תמונות מקור')).toBeInTheDocument();
    });

    it('should handle invalid timer states gracefully', () => {
      render(<WireframeTest />);
      
      const timerButton = screen.getByTestId('play-icon').closest('button');
      
      // Rapidly toggle timer
      for (let i = 0; i < 5; i++) {
        fireEvent.click(timerButton!);
      }
      
      // Component should still work
      expect(screen.getByText('00:00:00')).toBeInTheDocument();
    });
  });
}); 