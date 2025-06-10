import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { SubmissionViewer } from '../SubmissionViewer';
import { useAdminSubmissionComments, useAdminAddSubmissionComment, useAdminSubmission } from '@/hooks/useAdminSubmissions';
import { useLightbox } from '@/components/editor/submission-processing/hooks/useLightbox';
import { toast } from 'sonner';

// Mock all dependencies
vi.mock('@/hooks/useAdminSubmissions');
vi.mock('@/components/editor/submission-processing/hooks/useLightbox');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockSubmission = {
  submission_id: 'test-submission-id',
  client_id: 'test-client-id',
  item_type: 'dish',
  item_name_at_submission: 'Test Dish',
  submission_status: 'ממתינה לעיבוד',
  original_image_urls: ['http://example.com/image1.jpg'],
  processed_image_urls: ['http://example.com/processed1.jpg'],
  created_at: '2024-01-01T00:00:00Z',
  restaurant_name: 'Test Restaurant',
  contact_name: 'Test Contact',
  email: 'test@example.com',
  phone: '123456789',
};

const mockComments = [
  {
    comment_id: 'comment-1',
    submission_id: 'test-submission-id',
    comment_type: 'admin_internal',
    comment_text: 'This is an admin internal comment',
    visibility: 'admin',
    created_by: 'admin-user-id',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
  {
    comment_id: 'comment-2',
    submission_id: 'test-submission-id',
    comment_type: 'client_visible',
    comment_text: 'This comment is visible to client',
    visibility: 'client',
    created_by: 'admin-user-id',
    created_at: '2024-01-01T11:00:00Z',
    updated_at: '2024-01-01T11:00:00Z',
  },
  {
    comment_id: 'comment-3',
    submission_id: 'test-submission-id',
    comment_type: 'editor_note',
    comment_text: 'Editor note for processing',
    visibility: 'editor',
    created_by: 'editor-user-id',
    created_at: '2024-01-01T12:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Submission Comments System', () => {
  const mockMutate = vi.fn();
  const mockSetLightboxImage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock hooks
    vi.mocked(useAdminSubmission).mockReturnValue({
      data: mockSubmission,
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useAdminSubmissionComments).mockReturnValue({
      data: mockComments,
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useAdminAddSubmissionComment).mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
      isSuccess: false,
      isError: false,
    } as any);

    vi.mocked(useLightbox).mockReturnValue({
      lightboxImage: null,
      setLightboxImage: mockSetLightboxImage,
    } as any);
  });

  describe('Comments Display', () => {
    it('should display all comment tabs', () => {
      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('הערות פנימיות (1)')).toBeInTheDocument();
      expect(screen.getByText('הערות ללקוח (1)')).toBeInTheDocument();
      expect(screen.getByText('הערות עורך (1)')).toBeInTheDocument();
    });

    it('should show correct comment counts per tab', () => {
      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      // Each tab should show count of 1 based on mock data
      expect(screen.getByText('הערות פנימיות (1)')).toBeInTheDocument();
      expect(screen.getByText('הערות ללקוח (1)')).toBeInTheDocument();
      expect(screen.getByText('הערות עורך (1)')).toBeInTheDocument();
    });

    it('should display comments when tab is selected', async () => {
      const user = userEvent.setup();
      
      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      // Default tab should show admin_internal comments
      expect(screen.getByText('This is an admin internal comment')).toBeInTheDocument();

      // Click on client visible tab
      await user.click(screen.getByText('הערות ללקוח (1)'));
      expect(screen.getByText('This comment is visible to client')).toBeInTheDocument();

      // Click on editor note tab
      await user.click(screen.getByText('הערות עורך (1)'));
      expect(screen.getByText('Editor note for processing')).toBeInTheDocument();
    });

    it('should show empty state when no comments exist', () => {
      vi.mocked(useAdminSubmissionComments).mockReturnValue({
        data: [],
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('הערות פנימיות (0)')).toBeInTheDocument();
      expect(screen.getByText('הערות ללקוח (0)')).toBeInTheDocument();
      expect(screen.getByText('הערות עורך (0)')).toBeInTheDocument();
    });
  });

  describe('Adding Comments', () => {
    it('should allow adding a new comment', async () => {
      const user = userEvent.setup();
      
      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      // Find comment input and add button
      const commentInput = screen.getByPlaceholderText('הוסף הערה...');
      const addButton = screen.getByRole('button', { name: /הוסף הערה/i });

      // Type a comment
      await user.type(commentInput, 'New test comment');
      expect(commentInput).toHaveValue('New test comment');

      // Click add button
      await user.click(addButton);

      // Verify the mutation was called with correct data
      expect(mockMutate).toHaveBeenCalledWith({
        submissionId: 'test-submission-id',
        commentType: 'admin_internal',
        commentText: 'New test comment',
        visibility: 'admin',
      });
    });

    it('should not allow adding empty comment', async () => {
      const user = userEvent.setup();
      
      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      const addButton = screen.getByRole('button', { name: /הוסף הערה/i });

      // Try to add empty comment
      await user.click(addButton);

      // Mutation should not be called
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('should clear input after successful comment addition', async () => {
      const user = userEvent.setup();
      
      // Mock successful mutation
      vi.mocked(useAdminAddSubmissionComment).mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
        isSuccess: true,
        isError: false,
      } as any);

      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      const commentInput = screen.getByPlaceholderText('הוסף הערה...');
      const addButton = screen.getByRole('button', { name: /הוסף הערה/i });

      await user.type(commentInput, 'Test comment');
      await user.click(addButton);

      // Input should be cleared after successful submission
      expect(commentInput).toHaveValue('');
    });
  });

  describe('Comment Type Visibility Mapping', () => {
    it('should map admin_internal to admin visibility', async () => {
      const user = userEvent.setup();
      
      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      const commentInput = screen.getByPlaceholderText('הוסף הערה...');
      const addButton = screen.getByRole('button', { name: /הוסף הערה/i });

      // Default tab is admin_internal
      await user.type(commentInput, 'Admin internal comment');
      await user.click(addButton);

      expect(mockMutate).toHaveBeenCalledWith({
        submissionId: 'test-submission-id',
        commentType: 'admin_internal',
        commentText: 'Admin internal comment',
        visibility: 'admin',
      });
    });

    it('should map client_visible to client visibility', async () => {
      const user = userEvent.setup();
      
      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      // Switch to client visible tab
      await user.click(screen.getByText('הערות ללקוח (1)'));

      const commentInput = screen.getByPlaceholderText('הוסף הערה...');
      const addButton = screen.getByRole('button', { name: /הוסף הערה/i });

      await user.type(commentInput, 'Client visible comment');
      await user.click(addButton);

      expect(mockMutate).toHaveBeenCalledWith({
        submissionId: 'test-submission-id',
        commentType: 'client_visible',
        commentText: 'Client visible comment',
        visibility: 'client',
      });
    });

    it('should map editor_note to editor visibility', async () => {
      const user = userEvent.setup();
      
      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      // Switch to editor note tab
      await user.click(screen.getByText('הערות עורך (1)'));

      const commentInput = screen.getByPlaceholderText('הוסף הערה...');
      const addButton = screen.getByRole('button', { name: /הוסף הערה/i });

      await user.type(commentInput, 'Editor note comment');
      await user.click(addButton);

      expect(mockMutate).toHaveBeenCalledWith({
        submissionId: 'test-submission-id',
        commentType: 'editor_note',
        commentText: 'Editor note comment',
        visibility: 'editor',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle loading state', () => {
      vi.mocked(useAdminSubmissionComments).mockReturnValue({
        data: undefined,
        isLoading: true,
        refetch: vi.fn(),
      } as any);

      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      // Should show loading state or skeleton
      expect(screen.getByText('הערות פנימיות (0)')).toBeInTheDocument();
    });

    it('should handle mutation loading state', () => {
      vi.mocked(useAdminAddSubmissionComment).mockReturnValue({
        mutate: mockMutate,
        isLoading: true,
        isSuccess: false,
        isError: false,
      } as any);

      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      // Add button should be disabled during loading
      const addButton = screen.getByRole('button', { name: /הוסף הערה/i });
      expect(addButton).toBeDisabled();
    });

    it('should handle mutation error state', () => {
      vi.mocked(useAdminAddSubmissionComment).mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        isSuccess: false,
        isError: true,
        error: new Error('Failed to add comment'),
      } as any);

      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      // Should still be able to interact with the form
      const addButton = screen.getByRole('button', { name: /הוסף הערה/i });
      expect(addButton).not.toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle submission without comments', () => {
      vi.mocked(useAdminSubmissionComments).mockReturnValue({
        data: [],
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('הערות פנימיות (0)')).toBeInTheDocument();
      expect(screen.getByText('הערות ללקוח (0)')).toBeInTheDocument();
      expect(screen.getByText('הערות עורך (0)')).toBeInTheDocument();
    });

    it('should handle very long comment text', async () => {
      const user = userEvent.setup();
      const longComment = 'A'.repeat(1000); // Very long comment
      
      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      const commentInput = screen.getByPlaceholderText('הוסף הערה...');
      const addButton = screen.getByRole('button', { name: /הוסף הערה/i });

      await user.type(commentInput, longComment);
      await user.click(addButton);

      expect(mockMutate).toHaveBeenCalledWith({
        submissionId: 'test-submission-id',
        commentType: 'admin_internal',
        commentText: longComment,
        visibility: 'admin',
      });
    });

    it('should handle special characters in comments', async () => {
      const user = userEvent.setup();
      const specialComment = 'Comment with special chars: !@#$%^&*()_+{}|:<>?[]\\;\'",./`~אבגדהוזחטיכלמנסעפצקרשת';
      
      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      const commentInput = screen.getByPlaceholderText('הוסף הערה...');
      const addButton = screen.getByRole('button', { name: /הוסף הערה/i });

      await user.type(commentInput, specialComment);
      await user.click(addButton);

      expect(mockMutate).toHaveBeenCalledWith({
        submissionId: 'test-submission-id',
        commentType: 'admin_internal',
        commentText: specialComment,
        visibility: 'admin',
      });
    });

    it('should handle whitespace-only comments', async () => {
      const user = userEvent.setup();
      
      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      const commentInput = screen.getByPlaceholderText('הוסף הערה...');
      const addButton = screen.getByRole('button', { name: /הוסף הערה/i });

      // Type only spaces
      await user.type(commentInput, '   ');
      await user.click(addButton);

      // Should not call mutate for whitespace-only comments
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should work with client view mode', () => {
      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="client"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      // Client should only see client-visible comments
      expect(screen.getByText('This comment is visible to client')).toBeInTheDocument();
      
      // Should not see admin internal comments
      expect(screen.queryByText('This is an admin internal comment')).not.toBeInTheDocument();
    });

    it('should work with editor view mode', () => {
      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="editor"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      // Editor should see editor notes and client-visible comments
      expect(screen.getByText('Editor note for processing')).toBeInTheDocument();
      expect(screen.getByText('This comment is visible to client')).toBeInTheDocument();
    });

    it('should integrate with submission data loading', () => {
      vi.mocked(useAdminSubmission).mockReturnValue({
        data: undefined,
        isLoading: true,
        refetch: vi.fn(),
      } as any);

      render(
        <SubmissionViewer
          submissionId="test-submission-id"
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      // Should handle loading state gracefully
      expect(screen.queryByText('הוסף הערה')).not.toBeInTheDocument();
    });
  });
}); 