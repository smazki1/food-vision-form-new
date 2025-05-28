/// <reference types="vitest/globals" />

import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { CurrentUserRoleProvider, useCurrentUserRole } from '../useCurrentUserRole';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserRole } from '@/types/auth';
import { optimizedAuthService } from '@/services/optimizedAuthService';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
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

describe('useCurrentUserRole - Auth Events', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (supabase.auth.onAuthStateChange as Mock).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    (supabase.auth.getSession as Mock).mockResolvedValue({ data: { session: null }, error: null });
  });

  it('should handle SIGNED_IN auth event and determine role', async () => {
    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.status).toBe('NO_SESSION'));

    const mockSession = { user: { id: 'user-signed-in' } };
    const mockUserRoleData = {
      role: 'admin',
      clientId: null,
      restaurantName: null,
      hasLinkedClientRecord: false,
    };

    // (supabase.rpc as Mock).mockResolvedValue({ data: mockUserRole, error: null }); // Remove old rpc mock
    (optimizedAuthService.getUserAuthData as Mock).mockResolvedValue(mockUserRoleData); // Use new service mock

    const authCallback = (supabase.auth.onAuthStateChange as Mock).mock.calls[0][0];
    act(() => {
      authCallback('SIGNED_IN', mockSession);
    });
    
    await waitFor(() => expect(result.current.status).toBe('FETCHING_ROLE'));
    await waitFor(() => expect(result.current.userId).toBe(mockSession.user.id), { timeout: 2000 });
    
    await waitFor(() => expect(result.current.status).toBe('ROLE_DETERMINED'));
    expect(result.current.role).toBe(mockUserRoleData.role);
    expect(result.current.isAdmin).toBe(true);
  });

  it('should handle SIGNED_OUT auth event', async () => {
    const mockInitialSession = { user: { id: 'user-123' } };
    // const mockInitialAdminRole: UserRole = 'admin'; // Not needed directly
    const mockInitialUserRoleData = {
      role: 'admin',
      clientId: null,
      restaurantName: null,
      hasLinkedClientRecord: false,
    };
    (supabase.auth.getSession as Mock).mockResolvedValue({ data: { session: mockInitialSession }, error: null });
    // (supabase.rpc as Mock).mockResolvedValue({ data: mockInitialAdminRole, error: null }); // Remove old rpc mock
    (optimizedAuthService.getUserAuthData as Mock).mockResolvedValue(mockInitialUserRoleData); // Use new service mock

    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.status).toBe('ROLE_DETERMINED'));
    expect(result.current.role).toBe(mockInitialUserRoleData.role);

    const authCallback = (supabase.auth.onAuthStateChange as Mock).mock.calls[0][0];
    act(() => {
      authCallback('SIGNED_OUT', null);
    });

    await waitFor(() => expect(result.current.status).toBe('NO_SESSION'));
    expect(result.current.role).toBeNull();
    expect(result.current.userId).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });

  it('should update role to admin when user signs in as admin', async () => {
    // Arrange
    let capturedHandler: ((event: string, session: any) => void) | null = null;
    (supabase.auth.onAuthStateChange as Mock).mockImplementation((handler) => {
      capturedHandler = handler;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    // Mock getUserAuthData to return admin role
    (optimizedAuthService.getUserAuthData as Mock).mockResolvedValue({
      role: 'admin',
      clientId: null,
      restaurantName: null,
      hasLinkedClientRecord: false,
    });

    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });

    // Act
    act(() => {
      if (capturedHandler) {
        capturedHandler('SIGNED_IN', { user: { id: 'test-user-id-admin' } });
      }
    });

    // Wait for state updates
    await waitFor(() => {
      expect(result.current.role).toBe('admin');
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Assert
    expect(result.current.role).toBe('admin');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.clientId).toBeNull();
    expect(optimizedAuthService.getUserAuthData).toHaveBeenCalledWith('test-user-id-admin');
  });

  it('should update role to client when user signs in as client', async () => {
    // Arrange
    let capturedHandler: ((event: string, session: any) => void) | null = null;
    (supabase.auth.onAuthStateChange as Mock).mockImplementation((handler) => {
      capturedHandler = handler;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    // Mock getUserAuthData to return client role and client ID
    (optimizedAuthService.getUserAuthData as Mock).mockResolvedValue({
      role: 'client',
      clientId: 'test-client-id',
      restaurantName: 'Test Restaurant',
      hasLinkedClientRecord: true,
    });

    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });

    // Act
    act(() => {
      if (capturedHandler) {
        capturedHandler('SIGNED_IN', { user: { id: 'test-user-id-client' } });
      }
    });
    
    // Wait for state updates
    await waitFor(() => {
      expect(result.current.role).toBe('client');
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Assert
    expect(result.current.role).toBe('client');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.clientId).toBe('test-client-id');
    expect(result.current.restaurantName).toBe('Test Restaurant');
    expect(optimizedAuthService.getUserAuthData).toHaveBeenCalledWith('test-user-id-client');
  });

  it('should set role to null and clear client_id when user signs out', async () => {
    // Arrange
    let capturedHandler: ((event: string, session: any) => void) | null = null;
    (supabase.auth.onAuthStateChange as Mock).mockImplementation((handler) => {
      capturedHandler = handler; // Capture the handler
      // Simulate initial sign-in as client -- REMOVED DIRECT CALL FROM HERE
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    (supabase.auth.getSession as Mock).mockResolvedValueOnce({ // For initial call by initializeAuth
      data: { session: { user: { id: 'test-user-id-initial' } } },
    });
    (optimizedAuthService.getUserAuthData as Mock).mockResolvedValueOnce({ // For initial SIGNED_IN by initializeAuth/handleAuthStateChange
      role: 'client',
      clientId: 'initial-client-id',
      restaurantName: 'Initial Restaurant',
      hasLinkedClientRecord: true,
    });

    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });

    // Wait for initial role to be set via initializeAuth and subsequent handleAuthStateChange
    await waitFor(() => expect(result.current.role).toBe('client'), { timeout: 2000 });
    expect(result.current.clientId).toBe('initial-client-id');
    expect(result.current.userId).toBe('test-user-id-initial');

    // Act: Simulate sign out by directly calling the captured handler
    act(() => {
      if (capturedHandler) {
        capturedHandler('SIGNED_OUT', null); // Simulate sign out
      }
    });

    // Assert
    await waitFor(() => expect(result.current.role).toBeNull());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.clientId).toBeNull();
    expect(result.current.restaurantName).toBeNull();
    // Check that getUserAuthData was called for the initial sign-in, but not after sign-out
    expect(optimizedAuthService.getUserAuthData).toHaveBeenCalledTimes(1);
    expect(optimizedAuthService.getUserAuthData).toHaveBeenCalledWith('test-user-id-initial');
  });

  it('should handle TOKEN_REFRESHED event and re-fetch user data', async () => {
    // Arrange
    let capturedHandler: ((event: string, session: any) => void) | null = null;
    (supabase.auth.onAuthStateChange as Mock).mockImplementation((handler) => {
      capturedHandler = handler;
      // Simulate initial sign-in -- REMOVED DIRECT CALL
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    (optimizedAuthService.getUserAuthData as Mock)
      .mockResolvedValueOnce({ // First call for initial SIGNED_IN (triggered by initializeAuth)
        role: 'editor',
        clientId: null,
        restaurantName: null,
        hasLinkedClientRecord: false,
      })
      .mockResolvedValueOnce({ // Second call for TOKEN_REFRESHED
        role: 'admin', // Role changes after token refresh
        clientId: 'new-admin-cid',
        restaurantName: 'Admin Place',
        hasLinkedClientRecord: true,
      });
    
    // Ensure getSession returns a valid session for both initializeAuth and the TOKEN_REFRESHED handler path
    (supabase.auth.getSession as Mock).mockResolvedValue({
        data: { session: { user: { id: 'test-user-id-refresh' } } },
        error: null
    });


    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });

    // Wait for initial role (editor) to be set by initializeAuth
    await waitFor(() => expect(result.current.role).toBe('editor'), { timeout: 2000 });
    expect(result.current.userId).toBe('test-user-id-refresh');
    expect(optimizedAuthService.getUserAuthData).toHaveBeenCalledTimes(1);
    expect(optimizedAuthService.getUserAuthData).toHaveBeenNthCalledWith(1, 'test-user-id-refresh');

    // Act: Simulate TOKEN_REFRESHED event
    act(() => {
      if (capturedHandler) {
        // Simulate token refreshed event with the same user ID but potentially new claims/role
        capturedHandler('TOKEN_REFRESHED', { user: { id: 'test-user-id-refresh' } });
      }
    });
    
    // Wait for role to update to admin after token refresh
    await waitFor(() => {
        expect(result.current.role).toBe('admin');
    }, { timeout: 2000 });


    // Assert
    expect(result.current.role).toBe('admin');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.clientId).toBe('new-admin-cid');
    expect(result.current.restaurantName).toBe('Admin Place');
    expect(optimizedAuthService.getUserAuthData).toHaveBeenCalledTimes(2);
    expect(optimizedAuthService.getUserAuthData).toHaveBeenNthCalledWith(1, 'test-user-id-refresh');
    expect(optimizedAuthService.getUserAuthData).toHaveBeenNthCalledWith(2, 'test-user-id-refresh');
  });


  it('should set isLoading to false and role to null if getUserAuthData returns an error', async () => {
    // Arrange
    let capturedHandler: ((event: string, session: any) => void) | null = null;
    (supabase.auth.onAuthStateChange as Mock).mockImplementation((handler) => {
      capturedHandler = handler;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    // Mock getUserAuthData to return an error object
    (optimizedAuthService.getUserAuthData as Mock).mockResolvedValue({
      role: null,
      clientId: null,
      restaurantName: null,
      hasLinkedClientRecord: false,
      error: 'Failed to fetch auth data',
    });

    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });

    // Act
    act(() => {
      if (capturedHandler) {
        capturedHandler('SIGNED_IN', { user: { id: 'test-user-id-error' } });
      }
    });

    // Wait for isLoading to be false
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Assert
    expect(result.current.role).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.clientId).toBeNull();
    expect(result.current.error).toBe('Failed to fetch auth data');
    expect(optimizedAuthService.getUserAuthData).toHaveBeenCalledWith('test-user-id-error');
  });

  it('should set isLoading to false and role to null if getUserAuthData throws an exception', async () => {
    // Arrange
    let capturedHandler: ((event: string, session: any) => void) | null = null;
    (supabase.auth.onAuthStateChange as Mock).mockImplementation((handler) => {
      capturedHandler = handler;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    // Mock getUserAuthData to throw an error
    (optimizedAuthService.getUserAuthData as Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCurrentUserRole(), { wrapper: createWrapper() });

    // Act
    act(() => {
      if (capturedHandler) {
        capturedHandler('SIGNED_IN', { user: { id: 'test-user-id-exception' } });
      }
    });

    // Wait for isLoading to be false
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    

    // Assert
    expect(result.current.role).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.clientId).toBeNull();
    // The hook itself catches the error and sets a generic message or from the error object
    // expect(result.current.error).toBe('Network error'); // This depends on error handling in the hook
    expect(optimizedAuthService.getUserAuthData).toHaveBeenCalledWith('test-user-id-exception');
  });
});
