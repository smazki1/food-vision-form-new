import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientActivityNotes } from '../ClientActivityNotes';

// Mock dependencies
vi.mock('@/hooks/useClients', () => ({
  useClients: vi.fn()
}));

vi.mock('@/hooks/useClientUpdate', () => ({
  useClientUpdate: vi.fn()
}));

vi.mock('@/hooks/useRobustComments', () => ({
  useRobustClientComments: vi.fn(),
  useRobustNotes: vi.fn()
}));

vi.mock('@/utils/testLeadCommentTransfer', () => ({
  debugClientComments: vi.fn(),
  forceCommentSync: vi.fn()
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

import { useClients } from '@/hooks/useClients';
import { useClientUpdate } from '@/hooks/useClientUpdate';
import { useRobustClientComments, useRobustNotes } from '@/hooks/useRobustComments';
import { supabase } from '@/integrations/supabase/client';

const mockUseClients = useClients as any;
const mockUseClientUpdate = useClientUpdate as any;
const mockUseRobustClientComments = useRobustClientComments as any;
const mockUseRobustNotes = useRobustNotes as any;
const mockSupabase = supabase as any;

// Client without original_lead_id to avoid loading state
const mockClientSimple = {
  client_id: 'client-123',
  restaurant_name: 'Test Restaurant',
  contact_person: 'John Doe',
  next_follow_up_date: '2024-01-15',
  reminder_details: 'Follow up on catering',
  original_lead_id: null // No lead ID to avoid loading state
};

// Client with original_lead_id for lead sync tests
const mockClientWithLead = {
  ...mockClientSimple,
  original_lead_id: 'lead-456'
};

const mockNote = {
  id: 'note-1',
  content: 'Test notes content',
  last_updated: new Date().toISOString(),
  entity_id: 'client-123',
  entity_type: 'client' as const
};

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

describe('ClientActivityNotes Performance Tests', () => {
  let mockClientUpdate: any;
  let mockUpdateNotes: any;
  let mockAddComment: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    mockClientUpdate = vi.fn().mockResolvedValue(undefined);
    mockUpdateNotes = vi.fn().mockResolvedValue(undefined);
    mockAddComment = vi.fn().mockResolvedValue(undefined);

    // Mock Supabase to avoid loading state issues
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
    });

    // Setup default mocks
    mockUseClients.mockReturnValue({
      clients: [mockClientSimple], // Use simple client first
      isLoading: false,
      error: null
    });

    mockUseClientUpdate.mockReturnValue({
      mutateAsync: mockClientUpdate,
      isLoading: false,
      error: null
    });

    mockUseRobustClientComments.mockReturnValue({
      comments: [],
      isLoading: false,
      addComment: mockAddComment,
      isAddingComment: false,
      forceRefresh: vi.fn()
    });

    mockUseRobustNotes.mockReturnValue({
      note: mockNote,
      isLoading: false,
      updateNotes: mockUpdateNotes,
      isUpdating: false
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Local State Performance', () => {
    it('should provide immediate UI feedback for notes editing', async () => {
      render(
        <ClientActivityNotes clientId="client-123" />,
        { wrapper: createWrapper() }
      );

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('הערות ותגובות')).toBeInTheDocument();
      });

      const notesTextarea = screen.getByPlaceholderText('הערות כלליות על הלקוח, העדפות, הנחיות מיוחדות...');
      
      // Start timing
      const startTime = performance.now();
      
      // Type rapidly (simulate real user typing)
      act(() => {
        fireEvent.change(notesTextarea, { target: { value: 'T' } });
      });
      act(() => {
        fireEvent.change(notesTextarea, { target: { value: 'Te' } });
      });
      act(() => {
        fireEvent.change(notesTextarea, { target: { value: 'Test' } });
      });
      
      const endTime = performance.now();
      
      // UI updates should be immediate (< 5ms)
      expect(endTime - startTime).toBeLessThan(5);
      
      // Value should be immediately visible
      expect(notesTextarea).toHaveValue('Test');
      
      // Server update should be debounced (not called yet)
      expect(mockUpdateNotes).not.toHaveBeenCalled();
    });

    it('should debounce server updates for notes', async () => {
      render(
        <ClientActivityNotes clientId="client-123" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('הערות ותגובות')).toBeInTheDocument();
      });

      const notesTextarea = screen.getByPlaceholderText('הערות כלליות על הלקוח, העדפות, הנחיות מיוחדות...');
      
      // Rapid typing
      act(() => {
        fireEvent.change(notesTextarea, { target: { value: 'First text' } });
        fireEvent.change(notesTextarea, { target: { value: 'Second text' } });
        fireEvent.change(notesTextarea, { target: { value: 'Final text' } });
      });

      // Should not call server immediately
      expect(mockUpdateNotes).not.toHaveBeenCalled();
      
      // Fast forward debounce time (1000ms)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should only call server once with final value
      await waitFor(() => {
        expect(mockUpdateNotes).toHaveBeenCalledTimes(1);
        expect(mockUpdateNotes).toHaveBeenCalledWith('Final text');
      });
    });

    it('should handle follow-up date changes with optimistic updates', async () => {
      render(
        <ClientActivityNotes clientId="client-123" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('הערות ותגובות')).toBeInTheDocument();
      });

      const dateInput = screen.getByDisplayValue('2024-01-15');
      
      // Change date
      act(() => {
        fireEvent.change(dateInput, { target: { value: '2024-01-20' } });
      });

      // Should show new value immediately
      expect(dateInput).toHaveValue('2024-01-20');
      
      // Should not call server until blur
      expect(mockClientUpdate).not.toHaveBeenCalled();
      
      // Blur event should trigger server update
      act(() => {
        fireEvent.blur(dateInput);
      });

      await waitFor(() => {
        expect(mockClientUpdate).toHaveBeenCalledWith({
          clientId: 'client-123',
          updates: { next_follow_up_date: '2024-01-20' }
        });
      });
    });

    it('should rollback on server error for field updates', async () => {
      // Mock server error
      mockClientUpdate.mockRejectedValue(new Error('Server error'));

      render(
        <ClientActivityNotes clientId="client-123" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('הערות ותגובות')).toBeInTheDocument();
      });

      const reminderInput = screen.getByDisplayValue('Follow up on catering');
      
      act(() => {
        fireEvent.change(reminderInput, { target: { value: 'New reminder' } });
      });

      expect(reminderInput).toHaveValue('New reminder');
      
      act(() => {
        fireEvent.blur(reminderInput);
      });

      // Should rollback to original value on error
      await waitFor(() => {
        expect(reminderInput).toHaveValue('Follow up on catering');
      });
    });

    it('should skip server updates when value unchanged', async () => {
      render(
        <ClientActivityNotes clientId="client-123" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('הערות ותגובות')).toBeInTheDocument();
      });

      const dateInput = screen.getByDisplayValue('2024-01-15');
      
      // Change to same value
      act(() => {
        fireEvent.change(dateInput, { target: { value: '2024-01-15' } });
        fireEvent.blur(dateInput);
      });

      // Should not call server for unchanged value
      expect(mockClientUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Comment Performance', () => {
    it('should provide immediate feedback when adding comments', async () => {
      render(
        <ClientActivityNotes clientId="client-123" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('הערות ותגובות')).toBeInTheDocument();
      });

      const commentInput = screen.getByPlaceholderText('הוסף תגובה חדשה...');
      const addButton = screen.getByRole('button', { name: /הוסף/i });
      
      act(() => {
        fireEvent.change(commentInput, { target: { value: 'New test comment' } });
      });

      const startTime = performance.now();
      
      act(() => {
        fireEvent.click(addButton);
      });
      
      const endTime = performance.now();
      
      // Click handling should be immediate
      expect(endTime - startTime).toBeLessThan(5);
      
      await waitFor(() => {
        expect(mockAddComment).toHaveBeenCalledWith('New test comment');
      });
    });

    it('should clear comment input after successful addition', async () => {
      render(
        <ClientActivityNotes clientId="client-123" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('הערות ותגובות')).toBeInTheDocument();
      });

      const commentInput = screen.getByPlaceholderText('הוסף תגובה חדשה...');
      const addButton = screen.getByRole('button', { name: /הוסף/i });
      
      act(() => {
        fireEvent.change(commentInput, { target: { value: 'Test comment' } });
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(commentInput).toHaveValue('');
      });
    });

    it('should handle empty comment gracefully', async () => {
      render(
        <ClientActivityNotes clientId="client-123" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('הערות ותגובות')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /הוסף/i });
      
      act(() => {
        fireEvent.click(addButton);
      });

      // Should not call server for empty comment
      expect(mockAddComment).not.toHaveBeenCalled();
    });

    it('should trim whitespace from comments', async () => {
      render(
        <ClientActivityNotes clientId="client-123" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('הערות ותגובות')).toBeInTheDocument();
      });

      const commentInput = screen.getByPlaceholderText('הוסף תגובה חדשה...');
      const addButton = screen.getByRole('button', { name: /הוסף/i });
      
      act(() => {
        fireEvent.change(commentInput, { target: { value: '  Test comment  ' } });
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(mockAddComment).toHaveBeenCalledWith('Test comment');
      });
    });
  });

  describe('Loading States Performance', () => {
    it('should handle loading states without blocking UI', async () => {
      mockUseRobustNotes.mockReturnValue({
        note: null,
        isLoading: true,
        updateNotes: mockUpdateNotes,
        isUpdating: false
      });

      const startTime = performance.now();
      
      render(
        <ClientActivityNotes clientId="client-123" />,
        { wrapper: createWrapper() }
      );
      
      const endTime = performance.now();
      
      // Component should render quickly even with loading state
      expect(endTime - startTime).toBeLessThan(50);
      
      // Should still render main structure
      await waitFor(() => {
        expect(screen.getByText('הערות ותגובות')).toBeInTheDocument();
      });
    });

    it('should show updating state for notes', async () => {
      mockUseRobustNotes.mockReturnValue({
        note: mockNote,
        isLoading: false,
        updateNotes: mockUpdateNotes,
        isUpdating: true
      });

      render(
        <ClientActivityNotes clientId="client-123" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('הערות ותגובות')).toBeInTheDocument();
      });

      // Check if notes section shows updating state
      const notesTextarea = screen.getByPlaceholderText('הערות כלליות על הלקוח, העדפות, הנחיות מיוחדות...');
      expect(notesTextarea).toBeDisabled();
    });

    it('should show adding state for comments', async () => {
      mockUseRobustClientComments.mockReturnValue({
        comments: [],
        isLoading: false,
        addComment: mockAddComment,
        isAddingComment: true,
        forceRefresh: vi.fn()
      });

      render(
        <ClientActivityNotes clientId="client-123" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('הערות ותגובות')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /הוסף/i });
      expect(addButton).toBeDisabled();
    });
  });

  describe('Memory Management', () => {
    it('should not create memory leaks with state updates', async () => {
      const { rerender, unmount } = render(
        <ClientActivityNotes clientId="client-123" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('הערות ותגובות')).toBeInTheDocument();
      });

      const notesTextarea = screen.getByPlaceholderText('הערות כלליות על הלקוח, העדפות, הנחיות מיוחדות...');
      
      // Simulate many rapid updates
      for (let i = 0; i < 50; i++) {
        act(() => {
          fireEvent.change(notesTextarea, { target: { value: `Content ${i}` } });
        });
      }

      // Change props multiple times
      rerender(<ClientActivityNotes clientId="client-456" />);
      rerender(<ClientActivityNotes clientId="client-789" />);
      
      // Unmount to check cleanup
      unmount();
      
      // Advance timers to ensure any pending operations are cleaned up
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // No additional server calls should happen after unmount
      const finalCallCount = mockUpdateNotes.mock.calls.length;
      
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      expect(mockUpdateNotes.mock.calls.length).toBe(finalCallCount);
    });

    it('should handle client prop changes efficiently', async () => {
      const { rerender } = render(
        <ClientActivityNotes clientId="client-123" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('הערות ותגובות')).toBeInTheDocument();
      });

      // Change client ID
      rerender(<ClientActivityNotes clientId="client-456" />);

      // Should call hooks with new client ID
      expect(mockUseRobustClientComments).toHaveBeenCalledWith('client-456');
      expect(mockUseRobustNotes).toHaveBeenCalledWith('client-456', 'client');
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle comment addition errors gracefully', async () => {
      mockAddComment.mockRejectedValue(new Error('Network error'));

      render(
        <ClientActivityNotes clientId="client-123" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('הערות ותגובות')).toBeInTheDocument();
      });

      const commentInput = screen.getByPlaceholderText('הוסף תגובה חדשה...');
      const addButton = screen.getByRole('button', { name: /הוסף/i });
      
      act(() => {
        fireEvent.change(commentInput, { target: { value: 'Test comment' } });
        fireEvent.click(addButton);
      });

      // Should not crash and maintain state
      await waitFor(() => {
        expect(commentInput).toHaveValue('Test comment'); // Input should remain
      });
    });

    it('should handle missing client data gracefully', async () => {
      mockUseClients.mockReturnValue({
        clients: [], // No clients
        isLoading: false,
        error: null
      });

      const startTime = performance.now();
      
      render(
        <ClientActivityNotes clientId="client-123" />,
        { wrapper: createWrapper() }
      );
      
      const endTime = performance.now();
      
      // Should render without crashing
      expect(endTime - startTime).toBeLessThan(50);
      
      // Should still render main structure
      await waitFor(() => {
        expect(screen.getByText('הערות ותגובות')).toBeInTheDocument();
      });
    });
  });

  describe('Lead Integration Performance', () => {
    it('should handle clients with lead history efficiently', async () => {
      // Use client with lead history
      mockUseClients.mockReturnValue({
        clients: [mockClientWithLead],
        isLoading: false,
        error: null
      });

      const startTime = performance.now();
      
      render(
        <ClientActivityNotes clientId="client-123" />,
        { wrapper: createWrapper() }
      );
      
      // Should handle lead data loading without blocking
      await waitFor(() => {
        expect(screen.getByText('הערות ותגובות')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      const endTime = performance.now();
      
      // Should complete loading efficiently
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
}); 