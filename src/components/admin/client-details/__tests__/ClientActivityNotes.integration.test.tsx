import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { toast } from 'sonner';

import { ClientActivityNotes } from '../ClientActivityNotes';
import { supabase } from '@/integrations/supabase/client';
import * as useRobustComments from '@/hooks/useRobustComments';
import * as useClients from '@/hooks/useClients';
import * as diagnosticUtils from '@/utils/testLeadCommentTransfer';

// Mock dependencies
vi.mock('@/integrations/supabase/client');
vi.mock('sonner');
vi.mock('@/hooks/useRobustComments');
vi.mock('@/hooks/useClients');
vi.mock('@/utils/testLeadCommentTransfer');

const mockSupabaseClient = vi.mocked(supabase);
const mockToast = vi.mocked(toast);
const mockUseRobustComments = vi.mocked(useRobustComments);
const mockUseClients = vi.mocked(useClients);
const mockDiagnosticUtils = vi.mocked(diagnosticUtils);

// Test constants
const MOCK_CLIENT_ID = 'client-123';
const MOCK_LEAD_ID = 'lead-456';

// Helper to create a test wrapper with QueryClient
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

const mockClient = {
  client_id: MOCK_CLIENT_ID,
  restaurant_name: 'Test Restaurant',
  contact_person: 'John Doe',
  next_follow_up_date: '2025-01-15',
  reminder_details: 'Follow up on project status',
  original_lead_id: MOCK_LEAD_ID,
  internal_notes: null,
  updated_at: '2025-01-02T12:00:00.000Z'
};

const mockComments = [
  {
    id: 'comment-1',
    text: 'First comment from client',
    timestamp: '2025-01-02T10:00:00.000Z',
    source: 'client' as const,
    entity_id: MOCK_CLIENT_ID,
    entity_type: 'client' as const
  },
  {
    id: 'comment-2',
    text: 'Synced comment from lead',
    timestamp: '2025-01-02T09:00:00.000Z',
    source: 'lead' as const,
    entity_id: MOCK_CLIENT_ID,
    entity_type: 'client' as const
  }
];

const mockNote = {
  id: `client-notes-${MOCK_CLIENT_ID}`,
  content: 'Client internal notes',
  last_updated: '2025-01-02T12:00:00.000Z',
  entity_id: MOCK_CLIENT_ID,
  entity_type: 'client' as const
};

describe('ClientActivityNotes Integration Tests', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Setup default mocks
    mockUseClients.useClients.mockReturnValue({
      clients: [mockClient],
      isLoading: false,
      error: null
    });

    mockUseClients.useClientUpdate.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
      error: null
    });

    mockUseRobustComments.useRobustClientComments.mockReturnValue({
      comments: mockComments,
      isLoading: false,
      addComment: vi.fn().mockResolvedValue(undefined),
      isAddingComment: false,
      forceRefresh: vi.fn()
    });

    mockUseRobustComments.useRobustNotes.mockReturnValue({
      note: mockNote,
      isLoading: false,
      updateNotes: vi.fn().mockResolvedValue(undefined),
      isUpdating: false
    });

    // Setup diagnostic utils mocks
    mockDiagnosticUtils.debugClientComments.mockResolvedValue(undefined);
    mockDiagnosticUtils.forceCommentSync.mockResolvedValue(true);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Component Rendering', () => {
    it('should render client activity notes component successfully', () => {
      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('פעילות ותגובות')).toBeInTheDocument();
      expect(screen.getByText('הערות פנימיות')).toBeInTheDocument();
      expect(screen.getByText('תזכורות ומעקב')).toBeInTheDocument();
    });

    it('should display existing comments', () => {
      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('First comment from client')).toBeInTheDocument();
      expect(screen.getByText('Synced comment from lead')).toBeInTheDocument();
    });

    it('should show comment source badges', () => {
      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('לקוח')).toBeInTheDocument(); // client badge
      expect(screen.getByText('ליד')).toBeInTheDocument(); // lead badge
    });

    it('should display internal notes', () => {
      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByDisplayValue('Client internal notes')).toBeInTheDocument();
    });

    it('should show force refresh and debug buttons', () => {
      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('רענון מלא')).toBeInTheDocument();
      expect(screen.getByText('סנכרון מליד')).toBeInTheDocument();
      expect(screen.getByText('ניפוי שגיאות')).toBeInTheDocument();
    });
  });

  describe('Comment Management', () => {
    it('should add new comment successfully', async () => {
      const user = userEvent.setup();
      const mockAddComment = vi.fn().mockResolvedValue(undefined);
      
      mockUseRobustComments.useRobustClientComments.mockReturnValue({
        comments: mockComments,
        isLoading: false,
        addComment: mockAddComment,
        isAddingComment: false,
        forceRefresh: vi.fn()
      });

      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      const commentInput = screen.getByPlaceholderText('הוסף תגובה חדשה...');
      const addButton = screen.getByText('הוסף תגובה');

      await user.type(commentInput, 'New test comment');
      await user.click(addButton);

      expect(mockAddComment).toHaveBeenCalledWith('New test comment');
    });

    it('should disable add button when comment is empty', () => {
      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      const addButton = screen.getByText('הוסף תגובה');
      expect(addButton).toBeDisabled();
    });

    it('should clear input after successful comment addition', async () => {
      const user = userEvent.setup();
      const mockAddComment = vi.fn().mockResolvedValue(undefined);
      
      mockUseRobustComments.useRobustClientComments.mockReturnValue({
        comments: mockComments,
        isLoading: false,
        addComment: mockAddComment,
        isAddingComment: false,
        forceRefresh: vi.fn()
      });

      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      const commentInput = screen.getByPlaceholderText('הוסף תגובה חדשה...');
      const addButton = screen.getByText('הוסף תגובה');

      await user.type(commentInput, 'Test comment');
      await user.click(addButton);

      await waitFor(() => {
        expect(commentInput).toHaveValue('');
      });
    });

    it('should show loading state when adding comment', () => {
      mockUseRobustComments.useRobustClientComments.mockReturnValue({
        comments: mockComments,
        isLoading: false,
        addComment: vi.fn(),
        isAddingComment: true,
        forceRefresh: vi.fn()
      });

      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      const addButton = screen.getByText('מוסיף...');
      expect(addButton).toBeDisabled();
    });
  });

  describe('Force Refresh and Sync', () => {
    it('should trigger force refresh when button clicked', async () => {
      const user = userEvent.setup();
      const mockForceRefresh = vi.fn();
      
      mockUseRobustComments.useRobustClientComments.mockReturnValue({
        comments: mockComments,
        isLoading: false,
        addComment: vi.fn(),
        isAddingComment: false,
        forceRefresh: mockForceRefresh
      });

      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      const refreshButton = screen.getByText('רענון מלא');
      await user.click(refreshButton);

      expect(mockForceRefresh).toHaveBeenCalled();
      expect(mockToast.info).toHaveBeenCalledWith('מרענן תגובות...');
    });

    it('should trigger force comment sync when button clicked', async () => {
      const user = userEvent.setup();
      mockDiagnosticUtils.forceCommentSync.mockResolvedValue(true);

      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      const syncButton = screen.getByText('סנכרון מליד');
      await user.click(syncButton);

      expect(mockDiagnosticUtils.forceCommentSync).toHaveBeenCalledWith(MOCK_CLIENT_ID);
      
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('סנכרון הסתיים בהצלחה');
      });
    });

    it('should handle failed sync gracefully', async () => {
      const user = userEvent.setup();
      mockDiagnosticUtils.forceCommentSync.mockResolvedValue(false);

      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      const syncButton = screen.getByText('סנכרון מליד');
      await user.click(syncButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('הסנכרון נכשל');
      });
    });

    it('should trigger debug when debug button clicked', async () => {
      const user = userEvent.setup();

      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      const debugButton = screen.getByText('ניפוי שגיאות');
      await user.click(debugButton);

      expect(mockDiagnosticUtils.debugClientComments).toHaveBeenCalledWith(MOCK_CLIENT_ID);
      expect(mockToast.info).toHaveBeenCalledWith('מידע ניפוי שגיאות נשלח לקונסול');
    });
  });

  describe('Internal Notes Management', () => {
    it('should update internal notes when changed', async () => {
      const user = userEvent.setup();
      const mockUpdateNotes = vi.fn().mockResolvedValue(undefined);
      
      mockUseRobustComments.useRobustNotes.mockReturnValue({
        note: mockNote,
        isLoading: false,
        updateNotes: mockUpdateNotes,
        isUpdating: false
      });

      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      const notesTextarea = screen.getByDisplayValue('Client internal notes');
      
      await user.clear(notesTextarea);
      await user.type(notesTextarea, 'Updated internal notes');

      // Trigger blur to save
      fireEvent.blur(notesTextarea);

      await waitFor(() => {
        expect(mockUpdateNotes).toHaveBeenCalledWith('Updated internal notes');
      });
    });

    it('should show loading state when updating notes', () => {
      mockUseRobustComments.useRobustNotes.mockReturnValue({
        note: mockNote,
        isLoading: false,
        updateNotes: vi.fn(),
        isUpdating: true
      });

      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('שומר...')).toBeInTheDocument();
    });
  });

  describe('Follow-up Management', () => {
    it('should update follow-up date when changed', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      
      mockUseClients.useClientUpdate.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null
      });

      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      const dateInput = screen.getByDisplayValue('2025-01-15');
      
      await user.clear(dateInput);
      await user.type(dateInput, '2025-01-20');
      fireEvent.blur(dateInput);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          clientId: MOCK_CLIENT_ID,
          updates: { next_follow_up_date: '2025-01-20' }
        });
      });
    });

    it('should update reminder details when changed', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      
      mockUseClients.useClientUpdate.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null
      });

      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      const reminderInput = screen.getByDisplayValue('Follow up on project status');
      
      await user.clear(reminderInput);
      await user.type(reminderInput, 'Updated reminder details');
      fireEvent.blur(reminderInput);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          clientId: MOCK_CLIENT_ID,
          updates: { reminder_details: 'Updated reminder details' }
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle comment loading error gracefully', () => {
      mockUseRobustComments.useRobustClientComments.mockReturnValue({
        comments: [],
        isLoading: false,
        addComment: vi.fn(),
        isAddingComment: false,
        forceRefresh: vi.fn(),
        error: new Error('Failed to load comments')
      });

      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      // Component should still render despite error
      expect(screen.getByText('פעילות ותגובות')).toBeInTheDocument();
    });

    it('should handle notes loading error gracefully', () => {
      mockUseRobustComments.useRobustNotes.mockReturnValue({
        note: null,
        isLoading: false,
        updateNotes: vi.fn(),
        isUpdating: false,
        error: new Error('Failed to load notes')
      });

      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      // Component should still render despite error
      expect(screen.getByText('הערות פנימיות')).toBeInTheDocument();
    });

    it('should handle sync error with error message', async () => {
      const user = userEvent.setup();
      mockDiagnosticUtils.forceCommentSync.mockRejectedValue(new Error('Sync failed'));

      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      const syncButton = screen.getByText('סנכרון מליד');
      await user.click(syncButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('שגיאה בסנכרון: Sync failed');
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state when comments are loading', () => {
      mockUseRobustComments.useRobustClientComments.mockReturnValue({
        comments: [],
        isLoading: true,
        addComment: vi.fn(),
        isAddingComment: false,
        forceRefresh: vi.fn()
      });

      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('טוען תגובות...')).toBeInTheDocument();
    });

    it('should show loading state when notes are loading', () => {
      mockUseRobustComments.useRobustNotes.mockReturnValue({
        note: null,
        isLoading: true,
        updateNotes: vi.fn(),
        isUpdating: false
      });

      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('טוען הערות...')).toBeInTheDocument();
    });
  });

  describe('Lead Activity Integration', () => {
    it('should load and display lead activities when client has original_lead_id', async () => {
      const mockActivities = [
        {
          activity_id: 'activity-1',
          activity_description: 'Lead status updated',
          activity_timestamp: '2025-01-01T10:00:00.000Z',
          user_id: 'user-1'
        }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockActivities,
              error: null
            })
          })
        })
      } as any);

      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('פעילויות מהליד המקורי')).toBeInTheDocument();
      });
    });

    it('should not show lead activities section when no original_lead_id', () => {
      const clientWithoutLead = { ...mockClient, original_lead_id: null };
      
      mockUseClients.useClients.mockReturnValue({
        clients: [clientWithoutLead],
        isLoading: false,
        error: null
      });

      render(
        <ClientActivityNotes clientId={MOCK_CLIENT_ID} />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByText('פעילויות מהליד המקורי')).not.toBeInTheDocument();
    });
  });
}); 