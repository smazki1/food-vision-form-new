
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
import { User } from '@supabase/supabase-js';

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

describe('useUserRoles - Fetching', () => {
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

    (supabase.from as Mock).mockImplementation(() => ({
      select: mockSupabaseSelectFn,
    }));
    
    mockSupabaseSelectFn.mockReturnThis();
    mockSupabaseSelectFn.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch auth users and combine with roles from user_roles table', async () => {
    const mockAuthUsers: Partial<User>[] = [
      { id: 'user-1', email: 'user1@example.com', app_metadata: { role: 'editor_from_meta' }, user_metadata: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'user-2', email: 'user2@example.com', app_metadata: { role: 'viewer_from_meta' }, user_metadata: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'user-3', email: 'user3@example.com', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];
    const mockUserRoleTableRecords = [
      { user_id: 'user-1', role: 'editor_from_table' as UserRole, created_at: new Date().toISOString(), updated_at: null, id: 'role-1' },
      // user-2 has no record in user_roles table
    ];

    mockSupabaseAdminListUsers.mockResolvedValue({ 
      data: { users: mockAuthUsers as User[], aud:'', nextPageToken: null, total: mockAuthUsers.length }, 
      error: null 
    });
    // For supabase.from('user_roles').select('*')
    mockSupabaseSelectFn.mockResolvedValueOnce({ data: mockUserRoleTableRecords, error: null });
    
    const { result } = renderHook(() => useUserRoles(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 2000 });
    
    expect(result.current.error).toBeNull();
    expect(mockSupabaseAdminListUsers).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith('user_roles');
    expect(mockSupabaseSelectFn).toHaveBeenCalledWith('*');
    
    expect(result.current.userRoles?.users).toHaveLength(mockAuthUsers.length);
    const user1 = result.current.userRoles?.users.find(u => u.id === 'user-1');
    expect(user1?.role).toBe('editor_from_table');
    
    const user2 = result.current.userRoles?.users.find(u => u.id === 'user-2');
    expect(user2?.role).toBeUndefined(); 
    
    const user3 = result.current.userRoles?.users.find(u => u.id === 'user-3');
    expect(user3?.role).toBeUndefined();
  });
});
