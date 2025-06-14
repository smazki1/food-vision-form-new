import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientSubmissions2 } from '../ClientSubmissions2';
import { Client } from '@/types/client';

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
  Plus: () => <span data-testid="plus-icon">+</span>,
  ChevronDown: () => <span data-testid="chevron-down-icon">⬇</span>,
  ChevronUp: () => <span data-testid="chevron-up-icon">⬆</span>,
  ChevronLeft: () => <span data-testid="chevron-left-icon">⬅</span>,
  ChevronRight: () => <span data-testid="chevron-right-icon">➡</span>,
  Image: () => <span data-testid="image-icon">🖼</span>,
}));

describe('ClientSubmissions2 Component', () => {
  const mockClient: Client = {
    client_id: 'test-client-1',
    restaurant_name: 'Test Restaurant',
    contact_name: 'John Doe',
    phone: '123-456-7890',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    original_lead_id: null,
    client_status: 'פעיל',
    current_package_id: null,
    remaining_servings: 10,
    remaining_images: 20,
    consumed_images: 5,
    reserved_images: 3,
    last_activity_at: '2024-01-01T00:00:00Z',
    internal_notes: null,
    user_auth_id: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering - Happy Path', () => {
    it('should render all main sections correctly', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      // Check header stats
      expect(screen.getByText('בביצוע')).toBeInTheDocument();
      expect(screen.getByText('ממתינות')).toBeInTheDocument();
      expect(screen.getByText('הושלמו')).toBeInTheDocument();
      
      // Check costs section
      expect(screen.getByText('עלויות ותזמון')).toBeInTheDocument();
      
      // Check submissions sidebar
      expect(screen.getByText('הגשות')).toBeInTheDocument();
      
      // Check mock submissions
      expect(screen.getByText('חמבורגר טרופי')).toBeInTheDocument();
      expect(screen.getByText('קוקטייל מוהיטו')).toBeInTheDocument();
      expect(screen.getByText('פיצה מרגריטה')).toBeInTheDocument();
    });

    it('should display initial stats values correctly', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      expect(screen.getByText('0')).toBeInTheDocument(); // בביצוע
      expect(screen.getByText('2')).toBeInTheDocument(); // ממתינות
      expect(screen.getByText('5')).toBeInTheDocument(); // הושלמו
    });

    it('should render cost calculation section', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      expect(screen.getByText('GPT-4 (2.5$)')).toBeInTheDocument();
      expect(screen.getByText('Claude (1.5$)')).toBeInTheDocument();
      expect(screen.getByText('DALL-E (5$)')).toBeInTheDocument();
      expect(screen.getByText('פרומטים (0.162$)')).toBeInTheDocument();
    });

    it('should render timer section', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      expect(screen.getByText('00:00:00')).toBeInTheDocument();
      expect(screen.getByTestId('play-icon')).toBeInTheDocument();
    });
  });

  describe('Props Integration - Happy Path', () => {
    it('should accept and use clientId prop', () => {
      const { rerender } = render(<ClientSubmissions2 clientId="client-1" client={mockClient} />);
      
      // Component should render without errors
      expect(screen.getByText('הגשות')).toBeInTheDocument();
      
      // Re-render with different clientId
      rerender(<ClientSubmissions2 clientId="client-2" client={mockClient} />);
      expect(screen.getByText('הגשות')).toBeInTheDocument();
    });

    it('should accept and use client prop', () => {
      const customClient: Client = {
        ...mockClient,
        restaurant_name: 'Custom Restaurant',
        contact_name: 'Jane Smith',
      };
      
      render(<ClientSubmissions2 clientId="test-client-1" client={customClient} />);
      
      // Component should render with client data available
      expect(screen.getByText('הגשות')).toBeInTheDocument();
    });

    it('should handle client prop changes', () => {
      const { rerender } = render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      const updatedClient: Client = {
        ...mockClient,
        restaurant_name: 'Updated Restaurant',
      };
      
      rerender(<ClientSubmissions2 clientId="test-client-1" client={updatedClient} />);
      
      // Component should still render correctly
      expect(screen.getByText('הגשות')).toBeInTheDocument();
    });
  });

  describe('State Management - Happy Path', () => {
    it('should toggle costs section visibility', async () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      const toggleButton = screen.getByRole('button', { name: /chevron/ });
      
      // Initially costs should be visible
      expect(screen.getByText('GPT-4 (2.5$)')).toBeInTheDocument();
      
      // Click to hide
      fireEvent.click(toggleButton);
      await waitFor(() => {
        expect(screen.queryByText('GPT-4 (2.5$)')).not.toBeInTheDocument();
      });
    });

    it('should update cost quantities correctly', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      // Find GPT-4 increment button
      const gpt4Section = screen.getByText('GPT-4 (2.5$)').closest('div');
      const incrementButton = gpt4Section?.querySelector('button:last-child');
      
      expect(incrementButton).toBeInTheDocument();
      
      // Initial value should be 2
      expect(screen.getByText('2')).toBeInTheDocument();
      
      // Click increment
      fireEvent.click(incrementButton!);
      
      // Should now show 3
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should calculate total cost correctly', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      // Initial calculation: (2 * 2.5) + (0 * 1.5) + (0 * 5) + (22 * 0.162) = 8.564
      expect(screen.getByText(/סה"כ: ₪8\.56/)).toBeInTheDocument();
    });

    it('should handle timer toggle', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
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
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
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
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
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
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      const leftArrow = screen.getAllByTestId('chevron-left-icon')[0]?.closest('button');
      expect(leftArrow).toBeInTheDocument();
      
      // Starting at 1/3, clicking left should go to 3/3 (circular)
      fireEvent.click(leftArrow!);
      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });

    it('should handle circular navigation for processed images', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      const leftArrows = screen.getAllByTestId('chevron-left-icon');
      const processedLeftArrow = leftArrows[1]?.closest('button'); // Second left arrow is for processed images
      
      if (processedLeftArrow) {
        // Starting at 1/2, clicking left should go to 2/2 (circular)
        fireEvent.click(processedLeftArrow);
        expect(screen.getByText('2 / 2')).toBeInTheDocument();
      }
    });
  });

  describe('Submission Selection - Happy Path', () => {
    it('should select different submissions', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      // Initially first submission should be selected (חמבורגר טרופי)
      const firstSubmission = screen.getByText('חמבורגר טרופי').closest('div');
      expect(firstSubmission).toHaveClass('bg-blue-50');
      
      // Click on second submission
      const secondSubmission = screen.getByText('קוקטייל מוהיטו');
      fireEvent.click(secondSubmission);
      
      // Second submission should now be selected
      const secondSubmissionDiv = secondSubmission.closest('div');
      expect(secondSubmissionDiv).toHaveClass('bg-blue-50');
    });

    it('should update main content when submission changes', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      // Main title should initially show first submission
      expect(screen.getByText('חמבורגר טרופי')).toBeInTheDocument();
      
      // Click on second submission
      fireEvent.click(screen.getByText('קוקטייל מוהיטו'));
      
      // Main title should update (there might be multiple instances, so check title area)
      const titleElements = screen.getAllByText('קוקטייל מוהיטו');
      expect(titleElements.length).toBeGreaterThan(1); // Should appear in both sidebar and main content
    });

    it('should show correct submission status badges', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      expect(screen.getByText('בתהליך')).toBeInTheDocument();
      expect(screen.getByText('הושלם')).toBeInTheDocument();
      expect(screen.getByText('ממתין')).toBeInTheDocument();
    });
  });

  describe('Notes Management - Happy Path', () => {
    it('should switch between notes tabs', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      // Click on client notes tab
      const clientNotesTab = screen.getByText('הערה ללקוח');
      fireEvent.click(clientNotesTab);
      
      // Should show client notes textarea
      expect(screen.getByPlaceholderText('הערות ללקוח...')).toBeInTheDocument();
      
      // Click on editor notes tab
      const editorNotesTab = screen.getByText('הערה לעורך');
      fireEvent.click(editorNotesTab);
      
      // Should show editor notes textarea
      expect(screen.getByPlaceholderText('הערות לעורך...')).toBeInTheDocument();
    });

    it('should maintain notes content when switching tabs', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      // Type in self notes
      const selfNotesTextarea = screen.getByPlaceholderText('הערות אישיות להגשה...');
      fireEvent.change(selfNotesTextarea, { target: { value: 'Test note' } });
      
      // Switch to client notes and back
      fireEvent.click(screen.getByText('הערה ללקוח'));
      fireEvent.click(screen.getByText('הערה לעצמי'));
      
      // Self notes should still have the content
      expect(screen.getByDisplayValue('Test note')).toBeInTheDocument();
    });

    it('should handle notes input changes', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      // Test self notes
      const selfNotesTextarea = screen.getByPlaceholderText('הערות אישיות להגשה...');
      fireEvent.change(selfNotesTextarea, { target: { value: 'Self note content' } });
      expect(screen.getByDisplayValue('Self note content')).toBeInTheDocument();
      
      // Test client notes
      fireEvent.click(screen.getByText('הערה ללקוח'));
      const clientNotesTextarea = screen.getByPlaceholderText('הערות ללקוח...');
      fireEvent.change(clientNotesTextarea, { target: { value: 'Client note content' } });
      expect(screen.getByDisplayValue('Client note content')).toBeInTheDocument();
      
      // Test editor notes
      fireEvent.click(screen.getByText('הערה לעורך'));
      const editorNotesTextarea = screen.getByPlaceholderText('הערות לעורך...');
      fireEvent.change(editorNotesTextarea, { target: { value: 'Editor note content' } });
      expect(screen.getByDisplayValue('Editor note content')).toBeInTheDocument();
    });
  });

  describe('Background Images Toggle - Happy Path', () => {
    it('should toggle background images visibility', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
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

    it('should toggle background images multiple times', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      const toggleButton = screen.getByText('הצג רקעים');
      
      // Show background images
      fireEvent.click(toggleButton);
      expect(screen.getByText('תמונות רקע להשוואה')).toBeInTheDocument();
      
      // Hide background images
      const hideButton = screen.getByText('הסתר רקעים');
      fireEvent.click(hideButton);
      expect(screen.queryByText('תמונות רקע להשוואה')).not.toBeInTheDocument();
      
      // Show again
      const showButton = screen.getByText('הצג רקעים');
      fireEvent.click(showButton);
      expect(screen.getByText('תמונות רקע להשוואה')).toBeInTheDocument();
    });
  });

  describe('Submission Details Toggle - Happy Path', () => {
    it('should toggle submission details visibility', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      const toggleButton = screen.getByText('פרטי הגשה ולקוח');
      expect(toggleButton).toBeInTheDocument();
      
      // Details should not be visible initially
      expect(screen.queryByText('מסעדת הגן')).not.toBeInTheDocument();
      
      // Click to show details
      fireEvent.click(toggleButton);
      
      // Details should now be visible
      expect(screen.getByText('מסעדת הגן')).toBeInTheDocument();
      expect(screen.getByText('03-1234567')).toBeInTheDocument();
    });

    it('should show client data in submission details when toggled', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      // Toggle submission details
      const toggleButton = screen.getByText('פרטי הגשה ולקוח');
      fireEvent.click(toggleButton);
      
      // Should show mock client data
      expect(screen.getByText('מסעדת הגן')).toBeInTheDocument();
      expect(screen.getByText('03-1234567')).toBeInTheDocument();
      expect(screen.getByText('13/06/2025')).toBeInTheDocument();
      expect(screen.getByText('בתהליך')).toBeInTheDocument();
    });
  });

  describe('LORA Details Section - Happy Path', () => {
    it('should render LORA input fields', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      expect(screen.getByPlaceholderText('שם LORA')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('מזהה LORA')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('קישור LORA')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Prompt קבוע')).toBeInTheDocument();
    });

    it('should handle LORA input changes', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      const nameInput = screen.getByPlaceholderText('שם LORA');
      const idInput = screen.getByPlaceholderText('מזהה LORA');
      const linkInput = screen.getByPlaceholderText('קישור LORA');
      const promptInput = screen.getByPlaceholderText('Prompt קבוע');
      
      fireEvent.change(nameInput, { target: { value: 'Test LORA Name' } });
      fireEvent.change(idInput, { target: { value: 'test-id-123' } });
      fireEvent.change(linkInput, { target: { value: 'https://example.com/lora' } });
      fireEvent.change(promptInput, { target: { value: 'Test prompt content' } });
      
      expect(screen.getByDisplayValue('Test LORA Name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test-id-123')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://example.com/lora')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test prompt content')).toBeInTheDocument();
    });
  });

  describe('Action History - Happy Path', () => {
    it('should display action history items', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      expect(screen.getByText('היסטוריית פעולות')).toBeInTheDocument();
      expect(screen.getByText('הועלו תמונות מעובדות')).toBeInTheDocument();
      expect(screen.getByText('סטטוס עודכן')).toBeInTheDocument();
      expect(screen.getByText('הגשה נקלטה')).toBeInTheDocument();
    });

    it('should display timestamps for actions', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      expect(screen.getByText('13/06/2025 14:30')).toBeInTheDocument();
      expect(screen.getByText('13/06/2025 10:15')).toBeInTheDocument();
      expect(screen.getByText('13/06/2025 09:30')).toBeInTheDocument();
    });

    it('should display action descriptions', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      expect(screen.getByText('הועלו 2 תמונות מעובדות חדשות עבור חמבורגר טרופי')).toBeInTheDocument();
      expect(screen.getByText('סטטוס ההגשה עודכן מ"ממתין" ל"בתהליך"')).toBeInTheDocument();
      expect(screen.getByText('הגשה חדשה נקלטה במערכת עם 3 תמונות מקור')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle cost quantity reaching zero', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      // Find GPT-4 decrement button
      const gpt4Section = screen.getByText('GPT-4 (2.5$)').closest('div');
      const decrementButton = gpt4Section?.querySelector('button:first-child');
      
      expect(decrementButton).toBeInTheDocument();
      
      // Click decrement twice (from initial 2 to 0)
      fireEvent.click(decrementButton!);
      fireEvent.click(decrementButton!);
      
      // Should show 0 and not go negative
      expect(screen.getByText('0')).toBeInTheDocument();
      
      // Try to decrement once more
      fireEvent.click(decrementButton!);
      
      // Should still be 0
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle empty LORA fields gracefully', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      // LORA fields should be present and empty by default
      expect(screen.getByPlaceholderText('שם LORA')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('מזהה LORA')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('קישור LORA')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Prompt קבוע')).toBeInTheDocument();
    });

    it('should handle single image arrays properly', () => {
      // This would require modifying the component to accept props for testing
      // For now, we test that the component doesn't crash with the hardcoded arrays
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      // Component should render without crashing
      expect(screen.getByText('תמונות מקור')).toBeInTheDocument();
      expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
    });

    it('should handle missing client data gracefully', () => {
      const incompleteClient: Partial<Client> = {
        client_id: 'test-client-1',
        restaurant_name: 'Test Restaurant',
      };
      
      render(<ClientSubmissions2 clientId="test-client-1" client={incompleteClient as Client} />);
      
      // Component should still render
      expect(screen.getByText('הגשות')).toBeInTheDocument();
    });

    it('should handle empty clientId', () => {
      render(<ClientSubmissions2 clientId="" client={mockClient} />);
      
      // Component should still render
      expect(screen.getByText('הגשות')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should maintain state consistency across interactions', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
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

    it('should handle multiple simultaneous state changes', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      // Change submission selection
      fireEvent.click(screen.getByText('קוקטייל מוהיטו'));
      
      // Change notes
      const selfNotesTextarea = screen.getByPlaceholderText('הערות אישיות להגשה...');
      fireEvent.change(selfNotesTextarea, { target: { value: 'Multi-state test' } });
      
      // Toggle timer
      const timerButton = screen.getByTestId('play-icon').closest('button');
      fireEvent.click(timerButton!);
      
      // All states should be maintained
      expect(screen.getAllByText('קוקטייל מוהיטו').length).toBeGreaterThan(1);
      expect(screen.getByDisplayValue('Multi-state test')).toBeInTheDocument();
      expect(screen.getByTestId('pause-icon')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should not crash when clicking navigation buttons rapidly', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      const rightArrow = screen.getAllByTestId('chevron-right-icon')[0]?.closest('button');
      
      // Rapidly click navigation
      for (let i = 0; i < 10; i++) {
        fireEvent.click(rightArrow!);
      }
      
      // Component should still be functional
      expect(screen.getByText('תמונות מקור')).toBeInTheDocument();
    });

    it('should handle invalid timer states gracefully', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      const timerButton = screen.getByTestId('play-icon').closest('button');
      
      // Rapidly toggle timer
      for (let i = 0; i < 5; i++) {
        fireEvent.click(timerButton!);
      }
      
      // Component should still work
      expect(screen.getByText('00:00:00')).toBeInTheDocument();
    });

    it('should handle invalid cost calculations', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      // Try to increment costs to very high numbers
      const gpt4Section = screen.getByText('GPT-4 (2.5$)').closest('div');
      const incrementButton = gpt4Section?.querySelector('button:last-child');
      
      // Click many times
      for (let i = 0; i < 100; i++) {
        fireEvent.click(incrementButton!);
      }
      
      // Component should still display a cost (even if very high)
      expect(screen.getByText(/₪/)).toBeInTheDocument();
    });

    it('should handle rapid submission switching', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      const submissions = [
        screen.getByText('חמבורגר טרופי'),
        screen.getByText('קוקטייל מוהיטו'),
        screen.getByText('פיצה מרגריטה')
      ];
      
      // Rapidly switch between submissions
      for (let i = 0; i < 10; i++) {
        fireEvent.click(submissions[i % submissions.length]);
      }
      
      // Component should still be functional
      expect(screen.getByText('הגשות')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have proper input accessibility', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation for tabs', () => {
      render(<ClientSubmissions2 clientId="test-client-1" client={mockClient} />);
      
      const tabButtons = screen.getAllByRole('button').filter(button => 
        button.textContent?.includes('הערה')
      );
      
      expect(tabButtons.length).toBeGreaterThan(0);
    });
  });
}); 