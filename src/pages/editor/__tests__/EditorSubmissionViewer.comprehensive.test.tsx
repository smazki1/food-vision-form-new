import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import EditorSubmissionViewer from '../EditorSubmissionViewer';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn()
    }
  }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ submissionId: 'test-submission-id' })
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, disabled, ...props }: any) => (
    <button 
      data-testid="button" 
      onClick={onClick} 
      data-variant={variant}
      data-size={size}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span data-testid="badge" className={className}>{children}</span>
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, placeholder, ...props }: any) => (
    <textarea 
      data-testid="textarea" 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
      {...props} 
    />
  )
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange?.('בעיבוד')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <div data-testid="select-value">{placeholder}</div>
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => <div data-testid="alert" data-variant={variant}>{children}</div>,
  AlertDescription: ({ children }: any) => <div data-testid="alert-description">{children}</div>
}));

// Test data
const mockSubmission = {
  submission_id: 'test-submission-id',
  item_name_at_submission: 'Test Burger',
  submission_status: 'ממתינה לעיבוד',
  uploaded_at: '2024-01-01T10:00:00Z',
  original_image_urls: ['https://example.com/original1.jpg', 'https://example.com/original2.jpg'],
  processed_image_urls: ['https://example.com/processed1.jpg']
};

const mockComments = [
  {
    id: '1',
    comment_text: 'Test comment',
    comment_type: 'editor_note' as const,
    created_at: '2024-01-01T10:00:00Z'
  }
];

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/editor/submissions/test-submission-id']}>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('EditorSubmissionViewer - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Happy Path Tests', () => {
    it('should render submission details successfully', async () => {
      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSubmission,
              error: null
            })
          })
        })
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockComments,
              error: null
            })
          })
        });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      renderWithProviders(<EditorSubmissionViewer />);

      await waitFor(() => {
        expect(screen.queryByText('Loading submission...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Test Burger')).toBeInTheDocument();
      expect(screen.getAllByText('Pending Processing')[0]).toBeInTheDocument();
    });

    it('should display images with navigation counters', async () => {
      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSubmission,
              error: null
            })
          })
        })
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockComments,
              error: null
            })
          })
        });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      renderWithProviders(<EditorSubmissionViewer />);

      await waitFor(() => {
        expect(screen.queryByText('Loading submission...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Test Burger')).toBeInTheDocument();
      expect(screen.getAllByText('Pending Processing')[0]).toBeInTheDocument();

      // Check for image counters (text is split across elements, so we check the parent element)
      expect(screen.getAllByText((content, element) => {
        return element?.textContent?.trim() === '1 / 2';
      })[0]).toBeInTheDocument(); // Original images counter

      // Check that images are displayed
      expect(screen.getByAltText('Original')).toBeInTheDocument();
      expect(screen.getByAltText('Processed')).toBeInTheDocument();
    });

    it('should allow adding notes', async () => {
      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSubmission,
              error: null
            })
          })
        })
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockComments,
              error: null
            })
          })
        });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      renderWithProviders(<EditorSubmissionViewer />);

      await waitFor(() => {
        expect(screen.queryByText('Loading submission...')).not.toBeInTheDocument();
      });

      // Check that notes UI elements exist
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toBeInTheDocument();
      
      const addButton = screen.getByText('Add Note');
      expect(addButton).toBeInTheDocument();
      expect(addButton).toBeDisabled(); // Initially disabled when no text
      
      // Check existing comment is displayed
      expect(screen.getByText('Test comment')).toBeInTheDocument();
    });

    it('should navigate back to dashboard', async () => {
      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSubmission,
              error: null
            })
          })
        })
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockComments,
              error: null
            })
          })
        });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      renderWithProviders(<EditorSubmissionViewer />);

      await waitFor(() => {
        expect(screen.queryByText('Loading submission...')).not.toBeInTheDocument();
      });

      const backButton = screen.getByText('Back to Dashboard');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/editor');
    });
  });

  describe('Edge Cases', () => {
    it('should handle submissions without images', async () => {
      const submissionWithoutImages = {
        ...mockSubmission,
        original_image_urls: [],
        processed_image_urls: []
      };

      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: submissionWithoutImages,
              error: null
            })
          })
        })
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      renderWithProviders(<EditorSubmissionViewer />);

      await waitFor(() => {
        expect(screen.queryByText('Loading submission...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Test Burger')).toBeInTheDocument();
      // Should not show image counters when no images
      expect(screen.queryByText('1 / 2')).not.toBeInTheDocument();
    });

    it('should handle null image arrays', async () => {
      const submissionWithNullImages = {
        ...mockSubmission,
        original_image_urls: null,
        processed_image_urls: null
      };

      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: submissionWithNullImages,
              error: null
            })
          })
        })
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      renderWithProviders(<EditorSubmissionViewer />);

      await waitFor(() => {
        expect(screen.queryByText('Loading submission...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Test Burger')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle submission not found', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(new Error('Submission not found'))
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      renderWithProviders(<EditorSubmissionViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
      });
    });

    it('should handle database errors', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      renderWithProviders(<EditorSubmissionViewer />);

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockImplementation(() => 
            new Promise(resolve => setTimeout(() => resolve({ data: mockSubmission, error: null }), 100))
          )
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      renderWithProviders(<EditorSubmissionViewer />);

      expect(screen.getByText('Loading submission...')).toBeInTheDocument();
    });
  });
}); 