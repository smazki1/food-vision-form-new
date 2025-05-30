/// <reference types="vitest/globals" />

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { CurrentUserRoleProvider, useCurrentUserRole } from '../useCurrentUserRole';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserRole } from '@/types/unifiedAuthTypes';
import * as OptService from '@/services/optimizedAuthService';

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

const mockGetUserAuthData = (roleToReturn: string | null): any => {
  return vi.spyOn(OptService.optimizedAuthService, 'getUserAuthData')
    .mockResolvedValue({
      role: roleToReturn as UserRole,
      clientId: 'client-123',
      restaurantName: 'Test Restaurant',
      hasLinkedClientRecord: true,
      fromCache: false,
    });
};

describe('useCurrentUserRole - Role Determination', () => {
  let getUserAuthDataSpy: any;

  beforeEach(() => {
    vi.resetAllMocks();
    // Default mock for onAuthStateChange to avoid unhandled promises
    (supabase.auth.onAuthStateChange as Mock).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  afterEach(() => {
    if (getUserAuthDataSpy) {
      getUserAuthDataSpy.mockRestore();
    }
  });

  it('should transition to ROLE_DETERMINED with admin role', async () => {
    const mockSession = { user: { id: 'user-123' } };
    (supabase.auth.getSession as Mock).mockResolvedValue({ data: { session: mockSession }, error: null });
    getUserAuthDataSpy = mockGetUserAuthData('admin');

    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.status).toBe('ROLE_DETERMINED');
    });
    expect(result.current.role).toBe('admin');
    expect(result.current.isAdmin).toBe(true);
  });

  it('should transition to ROLE_DETERMINED with editor role', async () => {
    const mockSession = { user: { id: 'user-editor' } };
    (supabase.auth.getSession as Mock).mockResolvedValue({ data: { session: mockSession }, error: null });
    getUserAuthDataSpy = mockGetUserAuthData('editor');

    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.status).toBe('ROLE_DETERMINED');
    });
    expect(result.current.role).toBe('editor');
    expect(result.current.isEditor).toBe(true);
  });

  it('should transition to ROLE_DETERMINED with account_manager role', async () => {
    const mockSession = { user: { id: 'user-am' } };
    (supabase.auth.getSession as Mock).mockResolvedValue({ data: { session: mockSession }, error: null });
    getUserAuthDataSpy = mockGetUserAuthData('account_manager');

    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.status).toBe('ROLE_DETERMINED');
    });
    expect(result.current.role).toBe('account_manager');
    expect(result.current.isAccountManager).toBe(true);
  });
});
