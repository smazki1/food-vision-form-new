import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLeadComments, useAddLeadComment } from '../useEnhancedLeads';
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

  it('should handle successful comment fetch from activity log', async () => {
    const mockActivities = [
      {
        activity_id: '1',
        lead_id: 'lead-1',
        activity_description: 'תגובה: Test comment',
        activity_timestamp: '2024-01-01T00:00:00Z',
        user_id: null
      }
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          like: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockActivities,
              error: null
            })
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

    const expectedComments = [
      {
        comment_id: '1',
        lead_id: 'lead-1',
        comment_text: 'Test comment',
        comment_timestamp: '2024-01-01T00:00:00Z',
        user_id: null
      }
    ];

    expect(result.current.data).toEqual(expectedComments);
  });

  it('should handle activity log error gracefully', async () => {
    // Mock activity log query to fail
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          like: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '42501', message: 'Access denied' }
            })
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

    expect(result.current.data).toEqual([]);
  });

  it('should return empty array when no comment activities exist', async () => {
    // Mock activity log query to return empty array
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          like: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
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

describe('useAddLeadComment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle successful comment addition via RPC', async () => {
    // Mock successful RPC call
    (supabase.rpc as any).mockResolvedValue({
      error: null
    });

    const { result } = renderHook(() => useAddLeadComment(), {
      wrapper: createWrapper(),
    });

    const addComment = result.current.mutateAsync;
    const response = await addComment({ leadId: 'lead-1', comment: 'Test comment' });

    expect(supabase.rpc).toHaveBeenCalledWith('log_lead_activity', {
      p_lead_id: 'lead-1',
      p_activity_description: 'תגובה: Test comment'
    });

    // Response should be a mock structure since RPC doesn't return data
    expect(response).toEqual(expect.objectContaining({
      lead_id: 'lead-1',
      comment_text: 'Test comment',
      user_id: null
    }));
    expect(response.comment_id).toBeDefined();
    expect(response.comment_timestamp).toBeDefined();
  });

  it('should handle RPC call failure', async () => {
    // Mock RPC call to fail
    (supabase.rpc as any).mockResolvedValue({
      error: { code: '42501', message: 'Access denied' }
    });

    const { result } = renderHook(() => useAddLeadComment(), {
      wrapper: createWrapper(),
    });

    const addComment = result.current.mutateAsync;
    
    await expect(addComment({ leadId: 'lead-1', comment: 'Test comment' }))
      .rejects.toThrow('שגיאה בהוספת תגובה: Access denied');
  });
}); 