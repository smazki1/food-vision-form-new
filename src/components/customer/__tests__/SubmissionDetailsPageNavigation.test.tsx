import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, beforeEach, describe, test, expect } from 'vitest';
import { SubmissionDetailsPage } from '../SubmissionDetailsPage';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({ 
      submissionId: 'sub-123',
      clientId: 'client-456'
    })),
    Link: ({ children, to }: any) => (
      <a href={to} data-testid="link" data-to={to}>{children}</a>
    ),
  };
});

// Mock hooks
vi.mock('@/hooks/useSubmission', () => ({
  useSubmission: vi.fn(() => ({
    submission: {
      submission_id: 'sub-123',
      item_name_at_submission: 'Test Burger',
      submission_status: 'מוכנה להצגה',
      uploaded_at: '2024-01-01T10:00:00Z',
      original_image_urls: ['https://example.com/original1.jpg'],
      processed_image_urls: ['https://example.com/processed1.jpg'],
      main_processed_image_url: 'https://example.com/processed1.jpg',
    },
    loading: false,
    error: null,
    requestEdit: vi.fn(),
    updateSubmissionStatus: vi.fn(),
    setMainProcessedImage: vi.fn(),
  })),
}));

vi.mock('@/hooks/useMessages', () => ({
  useMessages: vi.fn(() => ({
    messages: [],
    loading: false,
    sendMessage: vi.fn(),
  })),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardFooter: ({ children }: any) => <div data-testid="card-footer">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, ...props }: any) => {
    if (asChild) {
      return <div data-testid="button-wrapper">{children}</div>;
    }
    return <button data-testid="button" {...props}>{children}</button>;
  },
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div data-testid="tabs">{children}</div>,
  TabsContent: ({ children }: any) => <div data-testid="tabs-content">{children}</div>,
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children }: any) => <button data-testid="tabs-trigger">{children}</button>,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea data-testid="textarea" {...props} />,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogTrigger: ({ children }: any) => <div data-testid="dialog-trigger">{children}</div>,
}));

vi.mock('@/components/ui/carousel', () => ({
  Carousel: ({ children }: any) => <div data-testid="carousel">{children}</div>,
  CarouselContent: ({ children }: any) => <div data-testid="carousel-content">{children}</div>,
  CarouselItem: ({ children }: any) => <div data-testid="carousel-item">{children}</div>,
  CarouselNext: () => <button data-testid="carousel-next">Next</button>,
  CarouselPrevious: () => <button data-testid="carousel-previous">Previous</button>,
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => <div data-testid="skeleton" className={className} />,
}));

vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span data-testid="arrow-left-icon">←</span>,
  Check: () => <span data-testid="check-icon">✓</span>,
  Download: () => <span data-testid="download-icon">⬇</span>,
  Edit: () => <span data-testid="edit-icon">✎</span>,
  MessageSquare: () => <span data-testid="message-icon">💬</span>,
  Send: () => <span data-testid="send-icon">📤</span>,
  Share2: () => <span data-testid="share-icon">🔗</span>,
  Facebook: () => <span data-testid="facebook-icon">📘</span>,
  Instagram: () => <span data-testid="instagram-icon">📷</span>,
  Mail: () => <span data-testid="mail-icon">📧</span>,
  Link: () => <span data-testid="link-icon">🔗</span>,
  Maximize: () => <span data-testid="maximize-icon">⛶</span>,
}));

vi.mock('./ShareDialog', () => ({
  ShareDialog: ({ children }: any) => <div data-testid="share-dialog">{children}</div>,
}));

vi.mock('./OriginalImagesCustomerTab', () => ({
  default: ({ submission }: any) => (
    <div data-testid="original-images-tab">
      Original images for {submission?.item_name_at_submission}
    </div>
  ),
}));

vi.mock('@/utils/formatDate', () => ({
  formatDate: vi.fn((date: string) => '01/01/2024'),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('SubmissionDetailsPage Navigation Enhancement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Back Button Navigation', () => {
    test('displays correct back button text when clientId is present', async () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('חזרה לגלריה')).toBeInTheDocument();
      });
    });

    test('navigates to customer review page when clientId is present', async () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const backLink = screen.getByTestId('link');
        expect(backLink).toHaveAttribute('data-to', '/customer-review/client-456');
      });
    });

    test('displays correct back button text when clientId is not present', async () => {
      const { useParams } = await import('react-router-dom');
      vi.mocked(useParams).mockReturnValue({ 
        submissionId: 'sub-123',
        clientId: undefined 
      });

      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('חזרה לרשימת ההגשות')).toBeInTheDocument();
      });
    });

    test('navigates to customer submissions page when clientId is not present', async () => {
      const { useParams } = await import('react-router-dom');
      vi.mocked(useParams).mockReturnValue({ 
        submissionId: 'sub-123',
        clientId: undefined 
      });

      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const backLink = screen.getByTestId('link');
        expect(backLink).toHaveAttribute('data-to', '/customer/submissions');
      });
    });

    test('displays arrow left icon in back button', async () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Submission Details Display', () => {
    test('displays submission title and status', async () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Burger')).toBeInTheDocument();
        expect(screen.getByText('מוכנה להצגה')).toBeInTheDocument();
      });
    });

    test('displays formatted upload date', async () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('הועלה בתאריך: 01/01/2024')).toBeInTheDocument();
      });
    });

    test('displays status badge', async () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const badge = screen.getByTestId('badge');
        expect(badge).toHaveTextContent('מוכנה להצגה');
      });
    });
  });

  describe('Action Buttons Visibility', () => {
    test('displays edit request button when status allows editing', async () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('בקש עריכה')).toBeInTheDocument();
        expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
      });
    });

    test('displays approve button when status allows approval', async () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('אשר מנה')).toBeInTheDocument();
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      });
    });

    test('hides action buttons when status does not allow them', async () => {
      const { useSubmission } = await import('@/hooks/useSubmission');
      vi.mocked(useSubmission).mockReturnValue({
        submission: {
          submission_id: 'sub-123',
          item_name_at_submission: 'Test Burger',
          submission_status: 'בעיבוד',
          uploaded_at: '2024-01-01T10:00:00Z',
          original_image_urls: ['https://example.com/original1.jpg'],
          processed_image_urls: ['https://example.com/processed1.jpg'],
          main_processed_image_url: 'https://example.com/processed1.jpg',
        },
        loading: false,
        error: null,
        requestEdit: vi.fn(),
        updateSubmissionStatus: vi.fn(),
        setMainProcessedImage: vi.fn(),
      });

      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByText('בקש עריכה')).not.toBeInTheDocument();
        expect(screen.queryByText('אשר מנה')).not.toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    test('displays all tab triggers', async () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('תמונות')).toBeInTheDocument();
        expect(screen.getByText('תמונות מקוריות')).toBeInTheDocument();
        expect(screen.getByText('היסטוריית עריכות')).toBeInTheDocument();
        expect(screen.getByText('תקשורת')).toBeInTheDocument();
      });
    });

    test('displays processed images tab content', async () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
        expect(screen.getByText('צפו בתמונות המעובדות של המנה')).toBeInTheDocument();
      });
    });

    test('displays original images tab component', async () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('original-images-tab')).toBeInTheDocument();
        expect(screen.getByText('Original images for Test Burger')).toBeInTheDocument();
      });
    });
  });

  describe('Image Display and Actions', () => {
    test('displays main processed image when available', async () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images[0]).toHaveAttribute('src', 'https://example.com/processed1.jpg');
        expect(images[0]).toHaveAttribute('alt', 'Test Burger - תמונה ראשית');
      });
    });

    test('displays image action buttons', async () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('maximize-icon')).toBeInTheDocument();
      });
    });

    test('displays carousel for multiple images', async () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('carousel')).toBeInTheDocument();
        expect(screen.getByText('כל התמונות (1)')).toBeInTheDocument();
      });
    });
  });

  describe('Loading and Error States', () => {
    test('displays loading skeleton when submission is loading', async () => {
      const { useSubmission } = await import('@/hooks/useSubmission');
      vi.mocked(useSubmission).mockReturnValue({
        submission: null,
        loading: true,
        error: null,
        requestEdit: vi.fn(),
        updateSubmissionStatus: vi.fn(),
        setMainProcessedImage: vi.fn(),
      });

      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      expect(screen.getAllByTestId('skeleton')).toHaveLength(3);
    });

    test('displays error state when submission fails to load', async () => {
      const { useSubmission } = await import('@/hooks/useSubmission');
      vi.mocked(useSubmission).mockReturnValue({
        submission: null,
        loading: false,
        error: 'Failed to load submission',
        requestEdit: vi.fn(),
        updateSubmissionStatus: vi.fn(),
        setMainProcessedImage: vi.fn(),
      });

      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('שגיאה בטעינת פרטי הגשה')).toBeInTheDocument();
        expect(screen.getByText('אירעה שגיאה בעת טעינת פרטי ההגשה. אנא נסו שוב מאוחר יותר.')).toBeInTheDocument();
      });
    });

    test('displays back button in error state', async () => {
      const { useSubmission } = await import('@/hooks/useSubmission');
      vi.mocked(useSubmission).mockReturnValue({
        submission: null,
        loading: false,
        error: 'Failed to load submission',
        requestEdit: vi.fn(),
        updateSubmissionStatus: vi.fn(),
        setMainProcessedImage: vi.fn(),
      });

      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('חזרה לרשימת ההגשות')).toBeInTheDocument();
      });
    });
  });

  describe('Route Parameter Handling', () => {
    test('handles different clientId values correctly', async () => {
      const { useParams } = await import('react-router-dom');
      vi.mocked(useParams).mockReturnValue({ 
        submissionId: 'sub-123',
        clientId: 'different-client-789' 
      });

      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const backLink = screen.getByTestId('link');
        expect(backLink).toHaveAttribute('data-to', '/customer-review/different-client-789');
      });
    });

    test('handles missing submissionId parameter', async () => {
      const { useParams } = await import('react-router-dom');
      vi.mocked(useParams).mockReturnValue({ 
        submissionId: undefined,
        clientId: 'client-456' 
      });

      const { useSubmission } = await import('@/hooks/useSubmission');
      vi.mocked(useSubmission).mockReturnValue({
        submission: null,
        loading: false,
        error: 'No submission ID provided',
        requestEdit: vi.fn(),
        updateSubmissionStatus: vi.fn(),
        setMainProcessedImage: vi.fn(),
      });

      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('שגיאה בטעינת פרטי הגשה')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    test('complete navigation flow from customer review page', async () => {
      const { useParams } = await import('react-router-dom');
      vi.mocked(useParams).mockReturnValue({ 
        submissionId: 'sub-123',
        clientId: 'client-456' 
      });

      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Burger')).toBeInTheDocument();
        expect(screen.getByText('חזרה לגלריה')).toBeInTheDocument();
        
        const backLink = screen.getByTestId('link');
        expect(backLink).toHaveAttribute('data-to', '/customer-review/client-456');
        
        expect(screen.getByText('מוכנה להצגה')).toBeInTheDocument();
        expect(screen.getByText('הועלה בתאריך: 01/01/2024')).toBeInTheDocument();
      });
    });

    test('complete navigation flow from customer submissions page', async () => {
      const { useParams } = await import('react-router-dom');
      vi.mocked(useParams).mockReturnValue({ 
        submissionId: 'sub-123',
        clientId: undefined 
      });

      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Burger')).toBeInTheDocument();
        expect(screen.getByText('חזרה לרשימת ההגשות')).toBeInTheDocument();
        
        const backLink = screen.getByTestId('link');
        expect(backLink).toHaveAttribute('data-to', '/customer/submissions');
      });
    });

    test('Hebrew language support throughout component', async () => {
      render(
        <TestWrapper>
          <SubmissionDetailsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('חזרה לגלריה')).toBeInTheDocument();
        expect(screen.getByText('מוכנה להצגה')).toBeInTheDocument();
        expect(screen.getByText('הועלה בתאריך:')).toBeInTheDocument();
        expect(screen.getByText('בקש עריכה')).toBeInTheDocument();
        expect(screen.getByText('אשר מנה')).toBeInTheDocument();
        expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
        expect(screen.getByText('צפו בתמונות המעובדות של המנה')).toBeInTheDocument();
      });
    });
  });
}); 