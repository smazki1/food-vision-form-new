
/// <reference types="vitest/globals" />

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CurrentUserRoleProvider, useCurrentUserRole } from '../useCurrentUserRole';
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

describe('useCurrentUserRole - Role Determination', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (supabase.auth.onAuthStateChange as vi.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it('should transition to ROLE_DETERMINED with admin role', async () => {
    const mockSession = { user: { id: 'user-123' } };
    const mockAdminRole: UserRole = 'admin';
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({ data: { session: mockSession }, error: null });
    (supabase.rpc as vi.Mock).mockResolvedValue({ data: mockAdminRole, error: null });

    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.status).toBe('ROLE_DETERMINED'));
    
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
});
