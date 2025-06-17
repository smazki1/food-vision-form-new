import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, beforeEach, describe, test, expect } from 'vitest';
import CustomerReviewPageTab from '../CustomerReviewPageTab';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock hooks with simple implementations
vi.mock('@/hooks/useClients', () => ({
  useClients: vi.fn(() => ({
    clients: [
      {
        client_id: 'client-123',
        restaurant_name: 'Test Restaurant',
        contact_name: 'John Doe',
        email: 'test@restaurant.com',
      },
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    refreshClients: vi.fn(),
  })),
}));

vi.mock('@/hooks/useClientSubmissions', () => ({
  useClientSubmissions: vi.fn(() => ({
    data: [
      {
        submission_id: 'sub-1',
        item_name_at_submission: 'Burger',
        submission_status: 'הושלמה ואושרה',
        main_processed_image_url: 'https://example.com/processed1.jpg',
        original_image_urls: ['https://example.com/original1.jpg'],
        processed_image_urls: ['https://example.com/processed1.jpg', 'https://example.com/processed2.jpg'],
      },
    ],
    isLoading: false,
    error: null,
    isError: false,
    isPending: false,
    isSuccess: true,
    refetch: vi.fn(),
  })),
}));

// Mock window.open
Object.defineProperty(window, 'open', {
  value: vi.fn(),
  writable: true,
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
  },
  writable: true,
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('CustomerReviewPageTab', () => {
  const defaultProps = {
    clientId: 'client-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    test('renders component with basic elements', () => {
      render(
        <TestWrapper>
          <CustomerReviewPageTab {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('עמוד ביקורת ללקוח')).toBeInTheDocument();
      expect(screen.getByText('גלריית Test Restaurant')).toBeInTheDocument();
      expect(screen.getByText('פתח בחלון חדש')).toBeInTheDocument();
      expect(screen.getByText('העתק קישור ללקוח')).toBeInTheDocument();
    });

    test('displays restaurant name in preview', () => {
      render(
        <TestWrapper>
          <CustomerReviewPageTab {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('גלריית Test Restaurant')).toBeInTheDocument();
    });

    test('displays submissions in preview section', () => {
      render(
        <TestWrapper>
          <CustomerReviewPageTab {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Burger')).toBeInTheDocument();
      expect(screen.getByText('הושלמה ואושרה')).toBeInTheDocument();
    });

    test('opens new tab with correct URL', () => {
      const mockWindowOpen = vi.mocked(window.open);

      render(
        <TestWrapper>
          <CustomerReviewPageTab {...defaultProps} />
        </TestWrapper>
      );

      const openButton = screen.getByText('פתח בחלון חדש');
      fireEvent.click(openButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('/customer-review/client-123'),
        '_blank'
      );
    });

    test('displays variation counts correctly', () => {
      render(
        <TestWrapper>
          <CustomerReviewPageTab {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('2 וריאציות')).toBeInTheDocument();
    });
  });

  describe('Clipboard Functionality', () => {
    test('copies link successfully with modern clipboard API', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      });

      const { toast } = await import('sonner');

      render(
        <TestWrapper>
          <CustomerReviewPageTab {...defaultProps} />
        </TestWrapper>
      );

      const copyButton = screen.getByText('העתק קישור ללקוח');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          expect.stringContaining('/customer-review/client-123')
        );
        expect(toast.success).toHaveBeenCalledWith('קישור הועתק ללוח');
      });
    });

    test('shows error message when clipboard fails', async () => {
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard failed'));
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      });

      const { toast } = await import('sonner');

      render(
        <TestWrapper>
          <CustomerReviewPageTab {...defaultProps} />
        </TestWrapper>
      );

      const copyButton = screen.getByText('העתק קישור ללקוח');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('לא ניתן להעתיק אוטומטית. קישור: http://localhost:3000/customer-review/client-123');
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading state when submissions are loading', async () => {
      const { useClientSubmissions } = await import('@/hooks/useClientSubmissions');
      vi.mocked(useClientSubmissions).mockReturnValueOnce({
        data: null,
        isLoading: true,
        error: null,
        isError: false,
        isPending: true,
        isSuccess: false,
        refetch: vi.fn(),
      } as any);

      render(
        <TestWrapper>
          <CustomerReviewPageTab clientId="client-123" />
        </TestWrapper>
      );

      expect(screen.getByText('טוען עמוד ביקורת ללקוח...')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles client not found', async () => {
      const { useClients } = await import('@/hooks/useClients');
      vi.mocked(useClients).mockReturnValueOnce({
        clients: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        refreshClients: vi.fn(),
      } as any);

      render(
        <TestWrapper>
          <CustomerReviewPageTab clientId="non-existent-client" />
        </TestWrapper>
      );

      expect(screen.getByText('גלריית המסעדה')).toBeInTheDocument(); // Fallback name
    });

    test('handles empty submissions list', async () => {
      const { useClientSubmissions } = await import('@/hooks/useClientSubmissions');
      vi.mocked(useClientSubmissions).mockReturnValueOnce({
        data: [],
        isLoading: false,
        error: null,
        isError: false,
        isPending: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      render(
        <TestWrapper>
          <CustomerReviewPageTab clientId="client-123" />
        </TestWrapper>
      );

      expect(screen.getByText('עדיין אין הגשות')).toBeInTheDocument();
    });

    test('handles null submissions data', async () => {
      const { useClientSubmissions } = await import('@/hooks/useClientSubmissions');
      vi.mocked(useClientSubmissions).mockReturnValueOnce({
        data: null,
        isLoading: false,
        error: null,
        isError: false,
        isPending: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      render(
        <TestWrapper>
          <CustomerReviewPageTab clientId="client-123" />
        </TestWrapper>
      );

      expect(screen.getByText('עדיין אין הגשות')).toBeInTheDocument();
    });

    test('handles submissions without images', async () => {
      const { useClientSubmissions } = await import('@/hooks/useClientSubmissions');
      vi.mocked(useClientSubmissions).mockReturnValueOnce({
        data: [
          {
            submission_id: 'sub-3',
            item_name_at_submission: 'No Image Item',
            submission_status: 'ממתינה לעיבוד',
            main_processed_image_url: null,
            original_image_urls: null,
            processed_image_urls: null,
          },
        ],
        isLoading: false,
        error: null,
        isError: false,
        isPending: false,
        isSuccess: true,
        refetch: vi.fn(),
      } as any);

      render(
        <TestWrapper>
          <CustomerReviewPageTab clientId="client-123" />
        </TestWrapper>
      );

      expect(screen.getByText('No Image Item')).toBeInTheDocument();
      expect(screen.getByText('אין תמונה')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles submissions loading error gracefully', async () => {
      const { useClientSubmissions } = await import('@/hooks/useClientSubmissions');
      vi.mocked(useClientSubmissions).mockReturnValueOnce({
        data: null,
        isLoading: false,
        error: new Error('Failed to load submissions'),
        isError: true,
        isPending: false,
        isSuccess: false,
        refetch: vi.fn(),
      } as any);

      render(
        <TestWrapper>
          <CustomerReviewPageTab clientId="client-123" />
        </TestWrapper>
      );

      // Component should still render but show empty state
      expect(screen.getByText('עדיין אין הגשות')).toBeInTheDocument();
    });

    test('handles missing clientId prop', () => {
      render(
        <TestWrapper>
          <CustomerReviewPageTab clientId="" />
        </TestWrapper>
      );

      // Should still render with fallback content
      expect(screen.getByText('עמוד ביקורת ללקוח')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    test('component integrates correctly with hooks', () => {
      render(
        <TestWrapper>
          <CustomerReviewPageTab {...defaultProps} />
        </TestWrapper>
      );

      // Verify component renders without errors
      expect(screen.getByText('עמוד ביקורת ללקוח')).toBeInTheDocument();
      expect(screen.getByText('גלריית Test Restaurant')).toBeInTheDocument();
    });

    test('URL generation is correct for different environments', () => {
      const originalOrigin = window.location.origin;
      Object.defineProperty(window, 'location', {
        value: { origin: 'https://test-domain.com' },
        writable: true,
      });

      const mockWindowOpen = vi.mocked(window.open);

      render(
        <TestWrapper>
          <CustomerReviewPageTab {...defaultProps} />
        </TestWrapper>
      );

      const openButton = screen.getByText('פתח בחלון חדש');
      fireEvent.click(openButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://test-domain.com/customer-review/client-123',
        '_blank'
      );

      // Restore original origin
      Object.defineProperty(window, 'location', {
        value: { origin: originalOrigin },
        writable: true,
      });
    });
  });
}); 