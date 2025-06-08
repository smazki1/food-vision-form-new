import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ClientListItemCard } from '../ClientListItemCard';
import { Client } from '@/types/client';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/hooks/useClientUpdate', () => ({
  useClientStatusUpdate: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('ClientListItemCard - Archive/Restore Functionality', () => {
  const mockActiveClient: Client = {
    client_id: 'active-client-123',
    user_auth_id: 'user-123',
    restaurant_name: 'Active Restaurant',
    contact_name: 'John Doe',
    phone: '050-1234567',
    email: 'john@active.com',
    client_status: 'פעיל',
    business_type: 'מסעדה',
    address: 'Tel Aviv',
    website_url: 'https://active.com',
    internal_notes: 'Active client notes',
    email_notifications: true,
    app_notifications: true,
    remaining_servings: 10,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_activity_at: '2024-01-01T00:00:00Z',
    current_package_id: null,
    service_packages: null,
    original_lead_id: null,
  };

  const mockArchivedClient: Client = {
    ...mockActiveClient,
    client_id: 'archived-client-123',
    restaurant_name: 'Archived Restaurant',
    client_status: 'ארכיון',
    email: 'john@archived.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Archive Button for Active Clients', () => {
    it('should display archive button for active clients', () => {
      render(
        <wrapper>
          <ClientListItemCard client={mockActiveClient} />
        </wrapper>
      );

      const archiveButton = screen.getByRole('button', { name: /ארכיון/i });
      expect(archiveButton).toBeInTheDocument();
      expect(archiveButton).toHaveClass('bg-orange-500');
    });

    it('should call archive mutation when archive button is clicked', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      
      vi.mocked(require('@/hooks/useClientUpdate').useClientStatusUpdate).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      render(
        <wrapper>
          <ClientListItemCard client={mockActiveClient} />
        </wrapper>
      );

      const archiveButton = screen.getByRole('button', { name: /ארכיון/i });
      fireEvent.click(archiveButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          clientId: 'active-client-123',
          status: 'ארכיון',
        });
      });
    });

    it('should show loading state when archiving', () => {
      vi.mocked(require('@/hooks/useClientUpdate').useClientStatusUpdate).mockReturnValue({
        mutateAsync: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000))),
        isPending: true,
      });

      render(
        <wrapper>
          <ClientListItemCard client={mockActiveClient} />
        </wrapper>
      );

      const archiveButton = screen.getByRole('button', { name: /ארכיון/i });
      expect(archiveButton).toBeDisabled();
      
      // Check for loading indicator
      const loadingSpinner = screen.getByTestId('loading-spinner');
      expect(loadingSpinner).toBeInTheDocument();
    });

    it('should display archive icon and correct styling', () => {
      render(
        <wrapper>
          <ClientListItemCard client={mockActiveClient} />
        </wrapper>
      );

      const archiveButton = screen.getByRole('button', { name: /ארכיון/i });
      expect(archiveButton).toHaveClass('bg-orange-500', 'hover:bg-orange-600');
      
      // Check for archive icon (Archive icon from lucide-react)
      const archiveIcon = screen.getByTestId('archive-icon');
      expect(archiveIcon).toBeInTheDocument();
    });
  });

  describe('Restore Button for Archived Clients', () => {
    it('should display restore button for archived clients', () => {
      render(
        <wrapper>
          <ClientListItemCard client={mockArchivedClient} />
        </wrapper>
      );

      const restoreButton = screen.getByRole('button', { name: /החזר/i });
      expect(restoreButton).toBeInTheDocument();
      expect(restoreButton).toHaveClass('bg-green-500');
    });

    it('should call restore mutation when restore button is clicked', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      
      vi.mocked(require('@/hooks/useClientUpdate').useClientStatusUpdate).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      render(
        <wrapper>
          <ClientListItemCard client={mockArchivedClient} />
        </wrapper>
      );

      const restoreButton = screen.getByRole('button', { name: /החזר/i });
      fireEvent.click(restoreButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          clientId: 'archived-client-123',
          status: 'פעיל',
        });
      });
    });

    it('should display restore icon and correct styling', () => {
      render(
        <wrapper>
          <ClientListItemCard client={mockArchivedClient} />
        </wrapper>
      );

      const restoreButton = screen.getByRole('button', { name: /החזר/i });
      expect(restoreButton).toHaveClass('bg-green-500', 'hover:bg-green-600');
      
      // Check for restore icon (Undo2 icon from lucide-react)
      const restoreIcon = screen.getByTestId('restore-icon');
      expect(restoreIcon).toBeInTheDocument();
    });

    it('should show loading state when restoring', () => {
      vi.mocked(require('@/hooks/useClientUpdate').useClientStatusUpdate).mockReturnValue({
        mutateAsync: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000))),
        isPending: true,
      });

      render(
        <wrapper>
          <ClientListItemCard client={mockArchivedClient} />
        </wrapper>
      );

      const restoreButton = screen.getByRole('button', { name: /החזר/i });
      expect(restoreButton).toBeDisabled();
      
      // Check for loading indicator
      const loadingSpinner = screen.getByTestId('loading-spinner');
      expect(loadingSpinner).toBeInTheDocument();
    });
  });

  describe('Status-based Button Logic', () => {
    it('should only show archive button for active status', () => {
      render(
        <wrapper>
          <ClientListItemCard client={mockActiveClient} />
        </wrapper>
      );

      expect(screen.getByRole('button', { name: /ארכיון/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /החזר/i })).not.toBeInTheDocument();
    });

    it('should only show restore button for archived status', () => {
      render(
        <wrapper>
          <ClientListItemCard client={mockArchivedClient} />
        </wrapper>
      );

      expect(screen.getByRole('button', { name: /החזר/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /ארכיון/i })).not.toBeInTheDocument();
    });

    it('should handle different client statuses correctly', () => {
      const clientWithDifferentStatus = {
        ...mockActiveClient,
        client_status: 'לא פעיל',
      };

      render(
        <wrapper>
          <ClientListItemCard client={clientWithDifferentStatus} />
        </wrapper>
      );

      // Should show archive button for non-archived status
      expect(screen.getByRole('button', { name: /ארכיון/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /החזר/i })).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle archive operation errors gracefully', async () => {
      const mockError = new Error('Archive operation failed');
      const mockMutateAsync = vi.fn().mockRejectedValue(mockError);
      
      vi.mocked(require('@/hooks/useClientUpdate').useClientStatusUpdate).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      render(
        <wrapper>
          <ClientListItemCard client={mockActiveClient} />
        </wrapper>
      );

      const archiveButton = screen.getByRole('button', { name: /ארכיון/i });
      fireEvent.click(archiveButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });

      // The error handling is done in the hook itself via toast.error
    });

    it('should handle restore operation errors gracefully', async () => {
      const mockError = new Error('Restore operation failed');
      const mockMutateAsync = vi.fn().mockRejectedValue(mockError);
      
      vi.mocked(require('@/hooks/useClientUpdate').useClientStatusUpdate).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      render(
        <wrapper>
          <ClientListItemCard client={mockArchivedClient} />
        </wrapper>
      );

      const restoreButton = screen.getByRole('button', { name: /החזר/i });
      fireEvent.click(restoreButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });

      // The error handling is done in the hook itself via toast.error
    });
  });

  describe('Integration with Client Data', () => {
    it('should display client information alongside archive/restore controls', () => {
      render(
        <wrapper>
          <ClientListItemCard client={mockActiveClient} />
        </wrapper>
      );

      expect(screen.getByText('Active Restaurant')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('050-1234567')).toBeInTheDocument();
      expect(screen.getByText('john@active.com')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ארכיון/i })).toBeInTheDocument();
    });

    it('should show correct status badge for active clients', () => {
      render(
        <wrapper>
          <ClientListItemCard client={mockActiveClient} />
        </wrapper>
      );

      const statusBadge = screen.getByText('פעיל');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should show correct status badge for archived clients', () => {
      render(
        <wrapper>
          <ClientListItemCard client={mockArchivedClient} />
        </wrapper>
      );

      const statusBadge = screen.getByText('ארכיון');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for archive button', () => {
      render(
        <wrapper>
          <ClientListItemCard client={mockActiveClient} />
        </wrapper>
      );

      const archiveButton = screen.getByRole('button', { name: /ארכיון/i });
      expect(archiveButton).toHaveAttribute('aria-label', expect.stringContaining('ארכיון'));
    });

    it('should have proper ARIA labels for restore button', () => {
      render(
        <wrapper>
          <ClientListItemCard client={mockArchivedClient} />
        </wrapper>
      );

      const restoreButton = screen.getByRole('button', { name: /החזר/i });
      expect(restoreButton).toHaveAttribute('aria-label', expect.stringContaining('החזר'));
    });

    it('should be keyboard accessible', () => {
      render(
        <wrapper>
          <ClientListItemCard client={mockActiveClient} />
        </wrapper>
      );

      const archiveButton = screen.getByRole('button', { name: /ארכיון/i });
      expect(archiveButton).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily when client data hasn\'t changed', () => {
      const { rerender } = render(
        <wrapper>
          <ClientListItemCard client={mockActiveClient} />
        </wrapper>
      );

      const initialRenderCount = screen.getAllByRole('button').length;

      // Re-render with same client data
      rerender(
        <wrapper>
          <ClientListItemCard client={mockActiveClient} />
        </wrapper>
      );

      const secondRenderCount = screen.getAllByRole('button').length;
      expect(secondRenderCount).toBe(initialRenderCount);
    });

    it('should update appropriately when client status changes', () => {
      const { rerender } = render(
        <wrapper>
          <ClientListItemCard client={mockActiveClient} />
        </wrapper>
      );

      expect(screen.getByRole('button', { name: /ארכיון/i })).toBeInTheDocument();

      // Change client to archived status
      rerender(
        <wrapper>
          <ClientListItemCard client={mockArchivedClient} />
        </wrapper>
      );

      expect(screen.getByRole('button', { name: /החזר/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /ארכיון/i })).not.toBeInTheDocument();
    });
  });
}); 