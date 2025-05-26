
/// <reference types="vitest/globals" />

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { useUserRoles } from '../useUserRoles';
import { supabaseAdmin } from '@/integrations/supabase/supabaseAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
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

// Mock regular supabase client for mutations
const mockSupabaseSelectFn = vi.fn();
const mockSupabaseDeleteFn = vi.fn();
const mockSupabaseEqFn = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockImplementation(() => ({
      select: mockSupabaseSelectFn,
      delete: mockSupabaseDeleteFn,
      eq: mockSupabaseEqFn,
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

describe('useUserRoles - Remove Role', () => {
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

    mockedUseCurrentUserRole.mockReturnValue({
      status: 'ROLE_DETERMINED',
      isAdmin: true,
      role: 'admin' as UserRole,
      userId: 'admin-user-id',
      error: null,
    });

    mockSupabaseAdminListUsers = supabaseAdmin.auth.admin.listUsers as Mock;
    mockSupabaseAdminListUsers.mockResolvedValue({ data: { users: [], aud: '', nextPageToken: null, total: 0 }, error: null });

    // Reset and configure default behavior for chained mocks
    (supabase.from as Mock).mockImplementation(() => ({
        select: mockSupabaseSelectFn,
        delete: mockSupabaseDeleteFn,
        eq: mockSupabaseEqFn,
    }));
    
    mockSupabaseSelectFn.mockReturnThis();
    mockSupabaseDeleteFn.mockReturnThis();
    mockSupabaseEqFn.mockReturnThis();
    
    mockSupabaseSelectFn.mockResolvedValue({ data: [], error: null });
    mockSupabaseEqFn.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should successfully remove role', async () => {
    const userIdToRemoveRole = 'user-remove-role';

    mockSupabaseEqFn.mockResolvedValue({ error: null }); 

    const { result } = renderHook(() => useUserRoles(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.removeRole.mutateAsync(userIdToRemoveRole);
    });

    expect(supabase.from).toHaveBeenCalledWith('user_roles');
    expect(mockSupabaseDeleteFn).toHaveBeenCalled();
    expect(mockSupabaseEqFn).toHaveBeenCalledWith('user_id', userIdToRemoveRole);
    expect(toast.success).toHaveBeenCalledWith(`תפקיד הוסר ממשתמש ID: ${userIdToRemoveRole}`);
  });

  it('should handle error when deleting role', async () => {
    const userIdToRemoveRole = 'user-remove-role';
    const deleteError = { message: 'Delete error', code: '123' };

    mockSupabaseEqFn.mockReset().mockResolvedValue({ error: deleteError });

    const { result } = renderHook(() => useUserRoles(), { wrapper: createWrapper() });
    await act(async () => {
      try {
        await result.current.removeRole.mutateAsync(userIdToRemoveRole);
      } catch (e) {
        // Expected error
      }
    });
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('שגיאה בהסרת תפקיד המשתמש: Delete error'));
  });
});
