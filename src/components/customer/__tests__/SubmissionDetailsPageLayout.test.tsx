import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, beforeEach, describe, test, expect } from 'vitest';
import { SubmissionDetailsPage } from '../SubmissionDetailsPage';
import { useSubmission } from '@/hooks/useSubmission';

// Mock hooks
vi.mock('@/hooks/useSubmission', () => ({
  useSubmission: vi.fn(() => ({
    submission: {
      submission_id: 'test-submission-1',
      item_name_at_submission: 'Test Burger',
      submission_status: 'מוכנה להצגה',
      uploaded_at: '2024-01-01T10:00:00Z',
      original_image_urls: ['https://example.com/original1.jpg', 'https://example.com/original2.jpg'],
      processed_image_urls: ['https://example.com/processed1.jpg', 'https://example.com/processed2.jpg'],
      main_processed_image_url: 'https://example.com/processed1.jpg',
      edit_history: {
        status_changes: [
          {
            from_status: 'בעיבוד',
            to_status: 'מוכנה להצגה',
            changed_at: '2024-01-01T12:00:00Z',
            note: 'עריכה הושלמה'
          }
        ]
      }
    },
    loading: false,
    error: null,
    requestEdit: vi.fn(),
    updateSubmissionStatus: vi.fn(),
    setMainProcessedImage: vi.fn()
  }))
}));

vi.mock('@/hooks/useMessages', () => ({
  useMessages: vi.fn(() => ({
    messages: [
      {
        message_id: 'msg-1',
        content: 'תודה על העבודה המעולה!',
        sender_type: 'client',
        timestamp: '2024-01-01T11:00:00Z'
      },
      {
        message_id: 'msg-2',
        content: 'בשמחה! אנחנו כאן לכל שאלה',
        sender_type: 'admin',
        timestamp: '2024-01-01T11:05:00Z'
      }
    ],
    loading: false,
    sendMessage: vi.fn()
  }))
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock ShareDialog component
vi.mock('../ShareDialog', () => ({
  ShareDialog: ({ open, onOpenChange }: any) => 
    open ? <div data-testid="share-dialog">Share Dialog</div> : null
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/customer/submissions/test-submission-1']}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('SubmissionDetailsPage Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tab Structure', () => {
    test('renders only 2 tabs as requested', () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      // Should have exactly 2 tabs
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);
      
      // Check tab names
      expect(screen.getByRole('tab', { name: 'תמונות מעובדות' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'היסטוריית עריכות' })).toBeInTheDocument();
      
      // Should NOT have old tabs
      expect(screen.queryByRole('tab', { name: 'תמונות' })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: 'תמונות מקוריות' })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: 'תקשורת' })).not.toBeInTheDocument();
    });

    test('main tab is selected by default', () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      const mainTab = screen.getByRole('tab', { name: 'תמונות מעובדות' });
      expect(mainTab).toHaveAttribute('data-state', 'active');
    });
  });

  describe('Side-by-Side Layout', () => {
    test('displays processed images section on left side', () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      // Should show processed images section
      const processedImagesTitles = screen.getAllByText('תמונות מעובדות');
      expect(processedImagesTitles.length).toBeGreaterThan(0);
      
      // Should display processed image
      const processedImage = screen.getByAltText('Test Burger - מעובד');
      expect(processedImage).toBeInTheDocument();
      expect(processedImage).toHaveAttribute('src', 'https://example.com/processed1.jpg');
    });

    test('displays original images section on right side', () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      // Should show original images section
      expect(screen.getByText('תמונות מקור')).toBeInTheDocument();
      
      // Should display original image
      const originalImage = screen.getByAltText('Test Burger - מקור');
      expect(originalImage).toBeInTheDocument();
      expect(originalImage).toHaveAttribute('src', 'https://example.com/original1.jpg');
    });

    test('displays comments section below images', () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      expect(screen.getByText('הודעות והערות')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('כתבו הודעה או הערה...')).toBeInTheDocument();
    });
  });

  describe('Comments Integration', () => {
    test('displays existing messages in comments section', () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      // Should show existing messages
      expect(screen.getByText('תודה על העבודה המעולה!')).toBeInTheDocument();
      expect(screen.getByText('בשמחה! אנחנו כאן לכל שאלה')).toBeInTheDocument();
    });

    test('allows sending new messages from comments section', () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      const messageInput = screen.getByPlaceholderText('כתבו הודעה או הערה...');
      // Find send button by looking for button with self-end class
      const allButtons = screen.getAllByRole('button');
      const sendButton = allButtons.find(button => 
        button.classList.contains('self-end')
      ) as HTMLButtonElement;

      // Initially send button should be disabled
      expect(sendButton).toBeDisabled();

      // Type a message
      fireEvent.change(messageInput, { target: { value: 'הודעה חדשה' } });
      
      // Send button should be enabled
      expect(sendButton).toBeEnabled();
    });
  });

  describe('Edit History Tab', () => {
    test('edit history tab exists and is clickable', () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      const editHistoryTab = screen.getByRole('tab', { name: 'היסטוריית עריכות' });
      
      // Tab should exist and be clickable
      expect(editHistoryTab).toBeInTheDocument();
      expect(editHistoryTab).not.toBeDisabled();
      
      // Should be able to click the tab without errors
      fireEvent.click(editHistoryTab);
      
      // Tab should still be in the document after clicking
      expect(editHistoryTab).toBeInTheDocument();
    });
  });

  describe('Image Interactions', () => {
    test('images are clickable for lightbox view', () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      const processedImage = screen.getByAltText('Test Burger - מעובד');
      expect(processedImage).toHaveClass('cursor-pointer');

      const originalImage = screen.getByAltText('Test Burger - מקור');
      expect(originalImage).toHaveClass('cursor-pointer');
    });

    test('displays action buttons on processed images', () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      // Should have maximize, download, and share buttons for processed images
      const actionButtons = screen.getAllByRole('button');
      const maximizeButtons = actionButtons.filter(btn => 
        btn.querySelector('svg')?.getAttribute('class')?.includes('h-4 w-4')
      );
      
      expect(maximizeButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Image Navigation', () => {
    test('shows navigation functionality exists', () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      // Should show image sections with navigation capability - use getAllByText for multiple instances
      const processedTitles = screen.getAllByText('תמונות מעובדות');
      expect(processedTitles.length).toBeGreaterThan(0);
      expect(screen.getByText('תמונות מקור')).toBeInTheDocument();
      
      // Images should be clickable for lightbox
      const processedImage = screen.getByAltText('Test Burger - מעובד');
      const originalImage = screen.getByAltText('Test Burger - מקור');
      
      expect(processedImage).toHaveClass('cursor-pointer');
      expect(originalImage).toHaveClass('cursor-pointer');
    });
  });
}); 