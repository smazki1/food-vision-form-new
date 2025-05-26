
/// <reference types="vitest/globals" />

import { renderHook, waitFor } from '@testing-library/react';
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

describe('useCurrentUserRole - Basic Functionality', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (supabase.auth.onAuthStateChange as vi.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({ data: { session: null }, error: null });
  });

  it('should be CHECKING_SESSION immediately after initial render', async () => {
    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });
    expect(result.current.status).toBe('CHECKING_SESSION');
    await waitFor(() => expect(result.current.status).toBe('NO_SESSION'));
  });

  it('should transition to NO_SESSION if no initial session', async () => {
    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.status).toBe('NO_SESSION'));
    expect(result.current.role).toBeNull();
    expect(result.current.userId).toBeNull();
  });

  it('should return role as null if RPC returns null', async () => {
    const mockSession = { user: { id: 'user-no-role-in-db' } };
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({ data: { session: mockSession }, error: null });
    (supabase.rpc as vi.Mock).mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.status).toBe('ROLE_DETERMINED'));
    expect(result.current.role).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });
});
