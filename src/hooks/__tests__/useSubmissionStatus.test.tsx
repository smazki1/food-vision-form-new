import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useSubmissionStatus } from '../useSubmissionStatus';
import { supabase } from '@/integrations/supabase/client';
import { updateClientServings } from '@/api/clientApi';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/integrations/supabase/client');
vi.mock('@/api/clientApi');
vi.mock('sonner');

const mockSupabase = supabase as any;
const mockUpdateClientServings = updateClientServings as any;
const mockToast = toast as any;

// Test wrapper with QueryClient
const createWrapper = () => {
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

describe('useSubmissionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.success = vi.fn();
    mockToast.error = vi.fn();
  });

  describe('Hook initialization', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useSubmissionStatus(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isUpdating).toBe(false);
      expect(result.current.availableStatuses).toEqual([
        'ממתינה לעיבוד',
        'בעיבוד',
        'מוכנה להצגה',
        'הערות התקבלו',
        'הושלמה ואושרה'
      ]);
      expect(typeof result.current.updateSubmissionStatus).toBe('function');
    });
  });

  describe('Basic status updates', () => {
    it('should successfully update submission status', async () => {
      // Mock current submission fetch
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                submission_status: 'בעיבוד',
                client_id: 'client-123',
                item_name_at_submission: 'Test Dish'
              },
              error: null
            })
          })
        })
      });

      // Mock status update
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  submission_id: 'test-123',
                  submission_status: 'מוכנה להצגה',
                  client_id: 'client-123',
                  item_name_at_submission: 'Test Dish'
                },
                error: null
              })
            })
          })
        })
      });

      const { result } = renderHook(() => useSubmissionStatus(), {
        wrapper: createWrapper(),
      });

      const success = await result.current.updateSubmissionStatus('test-123', 'מוכנה להצגה');

      expect(success).toBe(true);
      expect(mockToast.success).toHaveBeenCalledWith('סטטוס ההגשה עודכן ל: מוכנה להצגה');
    });
  });

  describe('Serving deduction and restoration', () => {
    it('should deduct serving when changing TO approved status', async () => {
      // Mock current submission fetch (not approved)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                submission_status: 'מוכנה להצגה',
                client_id: 'client-123',
                item_name_at_submission: 'Test Dish'
              },
              error: null
            })
          })
        })
      });

      // Mock status update
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  submission_id: 'sub-123',
                  submission_status: 'הושלמה ואושרה',
                  client_id: 'client-123',
                  item_name_at_submission: 'Test Dish'
                },
                error: null
              })
            })
          })
        })
      });

      // Mock client fetch for serving deduction
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                remaining_servings: 5,
                restaurant_name: 'Test Restaurant'
              },
              error: null
            })
          })
        })
      });

      mockUpdateClientServings.mockResolvedValue(true);

      const { result } = renderHook(() => useSubmissionStatus(), {
        wrapper: createWrapper(),
      });

      const success = await result.current.updateSubmissionStatus('sub-123', 'הושלמה ואושרה');

      expect(success).toBe(true);
      expect(mockUpdateClientServings).toHaveBeenCalledWith(
        'client-123',
        4,
        'ניכוי אוטומטי בעקבות אישור עבודה: Test Dish'
      );
      expect(mockToast.success).toHaveBeenCalledWith('נוכה סרבינג אחד מTest Restaurant. נותרו: 4 מנות');
    });

    it('should restore serving when changing FROM approved status', async () => {
      // Mock current submission fetch (currently approved)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                submission_status: 'הושלמה ואושרה',
                client_id: 'client-123',
                item_name_at_submission: 'Test Dish'
              },
              error: null
            })
          })
        })
      });

      // Mock status update
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  submission_id: 'sub-123',
                  submission_status: 'הערות התקבלו',
                  client_id: 'client-123',
                  item_name_at_submission: 'Test Dish'
                },
                error: null
              })
            })
          })
        })
      });

      // Mock client fetch for serving restoration
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                remaining_servings: 3,
                restaurant_name: 'Test Restaurant'
              },
              error: null
            })
          })
        })
      });

      mockUpdateClientServings.mockResolvedValue(true);

      const { result } = renderHook(() => useSubmissionStatus(), {
        wrapper: createWrapper(),
      });

      const success = await result.current.updateSubmissionStatus('sub-123', 'הערות התקבלו');

      expect(success).toBe(true);
      expect(mockUpdateClientServings).toHaveBeenCalledWith(
        'client-123',
        4,
        'החזרת מנה אוטומטית בעקבות ביטול אישור עבודה: Test Dish'
      );
      expect(mockToast.success).toHaveBeenCalledWith('הוחזרה מנה אחת לTest Restaurant. סה"כ: 4 מנות');
    });

    it('should not change servings when status remains approved', async () => {
      // Mock current submission fetch (already approved)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                submission_status: 'הושלמה ואושרה',
                client_id: 'client-123',
                item_name_at_submission: 'Test Dish'
              },
              error: null
            })
          })
        })
      });

      // Mock status update (same status)
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  submission_id: 'sub-123',
                  submission_status: 'הושלמה ואושרה',
                  client_id: 'client-123',
                  item_name_at_submission: 'Test Dish'
                },
                error: null
              })
            })
          })
        })
      });

      const { result } = renderHook(() => useSubmissionStatus(), {
        wrapper: createWrapper(),
      });

      const success = await result.current.updateSubmissionStatus('sub-123', 'הושלמה ואושרה');

      expect(success).toBe(true);
      expect(mockUpdateClientServings).not.toHaveBeenCalled();
    });

    it('should not change servings for non-approved status changes', async () => {
      // Mock current submission fetch
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                submission_status: 'בעיבוד',
                client_id: 'client-123',
                item_name_at_submission: 'Test Dish'
              },
              error: null
            })
          })
        })
      });

      // Mock status update
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  submission_id: 'sub-123',
                  submission_status: 'מוכנה להצגה',
                  client_id: 'client-123',
                  item_name_at_submission: 'Test Dish'
                },
                error: null
              })
            })
          })
        })
      });

      const { result } = renderHook(() => useSubmissionStatus(), {
        wrapper: createWrapper(),
      });

      const success = await result.current.updateSubmissionStatus('sub-123', 'מוכנה להצגה');

      expect(success).toBe(true);
      expect(mockUpdateClientServings).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle empty submission ID', async () => {
      const { result } = renderHook(() => useSubmissionStatus(), {
        wrapper: createWrapper(),
      });

      const success = await result.current.updateSubmissionStatus('', 'בעיבוד');

      expect(success).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith('מזהה הגשה חסר');
    });

    it('should handle fetch current submission error', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Submission not found' }
            })
          })
        })
      });

      const { result } = renderHook(() => useSubmissionStatus(), {
        wrapper: createWrapper(),
      });

      const success = await result.current.updateSubmissionStatus('sub-123', 'הושלמה ואושרה');

      expect(success).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith('שגיאה בטעינת נתוני ההגשה: Submission not found');
    });

    it('should handle status update errors', async () => {
      // Mock current submission fetch
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                submission_status: 'בעיבוד',
                client_id: 'client-123',
                item_name_at_submission: 'Test Dish'
              },
              error: null
            })
          })
        })
      });

      // Mock status update error
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' }
              })
            })
          })
        })
      });

      const { result } = renderHook(() => useSubmissionStatus(), {
        wrapper: createWrapper(),
      });

      const success = await result.current.updateSubmissionStatus('test-123', 'בעיבוד');

      expect(success).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith('שגיאה בעדכון סטטוס: Database error');
    });

    it('should handle serving restoration errors gracefully', async () => {
      // Mock current submission fetch (approved)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                submission_status: 'הושלמה ואושרה',
                client_id: 'client-123',
                item_name_at_submission: 'Test Dish'
              },
              error: null
            })
          })
        })
      });

      // Mock successful status update
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  submission_id: 'sub-123',
                  submission_status: 'בעיבוד',
                  client_id: 'client-123',
                  item_name_at_submission: 'Test Dish'
                },
                error: null
              })
            })
          })
        })
      });

      // Mock client fetch error for serving restoration
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Client not found' }
            })
          })
        })
      });

      const { result } = renderHook(() => useSubmissionStatus(), {
        wrapper: createWrapper(),
      });

      const success = await result.current.updateSubmissionStatus('sub-123', 'בעיבוד');

      // Status update should still succeed even if serving restoration fails
      expect(success).toBe(true);
      expect(mockToast.success).toHaveBeenCalledWith('סטטוס ההגשה עודכן ל: בעיבוד');
    });
  });

  describe('Loading state management', () => {
    it('should manage loading state correctly during update', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      // Mock current submission fetch
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue(promise)
          })
        })
      });

      const { result } = renderHook(() => useSubmissionStatus(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isUpdating).toBe(false);

      const updatePromise = result.current.updateSubmissionStatus('sub-123', 'הושלמה ואושרה');

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(true);
      });

      resolvePromise!({
        data: {
          submission_status: 'בעיבוד',
          client_id: 'client-123',
          item_name_at_submission: 'Test Dish'
        },
        error: null
      });

      await updatePromise;

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });
    });
  });
}); 