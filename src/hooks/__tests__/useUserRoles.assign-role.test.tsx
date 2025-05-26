
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
const mockSupabaseUpdateFn = vi.fn();
const mockSupabaseInsertFn = vi.fn();
const mockSupabaseEqFn = vi.fn();
const mockSupabaseMaybeSingleFn = vi.fn();
const mockSupabaseSingleFn = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockImplementation(() => ({
      select: mockSupabaseSelectFn,
      update: mockSupabaseUpdateFn,
      insert: mockSupabaseInsertFn,
      eq: mockSupabaseEqFn,
      maybeSingle: mockSupabaseMaybeSingleFn,
      single: mockSupabaseSingleFn,
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

describe('useUserRoles - Assign Role', () => {
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
        update: mockSupabaseUpdateFn,
        insert: mockSupabaseInsertFn,
        eq: mockSupabaseEqFn,
        maybeSingle: mockSupabaseMaybeSingleFn,
        single: mockSupabaseSingleFn,
    }));
    
    mockSupabaseSelectFn.mockReturnThis();
    mockSupabaseUpdateFn.mockReturnThis();
    mockSupabaseInsertFn.mockReturnThis();
    mockSupabaseEqFn.mockReturnThis();
    
    mockSupabaseMaybeSingleFn.mockResolvedValue({ data: null, error: null });
    mockSupabaseSingleFn.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should insert new role if user does not have one', async () => {
    const userIdToUpdate = 'user-assign-role';
    const newRole: UserRole = 'editor';

    mockSupabaseMaybeSingleFn.mockResolvedValue({ data: null, error: null }); 
    mockSupabaseSingleFn.mockResolvedValue({ data: { user_id: userIdToUpdate, role: newRole }, error: null }); 

    const { result } = renderHook(() => useUserRoles(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.assignRole.mutateAsync({ userId: userIdToUpdate, role: newRole });
    });

    expect(supabase.from).toHaveBeenCalledWith('user_roles');
    expect(mockSupabaseSelectFn).toHaveBeenCalledWith('user_id');
    expect(mockSupabaseEqFn).toHaveBeenCalledWith('user_id', userIdToUpdate);
    expect(mockSupabaseMaybeSingleFn).toHaveBeenCalledTimes(1);
    expect(mockSupabaseInsertFn).toHaveBeenCalledWith(expect.objectContaining({ user_id: userIdToUpdate, role: newRole }));
    expect(mockSupabaseSelectFn).toHaveBeenCalledWith('user_id, role');
    expect(mockSupabaseSingleFn).toHaveBeenCalledTimes(1);

    expect(mockSupabaseUpdateFn).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining(`תפקיד המשתמש ל ID: ${userIdToUpdate} עודכן ל: ${newRole}`));
  });

  it('should update existing role if user has one', async () => {
    const userIdToUpdate = 'user-assign-role';
    const newRole: UserRole = 'editor';
    const existingRoleRecord = { user_id: userIdToUpdate, role: 'account_manager' as UserRole };

    mockSupabaseMaybeSingleFn.mockResolvedValue({ data: existingRoleRecord, error: null }); 
    mockSupabaseSingleFn.mockResolvedValue({ data: { user_id: userIdToUpdate, role: newRole }, error: null }); 

    const { result } = renderHook(() => useUserRoles(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.assignRole.mutateAsync({ userId: userIdToUpdate, role: newRole });
    });

    expect(supabase.from).toHaveBeenCalledWith('user_roles');
    expect(mockSupabaseSelectFn).toHaveBeenCalledWith('user_id');
    expect(mockSupabaseEqFn).toHaveBeenCalledWith('user_id', userIdToUpdate);
    expect(mockSupabaseMaybeSingleFn).toHaveBeenCalledTimes(1);
    expect(mockSupabaseUpdateFn).toHaveBeenCalledWith(expect.objectContaining({ role: newRole }));
    expect(mockSupabaseEqFn).toHaveBeenCalledWith('user_id', userIdToUpdate);
    expect(mockSupabaseSelectFn).toHaveBeenCalledWith('user_id, role');
    expect(mockSupabaseSingleFn).toHaveBeenCalledTimes(1);

    expect(mockSupabaseInsertFn).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining(`תפקיד המשתמש ל ID: ${userIdToUpdate} עודכן ל: ${newRole}`));
  });

  it('should handle error when fetching existing role during assign', async () => {
    const userIdToUpdate = 'user-assign-role';
    const newRole: UserRole = 'editor';
    const fetchError = { message: 'Fetch error', code: '123' };

    mockSupabaseMaybeSingleFn.mockResolvedValue({ data: null, error: fetchError });
    
    const { result } = renderHook(() => useUserRoles(), { wrapper: createWrapper() });
    await act(async () => {
      try {
        await result.current.assignRole.mutateAsync({ userId: userIdToUpdate, role: newRole });
      } catch (e) {
        // Expected error
      }
    });
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('שגיאה בעדכון תפקיד המשתמש: Fetch error'));
  });
});
