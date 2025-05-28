/// <reference types="vitest/globals" />

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { CurrentUserRoleProvider, useCurrentUserRole } from '../useCurrentUserRole';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { toast } from 'sonner'; // toast is no longer asserted here
import { optimizedAuthService } from '@/services/optimizedAuthService'; // Ensure this is imported

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    // rpc: vi.fn(), // Not needed if service is mocked
  },
}));

// Mock sonner toast (still needed for other potential tests, but not asserted here)
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Mock the optimizedAuthService
vi.mock('@/services/optimizedAuthService', () => ({
  optimizedAuthService: {
    getUserAuthData: vi.fn(),
    clearAuthCache: vi.fn(),
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

describe('useCurrentUserRole - Error Handling', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (supabase.auth.onAuthStateChange as Mock).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    // Reset optimizedAuthService mocks too
    (optimizedAuthService.getUserAuthData as Mock).mockReset();
  });

  it('should transition to ERROR_SESSION if getSession resolves with an error', async () => {
    const sessionError = new Error('Session fetch failed');
    (supabase.auth.getSession as Mock).mockResolvedValue({ data: { session: null }, error: sessionError });
    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.status).toBe('ERROR_SESSION'));
    expect(result.current.error).toBe(sessionError.message);
    // expect(toast.error).toHaveBeenCalledWith(`Session error: ${sessionError.message}`, { id: 'user-role-error-toast' }); // Removed
  });

  it('should transition to ERROR_FETCHING_ROLE if rpc call fails', async () => {
    const mockSession = { user: { id: 'user-rpc-fail' } };
    const rpcErrorMessage = 'RPC failed DETAIL';
    (supabase.auth.getSession as Mock).mockResolvedValue({ data: { session: mockSession }, error: null });
    
    // Mock optimizedAuthService.getUserAuthData to reject with an error
    (optimizedAuthService.getUserAuthData as Mock).mockRejectedValue(new Error(rpcErrorMessage)); 

    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });
    
    await waitFor(() => expect(result.current.status).toBe('ERROR_FETCHING_ROLE'), { timeout: 2000 });
    expect(result.current.error).toBe(rpcErrorMessage);
    // expect(toast.error).toHaveBeenCalledWith(`Error determining user role. ${rpcErrorMessage}`, { id: 'user-role-error-toast' }); // Removed
  });
});
