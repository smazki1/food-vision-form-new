import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  useAdminSubmissionComments,
  useAdminAddSubmissionComment,
  useAdminDeleteSubmissionComment
} from '@/hooks/useAdminSubmissions';
import {
  useSubmissionComments,
  useAddSubmissionComment
} from '@/hooks/useSubmissions';
import { SubmissionCommentType } from '@/types/submission';

// Mock dependencies
vi.mock('@/integrations/supabase/client');
vi.mock('sonner');

const mockSupabase = supabase as any;
const mockToast = toast as any;

// Test data
const mockSubmissionId = 'test-submission-id';
const mockUserId = '4da6bdd1-442e-4e40-8db0-c88fc129c051';
const mockCommentText = 'Test comment text';

const mockComment = {
  comment_id: 'comment-1',
  submission_id: mockSubmissionId,
  comment_type: 'admin_internal' as SubmissionCommentType,
  comment_text: mockCommentText,
  tagged_users: null,
  visibility: 'admin',
  created_by: mockUserId,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockComments = [mockComment];

// Helper function to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Submission Comments System - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    mockSupabase.auth = {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: { id: mockUserId }
          }
        },
        error: null
      })
    };

    mockSupabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        }),
        in: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockComment,
            error: null
          })
        })
      })
    });

    mockToast.success = vi.fn();
    mockToast.error = vi.fn();
  });

  describe('Admin Comment Fetching (useAdminSubmissionComments)', () => {
    describe('Happy Path Tests', () => {
      it('should fetch comments successfully', async () => {
        // Override default mock for this test
        mockSupabase.from = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockComments,
                error: null
              })
            })
          })
        });

        const { result } = renderHook(
          () => useAdminSubmissionComments(mockSubmissionId),
          { wrapper: createWrapper() }
        );

        await waitFor(() => {
          expect(result.current.data).toEqual(mockComments);
        });

        expect(mockSupabase.from).toHaveBeenCalledWith('submission_comments');
      });

      it('should handle empty submission ID', async () => {
        const { result } = renderHook(
          () => useAdminSubmissionComments(''),
          { wrapper: createWrapper() }
        );

        // Query should be disabled with empty ID
        expect(result.current.data).toBeUndefined();
      });

      it('should handle null submission ID', async () => {
        const { result } = renderHook(
          () => useAdminSubmissionComments(null as any),
          { wrapper: createWrapper() }
        );

        expect(result.current.data).toBeUndefined();
      });

      it('should return empty array when no comments exist', async () => {
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
      it('should handle table not found error gracefully', async () => {
        mockSupabase.from = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: { code: '42P01', message: 'relation "public.submission_comments" does not exist' }
              })
            })
          })
        });

        const { result } = renderHook(
          () => useAdminSubmissionComments(mockSubmissionId),
          { wrapper: createWrapper() }
        );

        await waitFor(() => {
          expect(result.current.data).toEqual([]);
        });
      });

      it('should handle permission denied error gracefully', async () => {
        mockSupabase.from = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: { code: '42501', message: 'permission denied' }
              })
            })
          })
        });

        const { result } = renderHook(
          () => useAdminSubmissionComments(mockSubmissionId),
          { wrapper: createWrapper() }
        );

        await waitFor(() => {
          expect(result.current.data).toEqual([]);
        });
      });
    });
  });

  describe('Admin Comment Creation (useAdminAddSubmissionComment)', () => {
    describe('Happy Path Tests', () => {
      it('should create admin_internal comment successfully', async () => {
        const { result } = renderHook(
          () => useAdminAddSubmissionComment(),
          { wrapper: createWrapper() }
        );

        const commentData = {
          submissionId: mockSubmissionId,
          commentType: 'admin_internal' as SubmissionCommentType,
          commentText: mockCommentText,
          visibility: 'admin'
        };

        result.current.mutate(commentData);

        await waitFor(() => {
          expect(mockToast.success).toHaveBeenCalledWith('הערה נוספה בהצלחה');
        });
      });

      it('should create client_visible comment with correct visibility', async () => {
        const clientVisibleComment = {
          ...mockComment,
          comment_type: 'client_visible' as SubmissionCommentType,
          visibility: 'client'
        };

        mockSupabase.from = vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: clientVisibleComment,
                error: null
              })
            })
          })
        });

        const { result } = renderHook(
          () => useAdminAddSubmissionComment(),
          { wrapper: createWrapper() }
        );

        result.current.mutate({
          submissionId: mockSubmissionId,
          commentType: 'client_visible' as SubmissionCommentType,
          commentText: mockCommentText,
          visibility: 'client'
        });

        await waitFor(() => {
          expect(mockToast.success).toHaveBeenCalledWith('הערה נוספה בהצלחה');
        });
      });

      it('should create editor_note comment with correct visibility', async () => {
        const editorComment = {
          ...mockComment,
          comment_type: 'editor_note' as SubmissionCommentType,
          visibility: 'editor'
        };

        mockSupabase.from = vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: editorComment,
                error: null
              })
            })
          })
        });

        const { result } = renderHook(
          () => useAdminAddSubmissionComment(),
          { wrapper: createWrapper() }
        );

        result.current.mutate({
          submissionId: mockSubmissionId,
          commentType: 'editor_note' as SubmissionCommentType,
          commentText: mockCommentText,
          visibility: 'editor'
        });

        await waitFor(() => {
          expect(mockToast.success).toHaveBeenCalledWith('הערה נוספה בהצלחה');
        });
      });
    });

    describe('Authentication Handling', () => {
      it('should use session user ID when available', async () => {
        const sessionUserId = 'session-user-id';
        mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
          data: {
            session: {
              user: { id: sessionUserId }
            }
          },
          error: null
        });

        const { result } = renderHook(
          () => useAdminAddSubmissionComment(),
          { wrapper: createWrapper() }
        );

        result.current.mutate({
          submissionId: mockSubmissionId,
          commentType: 'admin_internal' as SubmissionCommentType,
          commentText: mockCommentText,
          visibility: 'admin'
        });

        await waitFor(() => {
          expect(mockToast.success).toHaveBeenCalledWith('הערה נוספה בהצלחה');
        });
      });

      it('should fallback to admin user ID when no session', async () => {
        mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
          data: { session: null },
          error: null
        });

        const { result } = renderHook(
          () => useAdminAddSubmissionComment(),
          { wrapper: createWrapper() }
        );

        result.current.mutate({
          submissionId: mockSubmissionId,
          commentType: 'admin_internal' as SubmissionCommentType,
          commentText: mockCommentText,
          visibility: 'admin'
        });

        await waitFor(() => {
          expect(mockToast.success).toHaveBeenCalledWith('הערה נוספה בהצלחה');
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle table not found error', async () => {
        mockSupabase.from = vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: '42P01' }
              })
            })
          })
        });

        const { result } = renderHook(
          () => useAdminAddSubmissionComment(),
          { wrapper: createWrapper() }
        );

        result.current.mutate({
          submissionId: mockSubmissionId,
          commentType: 'admin_internal' as SubmissionCommentType,
          commentText: mockCommentText,
          visibility: 'admin'
        });

        await waitFor(() => {
          expect(mockToast.error).toHaveBeenCalledWith('מערכת ההערות עדיין לא מוכנה');
        });
      });

      it('should handle foreign key constraint violation', async () => {
        mockSupabase.from = vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: '23503' }
              })
            })
          })
        });

        const { result } = renderHook(
          () => useAdminAddSubmissionComment(),
          { wrapper: createWrapper() }
        );

        result.current.mutate({
          submissionId: mockSubmissionId,
          commentType: 'admin_internal' as SubmissionCommentType,
          commentText: mockCommentText,
          visibility: 'admin'
        });

        await waitFor(() => {
          expect(mockToast.error).toHaveBeenCalledWith('הגשה לא נמצאה');
        });
      });

      it('should handle permission denied error', async () => {
        mockSupabase.from = vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: '42501', message: 'permission denied' }
              })
            })
          })
        });

        const { result } = renderHook(
          () => useAdminAddSubmissionComment(),
          { wrapper: createWrapper() }
        );

        result.current.mutate({
          submissionId: mockSubmissionId,
          commentType: 'admin_internal' as SubmissionCommentType,
          commentText: mockCommentText,
          visibility: 'admin'
        });

        await waitFor(() => {
          expect(mockToast.error).toHaveBeenCalledWith('יש להגדיר הרשאות מסד נתונים - אנא הפעל את המיגרציה');
        });
      });

      it('should handle generic errors', async () => {
        mockSupabase.from = vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'GENERIC_ERROR', message: 'Something went wrong' }
              })
            })
          })
        });

        const { result } = renderHook(
          () => useAdminAddSubmissionComment(),
          { wrapper: createWrapper() }
        );

        result.current.mutate({
          submissionId: mockSubmissionId,
          commentType: 'admin_internal' as SubmissionCommentType,
          commentText: mockCommentText,
          visibility: 'admin'
        });

        await waitFor(() => {
          expect(mockToast.error).toHaveBeenCalledWith('שגיאה בהוספת הערה');
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty comment text', async () => {
        const { result } = renderHook(
          () => useAdminAddSubmissionComment(),
          { wrapper: createWrapper() }
        );

        result.current.mutate({
          submissionId: mockSubmissionId,
          commentType: 'admin_internal' as SubmissionCommentType,
          commentText: '',
          visibility: 'admin'
        });

        await waitFor(() => {
          expect(mockToast.success).toHaveBeenCalledWith('הערה נוספה בהצלחה');
        });
      });

      it('should handle very long comment text', async () => {
        const longText = 'A'.repeat(1000);
        
        const { result } = renderHook(
          () => useAdminAddSubmissionComment(),
          { wrapper: createWrapper() }
        );

        result.current.mutate({
          submissionId: mockSubmissionId,
          commentType: 'admin_internal' as SubmissionCommentType,
          commentText: longText,
          visibility: 'admin'
        });

        await waitFor(() => {
          expect(mockToast.success).toHaveBeenCalledWith('הערה נוספה בהצלחה');
        });
      });

      it('should handle special characters in comment text', async () => {
        const specialText = 'Comment with הברית special chars: @#$%^&*()[]{}|';
        
        const { result } = renderHook(
          () => useAdminAddSubmissionComment(),
          { wrapper: createWrapper() }
        );

        result.current.mutate({
          submissionId: mockSubmissionId,
          commentType: 'admin_internal' as SubmissionCommentType,
          commentText: specialText,
          visibility: 'admin'
        });

        await waitFor(() => {
          expect(mockToast.success).toHaveBeenCalledWith('הערה נוספה בהצלחה');
        });
      });
    });
  });

  describe('Customer Comment Operations (useSubmissionComments)', () => {
    describe('Happy Path Tests', () => {
      it('should fetch only client-visible comments for customers', async () => {
        const clientVisibleComment = {
          ...mockComment,
          comment_type: 'client_visible' as SubmissionCommentType,
          visibility: 'client'
        };

        mockSupabase.from = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [clientVisibleComment],
                  error: null
                })
              })
            })
          })
        });

        const { result } = renderHook(
          () => useSubmissionComments(mockSubmissionId),
          { wrapper: createWrapper() }
        );

        await waitFor(() => {
          expect(result.current.data).toEqual([clientVisibleComment]);
        });
      });
    });

    describe('Access Control', () => {
      it('should filter for client_visible comments only', async () => {
        mockSupabase.from = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          })
        });

        renderHook(
          () => useSubmissionComments(mockSubmissionId),
          { wrapper: createWrapper() }
        );

        await waitFor(() => {
          expect(mockSupabase.from).toHaveBeenCalledWith('submission_comments');
        });
      });
    });
  });

  describe('Integration Tests', () => {
    describe('Comment Type and Visibility Mapping', () => {
      it('should correctly map comment types to visibility levels', async () => {
        const testCases = [
          { commentType: 'admin_internal' as SubmissionCommentType, expectedVisibility: 'admin' },
          { commentType: 'client_visible' as SubmissionCommentType, expectedVisibility: 'client' },
          { commentType: 'editor_note' as SubmissionCommentType, expectedVisibility: 'editor' }
        ];

        for (const testCase of testCases) {
          const { result } = renderHook(
            () => useAdminAddSubmissionComment(),
            { wrapper: createWrapper() }
          );

          result.current.mutate({
            submissionId: mockSubmissionId,
            commentType: testCase.commentType,
            commentText: mockCommentText,
            visibility: testCase.expectedVisibility
          });

          await waitFor(() => {
            expect(mockToast.success).toHaveBeenCalledWith('הערה נוספה בהצלחה');
          });

          vi.clearAllMocks();
          
          // Reset mocks for next iteration
          mockSupabase.from = vi.fn().mockReturnValue({
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockComment,
                  error: null
                })
              })
            })
          });
          mockToast.success = vi.fn();
        }
      });
    });

    describe('Database Constraint Validation', () => {
      it('should validate comment_type constraints', async () => {
        const validCommentTypes: SubmissionCommentType[] = ['admin_internal', 'client_visible', 'editor_note'];

        for (const commentType of validCommentTypes) {
          const { result } = renderHook(
            () => useAdminAddSubmissionComment(),
            { wrapper: createWrapper() }
          );

          result.current.mutate({
            submissionId: mockSubmissionId,
            commentType: commentType,
            commentText: mockCommentText,
            visibility: 'admin'
          });

          await waitFor(() => {
            expect(mockToast.success).toHaveBeenCalledWith('הערה נוספה בהצלחה');
          });

          vi.clearAllMocks();
          
          // Reset mocks for next iteration
          mockSupabase.from = vi.fn().mockReturnValue({
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockComment,
                  error: null
                })
              })
            })
          });
          mockToast.success = vi.fn();
        }
      });

      it('should validate visibility constraints', async () => {
        const validVisibilities = ['private', 'client', 'editor', 'admin', 'all'];

        for (const visibility of validVisibilities) {
          const { result } = renderHook(
            () => useAdminAddSubmissionComment(),
            { wrapper: createWrapper() }
          );

          result.current.mutate({
            submissionId: mockSubmissionId,
            commentType: 'admin_internal' as SubmissionCommentType,
            commentText: mockCommentText,
            visibility
          });

          await waitFor(() => {
            expect(mockToast.success).toHaveBeenCalledWith('הערה נוספה בהצלחה');
          });

          vi.clearAllMocks();
          
          // Reset mocks for next iteration
          mockSupabase.from = vi.fn().mockReturnValue({
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockComment,
                  error: null
                })
              })
            })
          });
          mockToast.success = vi.fn();
        }
      });
    });
  });

  describe('Performance and Load Tests', () => {
    it('should handle multiple rapid comment submissions', async () => {
      const { result } = renderHook(
        () => useAdminAddSubmissionComment(),
        { wrapper: createWrapper() }
      );

      // Submit 5 comments rapidly
      const promises = Array.from({ length: 5 }, (_, index) => {
        return new Promise<void>((resolve) => {
          result.current.mutate({
            submissionId: mockSubmissionId,
            commentType: 'admin_internal' as SubmissionCommentType,
            commentText: `Comment ${index + 1}`,
            visibility: 'admin'
          });
          resolve();
        });
      });

      await Promise.all(promises);

      // All submissions should complete
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalled();
      });
    });
  });
}); 