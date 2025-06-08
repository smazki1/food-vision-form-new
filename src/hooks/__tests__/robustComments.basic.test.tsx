import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useRobustLeadComments, useRobustClientComments, useRobustNotes } from '../useRobustComments';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
  auth: { getSession: vi.fn() }
};

const mockToast = {
  success: vi.fn(),
  error: vi.fn()
};

// Mock the integrations
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

vi.mock('sonner', () => ({
  toast: mockToast
}));

// Test data
const mockLeadId = 'test-lead-123';
const mockClientId = 'test-client-456';

// Query Client Provider wrapper
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

// Test imports and basic functionality
describe('Robust Comments System - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should import robust comments hooks successfully', async () => {
    const { useRobustLeadComments, useRobustClientComments, useRobustNotes } = await import('../useRobustComments');
    
    expect(useRobustLeadComments).toBeDefined();
    expect(useRobustClientComments).toBeDefined();
    expect(useRobustNotes).toBeDefined();
    expect(typeof useRobustLeadComments).toBe('function');
    expect(typeof useRobustClientComments).toBe('function');
    expect(typeof useRobustNotes).toBe('function');
  });

  it('should have proper function signatures', async () => {
    const { useRobustLeadComments, useRobustClientComments } = await import('../useRobustComments');
    
    // Verify the hooks exist and are callable
    expect(useRobustLeadComments).toBeDefined();
    expect(useRobustClientComments).toBeDefined();
    expect(typeof useRobustLeadComments).toBe('function');
    expect(typeof useRobustClientComments).toBe('function');
  });

  describe('useRobustLeadComments - Happy Path', () => {
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

    it('should add lead comment via RPC successfully', async () => {
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

    it('should filter non-comment activities correctly', async () => {
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
        },
        {
          activity_id: 'activity-3',
          lead_id: mockLeadId,
          activity_description: 'Phone call made',
          activity_timestamp: '2024-01-01T12:00:00Z'
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
  });

  describe('useRobustLeadComments - Edge Cases', () => {
    it('should handle empty activity log gracefully', async () => {
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

    it('should handle null activity descriptions', async () => {
      const activitiesWithNulls = [
        {
          activity_id: 'activity-1',
          lead_id: mockLeadId,
          activity_description: null,
          activity_timestamp: '2024-01-01T10:00:00Z'
        },
        {
          activity_id: 'activity-2',
          lead_id: mockLeadId,
          activity_description: 'תגובה: Valid comment',
          activity_timestamp: '2024-01-01T11:00:00Z'
        }
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: activitiesWithNulls,
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
      expect(result.current.comments[0].text).toBe('Valid comment');
    });

    it('should handle Hebrew comments correctly', async () => {
      const hebrewComment = 'תגובה בעברית על המוצר';
      const mockActivityLog = [
        {
          activity_id: 'activity-1',
          lead_id: mockLeadId,
          activity_description: `תגובה: ${hebrewComment}`,
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
      expect(result.current.comments[0].text).toBe(hebrewComment);
    });
  });

  describe('useRobustLeadComments - Error Handling', () => {
    it('should handle database fetch errors gracefully', async () => {
      const mockError = new Error('Database connection failed');
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

    it('should handle RPC failure with fallback to direct insert', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });
      
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              activity_id: 'new-activity-1',
              activity_timestamp: '2024-01-01T13:00:00Z'
            },
            error: null
          })
        })
      });
      
      mockSupabase.from.mockReturnValue({ 
        select: mockSelect,
        insert: mockInsert
      });

      // Mock RPC failure
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('RPC failed')
      });

      const { result } = renderHook(
        () => useRobustLeadComments(mockLeadId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.addComment('Test comment');

      expect(mockInsert).toHaveBeenCalledWith({
        lead_id: mockLeadId,
        activity_description: 'תגובה: Test comment',
        activity_timestamp: expect.any(String)
      });
      expect(mockToast.success).toHaveBeenCalled();
    });

    it('should handle add comment complete failure with error toast', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const mockError = new Error('Complete failure');
      
      mockSupabase.from.mockReturnValue({ select: mockSelect });
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: mockError
      });

      // Also mock insert failure
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(mockError)
        })
      });
      
      mockSupabase.from.mockReturnValue({ 
        select: mockSelect,
        insert: mockInsert
      });

      const { result } = renderHook(
        () => useRobustLeadComments(mockLeadId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      try {
        await result.current.addComment('Test comment');
      } catch (error) {
        // Expected to fail
      }

      expect(mockToast.error).toHaveBeenCalledWith('שגיאה בהוספת התגובה');
    });
  });
}); 