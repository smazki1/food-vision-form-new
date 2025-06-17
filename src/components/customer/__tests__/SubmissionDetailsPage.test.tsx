import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
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
    useParams: vi.fn(() => ({ submissionId: 'test-submission-id', clientId: 'test-client-id' })),
    Link: ({ children, to }: any) => <a href={to}>{children}</a>
  };
});

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
  CardDescription: ({ children }: any) => <p data-testid="card-description">{children}</p>,
  CardFooter: ({ children }: any) => <div data-testid="card-footer">{children}</div>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, variant, size, asChild, ...props }: any) => {
    if (asChild) {
      return <div className={className} {...props}>{children}</div>;
    }
    return (
      <button 
        onClick={onClick} 
        disabled={disabled} 
        className={className}
        data-variant={variant}
        data-size={size}
        data-testid="button"
        {...props}
      >
        {children}
      </button>
    );
  }
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={className} data-variant={variant} data-testid="badge">{children}</span>
  )
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, placeholder, className, disabled, ...props }: any) => (
    <textarea 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      data-testid="textarea"
      {...props}
    />
  )
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue, className }: any) => (
    <div className={className} data-default-value={defaultValue} data-testid="tabs">{children}</div>
  ),
  TabsList: ({ children, className }: any) => (
    <div className={className} data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({ children, value, className }: any) => (
    <button className={className} data-value={value} data-testid={`tab-trigger-${value}`}>{children}</button>
  ),
  TabsContent: ({ children, value, className }: any) => (
    <div className={className} data-value={value} data-testid={`tab-content-${value}`}>{children}</div>
  )
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    <div data-open={open} data-testid="dialog" onClick={() => onOpenChange?.(false)}>{children}</div>
  ),
  DialogContent: ({ children, className }: any) => (
    <div className={className} data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
  DialogTrigger: ({ children, asChild }: any) => asChild ? children : <div data-testid="dialog-trigger">{children}</div>
}));

vi.mock('./ShareDialog', () => ({
  ShareDialog: ({ open, onOpenChange, imageUrl, itemName }: any) => (
    <div data-testid="share-dialog" data-open={open} data-image-url={imageUrl} data-item-name={itemName}>
      Share Dialog
    </div>
  )
}));

vi.mock('@/utils/formatDate', () => ({
  formatDate: vi.fn((date) => '2024-01-01')
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span data-testid="arrow-left-icon">←</span>,
  Check: () => <span data-testid="check-icon">✓</span>,
  Download: () => <span data-testid="download-icon">↓</span>,
  Edit: () => <span data-testid="edit-icon">✎</span>,
  MessageSquare: () => <span data-testid="message-square-icon">💬</span>,
  Send: () => <span data-testid="send-icon">→</span>,
  ChevronLeft: () => <span data-testid="chevron-left-icon">‹</span>,
  ChevronRight: () => <span data-testid="chevron-right-icon">›</span>,
  Maximize: () => <span data-testid="maximize-icon">⛶</span>
}));

const { useSubmission } = await import('@/hooks/useSubmission');
const { useMessages } = await import('@/hooks/useMessages');
const { useToast } = await import('@/hooks/use-toast');

const mockUseSubmission = useSubmission as any;
const mockUseMessages = useMessages as any;
const mockUseToast = useToast as any;

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

describe('SubmissionDetailsPage', () => {
  const mockToast = vi.fn();
  
  const mockSubmission = {
    submission_id: 'test-submission-id',
    item_name_at_submission: 'חמבורגר טרופי',
    submission_status: 'מוכנה להצגה',
    uploaded_at: '2024-01-01T10:00:00Z',
    original_image_urls: ['original1.jpg', 'original2.jpg', 'original3.jpg'],
    processed_image_urls: ['processed1.jpg', 'processed2.jpg'],
    edit_history: {
      status_changes: [
        {
          from_status: 'בעיבוד',
          to_status: 'מוכנה להצגה',
          changed_at: '2024-01-01T12:00:00Z',
          note: 'הושלמה העריכה'
        }
      ]
    }
  };

  const mockMessages = [
    {
      message_id: 'msg1',
      sender_type: 'לקוח',
      content: 'הודעה ראשונה',
      timestamp: '2024-01-01T11:00:00Z'
    },
    {
      message_id: 'msg2',
      sender_type: 'עורך',
      content: 'הודעה שנייה',
      timestamp: '2024-01-01T11:30:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseToast.mockReturnValue({
      toast: mockToast
    });

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
      sendMessage: vi.fn()
    });
  });

  describe('Component Rendering', () => {
    it('renders submission details correctly', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      expect(screen.getByText('חמבורגר טרופי')).toBeInTheDocument();
      expect(screen.getByText('מוכנה להצגה')).toBeInTheDocument();
      expect(screen.getByText('הועלה בתאריך: 2024-01-01')).toBeInTheDocument();
    });

    it('renders tab structure correctly', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('tab-trigger-main')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-editHistory')).toBeInTheDocument();
      expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
      expect(screen.getByText('היסטוריית עריכות')).toBeInTheDocument();
    });

    it('renders side-by-side image layout', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
      expect(screen.getByText('תמונות מקור')).toBeInTheDocument();
      expect(screen.getByText('2 / 2')).toBeInTheDocument(); // Processed images counter
      expect(screen.getByText('3 / 3')).toBeInTheDocument(); // Original images counter
    });

    it('displays images with correct attributes', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      const processedImage = screen.getByAltText('חמבורגר טרופי - מעובד');
      const originalImage = screen.getByAltText('חמבורגר טרופי - מקור');
      
      expect(processedImage).toHaveAttribute('src', 'processed1.jpg');
      expect(originalImage).toHaveAttribute('src', 'original1.jpg');
      expect(processedImage).toHaveClass('w-full', 'h-full', 'object-cover');
      expect(originalImage).toHaveClass('w-full', 'h-full', 'object-cover');
    });
  });

  describe('Image Navigation', () => {
    it('navigates processed images correctly', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      const nextButton = screen.getAllByTestId('chevron-right-icon')[0].closest('button');
      const prevButton = screen.getAllByTestId('chevron-left-icon')[0].closest('button');
      
      // Navigate to next processed image
      fireEvent.click(nextButton!);
      const processedImage = screen.getByAltText('חמבורגר טרופי - מעובד');
      expect(processedImage).toHaveAttribute('src', 'processed2.jpg');
      
      // Navigate to previous (should wrap around)
      fireEvent.click(prevButton!);
      expect(processedImage).toHaveAttribute('src', 'processed1.jpg');
    });

    it('navigates original images correctly', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      const nextButtons = screen.getAllByTestId('chevron-right-icon');
      const prevButtons = screen.getAllByTestId('chevron-left-icon');
      
      // Get original image navigation buttons (second set)
      const nextButton = nextButtons[1].closest('button');
      const prevButton = prevButtons[1].closest('button');
      
      // Navigate to next original image
      fireEvent.click(nextButton!);
      const originalImage = screen.getByAltText('חמבורגר טרופי - מקור');
      expect(originalImage).toHaveAttribute('src', 'original2.jpg');
      
      // Navigate to next again
      fireEvent.click(nextButton!);
      expect(originalImage).toHaveAttribute('src', 'original3.jpg');
      
      // Navigate to next (should wrap around to first)
      fireEvent.click(nextButton!);
      expect(originalImage).toHaveAttribute('src', 'original1.jpg');
    });

    it('handles circular navigation correctly', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      const prevButtons = screen.getAllByTestId('chevron-left-icon');
      const prevButton = prevButtons[0].closest('button');
      
      // Navigate to previous from first image (should wrap to last)
      fireEvent.click(prevButton!);
      const processedImage = screen.getByAltText('חמבורגר טרופי - מעובד');
      expect(processedImage).toHaveAttribute('src', 'processed2.jpg');
    });
  });

  describe('Action Buttons', () => {
    it('shows edit request button when status allows', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      expect(screen.getByText('בקש עריכה')).toBeInTheDocument();
    });

    it('shows approve button when status allows', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      expect(screen.getByText('אשר מנה')).toBeInTheDocument();
    });

    it('handles edit request correctly', async () => {
      const mockRequestEdit = vi.fn().mockResolvedValue(true);
      mockUseSubmission.mockReturnValue({
        ...mockUseSubmission(),
        requestEdit: mockRequestEdit
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      // Open edit dialog
      fireEvent.click(screen.getByText('בקש עריכה'));
      
      // Fill in edit note
      const textarea = screen.getByPlaceholderText('תארו את העריכות הנדרשות...');
      fireEvent.change(textarea, { target: { value: 'בקשת עריכה לדוגמה' } });
      
      // Submit edit request
      fireEvent.click(screen.getByText('שליחת בקשה'));
      
      await waitFor(() => {
        expect(mockRequestEdit).toHaveBeenCalledWith('בקשת עריכה לדוגמה');
        expect(mockToast).toHaveBeenCalledWith({
          title: 'בקשת עריכה נשלחה',
          description: 'בקשת העריכה שלכם התקבלה ותטופל בקרוב'
        });
      });
    });

    it('handles approve action correctly', async () => {
      const mockUpdateStatus = vi.fn().mockResolvedValue(true);
      mockUseSubmission.mockReturnValue({
        ...mockUseSubmission(),
        updateSubmissionStatus: mockUpdateStatus
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      fireEvent.click(screen.getByText('אשר מנה'));
      
      await waitFor(() => {
        expect(mockUpdateStatus).toHaveBeenCalledWith('הושלמה ואושרה');
        expect(mockToast).toHaveBeenCalledWith({
          title: 'המנה אושרה',
          description: 'המנה סומנה כמאושרת ומוכנה להורדה'
        });
      });
    });
  });

  describe('Comments System', () => {
    it('displays existing messages correctly', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      expect(screen.getByText('הודעה ראשונה')).toBeInTheDocument();
      expect(screen.getByText('הודעה שנייה')).toBeInTheDocument();
      expect(screen.getByText('לקוח')).toBeInTheDocument();
      expect(screen.getByText('עורך')).toBeInTheDocument();
    });

    it('handles sending new messages', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue(true);
      mockUseMessages.mockReturnValue({
        ...mockUseMessages(),
        sendMessage: mockSendMessage
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      const textarea = screen.getByPlaceholderText('כתבו הודעה או הערה...');
      const sendButton = screen.getByTestId('send-icon').closest('button');
      
      fireEvent.change(textarea, { target: { value: 'הודעה חדשה' } });
      fireEvent.click(sendButton!);
      
      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith('הודעה חדשה');
        expect(mockToast).toHaveBeenCalledWith({
          title: 'ההודעה נשלחה',
          description: 'ההודעה שלכם נשלחה לצוות העריכה'
        });
      });
    });

    it('disables send button when message is empty', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      const sendButton = screen.getByTestId('send-icon').closest('button');
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Lightbox Functionality', () => {
    it('opens lightbox when image is clicked', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      const processedImage = screen.getByAltText('חמבורגר טרופי - מעובד');
      fireEvent.click(processedImage);
      
      const lightboxImage = screen.getByAltText('Selected Preview');
      expect(lightboxImage).toHaveAttribute('src', 'processed1.jpg');
    });

    it('closes lightbox when dialog is closed', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      const processedImage = screen.getByAltText('חמבורגר טרופי - מעובד');
      fireEvent.click(processedImage);
      
      const dialog = screen.getByTestId('dialog');
      fireEvent.click(dialog);
      
      expect(screen.queryByAltText('Selected Preview')).not.toBeInTheDocument();
    });
  });

  describe('Download Functionality', () => {
    it('handles image download correctly', () => {
      // Mock document.createElement and related methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      const mockCreateElement = vi.fn().mockReturnValue(mockLink);
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      
      Object.defineProperty(document, 'createElement', { value: mockCreateElement });
      Object.defineProperty(document.body, 'appendChild', { value: mockAppendChild });
      Object.defineProperty(document.body, 'removeChild', { value: mockRemoveChild });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      const downloadButtons = screen.getAllByTestId('download-icon');
      const downloadButton = downloadButtons[0].closest('button');
      
      fireEvent.click(downloadButton!);
      
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe('processed1.jpg');
      expect(mockLink.download).toBe('חמבורגר טרופי-processed-1.jpg');
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
    });
  });

  describe('Edit History', () => {
    it('displays edit history correctly', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      // Switch to edit history tab
      fireEvent.click(screen.getByTestId('tab-trigger-editHistory'));
      
      expect(screen.getByText('שינוי סטטוס #1')).toBeInTheDocument();
      expect(screen.getByText('בעיבוד')).toBeInTheDocument();
      expect(screen.getByText('מוכנה להצגה')).toBeInTheDocument();
      expect(screen.getByText('הושלמה העריכה')).toBeInTheDocument();
    });

    it('shows empty state when no edit history exists', () => {
      mockUseSubmission.mockReturnValue({
        ...mockUseSubmission(),
        submission: {
          ...mockSubmission,
          edit_history: { status_changes: [] }
        }
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      fireEvent.click(screen.getByTestId('tab-trigger-editHistory'));
      
      expect(screen.getByText('אין היסטוריית עריכות למנה זו')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading skeleton when submission is loading', () => {
      mockUseSubmission.mockReturnValue({
        submission: null,
        loading: true,
        error: null,
        requestEdit: vi.fn(),
        updateSubmissionStatus: vi.fn(),
        setMainProcessedImage: vi.fn()
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      expect(screen.getAllByTestId('skeleton')).toHaveLength(3);
    });

    it('shows loading skeleton for messages when loading', () => {
      mockUseMessages.mockReturnValue({
        messages: [],
        loading: true,
        sendMessage: vi.fn()
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      expect(screen.getAllByTestId('skeleton')).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('shows error state when submission fails to load', () => {
      mockUseSubmission.mockReturnValue({
        submission: null,
        loading: false,
        error: new Error('Failed to load'),
        requestEdit: vi.fn(),
        updateSubmissionStatus: vi.fn(),
        setMainProcessedImage: vi.fn()
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      expect(screen.getByText('שגיאה בטעינת פרטי הגשה')).toBeInTheDocument();
      expect(screen.getByText('אירעה שגיאה בעת טעינת פרטי ההגשה. אנא נסו שוב מאוחר יותר.')).toBeInTheDocument();
    });

    it('handles edit request failure', async () => {
      const mockRequestEdit = vi.fn().mockResolvedValue(false);
      mockUseSubmission.mockReturnValue({
        ...mockUseSubmission(),
        requestEdit: mockRequestEdit
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      fireEvent.click(screen.getByText('בקש עריכה'));
      
      const textarea = screen.getByPlaceholderText('תארו את העריכות הנדרשות...');
      fireEvent.change(textarea, { target: { value: 'בקשת עריכה' } });
      
      fireEvent.click(screen.getByText('שליחת בקשה'));
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'שגיאה בשליחת בקשת העריכה',
          description: 'אירעה שגיאה בעת שליחת בקשת העריכה. אנא נסו שוב מאוחר יותר.',
          variant: 'destructive'
        });
      });
    });

    it('validates edit request input', async () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      fireEvent.click(screen.getByText('בקש עריכה'));
      fireEvent.click(screen.getByText('שליחת בקשה'));
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'שגיאה',
          description: 'נא להזין הערות לעריכה',
          variant: 'destructive'
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles submission without processed images', () => {
      mockUseSubmission.mockReturnValue({
        ...mockUseSubmission(),
        submission: {
          ...mockSubmission,
          processed_image_urls: []
        }
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      expect(screen.getByText('אין תמונות מעובדות')).toBeInTheDocument();
    });

    it('handles submission without original images', () => {
      mockUseSubmission.mockReturnValue({
        ...mockUseSubmission(),
        submission: {
          ...mockSubmission,
          original_image_urls: []
        }
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      expect(screen.getByText('אין תמונות מקור')).toBeInTheDocument();
    });

    it('handles single image navigation correctly', () => {
      mockUseSubmission.mockReturnValue({
        ...mockUseSubmission(),
        submission: {
          ...mockSubmission,
          processed_image_urls: ['single-processed.jpg'],
          original_image_urls: ['single-original.jpg']
        }
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      // Navigation arrows should not be visible for single images
      expect(screen.queryByTestId('chevron-left-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('chevron-right-icon')).not.toBeInTheDocument();
    });

    it('handles different submission statuses correctly', () => {
      mockUseSubmission.mockReturnValue({
        ...mockUseSubmission(),
        submission: {
          ...mockSubmission,
          submission_status: 'בעיבוד'
        }
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      // Edit and approve buttons should not be visible for "בעיבוד" status
      expect(screen.queryByText('בקש עריכה')).not.toBeInTheDocument();
      expect(screen.queryByText('אשר מנה')).not.toBeInTheDocument();
    });

    it('handles empty messages list', () => {
      mockUseMessages.mockReturnValue({
        messages: [],
        loading: false,
        sendMessage: vi.fn()
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      expect(screen.getByText('אין הודעות עדיין')).toBeInTheDocument();
    });
  });

  describe('URL Navigation', () => {
    it('generates correct back URL for client context', () => {
      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      const backLink = screen.getByText('חזרה לגלריה').closest('a');
      expect(backLink).toHaveAttribute('href', '/customer-review/test-client-id');
    });

    it('generates correct back URL for submissions context', () => {
      vi.mocked(require('react-router-dom').useParams).mockReturnValue({
        submissionId: 'test-submission-id'
      });

      render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
      
      const backLink = screen.getByText('חזרה לרשימת ההגשות').closest('a');
      expect(backLink).toHaveAttribute('href', '/customer/submissions');
    });
  });
}); 