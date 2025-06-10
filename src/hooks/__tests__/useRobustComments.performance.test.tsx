import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useRobustNotes, useRobustClientComments } from '../useRobustComments';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn()
    }
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
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useRobustNotes Performance Tests', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    // Default successful database mock
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { notes: 'Test notes content' },
            error: null
          })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Debouncing Performance', () => {
    it('should not block UI during rapid note updates', async () => {
      const wrapper = createTestWrapper();
      const { result } = renderHook(
        () => useRobustNotes('client-123', 'client'),
        { wrapper }
      );

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.note).toBeDefined();
      });

      const updateNotes = result.current.updateNotes;
      
      // PERFORMANCE TEST: Rapid-fire updates should not block
      const startTime = performance.now();
      
      act(() => {
        updateNotes('Text 1');
        updateNotes('Text 2');
        updateNotes('Text 3');
        updateNotes('Text 4');
        updateNotes('Final text');
      });
      
      const endTime = performance.now();
      
      // Updates should complete immediately (< 10ms) due to debouncing
      expect(endTime - startTime).toBeLessThan(10);
      
      // Only the final update should be called after debounce
      act(() => {
        vi.advanceTimersByTime(1000); // 1 second debounce
      });
      
      await waitFor(() => {
        expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('client_id', 'client-123');
      });
      
      // Should only make one database call despite 5 rapid updates
      expect(mockSupabase.from().update).toHaveBeenCalledTimes(1);
    });

    it('should use useRef for timeout to prevent re-renders', async () => {
      const wrapper = createTestWrapper();
      const { result, rerender } = renderHook(
        () => useRobustNotes('client-123', 'client'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.note).toBeDefined();
      });

      const initialUpdateNotes = result.current.updateNotes;
      
      // Force re-render
      rerender();
      
      // Function reference should remain stable (useCallback optimization)
      expect(result.current.updateNotes).toBe(initialUpdateNotes);
    });

    it('should clean up timeout on unmount', async () => {
      const wrapper = createTestWrapper();
      const { result, unmount } = renderHook(
        () => useRobustNotes('client-123', 'client'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.note).toBeDefined();
      });

      // Start an update but don't wait for completion
      act(() => {
        result.current.updateNotes('Test content');
      });

      // Unmount before timeout completes
      unmount();
      
      // Advance time past debounce
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // No database call should happen after unmount
      expect(mockSupabase.from().update).not.toHaveBeenCalled();
    });
  });

  describe('Optimistic Updates Performance', () => {
    it('should provide immediate UI feedback through optimistic updates', async () => {
      const wrapper = createTestWrapper();
      const { result } = renderHook(
        () => useRobustNotes('client-123', 'client'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.note).toBeDefined();
      });

      const newContent = 'Immediately visible content';
      
      act(() => {
        result.current.updateNotes(newContent);
      });

      // Content should be immediately available in cache (optimistic update)
      expect(result.current.note?.content).toBe(newContent);
    });

    it('should rollback on server error', async () => {
      // Setup error scenario
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { notes: 'Original content' },
              error: null
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      });

      const wrapper = createTestWrapper();
      const { result } = renderHook(
        () => useRobustNotes('client-123', 'client'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.note?.content).toBe('Original content');
      });

      const originalContent = result.current.note?.content;

      act(() => {
        result.current.updateNotes('Failed update');
      });

      // Should show optimistic update initially
      expect(result.current.note?.content).toBe('Failed update');

      // Wait for server response and rollback
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.note?.content).toBe(originalContent);
      });

      expect(mockToast.error).toHaveBeenCalledWith('שגיאה בשמירת ההערות');
    });

    it('should handle concurrent updates gracefully', async () => {
      const wrapper = createTestWrapper();
      const { result } = renderHook(
        () => useRobustNotes('client-123', 'client'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.note).toBeDefined();
      });

      // Simulate rapid concurrent updates
      act(() => {
        result.current.updateNotes('Update 1');
      });
      
      act(() => {
        result.current.updateNotes('Update 2');
      });
      
      act(() => {
        result.current.updateNotes('Final update');
      });

      // Should show the latest optimistic update
      expect(result.current.note?.content).toBe('Final update');
      
      // Advance time to trigger server update
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockSupabase.from().update).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Memory Management', () => {
    it('should not create memory leaks with repeated updates', async () => {
      const wrapper = createTestWrapper();
      const { result } = renderHook(
        () => useRobustNotes('client-123', 'client'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.note).toBeDefined();
      });

      // Simulate many rapid updates (stress test)
      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.updateNotes(`Update ${i}`);
        });
      }

      // Only the final value should be in state
      expect(result.current.note?.content).toBe('Update 99');
      
      // Should only make one database call after debounce
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockSupabase.from().update).toHaveBeenCalledTimes(1);
      });
    });

    it('should clean up properly on client ID change', async () => {
      const wrapper = createTestWrapper();
      const { result, rerender } = renderHook(
        ({ clientId }) => useRobustNotes(clientId, 'client'),
        { 
          wrapper,
          initialProps: { clientId: 'client-123' }
        }
      );

      await waitFor(() => {
        expect(result.current.note).toBeDefined();
      });

      // Start update for first client
      act(() => {
        result.current.updateNotes('Client 123 content');
      });

      // Change client ID before update completes
      rerender({ clientId: 'client-456' });

      // Advance time
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should fetch data for new client
      await waitFor(() => {
        expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('client_id', 'client-456');
      });
    });
  });
});

describe('useRobustClientComments Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Mock successful client comments fetch
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { 
              internal_notes: JSON.stringify({
                clientComments: [
                  {
                    id: 'comment-1',
                    text: 'Test comment',
                    timestamp: new Date().toISOString(),
                    source: 'client'
                  }
                ]
              }),
              original_lead_id: null
            },
            error: null
          })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Comment Addition Performance', () => {
    it('should provide immediate UI feedback when adding comments', async () => {
      const wrapper = createTestWrapper();
      const { result } = renderHook(
        () => useRobustClientComments('client-123'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.comments).toBeDefined();
      });

      const initialCommentCount = result.current.comments?.length || 0;
      
      // Add comment
      act(() => {
        result.current.addComment('New test comment');
      });

      // Should immediately show optimistic comment
      expect(result.current.comments).toHaveLength(initialCommentCount + 1);
      expect(result.current.comments?.[0].text).toBe('New test comment');
    });

    it('should handle retry logic for failed comment additions', async () => {
      // Setup intermittent failure
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        if (callCount === 0) {
          callCount++;
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { internal_notes: '{}' },
                  error: null
                })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Temporary failure' }
              })
            })
          };
        } else {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { internal_notes: '{}' },
                  error: null
                })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          };
        }
      });

      const wrapper = createTestWrapper();
      const { result } = renderHook(
        () => useRobustClientComments('client-123'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.comments).toBeDefined();
      });

      await act(async () => {
        await result.current.addComment('Retry test comment');
      });

      // Should eventually succeed after retry
      await waitFor(() => {
        expect(mockSupabase.from().update).toHaveBeenCalledTimes(2); // First failure, then success
      });
    });

    it('should rollback optimistic update on permanent failure', async () => {
      // Setup permanent failure
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { internal_notes: '{}' },
              error: null
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Permanent failure' }
          })
        })
      });

      const wrapper = createTestWrapper();
      const { result } = renderHook(
        () => useRobustClientComments('client-123'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.comments).toBeDefined();
      });

      const initialCommentCount = result.current.comments?.length || 0;

      try {
        await act(async () => {
          await result.current.addComment('Failed comment');
        });
      } catch (error) {
        // Expected to fail
      }

      // Should rollback to original state
      await waitFor(() => {
        expect(result.current.comments).toHaveLength(initialCommentCount);
      });
    });
  });

  describe('Lead Comment Synchronization Performance', () => {
    it('should efficiently sync lead comments without blocking UI', async () => {
      // Mock client with original lead
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'clients') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    internal_notes: '{}',
                    original_lead_id: 'lead-123'
                  },
                  error: null
                })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          };
        } else if (table === 'lead_activity_log') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    {
                      activity_id: 'activity-1',
                      activity_description: 'תגובה: Lead comment 1',
                      activity_timestamp: new Date().toISOString()
                    }
                  ],
                  error: null
                })
              })
            })
          };
        }
      });

      const wrapper = createTestWrapper();
      const startTime = performance.now();
      
      const { result } = renderHook(
        () => useRobustClientComments('client-123'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.comments).toBeDefined();
      });

      const endTime = performance.now();
      
      // Initial load with sync should complete quickly (< 100ms in test env)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Should have synced lead comment
      expect(result.current.comments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: 'lead',
            text: 'Lead comment 1'
          })
        ])
      );
    });
  });
}); 