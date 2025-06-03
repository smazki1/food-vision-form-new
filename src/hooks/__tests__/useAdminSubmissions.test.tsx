/// <reference types="vitest/globals" />
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

// Import the hooks we're testing
import { 
  useAdminSubmission, 
  useAdminSubmissionComments, 
  useAdminUpdateSubmissionStatus 
} from '../useAdminSubmissions';

// Mock Supabase client
vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }
}));

// Mock sonner toast
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
    },
  });
  
  return ({ children }: { children: ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
};

describe('useAdminSubmissions hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAdminSubmission', () => {
    test('should fetch submission with client and lead data', async () => {
      const mockSubmissionData = {
        submission_id: 'test-submission-id',
        client_id: 'test-client-id',
        lead_id: 'test-lead-id',
        item_name_at_submission: 'Test Item',
        submission_status: 'ממתינה לעיבוד'
      };

      const mockClientData = {
        restaurant_name: 'Test Restaurant',
        contact_name: 'Test Contact',
        email: 'test@example.com',
        phone: '123456789'
      };

      const mockLeadData = {
        restaurant_name: 'Test Lead Restaurant',
        contact_name: 'Test Lead Contact',
        email: 'lead@example.com',
        phone: '987654321'
      };

      const { supabase } = await import('../../integrations/supabase/client');
      const fromMock = supabase.from as any;
      
      // Mock submission query
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSubmissionData,
              error: null
            })
          })
        })
      });

      // Mock client query
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockClientData,
              error: null
            })
          })
        })
      });

      // Mock lead query
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockLeadData,
              error: null
            })
          })
        })
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAdminSubmission('test-submission-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        ...mockSubmissionData,
        clients: mockClientData,
        leads: mockLeadData
      });
    });

    test('should handle submission without client or lead data', async () => {
      const mockSubmissionData = {
        submission_id: 'test-submission-id',
        client_id: null,
        lead_id: null,
        item_name_at_submission: 'Test Item',
        submission_status: 'ממתינה לעיבוד'
      };

      const { supabase } = await import('../../integrations/supabase/client');
      const fromMock = supabase.from as any;
      
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSubmissionData,
              error: null
            })
          })
        })
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAdminSubmission('test-submission-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        ...mockSubmissionData,
        clients: null,
        leads: null
      });
    });

    test('should handle submission query error', async () => {
      const { supabase } = await import('../../integrations/supabase/client');
      const fromMock = supabase.from as any;
      
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Submission not found' }
            })
          })
        })
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAdminSubmission('test-submission-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual({ message: 'Submission not found' });
    });
  });

  describe('useAdminSubmissionComments', () => {
    test('should return empty array for comments (table not implemented)', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAdminSubmissionComments('test-submission-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useAdminUpdateSubmissionStatus', () => {
    test('should update submission status successfully', async () => {
      const { supabase } = await import('../../integrations/supabase/client');
      const { toast } = await import('sonner');
      const fromMock = supabase.from as any;
      
      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null
          })
        })
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAdminUpdateSubmissionStatus(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      result.current.mutate({
        submissionId: 'test-submission-id',
        status: 'בעיבוד'
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(toast.success).toHaveBeenCalledWith('סטטוס עודכן בהצלחה');
    });

    test('should handle update error', async () => {
      const { supabase } = await import('../../integrations/supabase/client');
      const { toast } = await import('sonner');
      const fromMock = supabase.from as any;
      
      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Update failed' }
          })
        })
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAdminUpdateSubmissionStatus(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      result.current.mutate({
        submissionId: 'test-submission-id',
        status: 'בעיבוד'
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith('שגיאה בעדכון סטטוס: Update failed');
    });
  });
});