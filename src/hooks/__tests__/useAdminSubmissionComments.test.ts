import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAdminSubmissionComments, useAdminAddSubmissionComment } from '../useAdminSubmissions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import React from 'react';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
};

describe('useAdminSubmissionComments', () => {
  const mockSubmissionId = 'test-submission-id';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path Tests', () => {
    it('should fetch comments successfully', async () => {
      const mockComments = [
        {
          comment_id: 'comment-1',
          submission_id: mockSubmissionId,
          comment_type: 'admin_internal',
          comment_text: 'Test comment',
          tagged_users: null,
          visibility: 'admin',
          created_by: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockComments, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(
        () => useAdminSubmissionComments(mockSubmissionId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockComments);
      });

      expect(supabase.from).toHaveBeenCalledWith('submission_comments');
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('submission_id', mockSubmissionId);
      expect(mockSupabaseChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return empty array when no comments exist', async () => {
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(
        () => useAdminSubmissionComments(mockSubmissionId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
      });
    });

    it('should not fetch when submissionId is empty', () => {
      const { result } = renderHook(
        () => useAdminSubmissionComments(''),
        { wrapper: createWrapper() }
      );

      expect(result.current.data).toBeUndefined();
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle table not existing error gracefully', async () => {
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '42P01', message: 'relation "public.submission_comments" does not exist' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(
        () => useAdminSubmissionComments(mockSubmissionId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
      });
    });

    it('should handle permission denied error gracefully', async () => {
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '42501', message: 'permission denied' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(
        () => useAdminSubmissionComments(mockSubmissionId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
      });
    });

    it('should handle null data response', async () => {
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(
        () => useAdminSubmissionComments(mockSubmissionId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected database errors gracefully', async () => {
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '50000', message: 'Unexpected database error' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(
        () => useAdminSubmissionComments(mockSubmissionId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
      });
    });

    it('should handle network errors gracefully', async () => {
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockRejectedValue(new Error('Network error')),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(
        () => useAdminSubmissionComments(mockSubmissionId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
      });
    });
  });

  describe('Retry Logic', () => {
    it('should not retry on table not exists error', async () => {
      const orderSpy = vi.fn().mockResolvedValue({
        data: null,
        error: { code: '42P01' },
      });

      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: orderSpy,
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(
        () => useAdminSubmissionComments(mockSubmissionId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
      });

      // Should be called only once (no retries)
      expect(orderSpy).toHaveBeenCalledTimes(1);
    });

    it('should not retry on permission denied error', async () => {
      const orderSpy = vi.fn().mockResolvedValue({
        data: null,
        error: { code: '42501' },
      });

      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: orderSpy,
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(
        () => useAdminSubmissionComments(mockSubmissionId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
      });

      // Should be called only once (no retries)
      expect(orderSpy).toHaveBeenCalledTimes(1);
    });
  });
});

describe('useAdminAddSubmissionComment', () => {
  const mockSubmissionId = 'test-submission-id';
  const mockCommentData = {
    submissionId: mockSubmissionId,
    commentType: 'admin_internal' as const,
    commentText: 'Test comment',
    visibility: 'admin',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path Tests', () => {
    it('should add comment successfully with session user', async () => {
      const mockNewComment = {
        comment_id: 'new-comment-id',
        submission_id: mockSubmissionId,
        comment_type: 'admin_internal',
        comment_text: 'Test comment',
        tagged_users: null,
        visibility: 'admin',
        created_by: 'session-user-id',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock successful session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'session-user-id' },
          },
        },
        error: null,
      } as any);

      const mockSupabaseChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockNewComment, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(
        () => useAdminAddSubmissionComment(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(mockCommentData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabaseChain.insert).toHaveBeenCalledWith({
        submission_id: mockSubmissionId,
        comment_type: 'admin_internal',
        comment_text: 'Test comment',
        visibility: 'admin',
        created_by: 'session-user-id',
      });

      expect(toast.success).toHaveBeenCalledWith('הערה נוספה בהצלחה');
    });

    it('should add comment successfully with fallback admin user', async () => {
      const mockNewComment = {
        comment_id: 'new-comment-id',
        submission_id: mockSubmissionId,
        comment_type: 'admin_internal',
        comment_text: 'Test comment',
        tagged_users: null,
        visibility: 'admin',
        created_by: '4da6bdd1-442e-4e40-8db0-c88fc129c051',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock no session (fallback scenario)
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      const mockSupabaseChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockNewComment, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(
        () => useAdminAddSubmissionComment(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(mockCommentData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabaseChain.insert).toHaveBeenCalledWith({
        submission_id: mockSubmissionId,
        comment_type: 'admin_internal',
        comment_text: 'Test comment',
        visibility: 'admin',
        created_by: '4da6bdd1-442e-4e40-8db0-c88fc129c051',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle table not exists error', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-id' } } },
        error: null,
      } as any);

      const mockSupabaseChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '42P01' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(
        () => useAdminAddSubmissionComment(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(mockCommentData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith('מערכת ההערות עדיין לא מוכנה');
    });

    it('should handle permission denied error', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-id' } } },
        error: null,
      } as any);

      const mockSupabaseChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '42501', message: 'permission denied' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(
        () => useAdminAddSubmissionComment(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(mockCommentData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith('יש להגדיר הרשאות מסד נתונים - אנא הפעל את המיגרציה');
    });

    it('should handle foreign key constraint error', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-id' } } },
        error: null,
      } as any);

      const mockSupabaseChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '23503' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(
        () => useAdminAddSubmissionComment(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(mockCommentData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith('הגשה לא נמצאה');
    });

    it('should handle generic database error', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-id' } } },
        error: null,
      } as any);

      const mockSupabaseChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '50000', message: 'Generic error' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(
        () => useAdminAddSubmissionComment(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(mockCommentData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith('שגיאה בהוספת הערה');
    });

    it('should handle network errors', async () => {
      vi.mocked(supabase.auth.getSession).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(
        () => useAdminAddSubmissionComment(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(mockCommentData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle all comment types correctly', async () => {
      const testCases = [
        { commentType: 'admin_internal' as const, visibility: 'admin' },
        { commentType: 'client_visible' as const, visibility: 'client' },
        { commentType: 'editor_note' as const, visibility: 'editor' },
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();

        vi.mocked(supabase.auth.getSession).mockResolvedValue({
          data: { session: { user: { id: 'user-id' } } },
          error: null,
        } as any);

        const mockSupabaseChain = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { comment_id: 'test-id' },
            error: null,
          }),
        };

        vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

        const { result } = renderHook(
          () => useAdminAddSubmissionComment(),
          { wrapper: createWrapper() }
        );

        result.current.mutate({
          submissionId: mockSubmissionId,
          commentType: testCase.commentType,
          commentText: 'Test comment',
          visibility: testCase.visibility,
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(mockSupabaseChain.insert).toHaveBeenCalledWith({
          submission_id: mockSubmissionId,
          comment_type: testCase.commentType,
          comment_text: 'Test comment',
          visibility: testCase.visibility,
          created_by: 'user-id',
        });
      }
    });

    it('should handle empty comment text', async () => {
      // Note: This test validates that the hook can handle empty text,
      // but the UI should prevent this scenario
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-id' } } },
        error: null,
      } as any);

      const mockSupabaseChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { comment_id: 'test-id' },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(
        () => useAdminAddSubmissionComment(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({
        submissionId: mockSubmissionId,
        commentType: 'admin_internal',
        commentText: '',
        visibility: 'admin',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabaseChain.insert).toHaveBeenCalledWith({
        submission_id: mockSubmissionId,
        comment_type: 'admin_internal',
        comment_text: '',
        visibility: 'admin',
        created_by: 'user-id',
      });
    });
  });
}); 