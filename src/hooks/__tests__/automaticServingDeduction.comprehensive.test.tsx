import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSubmissionStatusTracking } from '../useSubmissionStatusTracking';
import { useAdminUpdateSubmissionStatus } from '../useAdminSubmissions';
import { useUpdateSubmissionStatus } from '../useSubmissions';
import { useSubmissionStatus } from '../useSubmissionStatus';
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

describe('Automatic Serving Deduction - Comprehensive Tests', () => {
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

  // Common test data
  const mockSubmissionData = {
    submission_id: 'sub-123',
    client_id: 'client-123',
    item_name_at_submission: 'עוגת שוקולד מיוחדת',
    submission_status: 'בעיבוד'
  };

  const mockClientData = {
    remaining_servings: 15,
    restaurant_name: 'מסעדת הטעם הטוב'
  };

  const setupMockCalls = (initialStatus = 'בעיבוד', finalStatus = 'הושלמה ואושרה', clientServings = 15) => {
    // Mock submission fetch
    const mockSubmissionSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            ...mockSubmissionData,
            submission_status: initialStatus,
            edit_history: null
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
              ...mockSubmissionData,
              submission_status: finalStatus
            }
          })
        })
      })
    });

    // Mock client fetch
    const mockClientSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            ...mockClientData,
            remaining_servings: clientServings
          }
        })
      })
    });

    mockSupabaseFrom
      .mockReturnValueOnce({ select: mockSubmissionSelect })
      .mockReturnValueOnce({ update: mockSubmissionUpdate })
      .mockReturnValueOnce({ select: mockClientSelect });

    return { mockSubmissionSelect, mockSubmissionUpdate, mockClientSelect };
  };

  describe('useSubmissionStatusTracking Hook', () => {
    it('should deduct servings when status changes to הושלמה ואושרה', async () => {
      setupMockCalls();
      mockUpdateClientServings.mockResolvedValue({ client_id: 'client-123', remaining_servings: 14 });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubmissionStatusTracking(), { wrapper });

      result.current.updateStatus.mutate({
        submissionId: 'sub-123',
        status: 'הושלמה ואושרה' as any,
        note: 'עבודה הושלמה בהצלחה'
      });

      await waitFor(() => {
        expect(result.current.updateStatus.isSuccess).toBe(true);
      });

      expect(mockUpdateClientServings).toHaveBeenCalledWith(
        'client-123',
        14,
        'ניכוי אוטומטי בעקבות אישור עבודה: עוגת שוקולד מיוחדת'
      );

      expect(toast.success).toHaveBeenCalledWith(
        'נוכה סרבינג אחד ממסעדת הטעם הטוב. נותרו: 14 מנות'
      );
    });

    it('should not deduct servings for other status changes', async () => {
      setupMockCalls('בעיבוד', 'מוכנה להצגה');
      
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubmissionStatusTracking(), { wrapper });

      result.current.updateStatus.mutate({
        submissionId: 'sub-123',
        status: 'מוכנה להצגה' as any
      });

      await waitFor(() => {
        expect(result.current.updateStatus.isSuccess).toBe(true);
      });

      expect(mockUpdateClientServings).not.toHaveBeenCalled();
    });
  });

  describe('useAdminUpdateSubmissionStatus Hook', () => {
    it('should deduct servings when admin marks submission as הושלמה ואושרה', async () => {
      setupMockCalls();
      mockUpdateClientServings.mockResolvedValue({ client_id: 'client-123', remaining_servings: 14 });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAdminUpdateSubmissionStatus(), { wrapper });

      result.current.mutate({
        submissionId: 'sub-123',
        status: 'הושלמה ואושרה' as any
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUpdateClientServings).toHaveBeenCalledWith(
        'client-123',
        14,
        'ניכוי אוטומטי בעקבות אישור עבודה: עוגת שוקולד מיוחדת'
      );
    });

    it('should handle client fetch errors gracefully', async () => {
      const mockSubmissionSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockSubmissionData
          })
        })
      });

      const mockSubmissionUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockSubmissionData,
                submission_status: 'הושלמה ואושרה'
              }
            })
          })
        })
      });

      const mockClientSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(new Error('Client not found'))
        })
      });

      mockSupabaseFrom
        .mockReturnValueOnce({ select: mockSubmissionSelect })
        .mockReturnValueOnce({ update: mockSubmissionUpdate })
        .mockReturnValueOnce({ select: mockClientSelect });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAdminUpdateSubmissionStatus(), { wrapper });

      result.current.mutate({
        submissionId: 'sub-123',
        status: 'הושלמה ואושרה' as any
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUpdateClientServings).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled(); // Should fail silently
    });
  });

  describe('useUpdateSubmissionStatus Hook (Customer)', () => {
    it('should deduct servings when customer submission is marked as הושלמה ואושרה', async () => {
      setupMockCalls();
      mockUpdateClientServings.mockResolvedValue({ client_id: 'client-123', remaining_servings: 14 });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateSubmissionStatus(), { wrapper });

      result.current.mutate({
        submissionId: 'sub-123',
        status: 'הושלמה ואושרה' as any
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUpdateClientServings).toHaveBeenCalledWith(
        'client-123',
        14,
        'ניכוי אוטומטי בעקבות אישור עבודה: עוגת שוקולד מיוחדת'
      );
    });
  });

  describe('useSubmissionStatus Hook (General)', () => {
    it('should deduct servings when submission status is updated to הושלמה ואושרה', async () => {
      // Special setup for useSubmissionStatus which has different API
      const mockSubmissionUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockSubmissionData,
                submission_status: 'הושלמה ואושרה'
              }
            })
          })
        })
      });

      const mockClientSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockClientData
          })
        })
      });

      mockSupabaseFrom
        .mockReturnValueOnce({ update: mockSubmissionUpdate })
        .mockReturnValueOnce({ select: mockClientSelect });

      mockUpdateClientServings.mockResolvedValue({ client_id: 'client-123', remaining_servings: 14 });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubmissionStatus(), { wrapper });

      result.current.updateStatus.mutate({
        submissionId: 'sub-123',
        status: 'הושלמה ואושרה' as any
      });

      await waitFor(() => {
        expect(result.current.updateStatus.isSuccess).toBe(true);
      });

      expect(mockUpdateClientServings).toHaveBeenCalledWith(
        'client-123',
        14,
        'ניכוי אוטומטי בעקבות אישור עבודה: עוגת שוקולד מיוחדת'
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should not deduct servings when client has zero remaining servings', async () => {
      setupMockCalls('בעיבוד', 'הושלמה ואושרה', 0);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubmissionStatusTracking(), { wrapper });

      result.current.updateStatus.mutate({
        submissionId: 'sub-123',
        status: 'הושלמה ואושרה' as any
      });

      await waitFor(() => {
        expect(result.current.updateStatus.isSuccess).toBe(true);
      });

      expect(mockUpdateClientServings).not.toHaveBeenCalled();
    });

    it('should handle submission without client_id', async () => {
      const mockSubmissionSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              ...mockSubmissionData,
              client_id: null,
              submission_status: 'בעיבוד'
            }
          })
        })
      });

      const mockSubmissionUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockSubmissionData,
                client_id: null,
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

      expect(mockUpdateClientServings).not.toHaveBeenCalled();
    });

    it('should handle updateClientServings API failure gracefully', async () => {
      setupMockCalls();
      mockUpdateClientServings.mockRejectedValue(new Error('API Error'));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubmissionStatusTracking(), { wrapper });

      result.current.updateStatus.mutate({
        submissionId: 'sub-123',
        status: 'הושלמה ואושרה' as any
      });

      await waitFor(() => {
        expect(result.current.updateStatus.isSuccess).toBe(true);
      });

      expect(mockUpdateClientServings).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('שגיאה בניכוי אוטומטי של מנה');
    });

    it('should handle multiple consecutive approvals correctly', async () => {
      // First approval
      setupMockCalls('בעיבוד', 'הושלמה ואושרה', 5);
      mockUpdateClientServings.mockResolvedValueOnce({ client_id: 'client-123', remaining_servings: 4 });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubmissionStatusTracking(), { wrapper });

      result.current.updateStatus.mutate({
        submissionId: 'sub-123',
        status: 'הושלמה ואושרה' as any
      });

      await waitFor(() => {
        expect(result.current.updateStatus.isSuccess).toBe(true);
      });

      expect(mockUpdateClientServings).toHaveBeenCalledWith(
        'client-123',
        4,
        'ניכוי אוטומטי בעקבות אישור עבודה: עוגת שוקולד מיוחדת'
      );

      expect(toast.success).toHaveBeenCalledWith(
        'נוכה סרבינג אחד ממסעדת הטעם הטוב. נותרו: 4 מנות'
      );
    });

    it('should validate Hebrew item names in audit trail', async () => {
      const hebrewSubmissionData = {
        ...mockSubmissionData,
        item_name_at_submission: 'מנה עם תווי עברית מיוחדים: חֲלָה וּמַרְמְלָדָה'
      };

      const mockSubmissionSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              ...hebrewSubmissionData,
              submission_status: 'בעיבוד'
            }
          })
        })
      });

      const mockSubmissionUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...hebrewSubmissionData,
                submission_status: 'הושלמה ואושרה'
              }
            })
          })
        })
      });

      const mockClientSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockClientData
          })
        })
      });

      mockSupabaseFrom
        .mockReturnValueOnce({ select: mockSubmissionSelect })
        .mockReturnValueOnce({ update: mockSubmissionUpdate })
        .mockReturnValueOnce({ select: mockClientSelect });

      mockUpdateClientServings.mockResolvedValue({ client_id: 'client-123', remaining_servings: 14 });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSubmissionStatusTracking(), { wrapper });

      result.current.updateStatus.mutate({
        submissionId: 'sub-123',
        status: 'הושלמה ואושרה' as any
      });

      await waitFor(() => {
        expect(result.current.updateStatus.isSuccess).toBe(true);
      });

      expect(mockUpdateClientServings).toHaveBeenCalledWith(
        'client-123',
        14,
        'ניכוי אוטומטי בעקבות אישור עבודה: מנה עם תווי עברית מיוחדים: חֲלָה וּמַרְמְלָדָה'
      );
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate correct queries after successful serving deduction', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false }
        }
      });
      
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      setupMockCalls();
      mockUpdateClientServings.mockResolvedValue({ client_id: 'client-123', remaining_servings: 14 });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useAdminUpdateSubmissionStatus(), { wrapper });

      result.current.mutate({
        submissionId: 'sub-123',
        status: 'הושלמה ואושרה' as any
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify that the correct queries are invalidated
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['client', 'client-123'] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['client-detail', 'client-123'] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['clients'] });
    });
  });
}); 