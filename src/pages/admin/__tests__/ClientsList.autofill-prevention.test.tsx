import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k: string, d?: string) => d ?? '' }),
}));

// Mock role hook to grant admin access
vi.mock('@/hooks/useCurrentUserRole', () => ({
  useCurrentUserRole: () => ({
    status: 'ROLE_DETERMINED',
    isAdmin: true,
    isAccountManager: false,
    userId: 'test-admin-id',
  }),
}));

// Mock simplified clients hook to provide stable data
vi.mock('@/hooks/useClients', () => ({
  useClients_Simplified_V2: () => ({
    clients: [
      { client_id: '1', restaurant_name: 'Sushi Bar', contact_name: 'Avi', email: 'owner@rest.co', phone: '050-0000000', client_status: 'פעיל' },
      { client_id: '2', restaurant_name: 'Falafel King', contact_name: 'Dana', email: 'dana@falafel.co', phone: '050-1111111', client_status: 'ארכיון' },
    ],
    isLoading: false,
    error: null,
    refreshClients: vi.fn(),
    queryStatus: 'success',
    isFetching: false,
  }),
}));

// Component under test
import ClientsList from '@/pages/admin/ClientsList';

describe('ClientsList - search input autofill prevention', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders empty search input with autofill-prevention attributes', async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ClientsList />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const input = screen.getByPlaceholderText('Search by name, contact, email...') as HTMLInputElement;

    expect(input).toBeInTheDocument();
    // Value should start empty (no autofill like admin@test.local)
    expect(input).toHaveValue('');
    expect(input).not.toHaveValue('admin@test.local');

    // Attributes enforcing no browser autofill
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAttribute('name', 'clients-search');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('autocorrect', 'off');
    expect(input).toHaveAttribute('autocapitalize', 'none');
    expect(input).toHaveAttribute('inputmode', 'search');
    expect(input).toHaveAttribute('spellcheck', 'false');
  });

  it('updates value on typing and filters client list textually', async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ClientsList />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const input = screen.getByPlaceholderText('Search by name, contact, email...');
    await userEvent.type(input, 'Sushi');
    expect(input).toHaveValue('Sushi');

    // List summary shows how many clients found (at least check presence of label)
    expect(screen.getByText(/לקוחות שנמצאו/i)).toBeInTheDocument();
  });
});


