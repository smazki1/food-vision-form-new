import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLeadComments } from '../useEnhancedLeads';
import { supabase } from '@/integrations/supabase/client';

import { vi } from 'vitest';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn()
        }))
      }))
    })),
    rpc: vi.fn()
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
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useLeadComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle successful comment fetch', async () => {
    const mockComments = [
      {
        comment_id: '1',
        lead_id: 'lead-1',
        comment_text: 'Test comment',
        comment_timestamp: '2024-01-01T00:00:00Z',
        user_id: null
      }
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockComments,
            error: null
          })
        })
      })
    });

    const { result } = renderHook(() => useLeadComments('lead-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockComments);
  });

  it('should handle RLS error and fallback to RPC', async () => {
    const mockComments = [
      {
        comment_id: '1',
        lead_id: 'lead-1',
        comment_text: 'RPC comment',
        comment_timestamp: '2024-01-01T00:00:00Z',
        user_id: null
      }
    ];

    // Mock initial query to fail with 401 error
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { code: '42501', message: '401 Unauthorized' }
          })
        })
      })
    });

    // Mock RPC to succeed
    (supabase.rpc as any).mockResolvedValue({
      data: mockComments,
      error: null
    });

    const { result } = renderHook(() => useLeadComments('lead-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(supabase.rpc).toHaveBeenCalledWith('get_lead_comments', { p_lead_id: 'lead-1' });
    expect(result.current.data).toEqual(mockComments);
  });

  it('should return empty array when all methods fail', async () => {
    // Mock both queries to fail
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { code: '42501', message: '401 Unauthorized' }
          })
        })
      })
    });

    (supabase.rpc as any).mockResolvedValue({
      data: null,
      error: { message: 'RPC failed' }
    });

    const { result } = renderHook(() => useLeadComments('lead-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('should not fetch when leadId is not provided', () => {
    const { result } = renderHook(() => useLeadComments(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
}); 