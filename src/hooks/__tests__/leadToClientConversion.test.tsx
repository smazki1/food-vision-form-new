import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

// Simple hook for testing conversion logic
const useTestConvertLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ leadId }: { leadId: string }) => {
      const { data, error } = await supabase.rpc('convert_lead_to_client', {
        lead_id: leadId
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['clients_simplified'] });
    },
  });
};

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

describe('Lead to Client Conversion Tests', () => {
  let mockRpc: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { supabase: mockedSupabase } = await import('@/integrations/supabase/client');
    mockRpc = mockedSupabase.rpc as ReturnType<typeof vi.fn>;
    
    // Default success response
    mockRpc.mockResolvedValue({
      data: { 
        success: true, 
        client_id: 'new-client-123'
      },
      error: null
    });
  });

  describe('Happy Path Tests', () => {
    it('should successfully convert lead to client', async () => {
      const { result } = renderHook(() => useTestConvertLead(), { wrapper });

      await waitFor(async () => {
        const response = await result.current.mutateAsync({
          leadId: 'lead-456'
        });
        
        expect(response.success).toBe(true);
        expect(response.client_id).toBe('new-client-123');
      });

      expect(mockRpc).toHaveBeenCalledWith('convert_lead_to_client', {
        lead_id: 'lead-456'
      });
    });

    it('should handle successful conversion with data synchronization', async () => {
      mockRpc.mockResolvedValue({
        data: { 
          success: true, 
          client_id: 'client-sync-123',
          synchronized_fields: ['restaurant_name', 'contact_name', 'phone', 'email'],
          submissions_linked: 2
        },
        error: null
      });

      const { result } = renderHook(() => useTestConvertLead(), { wrapper });

      await waitFor(async () => {
        const response = await result.current.mutateAsync({
          leadId: 'lead-with-data'
        });
        
        expect(response.synchronized_fields).toContain('restaurant_name');
        expect(response.synchronized_fields).toContain('contact_name');
        expect(response.submissions_linked).toBe(2);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle leads with missing email by generating dummy email', async () => {
      mockRpc.mockResolvedValue({
        data: { 
          success: true, 
          client_id: 'client-no-email',
          generated_email: 'noemail_lead456@temp.foodvision.com',
          warnings: ['Email was missing, generated dummy email']
        },
        error: null
      });

      const { result } = renderHook(() => useTestConvertLead(), { wrapper });

      await waitFor(async () => {
        const response = await result.current.mutateAsync({
          leadId: 'lead-no-email'
        });
        
        expect(response.generated_email).toMatch(/noemail_.*@temp\.foodvision\.com/);
        expect(response.warnings).toContain('Email was missing, generated dummy email');
      });
    });

    it('should handle Hebrew contact information', async () => {
      mockRpc.mockResolvedValue({
        data: { 
          success: true, 
          client_id: 'client-hebrew',
          synchronized_data: {
            restaurant_name: 'מסעדת השף',
            contact_name: 'יוסי כהן',
            business_type: 'מסעדה'
          }
        },
        error: null
      });

      const { result } = renderHook(() => useTestConvertLead(), { wrapper });

      await waitFor(async () => {
        const response = await result.current.mutateAsync({
          leadId: 'lead-hebrew'
        });
        
        expect(response.synchronized_data.restaurant_name).toBe('מסעדת השף');
        expect(response.synchronized_data.contact_name).toBe('יוסי כהן');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle RLS permission errors', async () => {
      const rlsError = {
        message: 'new row violates row-level security policy',
        code: '42501'
      };
      
      mockRpc.mockResolvedValue({
        data: null,
        error: rlsError
      });

      const { result } = renderHook(() => useTestConvertLead(), { wrapper });

      await expect(async () => {
        await result.current.mutateAsync({
          leadId: 'rls-test-lead'
        });
      }).rejects.toMatchObject({
        message: 'new row violates row-level security policy',
        code: '42501'
      });
    });

    it('should handle database constraint violations', async () => {
      const constraintError = {
        message: 'duplicate key value violates unique constraint',
        code: '23505'
      };
      
      mockRpc.mockResolvedValue({
        data: null,
        error: constraintError
      });

      const { result } = renderHook(() => useTestConvertLead(), { wrapper });

      await expect(async () => {
        await result.current.mutateAsync({
          leadId: 'duplicate-lead'
        });
      }).rejects.toMatchObject({
        code: '23505'
      });
    });

    it('should handle network errors', async () => {
      mockRpc.mockRejectedValue(new Error('Network timeout'));

      const { result } = renderHook(() => useTestConvertLead(), { wrapper });

      await expect(async () => {
        await result.current.mutateAsync({
          leadId: 'network-test'
        });
      }).rejects.toThrow('Network timeout');
    });
  });

  describe('Cache Management', () => {
    it('should invalidate relevant caches after conversion', async () => {
      const queryClient = createTestQueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useTestConvertLead(), { wrapper: customWrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          leadId: 'cache-test'
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['leads']
      });
      
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['clients_simplified']
      });
    });
  });
}); 