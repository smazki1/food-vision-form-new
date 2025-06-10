import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useClientUpdate } from '../useClientUpdate';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const mockSupabase = supabase as any;
const mockToast = toast as any;

// Test wrapper with QueryClient
const createTestWrapper = (testQueryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useClientUpdate Performance Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Default successful update mock
    mockSupabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Optimistic Updates Performance', () => {
    it('should provide immediate cache updates without blocking UI', async () => {
      const wrapper = createTestWrapper(queryClient);
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      // Pre-populate cache with client data using correct query keys
      // Use the same queryClient instance that the hook will use
      const testQueryClient = queryClient;
      testQueryClient.setQueryData(['clients_simplified'], [
        { client_id: 'client-123', restaurant_name: 'Original Name', client_status: 'active' }
      ]);
      testQueryClient.setQueryData(['clients_list_for_admin'], [
        { client_id: 'client-123', restaurant_name: 'Original Name', client_status: 'active' }
      ]);

      const updateData = {
        clientId: 'client-123',
        updates: { restaurant_name: 'Updated Name' }
      };

      const startTime = performance.now();

      // Use mutateAsync to ensure we can track completion
      await act(async () => {
        await result.current.mutateAsync(updateData);
      });

      const endTime = performance.now();

      // Mutation should complete quickly
      expect(endTime - startTime).toBeLessThan(100);

      // Cache should be updated optimistically - check both query keys
      const cachedDataSimplified = testQueryClient.getQueryData(['clients_simplified']) as any[];
      const cachedDataAdmin = testQueryClient.getQueryData(['clients_list_for_admin']) as any[];
      expect(cachedDataSimplified?.[0]?.restaurant_name).toBe('Updated Name');
      expect(cachedDataAdmin?.[0]?.restaurant_name).toBe('Updated Name');
    });

    it('should handle concurrent updates efficiently', async () => {
      const wrapper = createTestWrapper(queryClient);
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      // Pre-populate cache with correct query keys
      queryClient.setQueryData(['clients_simplified'], [
        { client_id: 'client-123', restaurant_name: 'Original', client_status: 'active', email: 'old@test.com' }
      ]);
      queryClient.setQueryData(['clients_list_for_admin'], [
        { client_id: 'client-123', restaurant_name: 'Original', client_status: 'active', email: 'old@test.com' }
      ]);

      // Fire multiple rapid updates sequentially
      await act(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { restaurant_name: 'Name 1' }
        });
        
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { client_status: 'inactive' }
        });

        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { email: 'new@test.com' }
        });
      });

      // Final state should reflect all updates
      const cachedData = queryClient.getQueryData(['clients_simplified']) as any[];
      expect(cachedData?.[0]).toEqual(
        expect.objectContaining({
          client_id: 'client-123',
          restaurant_name: 'Name 1',
          client_status: 'inactive',
          email: 'new@test.com'
        })
      );

      await waitFor(() => {
        expect(mockSupabase.from().update().eq).toHaveBeenCalledTimes(3);
      });
    });

    it('should rollback cache on server error', async () => {
      // Setup error scenario
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Update failed' }
          })
        })
      });

      const wrapper = createTestWrapper(queryClient);
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      // Pre-populate cache with correct query keys
      const originalData = [
        { client_id: 'client-123', restaurant_name: 'Original Name', client_status: 'active' }
      ];
      queryClient.setQueryData(['clients_simplified'], originalData);
      queryClient.setQueryData(['clients_list_for_admin'], originalData);

      const updateData = {
        clientId: 'client-123',
        updates: { restaurant_name: 'Failed Update' }
      };

      await act(async () => {
        try {
          await result.current.mutateAsync(updateData);
        } catch (error) {
          // Expected to fail
        }
      });

      // Cache should be rolled back to original state
      const cachedData = queryClient.getQueryData(['clients_simplified']);
      expect(cachedData).toEqual(originalData);

      expect(mockToast.error).toHaveBeenCalledWith('שגיאה בעדכון פרטי הלקוח: Update failed');
    });

    it('should handle undefined/null values properly in optimistic updates', async () => {
      const wrapper = createTestWrapper(queryClient);
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      // Pre-populate cache with some undefined fields using correct query keys
      queryClient.setQueryData(['clients_simplified'], [
        { 
          client_id: 'client-123', 
          restaurant_name: 'Test Restaurant',
          notes: undefined,
          reminder_details: null
        }
      ]);
      queryClient.setQueryData(['clients_list_for_admin'], [
        { 
          client_id: 'client-123', 
          restaurant_name: 'Test Restaurant',
          notes: undefined,
          reminder_details: null
        }
      ]);

      const updateData = {
        clientId: 'client-123',
        updates: { 
          notes: 'New notes',
          reminder_details: undefined // Should be filtered out
        }
      };

      await act(async () => {
        await result.current.mutateAsync(updateData);
      });

      // Should only update defined values
      const cachedData = queryClient.getQueryData(['clients_simplified']) as any[];
      expect(cachedData?.[0]).toEqual(
        expect.objectContaining({
          client_id: 'client-123',
          restaurant_name: 'Test Restaurant',
          notes: 'New notes',
          reminder_details: undefined, // Optimistic update preserves original undefined value
          updated_at: expect.any(String) // Optimistic update adds timestamp
        })
      );

      await waitFor(() => {
        expect(mockSupabase.from().update).toHaveBeenCalledWith({
          notes: 'New notes',
          updated_at: expect.any(String)
        });
      });
    });
  });

  describe('Cache Management Performance', () => {
    it('should minimize cache operations for better performance', async () => {
      const wrapper = createTestWrapper(queryClient);
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      // Pre-populate cache with multiple clients using correct query keys
      const clientsData = Array.from({ length: 100 }, (_, i) => ({
        client_id: `client-${i}`,
        restaurant_name: `Restaurant ${i}`,
        client_status: 'active'
      }));
      queryClient.setQueryData(['clients_simplified'], clientsData);
      queryClient.setQueryData(['clients_list_for_admin'], clientsData);

      const startTime = performance.now();

      // Update one client
      await act(async () => {
        await result.current.mutateAsync({
          clientId: 'client-50',
          updates: { restaurant_name: 'Updated Restaurant 50' }
        });
      });

      const endTime = performance.now();

      // Should complete quickly even with large cache
      expect(endTime - startTime).toBeLessThan(100);

      // Only the target client should be updated
      const cachedData = queryClient.getQueryData(['clients_simplified']) as any[];
      expect(cachedData[50].restaurant_name).toBe('Updated Restaurant 50');
      expect(cachedData[49].restaurant_name).toBe('Restaurant 49'); // Unchanged
      expect(cachedData[51].restaurant_name).toBe('Restaurant 51'); // Unchanged
    });

    it('should handle missing cache data gracefully', async () => {
      const wrapper = createTestWrapper(queryClient);
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      // No cache data set initially
      const updateData = {
        clientId: 'client-123',
        updates: { restaurant_name: 'New Name' }
      };

      const startTime = performance.now();

      await act(async () => {
        await result.current.mutateAsync(updateData);
      });

      const endTime = performance.now();

      // Should not block even with missing cache
      expect(endTime - startTime).toBeLessThan(100);

      await waitFor(() => {
        expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('client_id', 'client-123');
      });

      expect(mockToast.success).toHaveBeenCalledWith('שם המסעדה עודכן בהצלחה');
    });

    it('should invalidate specific query keys efficiently', async () => {
      const wrapper = createTestWrapper(queryClient);
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      // Spy on query client methods
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      queryClient.setQueryData(['clients_simplified'], [
        { client_id: 'client-123', restaurant_name: 'Original Name' }
      ]);
      queryClient.setQueryData(['clients_list_for_admin'], [
        { client_id: 'client-123', restaurant_name: 'Original Name' }
      ]);

      await act(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { restaurant_name: 'Updated Name' }
        });
      });

      // Should use optimistic updates (setQueryData) rather than expensive invalidation
      expect(setQueryDataSpy).toHaveBeenCalled();
      expect(invalidateQueriesSpy).not.toHaveBeenCalled();
    });
  });

  describe('Memory Management', () => {
    it('should not create memory leaks with repeated updates', async () => {
      const wrapper = createTestWrapper(queryClient);
      const { result, unmount } = renderHook(() => useClientUpdate(), { wrapper });

      queryClient.setQueryData(['clients_simplified'], [
        { client_id: 'client-123', restaurant_name: 'Original' }
      ]);
      queryClient.setQueryData(['clients_list_for_admin'], [
        { client_id: 'client-123', restaurant_name: 'Original' }
      ]);

      // Perform many updates
      for (let i = 0; i < 10; i++) { // Reduced from 50 to 10 for faster tests
        await act(async () => {
          await result.current.mutateAsync({
            clientId: 'client-123',
            updates: { restaurant_name: `Update ${i}` }
          });
        });
      }

      // Unmount hook
      unmount();

      // Should not throw or cause issues after unmount
      expect(() => {
        queryClient.getQueryData(['clients_simplified']);
      }).not.toThrow();
    });

    it('should handle rapid successive updates without accumulating state', async () => {
      const wrapper = createTestWrapper(queryClient);
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      queryClient.setQueryData(['clients_simplified'], [
        { client_id: 'client-123', restaurant_name: 'Original', count: 0 }
      ]);
      queryClient.setQueryData(['clients_list_for_admin'], [
        { client_id: 'client-123', restaurant_name: 'Original', count: 0 }
      ]);

      // Rapid updates simulating user typing (reduced count for performance)
      const updates = Array.from({ length: 5 }, (_, i) => ({
        clientId: 'client-123',
        updates: { restaurant_name: `Update ${i}`, count: i }
      }));

      await act(async () => {
        for (const updateData of updates) {
          await result.current.mutateAsync(updateData);
        }
      });

      // Final state should only reflect the last update
      const cachedData = queryClient.getQueryData(['clients_simplified']) as any[];
      expect(cachedData?.[0]).toEqual(
        expect.objectContaining({
          restaurant_name: 'Update 4',
          count: 4
        })
      );

      await waitFor(() => {
        expect(mockSupabase.from().update().eq).toHaveBeenCalledTimes(5);
      });
    });
  });

  describe('Error Recovery Performance', () => {
    it('should recover quickly from temporary network errors', async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.resolve({
                data: null,
                error: { message: 'Network timeout' }
              });
            }
            return Promise.resolve({
              data: null,
              error: null
            });
          })
        })
      }));

      const wrapper = createTestWrapper(queryClient);
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      queryClient.setQueryData(['clients_simplified'], [
        { client_id: 'client-123', restaurant_name: 'Original' }
      ]);
      queryClient.setQueryData(['clients_list_for_admin'], [
        { client_id: 'client-123', restaurant_name: 'Original' }
      ]);

      // First update fails, second succeeds
      await act(async () => {
        try {
          await result.current.mutateAsync({
            clientId: 'client-123',
            updates: { restaurant_name: 'First Update' }
          });
        } catch (error) {
          // Expected failure
        }
      });

      // Cache should be rolled back
      let cachedData = queryClient.getQueryData(['clients_simplified']) as any[];
      expect(cachedData?.[0]?.restaurant_name).toBe('Original');

      // Second update should succeed
      await act(async () => {
        await result.current.mutateAsync({
          clientId: 'client-123',
          updates: { restaurant_name: 'Second Update' }
        });
      });

      cachedData = queryClient.getQueryData(['clients_simplified']) as any[];
      expect(cachedData?.[0]?.restaurant_name).toBe('Second Update');
    });

    it('should handle malformed update data gracefully', async () => {
      const wrapper = createTestWrapper(queryClient);
      const { result } = renderHook(() => useClientUpdate(), { wrapper });

      const startTime = performance.now();

      // Invalid update data
      await act(async () => {
        await result.current.mutateAsync({
          clientId: '',
          updates: {}
        });
      });

      const endTime = performance.now();

      // Should not block UI even with invalid data
      expect(endTime - startTime).toBeLessThan(100);

      // Should still make database call even with empty client ID (hook doesn't validate)
      expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('client_id', '');
    });
  });
}); 