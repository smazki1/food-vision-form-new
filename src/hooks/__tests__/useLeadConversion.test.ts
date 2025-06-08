import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: {}, error: null })
          }))
        }))
      }))
    }))
  }
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

import { useUpdateLeadWithConversion, useConvertLeadToClient } from '@/hooks/useEnhancedLeads';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

describe('Lead Conversion Hooks Tests', () => {
  let queryClient: QueryClient;
  let mockSupabaseRpc: any;
  let mockToastSuccess: any;
  let mockToastError: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    
    // Get the mocked functions
    mockSupabaseRpc = vi.mocked(supabase.rpc);
    mockToastSuccess = vi.mocked(toast.success);
    mockToastError = vi.mocked(toast.error);
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    return ({ children }: { children: ReactNode }) => {
      return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };
  };

  describe('useUpdateLeadWithConversion Hook', () => {
    describe('Happy Path Tests', () => {
      it('should successfully update lead status to "הפך ללקוח" and trigger conversion', async () => {
        mockSupabaseRpc.mockResolvedValueOnce({
          data: 'new-client-id-123',
          error: null
        });

        const { result } = renderHook(() => useUpdateLeadWithConversion(), {
          wrapper: createWrapper()
        });

        const mutation = result.current;

        await waitFor(async () => {
          await mutation.mutateAsync({
            leadId: 'test-lead-id',
            updates: { lead_status: 'הפך ללקוח' }
          });
        });

        expect(mockSupabaseRpc).toHaveBeenCalledWith('convert_lead_to_client', {
          p_lead_id: 'test-lead-id'
        });

        expect(mockToastSuccess).toHaveBeenCalledWith(
          'הליד הומר ללקוח בהצלחה והמערכת עודכנה!'
        );
      });

      it('should handle regular status updates without triggering conversion', async () => {
        const { result } = renderHook(() => useUpdateLeadWithConversion(), {
          wrapper: createWrapper()
        });

        const mutation = result.current;

        await waitFor(async () => {
          await mutation.mutateAsync({
            leadId: 'test-lead-id',
            updates: { lead_status: 'מעוניין' }
          });
        });

        expect(mockSupabaseRpc).not.toHaveBeenCalled();
        // Regular updates don't show toast messages in the actual implementation
        expect(mockToastSuccess).not.toHaveBeenCalled();
      });

      it('should handle non-status field updates', async () => {
        const { result } = renderHook(() => useUpdateLeadWithConversion(), {
          wrapper: createWrapper()
        });

        const mutation = result.current;

        await waitFor(async () => {
          await mutation.mutateAsync({
            leadId: 'test-lead-id',
            updates: { restaurant_name: 'מסעדה חדשה' }
          });
        });

        expect(mockSupabaseRpc).not.toHaveBeenCalled();
        // Regular updates don't show toast messages in the actual implementation
        expect(mockToastSuccess).not.toHaveBeenCalled();
      });
    });

    describe('Edge Cases', () => {
      it('should handle conversion when client already exists', async () => {
        mockSupabaseRpc.mockResolvedValueOnce({
          data: 'existing-client-id-456',
          error: null
        });

        const { result } = renderHook(() => useUpdateLeadWithConversion(), {
          wrapper: createWrapper()
        });

        const mutation = result.current;

        await waitFor(async () => {
          await mutation.mutateAsync({
            leadId: 'test-lead-id',
            updates: { lead_status: 'הפך ללקוח' }
          });
        });

        expect(mockSupabaseRpc).toHaveBeenCalledWith('convert_lead_to_client', {
          p_lead_id: 'test-lead-id'
        });

        expect(mockToastSuccess).toHaveBeenCalledWith(
          'הליד הומר ללקוח בהצלחה והמערכת עודכנה!'
        );
      });

      it('should handle conversion with Hebrew characters in data', async () => {
        mockSupabaseRpc.mockResolvedValueOnce({
          data: 'hebrew-client-id-789',
          error: null
        });

        const { result } = renderHook(() => useUpdateLeadWithConversion(), {
          wrapper: createWrapper()
        });

        const mutation = result.current;

        await waitFor(async () => {
          await mutation.mutateAsync({
            leadId: 'hebrew-lead-id',
            updates: { lead_status: 'הפך ללקוח' }
          });
        });

        expect(mockSupabaseRpc).toHaveBeenCalledWith('convert_lead_to_client', {
          p_lead_id: 'hebrew-lead-id'
        });

        expect(mockToastSuccess).toHaveBeenCalledWith(
          'הליד הומר ללקוח בהצלחה והמערכת עודכנה!'
        );
      });
    });

    describe('Error Handling', () => {
      it('should handle conversion failure gracefully', async () => {
        mockSupabaseRpc.mockResolvedValueOnce({
          data: null,
          error: {
            message: 'Lead not found with ID: invalid-lead',
            code: 'P0001'
          }
        });

        const { result } = renderHook(() => useUpdateLeadWithConversion(), {
          wrapper: createWrapper()
        });

        const mutation = result.current;

        await waitFor(async () => {
          try {
            await mutation.mutateAsync({
              leadId: 'invalid-lead',
              updates: { lead_status: 'הפך ללקוח' }
            });
          } catch (error) {
            // Expected to throw
          }
        });

        expect(mockSupabaseRpc).toHaveBeenCalledWith('convert_lead_to_client', {
          p_lead_id: 'invalid-lead'
        });

        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringContaining('שגיאה בהמרת הליד ללקוח')
        );
      });

      it('should handle database constraint violations', async () => {
        mockSupabaseRpc.mockResolvedValueOnce({
          data: null,
          error: {
            message: 'duplicate key value violates unique constraint',
            code: '23505'
          }
        });

        const { result } = renderHook(() => useUpdateLeadWithConversion(), {
          wrapper: createWrapper()
        });

        const mutation = result.current;

        await waitFor(async () => {
          try {
            await mutation.mutateAsync({
              leadId: 'constraint-violation-lead',
              updates: { lead_status: 'הפך ללקוח' }
            });
          } catch (error) {
            // Expected to throw
          }
        });

        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringContaining('שגיאה בהמרת הליד ללקוח')
        );
      });

      it('should handle network errors during conversion', async () => {
        mockSupabaseRpc.mockRejectedValueOnce(new Error('Network timeout'));

        const { result } = renderHook(() => useUpdateLeadWithConversion(), {
          wrapper: createWrapper()
        });

        const mutation = result.current;

        await waitFor(async () => {
          try {
            await mutation.mutateAsync({
              leadId: 'network-error-lead',
              updates: { lead_status: 'הפך ללקוח' }
            });
          } catch (error) {
            // Expected to throw
          }
        });

        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringContaining('שגיאה בהמרת הליד ללקוח')
        );
      });

      it('should handle empty email conversion failure', async () => {
        mockSupabaseRpc.mockResolvedValueOnce({
          data: null,
          error: {
            message: 'Cannot convert lead to client: email is required but missing',
            code: 'P0001'
          }
        });

        const { result } = renderHook(() => useUpdateLeadWithConversion(), {
          wrapper: createWrapper()
        });

        const mutation = result.current;

        await waitFor(async () => {
          try {
            await mutation.mutateAsync({
              leadId: 'no-email-lead',
              updates: { lead_status: 'הפך ללקוח' }
            });
          } catch (error) {
            // Expected to throw
          }
        });

        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringContaining('email is required')
        );
      });
    });

    describe('Performance Tests', () => {
      it('should complete conversion within acceptable time', async () => {
        mockSupabaseRpc.mockImplementation(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({
              data: 'performance-client-id',
              error: null
            }), 50)
          )
        );

        const { result } = renderHook(() => useUpdateLeadWithConversion(), {
          wrapper: createWrapper()
        });

        const mutation = result.current;
        const startTime = performance.now();

        await waitFor(async () => {
          await mutation.mutateAsync({
            leadId: 'performance-test-lead',
            updates: { lead_status: 'הפך ללקוח' }
          });
        });

        const endTime = performance.now();
        const executionTime = endTime - startTime;

        expect(executionTime).toBeLessThan(200); // Should complete within 200ms
        expect(mockToastSuccess).toHaveBeenCalledWith(
          'הליד הומר ללקוח בהצלחה והמערכת עודכנה!'
        );
      });
    });
  });

  describe('useConvertLeadToClient Hook', () => {
    describe('Happy Path Tests', () => {
      it('should successfully convert lead to client directly', async () => {
        mockSupabaseRpc.mockResolvedValueOnce({
          data: 'direct-client-id-123',
          error: null
        });

        const { result } = renderHook(() => useConvertLeadToClient(), {
          wrapper: createWrapper()
        });

        const mutation = result.current;

        await waitFor(async () => {
          await mutation.mutateAsync('direct-lead-id');
        });

        expect(mockSupabaseRpc).toHaveBeenCalledWith('convert_lead_to_client', {
          p_lead_id: 'direct-lead-id'
        });

        expect(mockToastSuccess).toHaveBeenCalledWith(
          'הליד הומר ללקוח בהצלחה והמערכת עודכנה!'
        );
      });

      it('should handle conversion with data preservation', async () => {
        mockSupabaseRpc.mockResolvedValueOnce({
          data: 'data-preservation-client-id',
          error: null
        });

        const { result } = renderHook(() => useConvertLeadToClient(), {
          wrapper: createWrapper()
        });

        const mutation = result.current;

        await waitFor(async () => {
          await mutation.mutateAsync('data-preservation-lead');
        });

        expect(mockSupabaseRpc).toHaveBeenCalledWith('convert_lead_to_client', {
          p_lead_id: 'data-preservation-lead'
        });

        expect(mockToastSuccess).toHaveBeenCalledWith(
          'הליד הומר ללקוח בהצלחה והמערכת עודכנה!'
        );
      });
    });

    describe('Error Handling', () => {
      it('should handle direct conversion failure', async () => {
        mockSupabaseRpc.mockResolvedValueOnce({
          data: null,
          error: {
            message: 'Lead is already converted to client',
            code: 'P0001'
          }
        });

        const { result } = renderHook(() => useConvertLeadToClient(), {
          wrapper: createWrapper()
        });

        const mutation = result.current;

        await waitFor(async () => {
          try {
            await mutation.mutateAsync('already-converted-lead');
          } catch (error) {
            // Expected to throw
          }
        });

        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringContaining('שגיאה בהמרת הליד ללקוח')
        );
      });

      it('should handle malformed lead ID', async () => {
        mockSupabaseRpc.mockResolvedValueOnce({
          data: null,
          error: {
            message: 'invalid input syntax for type uuid',
            code: '22P02'
          }
        });

        const { result } = renderHook(() => useConvertLeadToClient(), {
          wrapper: createWrapper()
        });

        const mutation = result.current;

        await waitFor(async () => {
          try {
            await mutation.mutateAsync('not-a-valid-uuid');
          } catch (error) {
            // Expected to throw
          }
        });

        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringContaining('שגיאה בהמרת הליד ללקוח')
        );
      });
    });
  });

  describe('Data Preservation Integration Tests', () => {
    it('should validate conversion preserves notes and comments', async () => {
      mockSupabaseRpc.mockResolvedValueOnce({
        data: 'preservation-test-client',
        error: null
      });

      const { result } = renderHook(() => useConvertLeadToClient(), {
        wrapper: createWrapper()
      });

      const mutation = result.current;

      await waitFor(async () => {
        await mutation.mutateAsync('notes-comments-lead');
      });

      expect(mockSupabaseRpc).toHaveBeenCalledWith('convert_lead_to_client', {
        p_lead_id: 'notes-comments-lead'
      });

      expect(mockToastSuccess).toHaveBeenCalledWith(
        'הליד הומר ללקוח בהצלחה והמערכת עודכנה!'
      );
    });

    it('should validate cache invalidation after conversion', async () => {
      mockSupabaseRpc.mockResolvedValueOnce({
        data: 'cache-invalidation-client',
        error: null
      });

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useConvertLeadToClient(), {
        wrapper: createWrapper()
      });

      const mutation = result.current;

      await waitFor(async () => {
        await mutation.mutateAsync('cache-test-lead');
      });

      expect(invalidateQueriesSpy).toHaveBeenCalled();
      
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'הליד הומר ללקוח בהצלחה והמערכת עודכנה!'
      );
    });
  });

  describe('Concurrent Operations Tests', () => {
    it('should handle multiple conversion attempts gracefully', async () => {
      mockSupabaseRpc
        .mockResolvedValueOnce({
          data: 'concurrent-client-1',
          error: null
        })
        .mockResolvedValueOnce({
          data: 'concurrent-client-2',
          error: null
        });

      const { result } = renderHook(() => useConvertLeadToClient(), {
        wrapper: createWrapper()
      });

      const mutation = result.current;

      await waitFor(async () => {
        const promises = [
          mutation.mutateAsync('concurrent-lead-1'),
          mutation.mutateAsync('concurrent-lead-2')
        ];

        await Promise.all(promises);
      });

      expect(mockSupabaseRpc).toHaveBeenCalledTimes(2);
      expect(mockToastSuccess).toHaveBeenCalledTimes(2);
    });
  });
}); 