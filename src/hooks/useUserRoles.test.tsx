/// <reference types="vitest/globals" />

import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock, MockedFunction } from 'vitest';
import { useUserRoles } from './useUserRoles';
import { supabaseAdmin } from '@/integrations/supabase/supabaseAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserRole, UserWithRole } from '@/types/auth';
import { User } from '@supabase/supabase-js';

// Mock useCurrentUserRole
vi.mock('@/hooks/useCurrentUserRole.tsx', () => ({
  useCurrentUserRole: vi.fn(),
}));

// Mock supabaseAdmin client
vi.mock('@/integrations/supabase/supabaseAdmin', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        listUsers: vi.fn(),
        updateUserById: vi.fn(),
      },
    },
  },
}));

// Mock regular supabase client for mutations and user_roles fetch
const mockSupabaseSelectFn = vi.fn();
const mockSupabaseUpdateFn = vi.fn();
const mockSupabaseInsertFn = vi.fn();
const mockSupabaseDeleteFn = vi.fn();
const mockSupabaseEqFn = vi.fn();
const mockSupabaseMaybeSingleFn = vi.fn();
const mockSupabaseSingleFn = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockImplementation(() => ({
      select: mockSupabaseSelectFn,
      update: mockSupabaseUpdateFn,
      insert: mockSupabaseInsertFn,
      delete: mockSupabaseDeleteFn,
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

describe('useUserRoles', () => {
  let queryClient: QueryClient;
  const mockedUseCurrentUserRole = useCurrentUserRole as Mock;
  
  // Admin client mocks (primarily for fetching)
  let mockSupabaseAdminListUsers: Mock;

  // Individual Supabase chained method mocks (already defined above the vi.mock)
  // We will re-assign them in beforeEach to reset them and set default behaviors

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

    vi.resetAllMocks(); // This resets the vi.fn() mocks defined globally for supabase.from().<method>

    mockedUseCurrentUserRole.mockReturnValue({
      status: 'ROLE_DETERMINED',
      isAdmin: true,
      role: 'admin' as UserRole,
      userId: 'admin-user-id',
      error: null,
    });

    mockSupabaseAdminListUsers = supabaseAdmin.auth.admin.listUsers as Mock;
    mockSupabaseAdminListUsers.mockResolvedValue({ data: { users: [], aud: '', nextPageToken: null, total: 0 }, error: null });

    // Reset and configure default behavior for chained mocks from regular supabase client
    (supabase.from as Mock).mockImplementation(() => ({
        select: mockSupabaseSelectFn,
        update: mockSupabaseUpdateFn,
        insert: mockSupabaseInsertFn,
        delete: mockSupabaseDeleteFn,
        eq: mockSupabaseEqFn,
        maybeSingle: mockSupabaseMaybeSingleFn,
        single: mockSupabaseSingleFn,
    }));
    
    mockSupabaseSelectFn.mockReturnThis();
    mockSupabaseUpdateFn.mockReturnThis();
    mockSupabaseInsertFn.mockReturnThis();
    mockSupabaseDeleteFn.mockReturnThis();
    mockSupabaseEqFn.mockReturnThis();
    
    mockSupabaseMaybeSingleFn.mockResolvedValue({ data: null, error: null });
    mockSupabaseSingleFn.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Authorization Checks', () => {
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

  describe('Fetching User Roles', () => {
    const mockAuthUsers: Partial<User>[] = [
      { id: 'user-1', email: 'user1@example.com', app_metadata: { role: 'editor_from_meta' }, user_metadata: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'user-2', email: 'user2@example.com', app_metadata: { role: 'viewer_from_meta' }, user_metadata: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'user-3', email: 'user3@example.com', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];
    const mockUserRoleTableRecords = [
      { user_id: 'user-1', role: 'editor_from_table' as UserRole, created_at: new Date().toISOString(), updated_at: null, id: 'role-1' },
      // user-2 has no record in user_roles table
    ];

    it('should fetch auth users and combine with roles from user_roles table', async () => {
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

    it.skip('should handle error when fetching auth users', async () => {
      const authError = { message: 'Auth error', name: 'AuthError', status: 500 };
      mockSupabaseAdminListUsers.mockResolvedValue({ data: { users: [], aud: '', nextPageToken: null, total: 0 }, error: authError as any });
      
      const { result } = renderHook(() => useUserRoles(), { wrapper: createWrapper() }); 
      
      await waitFor(() => expect(result.current.error).not.toBeNull());
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error?.message).toBe('Auth error');
      expect(result.current.userRoles).toBeUndefined();
    });

    it.skip('should handle error when fetching from user_roles table', async () => {
      const rolesError = { message: 'Roles error', code: 'PGRST116', details: '', hint: '' };
      mockSupabaseAdminListUsers.mockResolvedValue({ 
        data: { users: mockAuthUsers as User[], aud:'', nextPageToken: null, total: mockAuthUsers.length }, 
        error: null 
      });
      mockSupabaseSelectFn.mockReset().mockResolvedValue({ data: null, error: rolesError });

      const { result } = renderHook(() => useUserRoles(), { wrapper: createWrapper() }); 

      await waitFor(() => expect(result.current.error).not.toBeNull());
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error?.message).toBe('Roles error');
      expect(result.current.userRoles).toBeUndefined();
    });
  });

  describe('assignRole mutation', () => {
    const userIdToUpdate = 'user-assign-role';
    const newRole: UserRole = 'editor';

    it('should insert new role if user does not have one', async () => {
      mockSupabaseMaybeSingleFn.mockResolvedValue({ data: null, error: null }); 
      mockSupabaseSingleFn.mockResolvedValue({ data: { user_id: userIdToUpdate, role: newRole }, error: null }); 

      const { result } = renderHook(() => useUserRoles(), { wrapper: createWrapper() });
      await act(async () => {
        await result.current.assignRole.mutateAsync({ userId: userIdToUpdate, role: newRole });
      });

      expect(supabase.from).toHaveBeenCalledWith('user_roles');
      // First call to user_roles for select().eq().maybeSingle()
      expect(mockSupabaseSelectFn).toHaveBeenCalledWith('user_id');
      expect(mockSupabaseEqFn).toHaveBeenCalledWith('user_id', userIdToUpdate);
      expect(mockSupabaseMaybeSingleFn).toHaveBeenCalledTimes(1);
      // Second call to user_roles for insert().select().single()
      expect(mockSupabaseInsertFn).toHaveBeenCalledWith(expect.objectContaining({ user_id: userIdToUpdate, role: newRole }));
      expect(mockSupabaseSelectFn).toHaveBeenCalledWith('user_id, role'); // After insert
      expect(mockSupabaseSingleFn).toHaveBeenCalledTimes(1); // After insert

      expect(mockSupabaseUpdateFn).not.toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining(`תפקיד המשתמש ל ID: ${userIdToUpdate} עודכן ל: ${newRole}`));
    });

    it('should update existing role if user has one', async () => {
      const existingRoleRecord = { user_id: userIdToUpdate, role: 'viewer' as UserRole };
      mockSupabaseMaybeSingleFn.mockResolvedValue({ data: existingRoleRecord, error: null }); 
      mockSupabaseSingleFn.mockResolvedValue({ data: { user_id: userIdToUpdate, role: newRole }, error: null }); 

      const { result } = renderHook(() => useUserRoles(), { wrapper: createWrapper() });
      await act(async () => {
        await result.current.assignRole.mutateAsync({ userId: userIdToUpdate, role: newRole });
      });

      expect(supabase.from).toHaveBeenCalledWith('user_roles');
       // First call to user_roles for select().eq().maybeSingle()
      expect(mockSupabaseSelectFn).toHaveBeenCalledWith('user_id');
      expect(mockSupabaseEqFn).toHaveBeenCalledWith('user_id', userIdToUpdate);
      expect(mockSupabaseMaybeSingleFn).toHaveBeenCalledTimes(1);
      // Second call to user_roles for update().eq().select().single()
      expect(mockSupabaseUpdateFn).toHaveBeenCalledWith(expect.objectContaining({ role: newRole }));
      expect(mockSupabaseEqFn).toHaveBeenCalledWith('user_id', userIdToUpdate); // Called again for update
      expect(mockSupabaseSelectFn).toHaveBeenCalledWith('user_id, role'); // After update
      expect(mockSupabaseSingleFn).toHaveBeenCalledTimes(1); // After update

      expect(mockSupabaseInsertFn).not.toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining(`תפקיד המשתמש ל ID: ${userIdToUpdate} עודכן ל: ${newRole}`));
    });

    it('should handle error when fetching existing role during assign', async () => {
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

    it('should handle error when inserting role during assign', async () => {
      const insertError = { message: 'Insert error', code: '123' };
      mockSupabaseMaybeSingleFn.mockResolvedValue({ data: null, error: null }); 
      mockSupabaseSingleFn.mockReset().mockResolvedValue({ data: null, error: insertError }); 

      const { result } = renderHook(() => useUserRoles(), { wrapper: createWrapper() });
      await act(async () => {
        try {
          await result.current.assignRole.mutateAsync({ userId: userIdToUpdate, role: newRole });
        } catch (e) {
          // Expected error
        }
      });
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('שגיאה בעדכון תפקיד המשתמש: Insert error'));
    });

     it('should handle error when updating role during assign', async () => {
      const updateError = { message: 'Update error', code: '123' };
      const existingRoleRecord = { user_id: userIdToUpdate, role: 'viewer' as UserRole };
      mockSupabaseMaybeSingleFn.mockResolvedValue({ data: existingRoleRecord, error: null });
      mockSupabaseSingleFn.mockReset().mockResolvedValue({ data: null, error: updateError }); 

      const { result } = renderHook(() => useUserRoles(), { wrapper: createWrapper() });
      await act(async () => {
        try {
          await result.current.assignRole.mutateAsync({ userId: userIdToUpdate, role: newRole });
        } catch (e) {
          // Expected error
        }
      });
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('שגיאה בעדכון תפקיד המשתמש: Update error'));
    });
  });

  describe('removeRole mutation', () => {
    const userIdToRemoveRole = 'user-remove-role';

    it('should successfully remove role', async () => {
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
}); 