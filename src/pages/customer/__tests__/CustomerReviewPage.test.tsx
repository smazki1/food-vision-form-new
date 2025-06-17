import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, beforeEach, describe, test, expect } from 'vitest';
import CustomerReviewPage from '../CustomerReviewPage';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({ clientId: 'client-123' })),
  };
});

// Mock Supabase client with simple implementation
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              client_id: 'client-123',
              restaurant_name: 'Test Restaurant',
            },
            error: null,
          })),
        })),
      })),
    })),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

describe('CustomerReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    test('renders loading state initially', () => {
      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      expect(screen.getByText('Loading your food gallery...')).toBeInTheDocument();
    });

    test('renders page title and description', async () => {
      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
        expect(screen.getByText('תוצאות הצילום המקצועי שלכם')).toBeInTheDocument();
      });
    });

    test('displays restaurant name when available', async () => {
      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles missing clientId parameter', async () => {
      const { useParams } = await import('react-router-dom');
      vi.mocked(useParams).mockReturnValueOnce({ clientId: undefined });

      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      // Component should still render but not fetch data
      await waitFor(() => {
        expect(screen.getByText('Loading your food gallery...')).toBeInTheDocument();
      });
    });

    test('handles client not found', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: null,
            })),
          })),
        })),
      } as any);

      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Restaurant Not Found')).toBeInTheDocument();
        expect(screen.getByText('The requested restaurant gallery could not be found.')).toBeInTheDocument();
      });
    });

    test('handles network errors gracefully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.reject(new Error('Network error'))),
          })),
        })),
      } as any);

      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Restaurant Not Found')).toBeInTheDocument();
      });
    });
  });

  describe('Submissions Display', () => {
    test('shows empty state when no submissions', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock client fetch success
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                client_id: 'client-123',
                restaurant_name: 'Test Restaurant',
              },
              error: null,
            })),
          })),
        })),
      } as any);

      // Mock submissions fetch returning empty array
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: [],
            error: null,
          })),
        })),
      } as any);

      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('עדיין אין הגשות')).toBeInTheDocument();
        expect(screen.getByText('התמונות המעובדות שלכם יופיעו כאן בקרוב')).toBeInTheDocument();
      });
    });

    test('displays submissions when available', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockSubmissions = [
        {
          submission_id: 'sub-1',
          item_name_at_submission: 'Burger',
          submission_status: 'הושלמה ואושרה',
          main_processed_image_url: 'https://example.com/processed1.jpg',
          processed_image_urls: ['https://example.com/processed1.jpg'],
          original_image_urls: null,
        },
      ];

      // Mock client fetch
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                client_id: 'client-123',
                restaurant_name: 'Test Restaurant',
              },
              error: null,
            })),
          })),
        })),
      } as any);

      // Mock submissions fetch
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: mockSubmissions,
            error: null,
          })),
        })),
      } as any);

      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Burger')).toBeInTheDocument();
        expect(screen.getByText('הושלמה ואושרה')).toBeInTheDocument();
        expect(screen.getByText('1 וריאציות')).toBeInTheDocument();
      });
    });

    test('handles submissions without images', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const submissionsWithoutImages = [
        {
          submission_id: 'sub-1',
          item_name_at_submission: 'No Image Item',
          submission_status: 'ממתינה לעיבוד',
          main_processed_image_url: null,
          original_image_urls: null,
          processed_image_urls: null,
        },
      ];

      // Mock client fetch
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                client_id: 'client-123',
                restaurant_name: 'Test Restaurant',
              },
              error: null,
            })),
          })),
        })),
      } as any);

      // Mock submissions fetch
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: submissionsWithoutImages,
            error: null,
          })),
        })),
      } as any);

      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No Image Item')).toBeInTheDocument();
        expect(screen.getByText('תמונה לא זמינה')).toBeInTheDocument();
        expect(screen.getByText('0 וריאציות')).toBeInTheDocument();
      });
    });

    test('displays fallback image when main processed image is null but original exists', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const submissionsWithOriginalOnly = [
        {
          submission_id: 'sub-1',
          item_name_at_submission: 'Original Only Item',
          submission_status: 'בעיבוד',
          main_processed_image_url: null,
          original_image_urls: ['https://example.com/original1.jpg'],
          processed_image_urls: null,
        },
      ];

      // Mock client fetch
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                client_id: 'client-123',
                restaurant_name: 'Test Restaurant',
              },
              error: null,
            })),
          })),
        })),
      } as any);

      // Mock submissions fetch
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: submissionsWithOriginalOnly,
            error: null,
          })),
        })),
      } as any);

      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Original Only Item')).toBeInTheDocument();
        expect(screen.getByText('בעיבוד')).toBeInTheDocument();
        const image = screen.getByAltText('Original Only Item');
        expect(image).toHaveAttribute('src', 'https://example.com/original1.jpg');
      });
    });
  });

  describe('UI Components', () => {
    test('renders responsive grid layout', async () => {
      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const gridContainer = screen.getByText('Test Restaurant').closest('main')?.querySelector('.grid');
        expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
      });
    });

    test('applies RTL direction to main container', async () => {
      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const mainContainer = screen.getByText('Test Restaurant').closest('[dir="rtl"]');
        expect(mainContainer).toBeInTheDocument();
      });
    });

    test('displays proper Hebrew text content', async () => {
      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('תוצאות הצילום המקצועי שלכם')).toBeInTheDocument();
      });
    });

    test('displays status badges with correct styling', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockSubmissions = [
        {
          submission_id: 'sub-1',
          item_name_at_submission: 'Completed Item',
          submission_status: 'הושלמה ואושרה',
          main_processed_image_url: 'https://example.com/processed1.jpg',
          processed_image_urls: ['https://example.com/processed1.jpg'],
          original_image_urls: null,
        },
        {
          submission_id: 'sub-2',
          item_name_at_submission: 'Processing Item',
          submission_status: 'בעיבוד',
          main_processed_image_url: null,
          processed_image_urls: null,
          original_image_urls: ['https://example.com/original1.jpg'],
        },
      ];

      // Mock client fetch
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                client_id: 'client-123',
                restaurant_name: 'Test Restaurant',
              },
              error: null,
            })),
          })),
        })),
      } as any);

      // Mock submissions fetch
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: mockSubmissions,
            error: null,
          })),
        })),
      } as any);

      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const completedBadge = screen.getByText('הושלמה ואושרה');
        const processingBadge = screen.getByText('בעיבוד');
        
        expect(completedBadge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
        expect(processingBadge).toHaveClass('bg-blue-100', 'text-blue-800', 'border-blue-200');
      });
    });
  });

  describe('Integration Tests', () => {
    test('makes correct database queries', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('clients');
        expect(supabase.from).toHaveBeenCalledWith('customer_submissions');
      });
    });

    test('handles different client ID formats', async () => {
      const { useParams } = await import('react-router-dom');
      vi.mocked(useParams).mockReturnValueOnce({ clientId: 'different-client-456' });

      const { supabase } = await import('@/integrations/supabase/client');
      
      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        // Verify the component handles different client IDs
        expect(supabase.from).toHaveBeenCalled();
      });
    });

    test('displays fallback name when restaurant name is missing', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock client fetch with null restaurant name
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                client_id: 'client-123',
                restaurant_name: null,
              },
              error: null,
            })),
          })),
        })),
      } as any);

      // Mock submissions fetch
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: [],
            error: null,
          })),
        })),
      } as any);

      render(
        <TestWrapper>
          <CustomerReviewPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Food Gallery')).toBeInTheDocument();
      });
    });
  });
}); 
