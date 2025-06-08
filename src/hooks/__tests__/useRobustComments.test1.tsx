import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useRobustLeadComments } from '../useRobustComments';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
  auth: { getSession: vi.fn() }
};

const mockToast = {
  success: vi.fn(),
  error: vi.fn()
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

vi.mock('sonner', () => ({
  toast: mockToast
}));

const mockLeadId = 'test-lead-123';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useRobustLeadComments - Core Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should fetch lead comments successfully', async () => {
    const mockActivityLog = [
      {
        activity_id: 'activity-1',
        lead_id: mockLeadId,
        activity_description: 'תגובה: First comment',
        activity_timestamp: '2024-01-01T10:00:00Z'
      }
    ];

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockActivityLog,
          error: null
        })
      })
    });
    
    mockSupabase.from.mockReturnValue({ select: mockSelect });

    const { result } = renderHook(
      () => useRobustLeadComments(mockLeadId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.comments).toHaveLength(1);
    expect(result.current.comments[0].text).toBe('First comment');
    expect(result.current.comments[0].entity_type).toBe('lead');
  });

  it('should add lead comment via RPC', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })
    });
    
    mockSupabase.from.mockReturnValue({ select: mockSelect });
    mockSupabase.rpc.mockResolvedValue({
      data: 'success',
      error: null
    });

    const { result } = renderHook(
      () => useRobustLeadComments(mockLeadId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.addComment('Test comment');

    expect(mockSupabase.rpc).toHaveBeenCalledWith('log_lead_activity', {
      p_lead_id: mockLeadId,
      p_activity_description: 'תגובה: Test comment'
    });
    expect(mockToast.success).toHaveBeenCalled();
  });

  it('should filter non-comment activities', async () => {
    const mixedActivities = [
      {
        activity_id: 'activity-1',
        lead_id: mockLeadId,
        activity_description: 'תגובה: This is a comment',
        activity_timestamp: '2024-01-01T10:00:00Z'
      },
      {
        activity_id: 'activity-2',
        lead_id: mockLeadId,
        activity_description: 'Status changed',
        activity_timestamp: '2024-01-01T11:00:00Z'
      }
    ];

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mixedActivities,
          error: null
        })
      })
    });
    
    mockSupabase.from.mockReturnValue({ select: mockSelect });

    const { result } = renderHook(
      () => useRobustLeadComments(mockLeadId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.comments).toHaveLength(1);
    expect(result.current.comments[0].text).toBe('This is a comment');
  });

  it('should handle empty activity log', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })
    });
    
    mockSupabase.from.mockReturnValue({ select: mockSelect });

    const { result } = renderHook(
      () => useRobustLeadComments(mockLeadId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.comments).toEqual([]);
  });

  it('should handle database errors gracefully', async () => {
    const mockError = new Error('Database error');
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockRejectedValue(mockError)
      })
    });
    
    mockSupabase.from.mockReturnValue({ select: mockSelect });

    const { result } = renderHook(
      () => useRobustLeadComments(mockLeadId),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(console.error).toHaveBeenCalledWith('[RobustComments] Database error:', mockError);
  });
}); 