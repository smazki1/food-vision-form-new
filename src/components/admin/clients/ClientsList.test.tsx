/// <reference types="vitest/globals" />

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import ClientsList from '@/pages/admin/ClientsList';
import * as useClientsHookModule from '@/hooks/useClients';
import { Client } from '@/types/client';
import { BrowserRouter } from 'react-router-dom';
import * as currentUserRoleHookModule from '@/hooks/useCurrentUserRole';
import { UserRole } from '@/types/auth';
import { QueryClient, QueryClientProvider, QueryObserverResult, RefetchOptions } from '@tanstack/react-query';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Mock react-i18next
vi.mock('react-i18next', () => {
  const actualTranslations: Record<string, string> = {
    'common.loadingData': 'טוען נתונים...',
    'clientsList.noClientsFound': 'לא נמצאו לקוחות',
    'clientsList.clientsFoundCount': 'לקוחות שנמצאו',
    'clientsList.errorLoading': 'שגיאה בטעינת הלקוחות',
    'clientsList.pageTitle': 'רשימת לקוחות',
    'clientsList.searchPlaceholder': 'חפש לקוחות...',
    'common.refresh': 'רענן',
    'common.refreshing': 'מרענן...',
    'clientsList.noClientsDescription': 'נסה לשנות את החיפוש או ליצור לקוח חדש.',
    'common.retry': 'נסה שוב',
  };

  return {
    useTranslation: () => ({
      t: (key: string, options?: { defaultValue?: string; count?: number }) => {
        if (options?.count !== undefined && actualTranslations[key]?.includes('{{count}}')) {
          return (actualTranslations[key] || options?.defaultValue || key).replace('{{count}}', String(options.count));
        }
        return actualTranslations[key] || options?.defaultValue || key;
      },
      i18n: {
        changeLanguage: () => new Promise(() => {}),
        language: 'he',
      },
    }),
    Trans: ({ i18nKey, children }: { i18nKey: string, children?: React.ReactNode }) => {
      if (children) return children;
      return actualTranslations[i18nKey] || i18nKey;
    }
  };
});

// Mock useCurrentUserRole hook
vi.mock('@/hooks/useCurrentUserRole', async () => {
  const actual = await vi.importActual<typeof currentUserRoleHookModule>('@/hooks/useCurrentUserRole');
  return {
    ...actual,
    useCurrentUserRole: vi.fn(),
  };
});

// Mock useClients_Simplified_V2 hook
vi.mock('@/hooks/useClients', async () => {
  const actual = await vi.importActual<typeof useClientsHookModule>('@/hooks/useClients');
  return {
    ...actual,
    useClients_Simplified_V2: vi.fn(), 
  };
});

const mockClients: Client[] = [
  {
    client_id: '1',
    restaurant_name: 'Flavor Town',
    contact_name: 'Guy Fieri',
    email: 'guy@flavortown.com',
    phone: '555-0001',
    client_status: 'פעיל',
    created_at: new Date().toISOString(),
    original_lead_id: null,
    last_activity_at: new Date().toISOString(),
    internal_notes: '',
    current_package_id: 'pkg1',
    remaining_servings: 10,
    user_auth_id: null,
  },
  {
    client_id: '2',
    restaurant_name: 'Burger Joint',
    contact_name: 'Bob Belcher',
    email: 'bob@bobsburgers.com',
    phone: '555-0002',
    client_status: 'לא פעיל',
    created_at: new Date().toISOString(),
    original_lead_id: 'lead2',
    last_activity_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    internal_notes: 'Needs follow up',
    current_package_id: 'pkg2',
    remaining_servings: 0,
    user_auth_id: 'auth123',
  },
];

// Typed mock for useCurrentUserRole
const mockedUseCurrentUserRole = currentUserRoleHookModule.useCurrentUserRole as MockedFunction<typeof currentUserRoleHookModule.useCurrentUserRole>;
// Typed mock for useClients_Simplified_V2
const mockedUseClients = useClientsHookModule.useClients_Simplified_V2 as MockedFunction<typeof useClientsHookModule.useClients_Simplified_V2>;

// Create a new QueryClient instance for each test run to ensure isolation
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, 
    },
  },
});

// Helper to create a default mock return value for useClients_Simplified_V2
const getDefaultMockClientsReturnValue = (): ReturnType<typeof useClientsHookModule.useClients_Simplified_V2> => ({
  clients: [],
  isLoading: true,
  error: null,
  refetch: vi.fn() as unknown as (options?: RefetchOptions) => Promise<QueryObserverResult<Client[], Error>>,
  refreshClients: vi.fn(),
  queryStatus: 'pending', 
  isFetching: true,
});

describe('ClientsList', () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = createTestQueryClient();
    vi.resetAllMocks(); 

    mockedUseCurrentUserRole.mockReturnValue({
      status: 'ROLE_DETERMINED' as currentUserRoleHookModule.CurrentUserRoleStatus,
      role: 'admin' as UserRole,
      isAdmin: true,
      isAccountManager: false,
      isEditor: false,
      userId: 'test-admin-user',
      error: null,
      isLoading: false,
    });

    mockedUseClients.mockReturnValue(getDefaultMockClientsReturnValue());
  });

  const renderComponent = async () => {
    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <currentUserRoleHookModule.CurrentUserRoleProvider>
              <ClientsList />
            </currentUserRoleHookModule.CurrentUserRoleProvider>
          </BrowserRouter>
        </QueryClientProvider>
      );
    });
  };

  it('should render loading state initially', async () => {
    await renderComponent();
    expect(screen.getByTestId('clients-list-loader')).toBeInTheDocument();
    expect(screen.getByText('טוען נתונים...')).toBeInTheDocument();
  });

  it('should display "No clients found" message when no clients are fetched', async () => {
    mockedUseClients.mockReturnValue({
      ...getDefaultMockClientsReturnValue(),
      clients: [],
      isLoading: false,
      queryStatus: 'success',
      isFetching: false,
    });
    await renderComponent();
    await waitFor(() => {
      expect(screen.getByText('לא נמצאו לקוחות')).toBeInTheDocument(); 
    });
  });

  it('should display clients when data is fetched successfully', async () => {
    mockedUseClients.mockReturnValue({
      ...getDefaultMockClientsReturnValue(),
      clients: mockClients,
      isLoading: false,
      queryStatus: 'success',
      isFetching: false,
    });
    await renderComponent();
    await waitFor(() => {
      expect(screen.getByText(mockClients[0].restaurant_name)).toBeInTheDocument();
      expect(screen.getByText(mockClients[1].restaurant_name)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(`לקוחות שנמצאו: ${mockClients.length}`)).toBeInTheDocument();
    });
  });

  it('should display error message if fetching clients fails', async () => {
    const errorMessage = 'Failed to fetch clients';
    const mockError = new Error(errorMessage);
    mockedUseClients.mockReturnValue({
      ...getDefaultMockClientsReturnValue(),
      clients: [],
      isLoading: false,
      error: mockError,
      queryStatus: 'error',
      isFetching: false,
    });
    await renderComponent();
    await waitFor(() => {
      expect(screen.getByText('שגיאה בטעינת הלקוחות')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});
