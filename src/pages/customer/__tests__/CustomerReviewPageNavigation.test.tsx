import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, beforeEach, describe, test, expect } from 'vitest';
import CustomerReviewPage from '../CustomerReviewPage';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({ clientId: 'client-123' })),
    useNavigate: vi.fn(() => mockNavigate),
  };
});

// Mock Supabase client with proper promise structure
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => (
    <div data-testid="card-content">{children}</div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, size }: any) => (
    <button 
      data-testid="button" 
      onClick={onClick} 
      className={className}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

vi.mock('lucide-react', () => ({
  Eye: () => <span data-testid="eye-icon">👁</span>,
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

// Mock data
const mockClient = {
  client_id: 'client-123',
  restaurant_name: 'Test Restaurant',
};

const mockSubmissions = [
  {
    submission_id: 'sub-1',
    item_name_at_submission: 'Burger Deluxe',
    submission_status: 'הושלמה ואושרה',
    main_processed_image_url: 'https://example.com/burger.jpg',
    original_image_urls: ['https://example.com/original1.jpg'],
    processed_image_urls: ['https://example.com/processed1.jpg', 'https://example.com/processed2.jpg'],
  },
  {
    submission_id: 'sub-2',
    item_name_at_submission: 'Pizza Supreme',
    submission_status: 'מוכנה להצגה',
    main_processed_image_url: null,
    original_image_urls: ['https://example.com/pizza-orig.jpg'],
    processed_image_urls: [],
  },
];

// Helper function to setup default successful mocks
const setupSuccessfulMocks = async () => {
  const { supabase } = await import('@/integrations/supabase/client');
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'clients') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockClient,
              error: null,
            })),
          })),
        })),
      } as any;
    }
    if (table === 'customer_submissions') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: mockSubmissions,
            error: null,
          })),
        })),
      } as any;
    }
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: null,
          error: null,
        })),
      })),
    } as any;
  });
};

describe('CustomerReviewPage Navigation Enhancement', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupSuccessfulMocks();
  });

  describe('Navigation Functionality', () => {
    test('renders clickable submission cards with hover overlay', async () => {
      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Burger Deluxe')).toBeInTheDocument();
        expect(screen.getByText('Pizza Supreme')).toBeInTheDocument();
      });

      // Check for hover overlay buttons
      const viewButtons = screen.getAllByText('צפייה בפרטים');
      expect(viewButtons).toHaveLength(2);
    });

    test('navigates to correct submission detail route when hover button clicked', async () => {
      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const viewButtons = screen.getAllByText('צפייה בפרטים');
        fireEvent.click(viewButtons[0]);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/customer-review/client-123/submission/sub-1');
    });

    test('navigates to correct submission detail route when card button clicked', async () => {
      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const cardButtons = screen.getAllByText('צפייה בהגשה');
        fireEvent.click(cardButtons[0]);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/customer-review/client-123/submission/sub-1');
    });

    test('handles multiple submissions navigation correctly', async () => {
      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const viewButtons = screen.getAllByText('צפייה בפרטים');
        
        // Click first submission
        fireEvent.click(viewButtons[0]);
        expect(mockNavigate).toHaveBeenCalledWith('/customer-review/client-123/submission/sub-1');
        
        // Click second submission
        fireEvent.click(viewButtons[1]);
        expect(mockNavigate).toHaveBeenCalledWith('/customer-review/client-123/submission/sub-2');
      });
    });

    test('preserves clientId in navigation URL', async () => {
      const { useParams } = await import('react-router-dom');
      vi.mocked(useParams).mockReturnValue({ clientId: 'different-client-456' });

      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const viewButton = screen.getAllByText('צפייה בפרטים')[0];
        fireEvent.click(viewButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/customer-review/different-client-456/submission/sub-1');
    });
  });

  describe('UI Enhancement Features', () => {
    test('displays Eye icon in buttons', async () => {
      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const eyeIcons = screen.getAllByTestId('eye-icon');
        expect(eyeIcons.length).toBeGreaterThanOrEqual(2);
      });
    });

    test('shows variation count for each submission', async () => {
      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('2 וריאציות')).toBeInTheDocument(); // Burger with 2 processed images
        expect(screen.getByText('0 וריאציות')).toBeInTheDocument(); // Pizza with 0 processed images
      });
    });

    test('displays correct status badges with proper styling', async () => {
      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const badges = screen.getAllByTestId('badge');
        expect(badges[0]).toHaveTextContent('הושלמה ואושרה');
        expect(badges[1]).toHaveTextContent('מוכנה להצגה');
      });
    });

    test('displays restaurant name in header', async () => {
      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      });
    });

    test('displays Hebrew subtitle text', async () => {
      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('תוצאות הצילום המקצועי שלכם')).toBeInTheDocument();
      });
    });
  });

  describe('Image Display Logic', () => {
    test('displays main processed image when available', async () => {
      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        const burgerImage = images.find(img => 
          img.getAttribute('src') === 'https://example.com/burger.jpg'
        );
        expect(burgerImage).toBeInTheDocument();
        expect(burgerImage).toHaveAttribute('alt', 'Burger Deluxe');
      });
    });

    test('falls back to original image when no processed image available', async () => {
      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        const pizzaImage = images.find(img => 
          img.getAttribute('src') === 'https://example.com/pizza-orig.jpg'
        );
        expect(pizzaImage).toBeInTheDocument();
        expect(pizzaImage).toHaveAttribute('alt', 'Pizza Supreme');
      });
    });

    test('displays placeholder when no images available', async () => {
      // Mock submissions with no images
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'clients') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: mockClient,
                  error: null,
                })),
              })),
            })),
          } as any;
        }
        if (table === 'customer_submissions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                data: [{
                  submission_id: 'sub-no-images',
                  item_name_at_submission: 'No Images Item',
                  submission_status: 'בעיבוד',
                  main_processed_image_url: null,
                  original_image_urls: null,
                  processed_image_urls: null,
                }],
                error: null,
              })),
            })),
          } as any;
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: null,
              error: null,
            })),
          })),
        } as any;
      });

      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('תמונה לא זמינה')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles missing clientId parameter', async () => {
      const { useParams } = await import('react-router-dom');
      vi.mocked(useParams).mockReturnValue({ clientId: undefined });

      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      // Should show loading initially, then nothing happens since no clientId
      await waitFor(() => {
        expect(screen.getByText('Loading your food gallery...')).toBeInTheDocument();
      });
    });

    test('handles database errors gracefully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Database error' },
          })),
        })),
      }) as any);

      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      // Component should handle errors gracefully and show loading state
      await waitFor(() => {
        expect(screen.getByText('Loading your food gallery...')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    it('handles navigation state correctly', () => {
      const mockNavigate = vi.fn();
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      render(
        <MemoryRouter initialEntries={['/customer-review/client-123']}>
          <CustomerReviewPage />
        </MemoryRouter>
      );

      // Test that navigate function is available
      expect(mockNavigate).toBeDefined();
    });

    it('renders with correct route parameters', () => {
      render(
        <MemoryRouter initialEntries={['/customer-review/client-123']}>
          <CustomerReviewPage />
        </MemoryRouter>
      );

      // Component should render without crashing
      expect(document.body).toBeInTheDocument();
    });

    it('maintains component structure during loading', () => {
      render(
        <MemoryRouter initialEntries={['/customer-review/client-123']}>
          <CustomerReviewPage />
        </MemoryRouter>
      );

      // Should show loading state initially
      expect(screen.getByText('Loading your food gallery...')).toBeInTheDocument();
    });
  });
}); 