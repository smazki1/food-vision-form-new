import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSubmissionStatusTracking } from '../useSubmissionStatusTracking';
import { supabase } from '@/integrations/supabase/client';
import { updateClientServings } from '@/api/clientApi';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }))
  }
}));

vi.mock('@/api/clientApi', () => ({
  updateClientServings: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

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

describe('useSubmissionStatusTracking', () => {
  let mockSupabaseFrom: any;
  let mockUpdateClientServings: any;

  beforeEach(() => {
    mockSupabaseFrom = vi.mocked(supabase.from);
    mockUpdateClientServings = vi.mocked(updateClientServings);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Automatic Servings Deduction', () => {
    it('should automatically deduct servings when submission status changes to הושלמה ואושרה', async () => {
      // Mock submission data fetch
      const mockSubmissionSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              submission_status: 'בעיבוד',
              edit_history: null,
              client_id: 'client-123',
              item_name_at_submission: 'עוגת שוקולד'
            }
          })
        })
      });

      // Mock submission update
      const mockSubmissionUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                submission_id: 'sub-123',
                client_id: 'client-123',
                item_name_at_submission: 'עוגת שוקולד',
                submission_status: 'הושלמה ואושרה'
              }
            })
          })
        })
      });

      // Mock client data fetch
      const mockClientSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              remaining_servings: 10,
              restaurant_name: 'מסעדת הטעם'
            }
          })
        })
      });

      mockSupabaseFrom
        .mockReturnValueOnce({ select: mockSubmissionSelect })  // First call - get submission
        .mockReturnValueOnce({ update: mockSubmissionUpdate })  // Second call - update submission
        .mockReturnValueOnce({ select: mockClientSelect });     // Third call - get client

      // Mock successful client servings update
      mockUpdateClientServings.mockResolvedValue({
        client_id: 'client-123',
        remaining_servings: 9
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubmissionStatusTracking(), { wrapper });

      // Trigger status update to approved
      result.current.updateStatus.mutate({
        submissionId: 'sub-123',
        status: 'הושלמה ואושרה' as any,
        note: 'עבודה הושלמה'
      });

      await waitFor(() => {
        expect(result.current.updateStatus.isSuccess).toBe(true);
      });

      // Verify that updateClientServings was called with correct parameters
      expect(mockUpdateClientServings).toHaveBeenCalledWith(
        'client-123',
        9,  // 10 - 1 = 9
        'ניכוי אוטומטי בעקבות אישור עבודה: עוגת שוקולד'
      );

      // Verify success toast was shown
      expect(toast.success).toHaveBeenCalledWith(
        'נוכה סרבינג אחד ממסעדת הטעם. נותרו: 9 מנות'
      );
    });

    it('should not deduct servings when client has zero remaining servings', async () => {
      // Mock submission data with approved status
      const mockSubmissionSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              submission_status: 'בעיבוד',
              edit_history: null,
              client_id: 'client-123',
              item_name_at_submission: 'עוגת שוקולד'
            }
          })
        })
      });

      const mockSubmissionUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                submission_id: 'sub-123',
                client_id: 'client-123',
                item_name_at_submission: 'עוגת שוקולד',
                submission_status: 'הושלמה ואושרה'
              }
            })
          })
        })
      });

      // Mock client with zero servings
      const mockClientSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              remaining_servings: 0,
              restaurant_name: 'מסעדת הטעם'
            }
          })
        })
      });

      mockSupabaseFrom
        .mockReturnValueOnce({ select: mockSubmissionSelect })
        .mockReturnValueOnce({ update: mockSubmissionUpdate })
        .mockReturnValueOnce({ select: mockClientSelect });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubmissionStatusTracking(), { wrapper });

      result.current.updateStatus.mutate({
        submissionId: 'sub-123',
        status: 'הושלמה ואושרה' as any
      });

      await waitFor(() => {
        expect(result.current.updateStatus.isSuccess).toBe(true);
      });

      // Verify that updateClientServings was NOT called
      expect(mockUpdateClientServings).not.toHaveBeenCalled();
    });

    it('should not deduct servings when submission has no client_id', async () => {
      const mockSubmissionSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              submission_status: 'בעיבוד',
              edit_history: null,
              client_id: null,  // No client ID
              item_name_at_submission: 'עוגת שוקולד'
            }
          })
        })
      });

      const mockSubmissionUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                submission_id: 'sub-123',
                client_id: null,
                item_name_at_submission: 'עוגת שוקולד',
                submission_status: 'הושלמה ואושרה'
              }
            })
          })
        })
      });

      mockSupabaseFrom
        .mockReturnValueOnce({ select: mockSubmissionSelect })
        .mockReturnValueOnce({ update: mockSubmissionUpdate });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubmissionStatusTracking(), { wrapper });

      result.current.updateStatus.mutate({
        submissionId: 'sub-123',
        status: 'הושלמה ואושרה' as any
      });

      await waitFor(() => {
        expect(result.current.updateStatus.isSuccess).toBe(true);
      });

      // Verify that updateClientServings was NOT called
      expect(mockUpdateClientServings).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully during automatic serving deduction', async () => {
      const mockSubmissionSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              submission_status: 'בעיבוד',
              edit_history: null,
              client_id: 'client-123',
              item_name_at_submission: 'עוגת שוקולד'
            }
          })
        })
      });

      const mockSubmissionUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                submission_id: 'sub-123',
                client_id: 'client-123',
                item_name_at_submission: 'עוגת שוקולד',
                submission_status: 'הושלמה ואושרה'
              }
            })
          })
        })
      });

      const mockClientSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              remaining_servings: 5,
              restaurant_name: 'מסעדת הטעם'
            }
          })
        })
      });

      mockSupabaseFrom
        .mockReturnValueOnce({ select: mockSubmissionSelect })
        .mockReturnValueOnce({ update: mockSubmissionUpdate })
        .mockReturnValueOnce({ select: mockClientSelect });

      // Mock updateClientServings to throw an error
      mockUpdateClientServings.mockRejectedValue(new Error('Database error'));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubmissionStatusTracking(), { wrapper });

      result.current.updateStatus.mutate({
        submissionId: 'sub-123',
        status: 'הושלמה ואושרה' as any
      });

      await waitFor(() => {
        expect(result.current.updateStatus.isSuccess).toBe(true);
      });

      // Verify error toast was shown
      expect(toast.error).toHaveBeenCalledWith('שגיאה בניכוי אוטומטי של מנה');
    });
  });

  describe('Regular Status Updates', () => {
    it('should not trigger serving deduction for non-approved statuses', async () => {
      const mockSubmissionSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              submission_status: 'ממתינה לעיבוד',
              edit_history: null,
              client_id: 'client-123',
              item_name_at_submission: 'עוגת שוקולד'
            }
          })
        })
      });

      const mockSubmissionUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                submission_id: 'sub-123',
                client_id: 'client-123',
                submission_status: 'בעיבוד'
              }
            })
          })
        })
      });

      mockSupabaseFrom
        .mockReturnValueOnce({ select: mockSubmissionSelect })
        .mockReturnValueOnce({ update: mockSubmissionUpdate });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubmissionStatusTracking(), { wrapper });

      result.current.updateStatus.mutate({
        submissionId: 'sub-123',
        status: 'בעיבוד' as any
      });

      await waitFor(() => {
        expect(result.current.updateStatus.isSuccess).toBe(true);
      });

      // Verify that updateClientServings was NOT called for non-approved status
      expect(mockUpdateClientServings).not.toHaveBeenCalled();
    });
  });
}); 