import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { SubmissionDetailsPage } from '../SubmissionDetailsPage';

// Mock the hooks
const mockUpdateSubmissionStatus = vi.fn();
const mockAddCommentMutation = { mutateAsync: vi.fn() };
const mockToast = vi.fn();

vi.mock('@/hooks/useSubmission', () => ({
  useSubmission: () => ({
    submission: {
      submission_id: 'test-id',
      item_name_at_submission: 'חמבורגר טרופי',
      submission_status: 'מוכנה להצגה',
      uploaded_at: '2024-01-01',
      processed_image_urls: ['processed1.jpg'],
      original_image_urls: ['original1.jpg']
    },
    loading: false,
    error: null,
    updateSubmissionStatus: mockUpdateSubmissionStatus,
    setMainProcessedImage: vi.fn()
  })
}));

vi.mock('@/hooks/useMessages', () => ({
  useMessages: () => ({
    messages: [],
    loading: false,
    sendMessage: vi.fn()
  })
}));

vi.mock('@/hooks/useSubmissions', () => ({
  useAddSubmissionComment: () => mockAddCommentMutation
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ submissionId: 'test-id' }),
    Link: ({ children, to }: any) => <a href={to}>{children}</a>
  };
});

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
  DialogTrigger: ({ children }: any) => <div data-testid="dialog-trigger">{children}</div>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid="button" {...props}>{children}</button>
  )
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, ...props }: any) => (
    <textarea 
      value={value} 
      onChange={onChange} 
      data-testid="textarea"
      {...props}
    />
  )
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardFooter: ({ children }: any) => <div data-testid="card-footer">{children}</div>
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div data-testid="tabs">{children}</div>,
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => (
    <button data-testid={`tabs-trigger-${value}`} data-value={value}>{children}</button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tabs-content-${value}`} data-value={value}>{children}</div>
  )
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => <div data-testid="skeleton" className={className} />
}));

vi.mock('./ShareDialog', () => ({
  ShareDialog: () => <div data-testid="share-dialog">Share Dialog</div>
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span data-testid="arrow-left-icon">←</span>,
  Check: () => <span data-testid="check-icon">✓</span>,
  Edit: () => <span data-testid="edit-icon">✏️</span>,
  MessageSquare: () => <span data-testid="message-square-icon">💬</span>,
  Send: () => <span data-testid="send-icon">📤</span>,
  ChevronLeft: () => <span data-testid="chevron-left-icon">‹</span>,
  ChevronRight: () => <span data-testid="chevron-right-icon">›</span>,
  Maximize: () => <span data-testid="maximize-icon">⛶</span>,
  Download: () => <span data-testid="download-icon">⬇</span>
}));

vi.mock('@/utils/formatDate', () => ({
  formatDate: (date: string) => date.split('T')[0].split('-').reverse().join('/')
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('SubmissionDetailsPage - Edit Request Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateSubmissionStatus.mockResolvedValue(true);
    mockAddCommentMutation.mutateAsync.mockResolvedValue(true);
  });

  it('should show edit request button when status is מוכנה להצגה', () => {
    render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
    
    // Check if both buttons are visible
    expect(screen.getByText('בקש עריכה')).toBeInTheDocument();
    expect(screen.getByText('אשר מנה')).toBeInTheDocument();
  });

  it('should open edit dialog when edit button is clicked', () => {
    render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
    
    const editButton = screen.getByText('בקש עריכה');
    fireEvent.click(editButton);
    
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByText('בקשת עריכה')).toBeInTheDocument();
  });

  it('should submit edit request successfully', async () => {
    render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
    
    // Open edit dialog
    const editButton = screen.getByText('בקש עריכה');
    fireEvent.click(editButton);
    
    // Fill in the textarea
    const textarea = screen.getByTestId('textarea');
    fireEvent.change(textarea, { target: { value: 'אנא שנו את הצבע לכחול' } });
    
    // Submit the request
    const submitButton = screen.getByText('שליחת בקשה');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockAddCommentMutation.mutateAsync).toHaveBeenCalledWith({
        submissionId: 'test-id',
        commentType: 'client_visible',
        commentText: 'אנא שנו את הצבע לכחול',
        visibility: 'admin'
      });
    });

    await waitFor(() => {
      expect(mockUpdateSubmissionStatus).toHaveBeenCalledWith('הערות התקבלו');
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'בקשת עריכה נשלחה',
        description: 'בקשת העריכה שלכם התקבלה ותטופל בקרוב'
      });
    });
  });

  it('should show error when edit note is empty', async () => {
    render(<SubmissionDetailsPage />, { wrapper: createWrapper() });
    
    // Open edit dialog
    const editButton = screen.getByText('בקש עריכה');
    fireEvent.click(editButton);
    
    // Submit without filling textarea
    const submitButton = screen.getByText('שליחת בקשה');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'שגיאה',
        description: 'נא להזין הערות לעריכה',
        variant: 'destructive'
      });
    });

    expect(mockAddCommentMutation.mutateAsync).not.toHaveBeenCalled();
  });
}); 