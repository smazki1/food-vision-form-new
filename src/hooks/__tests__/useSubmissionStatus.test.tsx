import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useSubmissionStatus, SUBMISSION_STATUSES } from '../useSubmissionStatus';
import React from 'react';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@/api/clientApi', () => ({
  updateClientServings: vi.fn()
}));

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { updateClientServings } from '@/api/clientApi';

describe('useSubmissionStatus Hook', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Hook Initialization', () => {
    it('should return initial state correctly', () => {
      const { result } = renderHook(() => useSubmissionStatus(), { wrapper });

      expect(result.current.isUpdating).toBe(false);
      expect(result.current.availableStatuses).toEqual(SUBMISSION_STATUSES);
      expect(typeof result.current.updateSubmissionStatus).toBe('function');
    });

    it('should have all required status options', () => {
      const { result } = renderHook(() => useSubmissionStatus(), { wrapper });

      const expectedStatuses = [
        'ממתינה לעיבוד',
        'בעיבוד', 
        'מוכנה להצגה',
        'הערות התקבלו',
        'הושלמה ואושרה'
      ];

      expect(result.current.availableStatuses).toEqual(expectedStatuses);
    });
  });

  describe('updateSubmissionStatus - Happy Path', () => {
    it('should successfully update submission status', async () => {
      const mockData = {
        submission_id: 'test-123',
        submission_status: 'בעיבוד',
        client_id: 'client-123'
      };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockData, error: null })
            })
          })
        })
      });

      const { result } = renderHook(() => useSubmissionStatus(), { wrapper });

      let updateResult: boolean | undefined;
      await act(async () => {
        updateResult = await result.current.updateSubmissionStatus('test-123', 'בעיבוד');
      });

      expect(updateResult).toBe(true);
      expect(toast.success).toHaveBeenCalledWith('סטטוס ההגשה עודכן ל: בעיבוד');
    });

    it('should handle approved status with serving deduction', async () => {
      const mockSubmissionData = {
        submission_id: 'test-123',
        submission_status: 'הושלמה ואושרה',
        client_id: 'client-123',
        item_name_at_submission: 'Test Item'
      };

      const mockClientData = {
        remaining_servings: 5,
        restaurant_name: 'Test Restaurant'
      };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'customer_submissions') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockSubmissionData, error: null })
                })
              })
            })
          };
        } else if (table === 'clients') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockClientData, error: null })
              })
            })
          };
        }
      });

      (updateClientServings as any).mockResolvedValue(true);

      const { result } = renderHook(() => useSubmissionStatus(), { wrapper });

      await act(async () => {
        await result.current.updateSubmissionStatus('test-123', 'הושלמה ואושרה');
      });

      expect(updateClientServings).toHaveBeenCalledWith(
        'client-123',
        4,
        'ניכוי אוטומטי בעקבות אישור עבודה: Test Item'
      );
      expect(toast.success).toHaveBeenCalledWith('נוכה סרבינג אחד מTest Restaurant. נותרו: 4 מנות');
    });

    it('should invalidate relevant queries after successful update', async () => {
      const mockData = { submission_id: 'test-123', submission_status: 'בעיבוד' };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockData, error: null })
            })
          })
        })
      });

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useSubmissionStatus(), { wrapper });

      await act(async () => {
        await result.current.updateSubmissionStatus('test-123', 'בעיבוד');
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['client-submissions'] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['submission', 'test-123'] });
    });
  });

  describe('updateSubmissionStatus - Error Handling', () => {
    it('should handle empty submission ID', async () => {
      const { result } = renderHook(() => useSubmissionStatus(), { wrapper });

      let updateResult: boolean | undefined;
      await act(async () => {
        updateResult = await result.current.updateSubmissionStatus('', 'בעיבוד');
      });

      expect(updateResult).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('מזהה הגשה חסר');
    });

    it('should handle Supabase errors', async () => {
      const mockError = { message: 'Database error' };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: mockError })
            })
          })
        })
      });

      const { result } = renderHook(() => useSubmissionStatus(), { wrapper });

      let updateResult: boolean | undefined;
      await act(async () => {
        updateResult = await result.current.updateSubmissionStatus('test-123', 'בעיבוד');
      });

      expect(updateResult).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('שגיאה בעדכון סטטוס: Database error');
    });

    it('should handle network/exception errors', async () => {
      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockRejectedValue(new Error('Network error'))
            })
          })
        })
      });

      const { result } = renderHook(() => useSubmissionStatus(), { wrapper });

      let updateResult: boolean | undefined;
      await act(async () => {
        updateResult = await result.current.updateSubmissionStatus('test-123', 'בעיבוד');
      });

      expect(updateResult).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('שגיאה בעדכון סטטוס ההגשה');
    });

    it('should handle serving deduction errors gracefully', async () => {
      const mockSubmissionData = {
        submission_id: 'test-123',
        submission_status: 'הושלמה ואושרה',
        client_id: 'client-123'
      };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'customer_submissions') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockSubmissionData, error: null })
                })
              })
            })
          };
        } else if (table === 'clients') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Client not found' } })
              })
            })
          };
        }
      });

      const { result } = renderHook(() => useSubmissionStatus(), { wrapper });

      let updateResult: boolean | undefined;
      await act(async () => {
        updateResult = await result.current.updateSubmissionStatus('test-123', 'הושלמה ואושרה');
      });

      // Should still return true for status update, even if serving deduction fails
      expect(updateResult).toBe(true);
      expect(toast.success).toHaveBeenCalledWith('סטטוס ההגשה עודכן ל: הושלמה ואושרה');
    });
  });

  describe('updateSubmissionStatus - Edge Cases', () => {
    it('should handle submission without client_id for serving deduction', async () => {
      const mockSubmissionData = {
        submission_id: 'test-123',
        submission_status: 'הושלמה ואושרה',
        client_id: null // No client_id
      };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockSubmissionData, error: null })
            })
          })
        })
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useSubmissionStatus(), { wrapper });

      await act(async () => {
        await result.current.updateSubmissionStatus('test-123', 'הושלמה ואושרה');
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot deduct servings: submission has no client_id');
      expect(updateClientServings).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should handle client with zero remaining servings', async () => {
      const mockSubmissionData = {
        submission_id: 'test-123',
        submission_status: 'הושלמה ואושרה',
        client_id: 'client-123'
      };

      const mockClientData = {
        remaining_servings: 0,
        restaurant_name: 'Test Restaurant'
      };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'customer_submissions') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockSubmissionData, error: null })
                })
              })
            })
          };
        } else if (table === 'clients') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockClientData, error: null })
              })
            })
          };
        }
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useSubmissionStatus(), { wrapper });

      await act(async () => {
        await result.current.updateSubmissionStatus('test-123', 'הושלמה ואושרה');
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot deduct servings: client has no remaining servings');
      expect(updateClientServings).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should handle all status types correctly', async () => {
      const { result } = renderHook(() => useSubmissionStatus(), { wrapper });

      for (const status of SUBMISSION_STATUSES) {
        const mockData = { submission_id: 'test-123', submission_status: status };

        (supabase.from as any).mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockData, error: null })
              })
            })
          })
        });

        await act(async () => {
          await result.current.updateSubmissionStatus('test-123', status);
        });

        expect(toast.success).toHaveBeenCalledWith(`סטטוס ההגשה עודכן ל: ${status}`);
      }
    });
  });

  describe('Loading State Management', () => {
    it('should manage isUpdating state correctly during successful update', async () => {
      const mockData = { submission_id: 'test-123', submission_status: 'בעיבוד' };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockData, error: null })
            })
          })
        })
      });

      const { result } = renderHook(() => useSubmissionStatus(), { wrapper });

      expect(result.current.isUpdating).toBe(false);

      await act(async () => {
        await result.current.updateSubmissionStatus('test-123', 'בעיבוד');
      });

      // Should be false after completion
      expect(result.current.isUpdating).toBe(false);
    });

    it('should reset isUpdating state after error', async () => {
      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockRejectedValue(new Error('Network error'))
            })
          })
        })
      });

      const { result } = renderHook(() => useSubmissionStatus(), { wrapper });

      expect(result.current.isUpdating).toBe(false);

      await act(async () => {
        await result.current.updateSubmissionStatus('test-123', 'בעיבוד');
      });

      expect(result.current.isUpdating).toBe(false);
    });
  });
}); 