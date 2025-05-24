/// <reference types="vitest/globals" />

import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CurrentUserRoleProvider, useCurrentUserRole } from './useCurrentUserRole';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserRole } from '@/types/auth';
import { toast } from 'sonner';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    rpc: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for testing
        gcTime: Infinity, // Prevent garbage collection for tests
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <CurrentUserRoleProvider>{children}</CurrentUserRoleProvider>
    </QueryClientProvider>
  );
};

describe('useCurrentUserRole', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (supabase.auth.onAuthStateChange as vi.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    // Default to no session to prevent interference unless overridden by a specific test
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({ data: { session: null }, error: null });
  });

  it('should be CHECKING_SESSION immediately after initial render and effect', async () => {
    // initialState is INITIALIZING, but the first useEffect immediately sets it to CHECKING_SESSION.
    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });
    // Thus, the first observable state should be CHECKING_SESSION.
    expect(result.current.status).toBe('CHECKING_SESSION');
    // Then it will proceed based on getSession mock
    await waitFor(() => expect(result.current.status).toBe('NO_SESSION'));
  });

  it('should transition to NO_SESSION if no initial session', async () => {
    // getSession is already mocked to return no session in beforeEach
    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.status).toBe('NO_SESSION'));
    expect(result.current.role).toBeNull();
    expect(result.current.userId).toBeNull();
  });

  it('should transition to ERROR_SESSION if getSession resolves with an error', async () => {
    const sessionError = new Error('Session fetch failed');
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({ data: { session: null }, error: sessionError });
    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.status).toBe('ERROR_SESSION'));
    expect(result.current.error).toBe(sessionError.message);
    expect(toast.error).toHaveBeenCalledWith(`Session error: ${sessionError.message}`, { id: 'user-role-error-toast' });
  });

  it('should transition to ROLE_DETERMINED with admin role', async () => {
    const mockSession = { user: { id: 'user-123' } };
    const mockAdminRole: UserRole = 'admin';
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({ data: { session: mockSession }, error: null });
    (supabase.rpc as vi.Mock).mockResolvedValue({ data: mockAdminRole, error: null });

    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });

    // Directly wait for ROLE_DETERMINED as FETCHING_ROLE can be transient with mocks
    await waitFor(() => expect(result.current.status).toBe('ROLE_DETERMINED'));
    
    // Still good to check userId was set correctly during the process
    expect(result.current.userId).toBe(mockSession.user.id);
    expect(result.current.role).toBe(mockAdminRole);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isAccountManager).toBe(false);
    expect(result.current.isEditor).toBe(false);
    expect(toast.dismiss).toHaveBeenCalledWith('user-role-error-toast');
  });

  it('should transition to ROLE_DETERMINED with editor role', async () => {
    const mockSession = { user: { id: 'user-editor' } };
    const mockEditorRole: UserRole = 'editor';
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({ data: { session: mockSession }, error: null });
    (supabase.rpc as vi.Mock).mockResolvedValue({ data: mockEditorRole, error: null });

    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.status).toBe('ROLE_DETERMINED'));
    expect(result.current.role).toBe(mockEditorRole);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isEditor).toBe(true);
  });
  
  it('should transition to ROLE_DETERMINED with account_manager role', async () => {
    const mockSession = { user: { id: 'user-am' } };
    const mockAmRole: UserRole = 'account_manager';
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({ data: { session: mockSession }, error: null });
    (supabase.rpc as vi.Mock).mockResolvedValue({ data: mockAmRole, error: null });

    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.status).toBe('ROLE_DETERMINED'));
    expect(result.current.role).toBe(mockAmRole);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isAccountManager).toBe(true);
  });

  it('should transition to ERROR_FETCHING_ROLE if rpc call fails', async () => {
    const mockSession = { user: { id: 'user-rpc-fail' } };
    const rpcError = { message: 'RPC failed DETAIL' }; // Supabase errors often have a message property
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({ data: { session: mockSession }, error: null });
    // Ensure the rpc mock for this specific test leads to an error state in useQuery
    (supabase.rpc as vi.Mock).mockRejectedValue(rpcError); 

    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });
    
    // Expect FETCHING_ROLE first because the query will be attempted
    await waitFor(() => expect(result.current.status).toBe('FETCHING_ROLE'));

    await waitFor(() => expect(result.current.status).toBe('ERROR_FETCHING_ROLE'), { timeout: 2000 });
    expect(result.current.error).toBe(rpcError.message);
    expect(toast.error).toHaveBeenCalledWith(`Error determining user role. ${rpcError.message}`, { id: 'user-role-error-toast' });
  });

  it('should handle SIGNED_IN auth event and determine role', async () => {
    // Initial state: No session (from beforeEach)
    const { result, rerender } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.status).toBe('NO_SESSION'));

    const mockSession = { user: { id: 'user-signed-in' } };
    const mockUserRole: UserRole = 'admin';

    // Mock RPC that will be called after SIGNED_IN's induced refetch
    (supabase.rpc as vi.Mock).mockResolvedValue({ data: mockUserRole, error: null });

    const authCallback = (supabase.auth.onAuthStateChange as vi.Mock).mock.calls[0][0];
    act(() => {
      authCallback('SIGNED_IN', mockSession);
    });
    
    // Status should become FETCHING_ROLE after SIGNED_IN
    await waitFor(() => expect(result.current.status).toBe('FETCHING_ROLE'));
    expect(result.current.userId).toBe(mockSession.user.id);
    
    // Then, role should be determined
    await waitFor(() => expect(result.current.status).toBe('ROLE_DETERMINED'));
    expect(result.current.role).toBe(mockUserRole);
    expect(result.current.isAdmin).toBe(true);
  });

  it('should handle SIGNED_OUT auth event', async () => {
    const mockInitialSession = { user: { id: 'user-123' } };
    const mockInitialAdminRole: UserRole = 'admin';
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({ data: { session: mockInitialSession }, error: null });
    (supabase.rpc as vi.Mock).mockResolvedValue({ data: mockInitialAdminRole, error: null });

    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.status).toBe('ROLE_DETERMINED'));
    expect(result.current.role).toBe(mockInitialAdminRole);

    const authCallback = (supabase.auth.onAuthStateChange as vi.Mock).mock.calls[0][0];
    act(() => {
      authCallback('SIGNED_OUT', null);
    });

    await waitFor(() => expect(result.current.status).toBe('NO_SESSION'));
    expect(result.current.role).toBeNull();
    expect(result.current.userId).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });

  it('should clean up auth listener on unmount', () => {
    const unsubscribeMock = vi.fn();
    (supabase.auth.onAuthStateChange as vi.Mock).mockReturnValueOnce({
      data: { subscription: { unsubscribe: unsubscribeMock } },
    });
    // getSession mock from beforeEach (no session) is fine here

    const { unmount } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });
    act(() => {
        unmount();
    });

    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    expect(toast.dismiss).toHaveBeenCalledWith('user-role-error-toast');
  });

  it('should return role as null if RPC returns null (e.g. role_not_found)', async () => {
    const mockSession = { user: { id: 'user-no-role-in-db' } };
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({ data: { session: mockSession }, error: null });
    (supabase.rpc as vi.Mock).mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.status).toBe('ROLE_DETERMINED'));
    expect(result.current.role).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });
}); 