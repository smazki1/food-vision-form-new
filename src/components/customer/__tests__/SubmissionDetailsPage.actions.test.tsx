import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SubmissionDetailsPage } from '../SubmissionDetailsPage';
import { supabase } from '@/integrations/supabase/client';
import { Toaster } from '@/components/ui/sonner';

// Mock child components and hooks
vi.mock('@/hooks/useMessages', () => ({
  useMessages: () => ({ messages: [], loading: false, sendMessage: vi.fn() }),
}));

vi.mock('../ShareDialog', () => ({
  ShareDialog: () => <div data-testid="share-dialog-mock" />,
}));

// Mock window.matchMedia for sonner component
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
});

// Mock Supabase globally
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    })),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockSubmission = (status: string, id: string = 'test-submission-id') => ({
  submission_id: id,
  client_id: 'test-client-id',
  item_name_at_submission: 'Test Dish',
  submission_status: status,
  uploaded_at: new Date().toISOString(),
  original_image_urls: ['original.jpg'],
  processed_image_urls: ['processed.jpg'],
  edit_history: { status_changes: [] },
});

const renderComponent = (submission: any) => {
  // Setup mocks for this specific render
  const from = supabase.from as vi.Mock;
  const submissionUpdateMock = vi.fn().mockResolvedValue({ data: { ...submission, submission_status: 'הושלמה ואושרה' }, error: null });
  const submissionQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: submission, error: null }),
    update: submissionUpdateMock,
  };
  from.mockImplementation((tableName: string) => {
    if (tableName === 'customer_submissions') {
      return submissionQuery;
    }
    if (tableName === 'submission_comments') {
        return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { comment_id: 'new-comment-id' }, error: null }),
        };
    }
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/customer/submission/${submission.submission_id}`]}>
        <Routes>
          <Route path="/customer/submission/:submissionId" element={<SubmissionDetailsPage />} />
        </Routes>
      </MemoryRouter>
      <Toaster />
    </QueryClientProvider>
  );

  return { submissionQuery };
};

describe('SubmissionDetailsPage Actions', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('Button Visibility', () => {
    test('should show both "Approve" and "Request Edit" buttons when status is "מוכנה להצגה"', async () => {
      renderComponent(mockSubmission('מוכנה להצגה'));
      expect(await screen.findByRole('button', { name: /אשר מנה/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /בקש עריכה/i })).toBeInTheDocument();
    });

    test('should show only "Request Edit" button when status is "הערות התקבלו"', async () => {
      renderComponent(mockSubmission('הערות התקבלו'));
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /אשר מנה/i })).not.toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /בקש עריכה/i })).toBeInTheDocument();
    });

    test('should hide both buttons when status is "הושלמה ואושרה"', async () => {
      renderComponent(mockSubmission('הושלמה ואושרה'));
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /אשר מנה/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /בקש עריכה/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Approve Action', () => {
    test('successfully approves a submission', async () => {
      const { submissionQuery } = renderComponent(mockSubmission('מוכנה להצגה'));
      
      const approveButton = await screen.findByRole('button', { name: /אשר מנה/i });
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(submissionQuery.update).toHaveBeenCalledWith(expect.objectContaining({
            submission_status: 'הושלמה ואושרה',
        }));
      });

      expect(await screen.findByText('המנה אושרה')).toBeInTheDocument();
    });

    test('shows an error toast if approval fails', async () => {
        const { submissionQuery } = renderComponent(mockSubmission('מוכנה להצגה'));
        submissionQuery.update.mockResolvedValueOnce({ error: { message: 'Approval failed' }});

      const approveButton = await screen.findByRole('button', { name: /אשר מנה/i });
      fireEvent.click(approveButton);

      expect(await screen.findByText(/שגיאה באישור המנה/i)).toBeInTheDocument();
    });
  });

  describe('Request Edit Action', () => {
    test('successfully requests an edit', async () => {
      renderComponent(mockSubmission('מוכנה להצגה'));
      const requestEditButton = await screen.findByRole('button', { name: /בקש עריכה/i });
      fireEvent.click(requestEditButton);

      // Dialog opens
      const textarea = await screen.findByPlaceholderText(/תארו את העריכות הנדרשות.../i);
      const submitButton = screen.getByRole('button', { name: /שליחת בקשה/i });

      fireEvent.change(textarea, { target: { value: 'This is a test edit request.' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const fromMock = supabase.from as vi.Mock;
        // 1. Check comment was inserted
        const insertMock = fromMock.mock.results.find(res => res.value.insert).value.insert;
        expect(insertMock).toHaveBeenCalledWith({
            submission_id: 'test-submission-id',
            comment_type: 'client_visible',
            comment_text: 'This is a test edit request.',
            visibility: 'admin',
            created_by: 'test-user-id',
        });

        // 2. Check status was updated
        const updateMock = fromMock.mock.results.find(res => res.value.update).value.update;
        expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
            submission_status: 'הערות התקבלו',
        }));
      });

      expect(await screen.findByText('בקשת עריכה נשלחה')).toBeInTheDocument();
    });

    test('shows error if edit note is empty', async () => {
      renderComponent(mockSubmission('מוכנה להצגה'));
      const requestEditButton = await screen.findByRole('button', { name: /בקש עריכה/i });
      fireEvent.click(requestEditButton);

      const submitButton = await screen.findByRole('button', { name: /שליחת בקשה/i });
      fireEvent.click(submitButton);

      expect(await screen.findByText('נא להזין הערות לעריכה')).toBeInTheDocument();
      const fromMock = supabase.from as vi.Mock;
      const submissionQueryUpdate = fromMock.mock.results.find(res => res.value.update)?.value.update;
      expect(submissionQueryUpdate).not.toHaveBeenCalled();
    });

    test('shows error if comment insert fails', async () => {
       const { submissionQuery } = renderComponent(mockSubmission('מוכנה להצגה'));
       (supabase.from as vi.Mock).mockImplementation((tableName) => {
            if (tableName === 'customer_submissions') return submissionQuery;
            if (tableName === 'submission_comments') return { insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ error: { message: 'Insert failed' } }) }) })};
            return { insert: vi.fn() };
        });

      renderComponent(mockSubmission('מוכנה להצגה'));
      const requestEditButton = await screen.findByRole('button', { name: /בקש עריכה/i });
      fireEvent.click(requestEditButton);
      
      const textarea = await screen.findByPlaceholderText(/תארו את העריכות הנדרשות.../i);
      fireEvent.change(textarea, { target: { value: 'Test note' } });
      fireEvent.click(screen.getByRole('button', { name: /שליחת בקשה/i }));

      expect(await screen.findByText(/שגיאה בשליחת בקשת העריכה/i)).toBeInTheDocument();
    });
  });
}); 