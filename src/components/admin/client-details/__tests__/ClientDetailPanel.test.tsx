import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { toast } from 'sonner';
import { ClientDetailPanel } from '../ClientDetailPanel';
import { useClients } from '@/hooks/useClients';
import { useClientUpdate } from '@/hooks/useClientUpdate';
import { Client } from '@/types/client';

// Mock dependencies
vi.mock('@/hooks/useClients');
vi.mock('@/hooks/useClientUpdate');
vi.mock('sonner');

// Mock client data
const mockClient: Client = {
  client_id: 'test-client-1',
  restaurant_name: 'Test Restaurant',
  contact_name: 'John Doe',
  phone: '123-456-7890',
  email: 'john@test.com',
  client_status: 'פעיל',
  business_type: 'מסעדה',
  address: '123 Test St',
  website_url: 'https://test.com',
  internal_notes: 'Internal test notes',
  remaining_servings: 10,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  current_package_id: null,
  user_auth_id: null,
  service_packages: null,
  original_lead_id: null,
  last_activity_at: '2024-01-01T00:00:00Z'
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('ClientDetailPanel', () => {
  const mockOnClose = vi.fn();
  const mockUpdateClient = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useClients as any).mockReturnValue({
      clients: [mockClient],
      isLoading: false,
      error: null,
    });

    (useClientUpdate as any).mockReturnValue({
      mutateAsync: mockUpdateClient.mockResolvedValue({}),
      isPending: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Basic Functionality', () => {
    it('should render with client information', () => {
      render(
        <ClientDetailPanel clientId="test-client-1" onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getAllByText('Test Restaurant')).toHaveLength(2); // Header and content
      expect(screen.getByText('פעיל')).toBeInTheDocument();
    });

    it('should display all tabs correctly', () => {
      render(
        <ClientDetailPanel clientId="test-client-1" onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getAllByText('פרטי הלקוח')).toHaveLength(2); // Tab and header
      expect(screen.getByText('חבילות')).toBeInTheDocument();
      expect(screen.getByText('הגשות')).toBeInTheDocument();
      expect(screen.getByText('פעילות')).toBeInTheDocument();
      expect(screen.getByText('עיצוב')).toBeInTheDocument();
    });

    it('should switch between tabs correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <ClientDetailPanel clientId="test-client-1" onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      // Click on activity tab
      await user.click(screen.getByText('פעילות'));
      expect(screen.getByText('פעילות והערות')).toBeInTheDocument();

      // Click on design tab
      await user.click(screen.getByText('עיצוב'));
      expect(screen.getByText('תמונות ייחוס ועיצוב')).toBeInTheDocument();
    });

    it('should display edit button and toggle edit mode', async () => {
      const user = userEvent.setup();
      
      render(
        <ClientDetailPanel clientId="test-client-1" onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const editButton = screen.getByText('עריכה');
      expect(editButton).toBeInTheDocument();

      await user.click(editButton);
      
      expect(screen.getByText('שמירה')).toBeInTheDocument();
      expect(screen.getByText('ביטול')).toBeInTheDocument();
    });
  });

  describe('Client Information Display', () => {
    it('should display all client information correctly', () => {
      render(
        <ClientDetailPanel clientId="test-client-1" onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getAllByText('Test Restaurant')).toHaveLength(2); // Header and content
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('123-456-7890')).toBeInTheDocument();
      expect(screen.getByText('john@test.com')).toBeInTheDocument();
      expect(screen.getByText('123 Test St')).toBeInTheDocument();
      expect(screen.getByText('https://test.com')).toBeInTheDocument();
    });

    it('should show remaining servings with correct color coding', () => {
      render(
        <ClientDetailPanel clientId="test-client-1" onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const servingsElement = screen.getByText('10');
      expect(servingsElement).toHaveClass('text-green-600');
    });

    it('should show red color for zero servings', () => {
      const clientWithZeroServings = { ...mockClient, remaining_servings: 0 };
      
      (useClients as any).mockReturnValue({
        clients: [clientWithZeroServings],
        isLoading: false,
        error: null,
      });

      render(
        <ClientDetailPanel clientId="test-client-1" onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const servingsElement = screen.getByText('0');
      expect(servingsElement).toHaveClass('text-red-600');
    });
  });

  describe('Edit Mode Functionality', () => {
    it('should enable edit mode and show form fields', async () => {
      const user = userEvent.setup();
      
      render(
        <ClientDetailPanel clientId="test-client-1" onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('עריכה'));

      expect(screen.getByDisplayValue('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123-456-7890')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@test.com')).toBeInTheDocument();
    });

    it('should cancel edit mode and restore original values', async () => {
      const user = userEvent.setup();
      
      render(
        <ClientDetailPanel clientId="test-client-1" onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('עריכה'));
      
      // Change a value
      const restaurantInput = screen.getByDisplayValue('Test Restaurant');
      await user.clear(restaurantInput);
      await user.type(restaurantInput, 'Modified Restaurant');

      // Cancel edit
      await user.click(screen.getByText('ביטול'));

      // Should show original value and exit edit mode
      expect(screen.getAllByText('Test Restaurant')).toHaveLength(2); // Header and content
      expect(screen.getByText('עריכה')).toBeInTheDocument();
    });

    it('should handle blur events and auto-save changes', async () => {
      const user = userEvent.setup();
      
      render(
        <ClientDetailPanel clientId="test-client-1" onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('עריכה'));
      
      const restaurantInput = screen.getByDisplayValue('Test Restaurant');
      await user.clear(restaurantInput);
      await user.type(restaurantInput, 'Modified Restaurant');
      
      // Trigger blur event
      fireEvent.blur(restaurantInput);

      await waitFor(() => {
        expect(mockUpdateClient).toHaveBeenCalledWith({
          clientId: 'test-client-1',
          updates: { restaurant_name: 'Modified Restaurant' }
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle loading state', () => {
      (useClients as any).mockReturnValue({
        clients: [],
        isLoading: true,
        error: null,
      });

      render(
        <ClientDetailPanel clientId="test-client-1" onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should handle error state', () => {
      (useClients as any).mockReturnValue({
        clients: [],
        isLoading: false,
        error: new Error('Test error'),
      });

      render(
        <ClientDetailPanel clientId="test-client-1" onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('שגיאה בטעינת נתונים')).toBeInTheDocument();
    });

    it('should handle client not found', () => {
      (useClients as any).mockReturnValue({
        clients: [],
        isLoading: false,
        error: null,
      });

      render(
        <ClientDetailPanel clientId="non-existent-client" onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('לקוח לא נמצא')).toBeInTheDocument();
    });

    it('should handle update errors gracefully', async () => {
      const user = userEvent.setup();
      mockUpdateClient.mockRejectedValue(new Error('Update failed'));
      
      render(
        <ClientDetailPanel clientId="test-client-1" onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('עריכה'));
      
      const restaurantInput = screen.getByDisplayValue('Test Restaurant');
      await user.clear(restaurantInput);
      await user.type(restaurantInput, 'Modified Restaurant');
      
      fireEvent.blur(restaurantInput);

      await waitFor(() => {
        expect(mockUpdateClient).toHaveBeenCalled();
      });

      // The error should be handled in the hook, not crash the component
      expect(screen.getByDisplayValue('Modified Restaurant')).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ClientDetailPanel clientId="test-client-1" onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      const closeButton = screen.getByRole('button', { name: /close/i }) || 
                          document.querySelector('[data-testid="close-button"]') ||
                          screen.getByText('✕');
      
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Status Color Coding', () => {
    it('should apply correct colors for different client statuses', () => {
      const statusTests = [
        { status: 'פעיל', expectedClass: 'bg-green-100' },
        { status: 'לא פעיל', expectedClass: 'bg-red-100' },
        { status: 'בהמתנה', expectedClass: 'bg-yellow-100' },
        { status: 'unknown', expectedClass: 'bg-gray-100' },
      ];

      statusTests.forEach(({ status, expectedClass }) => {
        const testClient = { ...mockClient, client_status: status };
        
        (useClients as any).mockReturnValue({
          clients: [testClient],
          isLoading: false,
          error: null,
        });

        const { unmount } = render(
          <ClientDetailPanel clientId="test-client-1" onClose={mockOnClose} />,
          { wrapper: createWrapper() }
        );

        const statusBadge = screen.getByText(status);
        expect(statusBadge).toHaveClass(expectedClass);

        unmount();
      });
    });
  });

  describe('Integration with Child Components', () => {
    it('should render child components in their respective tabs', async () => {
      const user = userEvent.setup();
      
      render(
        <ClientDetailPanel clientId="test-client-1" onClose={mockOnClose} />,
        { wrapper: createWrapper() }
      );

      // Check packages tab
      await user.click(screen.getByText('חבילות'));
      // Should render ClientPackageManagement component
      
      // Check submissions tab  
      await user.click(screen.getByText('הגשות'));
      // Should render ClientSubmissionsSection component
      
      // Check activity tab
      await user.click(screen.getByText('פעילות'));
      expect(screen.getByText('פעילות והערות')).toBeInTheDocument();
      
      // Check design tab
      await user.click(screen.getByText('עיצוב'));
      expect(screen.getByText('תמונות ייחוס ועיצוב')).toBeInTheDocument();
    });
  });
}); 