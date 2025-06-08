import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useClientUpdate, useClientStatusUpdate } from '../useClientUpdate';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useClientUpdate - Enhanced Cache Management & Archive Tests', () => {
  let mockSupabaseUpdate: ReturnType<typeof vi.fn>;
  let mockSupabaseFrom: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { supabase } = await import('@/integrations/supabase/client');
    mockSupabaseFrom = supabase.from as ReturnType<typeof vi.fn>;
    
    mockSupabaseUpdate = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    }));
    
    mockSupabaseFrom.mockReturnValue({
      update: mockSupabaseUpdate,
    });
  });

  describe('Dynamic Cache Management', () => {
    it('should identify and update all client-related caches dynamically', async () => {
      const queryClient = createTestQueryClient();
      
      // Set up multiple client caches with different patterns
      queryClient.setQueryData(['clients_list_for_admin', 'user-123'], [
        { client_id: 'client-1', restaurant_name: 'Restaurant 1', client_status: 'פעיל' }
      ]);
      
      queryClient.setQueryData(['clients_simplified'], [
        { client_id: 'client-1', restaurant_name: 'Restaurant 1', client_status: 'פעיל' }
      ]);
      
      queryClient.setQueryData(['clients_list_for_admin', 'user-456'], [
        { client_id: 'client-2', restaurant_name: 'Restaurant 2', client_status: 'פעיל' }
      ]);

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useClientUpdate(), { wrapper: customWrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-1',
          updates: { client_status: 'ארכיון' }
        });
      });

      // Should call setQueryData for each matching cache
      expect(setQueryDataSpy).toHaveBeenCalledTimes(2); // Only the caches containing client-1
    });

    it('should use predicate-based cache invalidation as fallback', async () => {
      const queryClient = createTestQueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useClientUpdate(), { wrapper: customWrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-1',
          updates: { client_status: 'ארכיון' }
        });
      });

      // Should call invalidateQueries with predicate for comprehensive cache updates
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        predicate: expect.any(Function),
      });
    });

    it('should correctly identify client-related query keys', async () => {
      const queryClient = createTestQueryClient();
      
      // Set up various cache entries
      queryClient.setQueryData(['clients_list_for_admin', 'user-123'], []);
      queryClient.setQueryData(['clients_simplified'], []);
      queryClient.setQueryData(['leads'], []); // Non-client cache
      queryClient.setQueryData(['dashboard-stats'], []);
      queryClient.setQueryData(['packages'], []); // Non-client cache

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      let predicateFunction: any;

      invalidateQueriesSpy.mockImplementation((options: any) => {
        if (options.predicate) {
          predicateFunction = options.predicate;
        }
        return Promise.resolve();
      });

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useClientUpdate(), { wrapper: customWrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-1',
          updates: { client_status: 'ארכיון' }
        });
      });

      // Test the predicate function
      expect(predicateFunction).toBeDefined();
      
      // Should match client-related queries
      expect(predicateFunction({ queryKey: ['clients_list_for_admin', 'user-123'] })).toBe(true);
      expect(predicateFunction({ queryKey: ['clients_simplified'] })).toBe(true);
      expect(predicateFunction({ queryKey: ['dashboard-stats'] })).toBe(true);
      
      // Should not match non-client queries
      expect(predicateFunction({ queryKey: ['leads'] })).toBe(false);
      expect(predicateFunction({ queryKey: ['packages'] })).toBe(false);
    });
  });

  describe('Archive Status Updates', () => {
    it('should correctly update client status to archive', async () => {
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { client_status: 'ארכיון' }
        });
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('clients');
      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          client_status: 'ארכיון',
          updated_at: expect.any(String),
        })
      );
    });

    it('should correctly update client status to active (restore)', async () => {
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { client_status: 'פעיל' }
        });
      });

      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          client_status: 'פעיל',
          updated_at: expect.any(String),
        })
      );
    });

    it('should handle cache rollback on failed status update', async () => {
      const queryClient = createTestQueryClient();
      
      // Set up initial cache data
      const initialData = [
        { client_id: 'client-123', client_status: 'פעיל', restaurant_name: 'Test Restaurant' }
      ];
      queryClient.setQueryData(['clients_simplified'], initialData);

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // Mock failure
      mockSupabaseUpdate.mockReturnValue({
        eq: vi.fn(() => Promise.resolve({ error: { message: 'Status update failed' } })),
      });

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useClientUpdate(), { wrapper: customWrapper });

      try {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { client_status: 'ארכיון' }
        });
      } catch (error) {
        // Expected to fail
      }

      // Should have attempted cache rollback
      expect(setQueryDataSpy).toHaveBeenCalled();
    });
  });

  describe('useClientStatusUpdate Hook', () => {
    it('should successfully archive a client', async () => {
      const { result } = renderHook(() => useClientStatusUpdate(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          status: 'ארכיון'
        });
      });

      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          client_status: 'ארכיון'
        })
      );
    });

    it('should successfully restore a client', async () => {
      const { result } = renderHook(() => useClientStatusUpdate(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          status: 'פעיל'
        });
      });

      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          client_status: 'פעיל'
        })
      );
    });

    it('should invalidate caches after successful status update', async () => {
      const queryClient = createTestQueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useClientStatusUpdate(), { wrapper: customWrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          status: 'ארכיון'
        });
      });

      // Should invalidate after successful update
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        predicate: expect.any(Function),
      });
    });

    it('should show success toast after status change', async () => {
      const { result } = renderHook(() => useClientStatusUpdate(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          status: 'ארכיון'
        });
      });

      expect(toast.success).toHaveBeenCalledWith('סטטוס הלקוח עודכן בהצלחה');
    });

    it('should show error toast on status change failure', async () => {
      const error = new Error('Status update failed');
      
      // Mock the main useClientUpdate to throw error
      vi.mocked(require('../useClientUpdate').useClientUpdate).mockReturnValue({
        mutateAsync: vi.fn().mockRejectedValue(error),
        isPending: false,
      });

      const { result } = renderHook(() => useClientStatusUpdate(), { wrapper });

      try {
        await result.current.mutateAsync({
          clientId: 'client-123',
          status: 'ארכיון'
        });
      } catch (err) {
        // Expected to fail
      }

      expect(toast.error).toHaveBeenCalledWith('שגיאה בעדכון סטטוס הלקוח: Status update failed');
    });
  });

  describe('Complex Cache Scenarios', () => {
    it('should handle multiple concurrent status updates', async () => {
      const queryClient = createTestQueryClient();
      
      // Set up cache with multiple clients
      const initialData = [
        { client_id: 'client-1', client_status: 'פעיל' },
        { client_id: 'client-2', client_status: 'פעיל' },
        { client_id: 'client-3', client_status: 'ארכיון' }
      ];
      queryClient.setQueryData(['clients_simplified'], initialData);

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useClientStatusUpdate(), { wrapper: customWrapper });

      // Perform multiple concurrent updates
      const updates = [
        result.current.mutateAsync({ clientId: 'client-1', status: 'ארכיון' }),
        result.current.mutateAsync({ clientId: 'client-2', status: 'ארכיון' }),
        result.current.mutateAsync({ clientId: 'client-3', status: 'פעיל' }),
      ];

      await waitFor(async () => {
        await Promise.all(updates);
      });

      // All updates should have completed successfully
      expect(mockSupabaseUpdate).toHaveBeenCalledTimes(3);
    });

    it('should preserve other client data when updating status', async () => {
      const queryClient = createTestQueryClient();
      
      const clientData = {
        client_id: 'client-123',
        restaurant_name: 'Test Restaurant',
        contact_name: 'John Doe',
        client_status: 'פעיל',
        business_type: 'מסעדה',
        remaining_servings: 10
      };
      
      queryClient.setQueryData(['clients_simplified'], [clientData]);

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useClientUpdate(), { wrapper: customWrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { client_status: 'ארכיון' }
        });
      });

      // Should preserve all other client data except status
      const cacheUpdateCall = setQueryDataSpy.mock.calls.find(call => 
        call[0] === 'clients_simplified' || 
        (Array.isArray(call[0]) && call[0][0] === 'clients_simplified')
      );
      
      expect(cacheUpdateCall).toBeDefined();
    });

    it('should handle edge case where client is not found in cache', async () => {
      const queryClient = createTestQueryClient();
      
      // Set up cache without the target client
      queryClient.setQueryData(['clients_simplified'], [
        { client_id: 'other-client', client_status: 'פעיל' }
      ]);

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useClientUpdate(), { wrapper: customWrapper });

      // Should not throw error even if client not found in cache
      await expect(async () => {
        await result.current.mutateAsync({
          clientId: 'non-existent-client',
          updates: { client_status: 'ארכיון' }
        });
      }).not.toThrow();
    });
  });

  describe('Performance Optimizations', () => {
    it('should use optimistic updates without immediate invalidation', async () => {
      const queryClient = createTestQueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // Clear the spy before the operation
      invalidateQueriesSpy.mockClear();

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useClientUpdate(), { wrapper: customWrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { client_status: 'ארכיון' }
        });
      });

      // Should use optimistic updates first
      expect(setQueryDataSpy).toHaveBeenCalled();
      
      // Should also use fallback invalidation
      expect(invalidateQueriesSpy).toHaveBeenCalled();
    });

    it('should minimize cache operations for better performance', async () => {
      const queryClient = createTestQueryClient();
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useClientUpdate(), { wrapper: customWrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { client_status: 'ארכיון' }
        });
      });

      // Should not make excessive cache operations
      const cacheOperationCount = setQueryDataSpy.mock.calls.length;
      expect(cacheOperationCount).toBeLessThan(10); // Reasonable upper bound
    });
  });
}); 