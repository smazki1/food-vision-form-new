
/// <reference types="vitest/globals" />

import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CurrentUserRoleProvider, useCurrentUserRole } from '../useCurrentUserRole';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserRole } from '@/types/auth';

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
        retry: false,
        gcTime: Infinity,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <CurrentUserRoleProvider>{children}</CurrentUserRoleProvider>
    </QueryClientProvider>
  );
};

describe('useCurrentUserRole - Auth Events', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (supabase.auth.onAuthStateChange as vi.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({ data: { session: null }, error: null });
  });

  it('should handle SIGNED_IN auth event and determine role', async () => {
    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.status).toBe('NO_SESSION'));

    const mockSession = { user: { id: 'user-signed-in' } };
    const mockUserRole: UserRole = 'admin';

    (supabase.rpc as vi.Mock).mockResolvedValue({ data: mockUserRole, error: null });

    const authCallback = (supabase.auth.onAuthStateChange as vi.Mock).mock.calls[0][0];
    act(() => {
      authCallback('SIGNED_IN', mockSession);
    });
    
    await waitFor(() => expect(result.current.status).toBe('FETCHING_ROLE'));
    expect(result.current.userId).toBe(mockSession.user.id);
    
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
});
