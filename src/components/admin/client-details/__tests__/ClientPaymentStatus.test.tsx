import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientPaymentStatus } from '../ClientPaymentStatus';
import { Client } from '@/types/client';

// Mock the useClientUpdate hook
const mockMutateAsync = vi.fn();
vi.mock('@/hooks/useClientUpdate', () => ({
  useClientUpdate: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false
  })
}));

const mockClient: Client = {
  client_id: 'test-client-123',
  restaurant_name: 'Test Restaurant',
  contact_name: 'Test Contact',
  phone: '050-1234567',
  email: 'test@example.com',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  original_lead_id: null,
  client_status: 'פעיל',
  current_package_id: null,
  remaining_servings: 10,
  remaining_images: 20,
  consumed_images: 5,
  reserved_images: 0,
  last_activity_at: '2025-01-01T00:00:00Z',
  internal_notes: null,
  user_auth_id: null,
  payment_status: 'לא מוגדר',
  payment_due_date: null,
  payment_amount_ils: null
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('ClientPaymentStatus Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  describe('Happy Path Tests', () => {
    it('should render all payment fields correctly', () => {
      render(
        <ClientPaymentStatus clientId="test-client-123" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('סטטוס תשלומים')).toBeInTheDocument();
      expect(screen.getByLabelText('סטטוס תשלום')).toBeInTheDocument();
      expect(screen.getByLabelText('תאריך פירעון')).toBeInTheDocument();
      expect(screen.getByLabelText('סכום בשקלים')).toBeInTheDocument();
    });

    it('should display default payment status correctly', () => {
      render(
        <ClientPaymentStatus clientId="test-client-123" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('לא מוגדר')).toBeInTheDocument();
    });

    it('should update payment status when changed', async () => {
      const user = userEvent.setup();
      
      render(
        <ClientPaymentStatus clientId="test-client-123" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      const statusSelect = screen.getByRole('combobox');
      await user.click(statusSelect);
      
      const paidOption = screen.getByText('שולם תשלום מלא');
      await user.click(paidOption);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          clientId: 'test-client-123',
          updates: { payment_status: 'שולם תשלום מלא' }
        });
      });
    });

    it('should update due date when changed', async () => {
      const user = userEvent.setup();
      
      render(
        <ClientPaymentStatus clientId="test-client-123" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      const dateInput = screen.getByLabelText('תאריך פירעון');
      await user.type(dateInput, '2025-02-15');

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          clientId: 'test-client-123',
          updates: { payment_due_date: '2025-02-15' }
        });
      });
    });

    it('should update payment amount when changed', async () => {
      const user = userEvent.setup();
      
      render(
        <ClientPaymentStatus clientId="test-client-123" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      const amountInput = screen.getByLabelText('סכום בשקלים');
      fireEvent.change(amountInput, { target: { value: '5000' } });

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          clientId: 'test-client-123',
          updates: { payment_amount_ils: 5000 }
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle client with existing payment data', () => {
      const clientWithPayment: Client = {
        ...mockClient,
        payment_status: 'שולם תשלום מלא',
        payment_due_date: '2025-03-01',
        payment_amount_ils: 7500
      };

      render(
        <ClientPaymentStatus clientId="test-client-123" client={clientWithPayment} />,
        { wrapper: createWrapper() }
      );

      const dateInput = screen.getByLabelText('תאריך פירעון') as HTMLInputElement;
      const amountInput = screen.getByLabelText('סכום בשקלים') as HTMLInputElement;

      expect(screen.getByText('שולם תשלום מלא')).toBeInTheDocument();
      expect(dateInput.value).toBe('2025-03-01');
      expect(amountInput.value).toBe('7500');
    });

    it('should handle clearing due date', async () => {
      const user = userEvent.setup();
      const clientWithDate: Client = {
        ...mockClient,
        payment_due_date: '2025-02-01'
      };

      render(
        <ClientPaymentStatus clientId="test-client-123" client={clientWithDate} />,
        { wrapper: createWrapper() }
      );

      const dateInput = screen.getByLabelText('תאריך פירעון');
      await user.clear(dateInput);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          clientId: 'test-client-123',
          updates: { payment_due_date: null }
        });
      });
    });

    it('should handle clearing payment amount', async () => {
      const user = userEvent.setup();
      const clientWithAmount: Client = {
        ...mockClient,
        payment_amount_ils: 1000
      };

      render(
        <ClientPaymentStatus clientId="test-client-123" client={clientWithAmount} />,
        { wrapper: createWrapper() }
      );

      const amountInput = screen.getByLabelText('סכום בשקלים');
      await user.clear(amountInput);
      fireEvent.blur(amountInput);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          clientId: 'test-client-123',
          updates: { payment_amount_ils: null }
        });
      });
    });

    it('should handle decimal amounts correctly', async () => {
      render(
        <ClientPaymentStatus clientId="test-client-123" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      const amountInput = screen.getByLabelText('סכום בשקלים');
      fireEvent.change(amountInput, { target: { value: '1234.56' } });

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          clientId: 'test-client-123',
          updates: { payment_amount_ils: 1234.56 }
        });
      });
    });
  });

  describe('Payment Status Options', () => {
    it('should display all payment status options', async () => {
      const user = userEvent.setup();
      
      render(
        <ClientPaymentStatus clientId="test-client-123" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      const statusSelect = screen.getByRole('combobox');
      await user.click(statusSelect);

      expect(screen.getAllByText('שולם תשלום מלא')[0]).toBeInTheDocument();
      expect(screen.getAllByText('תשלום חלקי')[0]).toBeInTheDocument();
      expect(screen.getAllByText('עדיין לא שולם')[0]).toBeInTheDocument();
      expect(screen.getAllByText('לא מוגדר')).toHaveLength(2); // One in select display, one in options
    });

    it('should handle each payment status option correctly', async () => {
      const user = userEvent.setup();
      const statusOptions = [
        'שולם תשלום מלא',
        'תשלום חלקי', 
        'עדיין לא שולם'
      ];

      for (const status of statusOptions) {
        mockMutateAsync.mockClear();
        
        const { unmount } = render(
          <ClientPaymentStatus clientId="test-client-123" client={mockClient} />,
          { wrapper: createWrapper() }
        );

        const statusSelect = screen.getByLabelText('סטטוס תשלום');
        await user.click(statusSelect);
        
        const option = screen.getAllByText(status).find(el => el.closest('[role="option"]'));
        if (option) {
          await user.click(option);

          await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalledWith({
              clientId: 'test-client-123',
              updates: { payment_status: status }
            });
          });
        }
        
        unmount();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle payment status update errors gracefully', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockRejectedValue(new Error('Update failed'));
      
      // Mock console.error to prevent error output in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <ClientPaymentStatus clientId="test-client-123" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      const statusSelect = screen.getByRole('combobox');
      await user.click(statusSelect);
      
      const paidOption = screen.getByText('שולם תשלום מלא');
      await user.click(paidOption);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error updating payment status:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle invalid number input gracefully', async () => {
      const user = userEvent.setup();
      
      render(
        <ClientPaymentStatus clientId="test-client-123" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      const amountInput = screen.getByLabelText('סכום בשקלים');
      await user.type(amountInput, 'invalid-number');
      fireEvent.blur(amountInput);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          clientId: 'test-client-123',
          updates: { payment_amount_ils: null }
        });
      });
    });
  });

  describe('UI State Management', () => {
    it('should disable fields while updating', async () => {
      const user = userEvent.setup();
      let resolveUpdate: (value: any) => void;
      mockMutateAsync.mockReturnValue(new Promise(resolve => {
        resolveUpdate = resolve;
      }));
      
      render(
        <ClientPaymentStatus clientId="test-client-123" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      const statusSelect = screen.getByRole('combobox');
      const dateInput = screen.getByLabelText('תאריך פירעון');
      const amountInput = screen.getByLabelText('סכום בשקלים');

      await user.click(statusSelect);
      const paidOption = screen.getByText('שולם תשלום מלא');
      await user.click(paidOption);

      // Fields should be disabled during update
      expect(statusSelect).toBeDisabled();
      expect(dateInput).toBeDisabled();
      expect(amountInput).toBeDisabled();

      // Resolve the update
      resolveUpdate!({});

      await waitFor(() => {
        expect(statusSelect).not.toBeDisabled();
        expect(dateInput).not.toBeDisabled();
        expect(amountInput).not.toBeDisabled();
      });
    });
  });
}); 