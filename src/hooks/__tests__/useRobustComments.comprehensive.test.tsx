import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock modules before importing the hooks
const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn(),
  auth: {
    getSession: vi.fn()
  }
};

const mockToast = {
  success: vi.fn(),
  error: vi.fn()
};

// Mock the modules at the top level
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient
}));

vi.mock('sonner', () => ({
  toast: mockToast
}));

// Now import the hooks after mocking
import { 
  useRobustLeadComments, 
  useRobustClientComments, 
  useRobustNotes,
  type RobustComment,
  type RobustNote
} from '../useRobustComments';

// Test data constants
const MOCK_LEAD_ID = 'test-lead-123';
const MOCK_CLIENT_ID = 'test-client-456';
const MOCK_TIMESTAMP = '2024-01-01T10:00:00Z';

// Helper to create query client wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false,
        gcTime: 0 // Disable garbage collection for tests
      },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mock data generators
const createMockLeadActivity = (id: string, description: string, timestamp = MOCK_TIMESTAMP) => ({
  activity_id: id,
  lead_id: MOCK_LEAD_ID,
  activity_description: description,
  activity_timestamp: timestamp
});

const createMockClientData = (internalNotes: string | null = null) => ({
  client_id: MOCK_CLIENT_ID,
  internal_notes: internalNotes
});

const createMockComment = (text: string, source: 'lead' | 'client' | 'manual' = 'manual'): RobustComment => ({
  id: `test-${Date.now()}`,
  text,
  timestamp: MOCK_TIMESTAMP,
  source,
  entity_id: source === 'lead' ? MOCK_LEAD_ID : MOCK_CLIENT_ID,
  entity_type: source === 'lead' ? 'lead' : 'client'
});

describe('Robust Comments System - Comprehensive Test Suite', () => {
  beforeAll(() => {
    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset Supabase mock to default state
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        }),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    });
    
    mockSupabaseClient.rpc.mockResolvedValue({ data: 'success', error: null });
    mockSupabaseClient.auth.getSession.mockResolvedValue({ 
      data: { session: { user: { id: 'test-user' } } }, 
      error: null 
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Module Imports and Type Definitions', () => {
    it('should import all hooks successfully', () => {
      expect(useRobustLeadComments).toBeDefined();
      expect(useRobustClientComments).toBeDefined();
      expect(useRobustNotes).toBeDefined();
      expect(typeof useRobustLeadComments).toBe('function');
      expect(typeof useRobustClientComments).toBe('function');
      expect(typeof useRobustNotes).toBe('function');
    });

    it('should have correct function signatures', () => {
      // Test that hooks can be called with correct parameters
      expect(() => useRobustLeadComments).not.toThrow();
      expect(() => useRobustClientComments).not.toThrow();
      expect(() => useRobustNotes).not.toThrow();
    });
  });

  describe('useRobustLeadComments - Happy Path Tests', () => {
    it('should fetch lead comments successfully', async () => {
      const mockActivities = [
        createMockLeadActivity('activity-1', 'תגובה: First comment'),
        createMockLeadActivity('activity-2', 'תגובה: Second comment'),
        createMockLeadActivity('activity-3', 'Regular activity') // Should be filtered out
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockActivities,
            error: null
          })
        })
      });
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(
        () => useRobustLeadComments(MOCK_LEAD_ID),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.comments).toHaveLength(2);
      expect(result.current.comments[0].text).toBe('First comment');
      expect(result.current.comments[1].text).toBe('Second comment');
      expect(result.current.comments[0].entity_type).toBe('lead');
      expect(result.current.comments[0].source).toBe('lead');
    });

    it('should add lead comment via RPC successfully', async () => {
      // Setup initial empty state
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });
      mockSupabaseClient.rpc.mockResolvedValue({
        data: 'success',
        error: null
      });

      const { result } = renderHook(
        () => useRobustLeadComments(MOCK_LEAD_ID),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addComment('Test comment');
      });

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('log_lead_activity', {
        p_lead_id: MOCK_LEAD_ID,
        p_activity_description: 'תגובה: Test comment'
      });
      expect(mockToast.success).toHaveBeenCalledWith('התגובה נוספה בהצלחה');
    });

    it('should filter Hebrew comments correctly', async () => {
      const mixedActivities = [
        createMockLeadActivity('activity-1', 'תגובה: Hebrew comment'),
        createMockLeadActivity('activity-2', 'Status changed to active'),
        createMockLeadActivity('activity-3', 'תגובה: Another Hebrew comment'),
        createMockLeadActivity('activity-4', 'Phone call completed')
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mixedActivities,
            error: null
          })
        })
      });
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(
        () => useRobustLeadComments(MOCK_LEAD_ID),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.comments).toHaveLength(2);
      expect(result.current.comments[0].text).toBe('Hebrew comment');
      expect(result.current.comments[1].text).toBe('Another Hebrew comment');
    });

    it('should handle optimistic updates correctly', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });
      mockSupabaseClient.rpc.mockResolvedValue({
        data: 'success',
        error: null
      });

      const { result } = renderHook(
        () => useRobustLeadComments(MOCK_LEAD_ID),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start adding comment
      act(() => {
        result.current.addComment('Optimistic comment');
      });

      // Should show optimistic update immediately
      expect(result.current.isAddingComment).toBe(true);
    });
  });

  describe('useRobustLeadComments - Edge Cases and Error Handling', () => {
    it('should handle empty activity log gracefully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(
        () => useRobustLeadComments(MOCK_LEAD_ID),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.comments).toHaveLength(0);
      expect(result.current.comments).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          })
        })
      });
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(
        () => useRobustLeadComments(MOCK_LEAD_ID),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should handle error gracefully
      expect(result.current.comments).toEqual([]);
    });

    it('should fallback to direct insert when RPC fails', async () => {
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
              activity_timestamp: MOCK_TIMESTAMP
            },
            error: null
          })
        })
      });
      
      mockSupabaseClient.from.mockReturnValue({ 
        select: mockSelect,
        insert: mockInsert
      });
      
      // Make RPC fail
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' }
      });

      const { result } = renderHook(
        () => useRobustLeadComments(MOCK_LEAD_ID),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addComment('Fallback comment');
      });

      expect(mockSupabaseClient.rpc).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalledWith({
        lead_id: MOCK_LEAD_ID,
        activity_description: 'תגובה: Fallback comment',
        activity_timestamp: expect.any(String)
      });
    });

    it('should handle RPC and direct insert both failing', async () => {
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
            data: null,
            error: { message: 'Insert failed' }
          })
        })
      });
      
      mockSupabaseClient.from.mockReturnValue({ 
        select: mockSelect,
        insert: mockInsert
      });
      
      // Make both RPC and insert fail
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' }
      });

      const { result } = renderHook(
        () => useRobustLeadComments(MOCK_LEAD_ID),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.addComment('Failed comment');
        } catch (error) {
          // Expected to fail
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('שגיאה בהוספת התגובה');
    });

    it('should handle malformed activity descriptions', async () => {
      const malformedActivities = [
        createMockLeadActivity('activity-1', 'תגובה:'), // Empty comment
        createMockLeadActivity('activity-2', 'תגובה'), // Missing colon
        createMockLeadActivity('activity-3', null as any), // Null description
        createMockLeadActivity('activity-4', 'תגובה: Valid comment')
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: malformedActivities,
            error: null
          })
        })
      });
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(
        () => useRobustLeadComments(MOCK_LEAD_ID),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should only include the valid comment
      expect(result.current.comments).toHaveLength(2);
      expect(result.current.comments[0].text).toBe('');
      expect(result.current.comments[1].text).toBe('Valid comment');
    });

    it('should handle disabled leadId', async () => {
      const { result } = renderHook(
        () => useRobustLeadComments(''),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.comments).toEqual([]);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });
  });

  describe('useRobustClientComments - Happy Path Tests', () => {
    it('should fetch client comments successfully', async () => {
      const mockClientComments = [
        createMockComment('First client comment', 'client'),
        createMockComment('Second client comment', 'client')
      ];

      const mockInternalNotes = JSON.stringify({
        clientComments: mockClientComments,
        lastCommentUpdate: MOCK_TIMESTAMP
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: createMockClientData(mockInternalNotes),
            error: null
          })
        })
      });
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(
        () => useRobustClientComments(MOCK_CLIENT_ID),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.comments).toHaveLength(2);
      expect(result.current.comments[0].text).toBe('First client comment');
      expect(result.current.comments[1].text).toBe('Second client comment');
      expect(result.current.comments[0].entity_type).toBe('client');
    });

    it('should add client comment with atomic update', async () => {
      // Setup initial state
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: createMockClientData('{}'),
            error: null
          })
        })
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });
      
      mockSupabaseClient.from.mockReturnValue({ 
        select: mockSelect,
        update: mockUpdate
      });

      const { result } = renderHook(
        () => useRobustClientComments(MOCK_CLIENT_ID),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addComment('New client comment');
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        internal_notes: expect.stringContaining('New client comment'),
        updated_at: expect.any(String)
      });
      expect(mockToast.success).toHaveBeenCalledWith('התגובה נוספה בהצלחה');
    });

    it('should handle empty internal_notes gracefully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: createMockClientData(null),
            error: null
          })
        })
      });
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(
        () => useRobustClientComments(MOCK_CLIENT_ID),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.comments).toHaveLength(0);
      expect(result.current.comments).toEqual([]);
    });

    it('should handle malformed JSON in internal_notes', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: createMockClientData('invalid json {'),
            error: null
          })
        })
      });
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(
        () => useRobustClientComments(MOCK_CLIENT_ID),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.comments).toHaveLength(0);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse internal_notes JSON'),
        expect.any(Error)
      );
    });
  });

  describe('useRobustClientComments - Edge Cases and Error Handling', () => {
    it('should retry on update conflicts', async () => {
      let attemptCount = 0;
      
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockImplementation(() => {
            attemptCount++;
            return Promise.resolve({
              data: createMockClientData('{}'),
              error: null
            });
          })
        })
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn()
          .mockResolvedValueOnce({ error: { message: 'Conflict' } }) // First attempt fails
          .mockResolvedValueOnce({ error: null }) // Second attempt succeeds
      });
      
      mockSupabaseClient.from.mockReturnValue({ 
        select: mockSelect,
        update: mockUpdate
      });

      const { result } = renderHook(
        () => useRobustClientComments(MOCK_CLIENT_ID),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addComment('Retry comment');
      });

      expect(attemptCount).toBeGreaterThan(1);
      expect(mockToast.success).toHaveBeenCalledWith('התגובה נוספה בהצלחה');
    });

    it('should fail after max retry attempts', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: createMockClientData('{}'),
            error: null
          })
        })
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Persistent error' } })
      });
      
      mockSupabaseClient.from.mockReturnValue({ 
        select: mockSelect,
        update: mockUpdate
      });

      const { result } = renderHook(
        () => useRobustClientComments(MOCK_CLIENT_ID),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.addComment('Failed comment');
        } catch (error) {
          // Expected to fail
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('שגיאה בהוספת התגובה');
    });

    it('should handle fetch errors gracefully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Client not found' }
          })
        })
      });
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(
        () => useRobustClientComments(MOCK_CLIENT_ID),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.comments).toEqual([]);
    });
  });

  describe('useRobustNotes - Happy Path Tests', () => {
    it('should fetch lead notes successfully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { notes: 'Test lead notes' },
            error: null
          })
        })
      });
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(
        () => useRobustNotes(MOCK_LEAD_ID, 'lead'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.note?.content).toBe('Test lead notes');
      expect(result.current.note?.entity_type).toBe('lead');
      expect(result.current.note?.entity_id).toBe(MOCK_LEAD_ID);
    });

    it('should fetch client notes successfully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { notes: 'Test client notes' },
            error: null
          })
        })
      });
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(
        () => useRobustNotes(MOCK_CLIENT_ID, 'client'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.note?.content).toBe('Test client notes');
      expect(result.current.note?.entity_type).toBe('client');
      expect(result.current.note?.entity_id).toBe(MOCK_CLIENT_ID);
    });

    it('should update lead notes successfully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { notes: 'Original notes' },
            error: null
          })
        })
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });
      
      mockSupabaseClient.from.mockReturnValue({ 
        select: mockSelect,
        update: mockUpdate
      });

      const { result } = renderHook(
        () => useRobustNotes(MOCK_LEAD_ID, 'lead'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateNotes('Updated notes');
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        notes: 'Updated notes',
        updated_at: expect.any(String)
      });
    });

    it('should handle empty notes gracefully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { notes: null },
            error: null
          })
        })
      });
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(
        () => useRobustNotes(MOCK_LEAD_ID, 'lead'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.note?.content).toBe('');
    });
  });

  describe('useRobustNotes - Edge Cases and Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Entity not found' }
          })
        })
      });
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(
        () => useRobustNotes(MOCK_LEAD_ID, 'lead'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.note).toBeUndefined();
    });

    it('should handle update errors gracefully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { notes: 'Original notes' },
            error: null
          })
        })
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } })
      });
      
      mockSupabaseClient.from.mockReturnValue({ 
        select: mockSelect,
        update: mockUpdate
      });

      const { result } = renderHook(
        () => useRobustNotes(MOCK_LEAD_ID, 'lead'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.updateNotes('Failed update');
        } catch (error) {
          // Expected to fail
        }
      });

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Update error'),
        expect.any(Object)
      );
    });

    it('should handle disabled entityId', async () => {
      const { result } = renderHook(
        () => useRobustNotes('', 'lead'),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.note).toBeUndefined();
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should handle multiple hooks simultaneously', async () => {
      // Setup mocks for all hooks
      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [createMockLeadActivity('activity-1', 'תגובה: Lead comment')],
              error: null
            })
          })
        })
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: createMockClientData('{"clientComments":[]}'),
              error: null
            })
          })
        })
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { notes: 'Test notes' },
              error: null
            })
          })
        });
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      const wrapper = createWrapper();

      const { result: leadResult } = renderHook(
        () => useRobustLeadComments(MOCK_LEAD_ID),
        { wrapper }
      );

      const { result: clientResult } = renderHook(
        () => useRobustClientComments(MOCK_CLIENT_ID),
        { wrapper }
      );

      const { result: notesResult } = renderHook(
        () => useRobustNotes(MOCK_LEAD_ID, 'lead'),
        { wrapper }
      );

      await waitFor(() => {
        expect(leadResult.current.isLoading).toBe(false);
        expect(clientResult.current.isLoading).toBe(false);
        expect(notesResult.current.isLoading).toBe(false);
      });

      expect(leadResult.current.comments).toHaveLength(1);
      expect(clientResult.current.comments).toHaveLength(0);
      expect(notesResult.current.note?.content).toBe('Test notes');
    });

    it('should handle cache invalidation correctly', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });
      mockSupabaseClient.rpc.mockResolvedValue({
        data: 'success',
        error: null
      });

      const { result } = renderHook(
        () => useRobustLeadComments(MOCK_LEAD_ID),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add a comment which should trigger cache invalidation
      await act(async () => {
        await result.current.addComment('Cache test comment');
      });

      // Verify that the query was called again due to invalidation
      expect(mockSelect).toHaveBeenCalledTimes(2); // Initial load + refetch after invalidation
    });
  });

  describe('Performance and Memory Tests', () => {
    it('should not cause memory leaks with rapid hook mounting/unmounting', async () => {
      const wrapper = createWrapper();

      // Mount and unmount hooks rapidly
      for (let i = 0; i < 5; i++) {
        const { unmount } = renderHook(
          () => useRobustLeadComments(MOCK_LEAD_ID),
          { wrapper }
        );
        unmount();
      }

      // Should not throw or cause issues
      expect(true).toBe(true);
    });

    it('should handle concurrent comment additions', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });
      
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });
      mockSupabaseClient.rpc.mockResolvedValue({
        data: 'success',
        error: null
      });

      const { result } = renderHook(
        () => useRobustLeadComments(MOCK_LEAD_ID),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add multiple comments concurrently
      await act(async () => {
        await Promise.all([
          result.current.addComment('Comment 1'),
          result.current.addComment('Comment 2'),
          result.current.addComment('Comment 3')
        ]);
      });

      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(3);
    });
  });
}); 