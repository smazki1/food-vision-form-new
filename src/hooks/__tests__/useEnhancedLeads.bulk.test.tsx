/// <reference types="vitest/globals" />
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

// Import the hooks we're testing
import { 
  useBulkDeleteLeads,
  useBulkArchiveLeads,
  useUpdateLeadWithConversion
} from '../useEnhancedLeads';

// Mock Supabase client
vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ error: null }))
      })),
      update: vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ error: null })),
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { lead_id: 'test' }, error: null }))
          }))
        }))
      }))
    })),
    rpc: vi.fn(() => Promise.resolve({ data: 'test-client-id', error: null }))
  }
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
};

describe('Bulk Operations and Conversion Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useBulkDeleteLeads', () => {
    test('should delete multiple leads successfully', async () => {
      const leadIds = ['lead-1', 'lead-2', 'lead-3'];
      
      const { supabase } = await import('../../integrations/supabase/client');
      const fromMock = supabase.from as any;
      
      const deleteMock = vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ error: null })
      });
      
      fromMock.mockReturnValue({
        delete: deleteMock
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useBulkDeleteLeads(), { wrapper });

      result.current.mutate(leadIds);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fromMock).toHaveBeenCalledWith('leads');
      expect(deleteMock).toHaveBeenCalled();
    });
  });

  describe('useBulkArchiveLeads', () => {
    test('should archive multiple leads successfully', async () => {
      const leadIds = ['lead-1', 'lead-2', 'lead-3'];
      
      const { supabase } = await import('../../integrations/supabase/client');
      const fromMock = supabase.from as any;
      
      const updateMock = vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ error: null })
      });
      
      fromMock.mockReturnValue({
        update: updateMock
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useBulkArchiveLeads(), { wrapper });

      result.current.mutate(leadIds);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fromMock).toHaveBeenCalledWith('leads');
      expect(updateMock).toHaveBeenCalledWith({ 
        lead_status: 'ארכיון', 
        is_archived: true 
      });
    });
  });

  describe('useUpdateLeadWithConversion', () => {
    test('should automatically convert lead to client when status changes to "הפך ללקוח"', async () => {
      const leadId = 'test-lead-id';
      const updates = { lead_status: 'הפך ללקוח' };
      
      const { supabase } = await import('../../integrations/supabase/client');
      const rpcMock = supabase.rpc as any;
      
      rpcMock.mockResolvedValue({ data: 'test-client-id', error: null });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateLeadWithConversion(), { wrapper });

      result.current.mutate({ leadId, updates });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(rpcMock).toHaveBeenCalledWith('convert_lead_to_client', {
        p_lead_id: leadId
      });
    });

    test('should perform regular update when status is not "הפך ללקוח"', async () => {
      const leadId = 'test-lead-id';
      const updates = { lead_status: 'בטיפול' };
      
      const { supabase } = await import('../../integrations/supabase/client');
      const fromMock = supabase.from as any;
      
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: { lead_id: leadId, ...updates }, 
              error: null 
            })
          })
        })
      });
      
      fromMock.mockReturnValue({
        update: updateMock
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateLeadWithConversion(), { wrapper });

      result.current.mutate({ leadId, updates });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fromMock).toHaveBeenCalledWith('leads');
      expect(updateMock).toHaveBeenCalledWith(updates);
    });
  });
}); 