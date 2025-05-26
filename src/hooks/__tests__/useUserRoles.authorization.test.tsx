
/// <reference types="vitest/globals" />

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { useUserRoles } from '../useUserRoles';
import { supabaseAdmin } from '@/integrations/supabase/supabaseAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserRole } from '@/types/auth';

// Mock useCurrentUserRole
vi.mock('@/hooks/useCurrentUserRole', () => ({
  useCurrentUserRole: vi.fn(),
}));

// Mock supabaseAdmin client
vi.mock('@/integrations/supabase/supabaseAdmin', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        listUsers: vi.fn(),
      },
    },
  },
}));

// Mock regular supabase client
const mockSupabaseSelectFn = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockImplementation(() => ({
      select: mockSupabaseSelectFn,
    })),
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

describe('useUserRoles - Authorization', () => {
  let queryClient: QueryClient;
  const mockedUseCurrentUserRole = useCurrentUserRole as Mock;
  let mockSupabaseAdminListUsers: Mock;

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
        },
        mutations: {
          retry: false,
        }
      },
    });

    vi.resetAllMocks();

    mockSupabaseAdminListUsers = supabaseAdmin.auth.admin.listUsers as Mock;
    mockSupabaseAdminListUsers.mockResolvedValue({ data: { users: [], aud: '', nextPageToken: null, total: 0 }, error: null });

    (supabase.from as Mock).mockImplementation(() => ({
      select: mockSupabaseSelectFn,
    }));
    
    mockSupabaseSelectFn.mockReturnThis();
    mockSupabaseSelectFn.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should be disabled and not loading if current user is not admin', async () => {
    mockedUseCurrentUserRole.mockReturnValue({
      status: 'ROLE_DETERMINED',
      isAdmin: false,
      role: 'editor' as UserRole,
      userId: 'editor-user-id',
      error: null,
    });

    const { result } = renderHook(() => useUserRoles(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false); 
      expect(result.current.userRoles).toBeUndefined(); 
    });
    expect(mockSupabaseAdminListUsers).not.toHaveBeenCalled();
  });

  it('should be loading if auth status is not ROLE_DETERMINED', async () => {
    mockedUseCurrentUserRole.mockReturnValue({
      status: 'FETCHING_ROLE',
      isAdmin: true, 
      role: null,
      userId: 'some-user-id',
      error: null,
    });
    const { result } = renderHook(() => useUserRoles(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.userRoles).toBeUndefined();
    expect(mockSupabaseAdminListUsers).not.toHaveBeenCalled();
  });
});
