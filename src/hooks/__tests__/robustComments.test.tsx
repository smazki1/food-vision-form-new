import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRobustLeadComments, useRobustClientComments, useRobustNotes } from '../useRobustComments';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }))
    })),
    insert: vi.fn(() => Promise.resolve({
      data: { id: 'test-id' },
      error: null
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({
        data: { id: 'test-id' },
        error: null
      }))
    })),
    upsert: vi.fn(() => Promise.resolve({
      data: { id: 'test-id' },
      error: null
    }))
  }))
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

// Mock toast
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
      mutations: {
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

describe('Robust Comments System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useRobustLeadComments', () => {
    it('should fetch and manage lead comments correctly', async () => {
      const mockComments = [
        {
          activity_id: '1',
          activity_description: 'תגובה: Test comment',
          activity_timestamp: '2024-01-01T00:00:00Z',
          lead_id: 'lead-1'
        }
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            ilike: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: mockComments,
                error: null
              }))
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({
          data: { activity_id: 'new-comment' },
          error: null
        }))
      });

      const { result } = renderHook(
        () => useRobustLeadComments('lead-1'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.comments).toBeDefined();
      });

      // Test adding a comment
      await result.current.addComment('New test comment');

      expect(supabase.from).toHaveBeenCalledWith('lead_activity_log');
    });

    it('should handle errors gracefully when adding comments', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            ilike: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: [],
                error: null
              }))
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({
          data: null,
          error: { message: 'Database error' }
        }))
      });

      const { result } = renderHook(
        () => useRobustLeadComments('lead-1'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.comments).toBeDefined();
      });

      // Test error handling
      await expect(result.current.addComment('Fail comment')).rejects.toThrow();
    });
  });

  describe('useRobustClientComments', () => {
    it('should fetch and manage client comments correctly', async () => {
      const mockClient = {
        client_id: 'client-1',
        internal_notes: JSON.stringify({
          clientComments: [
            {
              id: '1',
              text: 'Test client comment',
              timestamp: '2024-01-01T00:00:00Z',
              source: 'client'
            }
          ]
        })
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: [mockClient],
            error: null
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: mockClient,
            error: null
          }))
        }))
      });

      const { result } = renderHook(
        () => useRobustClientComments('client-1'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.comments).toBeDefined();
      });

      // Test adding a comment
      await result.current.addComment('New client comment');

      expect(supabase.from).toHaveBeenCalledWith('clients');
    });
  });

  describe('useRobustNotes', () => {
    it('should fetch and update notes correctly for leads', async () => {
      const mockNote = {
        entity_id: 'lead-1',
        entity_type: 'lead',
        content: 'Test note content',
        last_updated: '2024-01-01T00:00:00Z'
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: mockNote,
                error: null
              }))
            }))
          }))
        })),
        upsert: jest.fn(() => Promise.resolve({
          data: mockNote,
          error: null
        }))
      });

      const { result } = renderHook(
        () => useRobustNotes('lead-1', 'lead'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.note).toBeDefined();
      });

      // Test updating notes
      await result.current.updateNotes('Updated note content');

      expect(supabase.from).toHaveBeenCalledWith('robust_notes');
    });

    it('should fetch and update notes correctly for clients', async () => {
      const mockNote = {
        entity_id: 'client-1',
        entity_type: 'client',
        content: 'Test client note',
        last_updated: '2024-01-01T00:00:00Z'
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: mockNote,
                error: null
              }))
            }))
          }))
        })),
        upsert: jest.fn(() => Promise.resolve({
          data: mockNote,
          error: null
        }))
      });

      const { result } = renderHook(
        () => useRobustNotes('client-1', 'client'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.note).toBeDefined();
      });

      // Test updating notes
      await result.current.updateNotes('Updated client note');

      expect(supabase.from).toHaveBeenCalledWith('robust_notes');
    });
  });

  describe('Cache Management', () => {
    it('should properly invalidate cache after operations', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            ilike: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: [],
                error: null
              }))
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({
          data: { activity_id: 'new-comment' },
          error: null
        }))
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(
        () => useRobustLeadComments('lead-1'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.comments).toBeDefined();
      });

      await result.current.addComment('Test comment');

      // Verify cache invalidation was called
      expect(invalidateSpy).toHaveBeenCalled();
    });
  });
}); 