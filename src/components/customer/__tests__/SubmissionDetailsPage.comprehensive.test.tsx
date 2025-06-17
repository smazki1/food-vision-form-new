import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SubmissionDetailsPage } from '../SubmissionDetailsPage';

// Mock the hooks
vi.mock('@/hooks/useSubmission', () => ({
  useSubmission: vi.fn()
}));

vi.mock('@/hooks/useMessages', () => ({
  useMessages: vi.fn()
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
  }))
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({
      submissionId: 'test-submission-id',
      clientId: 'test-client-id'
    }))
  };
});

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, disabled, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={className} 
      disabled={disabled}
      data-testid={props['data-testid'] || 'button'}
      {...props}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }: any) => <div data-testid="tabs" data-default-value={defaultValue}>{children}</div>,
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => <div data-testid={`tab-trigger-${value}`}>{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-testid={`tab-content-${value}`}>{children}</div>
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, placeholder, ...props }: any) => (
    <textarea 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder}
      data-testid="textarea"
      {...props}
    />
  )
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  )
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  Check: () => <div data-testid="check-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  MessageSquare: () => <div data-testid="message-square-icon" />,
  Send: () => <div data-testid="send-icon" />,
  ChevronLeft: () => <div data-testid="chevron-left-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  Maximize: () => <div data-testid="maximize-icon" />
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => <div data-testid="skeleton" className={className} />
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock data
const mockSubmission = {
  submission_id: 'test-submission-id',
  item_name_at_submission: 'חמבורגר טרופי',
  submission_status: 'בעיבוד',
  original_image_urls: [
    'https://example.com/original1.jpg',
    'https://example.com/original2.jpg',
    'https://example.com/original3.jpg'
  ],
  processed_image_urls: [
    'https://example.com/processed1.jpg',
    'https://example.com/processed2.jpg'
  ],
  client_id: 'test-client-id',
  uploaded_at: '2024-01-01T10:00:00Z'
};

const mockMessages = [
  {
    message_id: '1',
    submission_id: 'test-submission-id',
    sender_type: 'client',
    content: 'הודעה מהלקוח',
    timestamp: '2024-01-01T10:00:00Z'
  },
  {
    message_id: '2',
    submission_id: 'test-submission-id',
    sender_type: 'team',
    content: 'תגובה מהצוות',
    timestamp: '2024-01-01T11:00:00Z'
  }
];

describe('SubmissionDetailsPage - Comprehensive Feature Tests', () => {
  const mockUseSubmission = vi.fn();
  const mockUseMessages = vi.fn();
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    mockUseSubmission.mockReturnValue({
      submission: mockSubmission,
      loading: false,
      error: null,
      requestEdit: vi.fn(),
      updateSubmissionStatus: vi.fn(),
      setMainProcessedImage: vi.fn()
    });

    mockUseMessages.mockReturnValue({
      messages: mockMessages,
      loading: false,
      sendMessage: vi.fn().mockResolvedValue(true)
    });

    require('@/hooks/useSubmission').useSubmission = mockUseSubmission;
    require('@/hooks/useMessages').useMessages = mockUseMessages;
    require('@/hooks/use-toast').useToast.mockReturnValue({ toast: mockToast });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===== FEATURE 1: SIDE-BY-SIDE IMAGE DISPLAY WITH NAVIGATION =====
  describe('Side-by-Side Image Display with Navigation', () => {
    it('should display processed and original images side by side', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
      expect(screen.getByText('תמונות מקור')).toBeInTheDocument();
      
      // Check image counters
      expect(screen.getByText('1 / 2')).toBeInTheDocument(); // Processed images counter
      expect(screen.getByText('1 / 3')).toBeInTheDocument(); // Original images counter
    });

    it('should show navigation arrows for multiple images', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      // Should show navigation arrows for both sides
      const leftArrows = screen.getAllByTestId('chevron-left');
      const rightArrows = screen.getAllByTestId('chevron-right');
      
      expect(leftArrows.length).toBeGreaterThanOrEqual(2);
      expect(rightArrows.length).toBeGreaterThanOrEqual(2);
    });

    it('should navigate through processed images independently', async () => {
      const user = userEvent.setup();
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      // Find navigation buttons for processed images
      const rightButtons = screen.getAllByTestId('navigate-processed-next');
      
      if (rightButtons.length > 0) {
        await user.click(rightButtons[0]);
        
        await waitFor(() => {
          expect(screen.getByText('2 / 2')).toBeInTheDocument();
        });
      }
    });

    it('should implement circular navigation', async () => {
      const user = userEvent.setup();
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      // Navigate to last processed image and then wrap around
      const rightButtons = screen.getAllByTestId('navigate-processed-next');
      
      if (rightButtons.length > 0) {
        await user.click(rightButtons[0]); // Go to 2/2
        await user.click(rightButtons[0]); // Should wrap to 1/2
        
        await waitFor(() => {
          expect(screen.getByText('1 / 2')).toBeInTheDocument();
        });
      }
    });
  });

  // ===== FEATURE 2: LIGHTBOX NAVIGATION =====
  describe('Lightbox Navigation Feature', () => {
    it('should open lightbox when image is clicked', async () => {
      const user = userEvent.setup();
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      const images = screen.getAllByRole('img');
      if (images.length > 0) {
        await user.click(images[0]);
        
        expect(screen.getByTestId('lightbox-dialog')).toBeInTheDocument();
      }
    });

    it('should show navigation arrows in lightbox for multiple images', async () => {
      const user = userEvent.setup();
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      const images = screen.getAllByRole('img');
      if (images.length > 0) {
        await user.click(images[0]);

        await waitFor(() => {
          expect(screen.getByTestId('lightbox-prev')).toBeInTheDocument();
          expect(screen.getByTestId('lightbox-next')).toBeInTheDocument();
        });
      }
    });

    it('should show image counter in lightbox', async () => {
      const user = userEvent.setup();
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      const images = screen.getAllByRole('img');
      if (images.length > 0) {
        await user.click(images[0]);

        await waitFor(() => {
          expect(screen.getByTestId('lightbox-counter')).toBeInTheDocument();
        });
      }
    });
  });

  // ===== FEATURE 3: FULLSCREEN COMPARISON =====
  describe('Fullscreen Comparison Feature', () => {
    it('should show fullscreen comparison button when both image types exist', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('השוואה מלאה')).toBeInTheDocument();
    });

    it('should not show comparison button when only one image type exists', () => {
      mockUseSubmission.mockReturnValue({
        submission: {
          ...mockSubmission,
          original_image_urls: []
        },
        loading: false,
        error: null,
        requestEdit: vi.fn(),
        updateSubmissionStatus: vi.fn(),
        setMainProcessedImage: vi.fn()
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      expect(screen.queryByText('השוואה מלאה')).not.toBeInTheDocument();
    });

    it('should open fullscreen comparison dialog', async () => {
      const user = userEvent.setup();
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      const comparisonButton = screen.getByText('השוואה מלאה');
      await user.click(comparisonButton);

      await waitFor(() => {
        expect(screen.getByTestId('fullscreen-comparison')).toBeInTheDocument();
      });
    });

    it('should show both image types in fullscreen comparison', async () => {
      const user = userEvent.setup();
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      const comparisonButton = screen.getByText('השוואה מלאה');
      await user.click(comparisonButton);

      await waitFor(() => {
        expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
        expect(screen.getByText('תמונות מקור')).toBeInTheDocument();
      });
    });
  });

  // ===== FEATURE 4: COMMENTS SYSTEM =====
  describe('Customer Comments System', () => {
    it('should display existing messages', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('הודעה מהלקוח')).toBeInTheDocument();
      expect(screen.getByText('תגובה מהצוות')).toBeInTheDocument();
    });

    it('should show message input field', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      const messageInput = screen.getByPlaceholderText(/הודעה/);
      expect(messageInput).toBeInTheDocument();
    });

    it('should send new message when form is submitted', async () => {
      const user = userEvent.setup();
      const mockSendMessage = vi.fn().mockResolvedValue(true);
      
      mockUseMessages.mockReturnValue({
        messages: mockMessages,
        loading: false,
        sendMessage: mockSendMessage
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      const messageInput = screen.getByPlaceholderText(/הודעה/);
      const sendButton = screen.getByTestId('send-message');

      await user.type(messageInput, 'הודעה חדשה מהלקוח');
      await user.click(sendButton);
      
      expect(mockSendMessage).toHaveBeenCalledWith('הודעה חדשה מהלקוח');
    });
  });

  // ===== FEATURE 5: TAB STRUCTURE =====
  describe('Tab Structure', () => {
    it('should show main tab and edit history tab', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
      expect(screen.getByText('היסטוריית עריכות')).toBeInTheDocument();
    });

    it('should switch between tabs', async () => {
      const user = userEvent.setup();
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      const editHistoryTab = screen.getByText('היסטוריית עריכות');
      await user.click(editHistoryTab);

      // Should show edit history content
      expect(screen.getByTestId('edit-history-content')).toBeInTheDocument();
    });
  });

  // ===== EDGE CASES AND ERROR HANDLING =====
  describe('Edge Cases and Error Handling', () => {
    it('should handle submission with no images', () => {
      mockUseSubmission.mockReturnValue({
        submission: {
          ...mockSubmission,
          original_image_urls: [],
          processed_image_urls: []
        },
        loading: false,
        error: null,
        requestEdit: vi.fn(),
        updateSubmissionStatus: vi.fn(),
        setMainProcessedImage: vi.fn()
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('אין תמונות מעובדות')).toBeInTheDocument();
      expect(screen.getByText('אין תמונות מקור')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockUseSubmission.mockReturnValue({
        submission: null,
        loading: true,
        error: null,
        requestEdit: vi.fn(),
        updateSubmissionStatus: vi.fn(),
        setMainProcessedImage: vi.fn()
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('should handle submission error', () => {
      mockUseSubmission.mockReturnValue({
        submission: null,
        loading: false,
        error: new Error('Failed to load submission'),
        requestEdit: vi.fn(),
        updateSubmissionStatus: vi.fn(),
        setMainProcessedImage: vi.fn()
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/שגיאה/)).toBeInTheDocument();
    });

    it('should handle empty messages list', () => {
      mockUseMessages.mockReturnValue({
        messages: [],
        loading: false,
        sendMessage: vi.fn()
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/אין הודעות/)).toBeInTheDocument();
    });
  });

  // ===== ACCESSIBILITY AND UX =====
  describe('Accessibility and User Experience', () => {
    it('should have proper alt text for images', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).toBeTruthy();
      });
    });

    it('should have cursor pointer on clickable images', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveClass('cursor-pointer');
      });
    });

    it('should show Hebrew text in RTL layout', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
      expect(screen.getByText('תמונות מקור')).toBeInTheDocument();
      expect(screen.getByText('השוואה מלאה')).toBeInTheDocument();
    });
  });
}); 