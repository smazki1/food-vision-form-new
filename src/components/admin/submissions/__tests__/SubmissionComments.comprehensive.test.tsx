import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SubmissionViewer } from '../SubmissionViewer';
import { SubmissionCommentType } from '@/types/submission';

// Mock dependencies
jest.mock('sonner');
jest.mock('@/hooks/useAdminSubmissions');
jest.mock('@/hooks/useSubmissions');
jest.mock('@/components/editor/submission/LightboxDialog', () => {
  return function MockLightboxDialog() {
    return <div data-testid="lightbox-dialog">Lightbox Dialog</div>;
  };
});

const mockToast = toast as jest.Mocked<typeof toast>;

// Mock hooks
const mockUseAdminSubmission = jest.fn();
const mockUseAdminSubmissionComments = jest.fn();
const mockUseAdminAddSubmissionComment = jest.fn();
const mockUseAdminUpdateSubmissionStatus = jest.fn();
const mockUseAdminUpdateSubmissionLora = jest.fn();

// Import and setup mocks
import * as useAdminSubmissions from '@/hooks/useAdminSubmissions';
import * as useSubmissions from '@/hooks/useSubmissions';

(useAdminSubmissions.useAdminSubmission as jest.Mock) = mockUseAdminSubmission;
(useAdminSubmissions.useAdminSubmissionComments as jest.Mock) = mockUseAdminSubmissionComments;
(useAdminSubmissions.useAdminAddSubmissionComment as jest.Mock) = mockUseAdminAddSubmissionComment;
(useAdminSubmissions.useAdminUpdateSubmissionStatus as jest.Mock) = mockUseAdminUpdateSubmissionStatus;
(useAdminSubmissions.useAdminUpdateSubmissionLora as jest.Mock) = mockUseAdminUpdateSubmissionLora;

// Mock customer hooks
(useSubmissions.useSubmission as jest.Mock) = jest.fn();
(useSubmissions.useSubmissionComments as jest.Mock) = jest.fn();
(useSubmissions.useUpdateSubmissionStatus as jest.Mock) = jest.fn();
(useSubmissions.useUpdateSubmissionLora as jest.Mock) = jest.fn();
(useSubmissions.useAddSubmissionComment as jest.Mock) = jest.fn();

// Test data
const mockSubmissionId = 'test-submission-id';
const mockUserId = '4da6bdd1-442e-4e40-8db0-c88fc129c051';

const mockSubmission = {
  submission_id: mockSubmissionId,
  client_id: 'client-123',
  item_type: 'dish',
  item_name_at_submission: 'Test Dish',
  submission_status: 'ממתינה לעיבוד',
  original_image_urls: ['image1.jpg', 'image2.jpg'],
  processed_image_urls: ['processed1.jpg'],
  main_processed_image_url: 'processed1.jpg',
  uploaded_at: '2024-01-01T00:00:00Z',
  edit_count: 0,
  clients: {
    restaurant_name: 'Test Restaurant',
    contact_name: 'Test Contact',
    email: 'test@example.com',
    phone: '123-456-7890'
  }
};

const mockAdminComment = {
  comment_id: 'comment-1',
  submission_id: mockSubmissionId,
  comment_type: 'admin_internal' as SubmissionCommentType,
  comment_text: 'Admin internal comment',
  tagged_users: null,
  visibility: 'admin',
  created_by: mockUserId,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockClientComment = {
  comment_id: 'comment-2',
  submission_id: mockSubmissionId,
  comment_type: 'client_visible' as SubmissionCommentType,
  comment_text: 'Client visible comment',
  tagged_users: null,
  visibility: 'client',
  created_by: mockUserId,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockEditorComment = {
  comment_id: 'comment-3',
  submission_id: mockSubmissionId,
  comment_type: 'editor_note' as SubmissionCommentType,
  comment_text: 'Editor note comment',
  tagged_users: null,
  visibility: 'editor',
  created_by: mockUserId,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockComments = [mockAdminComment, mockClientComment, mockEditorComment];

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

// Helper function to setup default mocks
const setupDefaultMocks = () => {
  mockUseAdminSubmission.mockReturnValue({
    data: mockSubmission,
    isLoading: false,
    error: null,
    refetch: jest.fn()
  });

  mockUseAdminSubmissionComments.mockReturnValue({
    data: mockComments
  });

  mockUseAdminUpdateSubmissionStatus.mockReturnValue({
    mutate: jest.fn(),
    isPending: false
  });

  mockUseAdminUpdateSubmissionLora.mockReturnValue({
    mutate: jest.fn(),
    isPending: false
  });

  const mockAddCommentMutate = jest.fn();
  mockUseAdminAddSubmissionComment.mockReturnValue({
    mutate: mockAddCommentMutate,
    isPending: false
  });

  return { mockAddCommentMutate };
};

describe('SubmissionViewer Comments System - UI Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
  });

  describe('Comment Display and Filtering', () => {
    it('should display comment tabs with correct counts', async () => {
      setupDefaultMocks();

      render(
        <SubmissionViewer
          submissionId={mockSubmissionId}
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      // Check tab existence and content
      expect(screen.getByText('הערות פנימיות')).toBeInTheDocument();
      expect(screen.getByText('הערות ללקוח')).toBeInTheDocument();
      expect(screen.getByText('הערות לעורך')).toBeInTheDocument();

      // Check comment counts in badges
      expect(screen.getByText('1')).toBeInTheDocument(); // Admin comments count
      expect(screen.getByText('1')).toBeInTheDocument(); // Client comments count
      expect(screen.getByText('1')).toBeInTheDocument(); // Editor comments count
    });

    it('should filter comments by selected tab', async () => {
      setupDefaultMocks();

      render(
        <SubmissionViewer
          submissionId={mockSubmissionId}
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      // By default, admin_internal tab should be active
      expect(screen.getByText('Admin internal comment')).toBeInTheDocument();
      expect(screen.queryByText('Client visible comment')).not.toBeInTheDocument();
      expect(screen.queryByText('Editor note comment')).not.toBeInTheDocument();

      // Click client_visible tab
      fireEvent.click(screen.getByText('הערות ללקוח'));
      await waitFor(() => {
        expect(screen.getByText('Client visible comment')).toBeInTheDocument();
        expect(screen.queryByText('Admin internal comment')).not.toBeInTheDocument();
        expect(screen.queryByText('Editor note comment')).not.toBeInTheDocument();
      });

      // Click editor_note tab
      fireEvent.click(screen.getByText('הערות לעורך'));
      await waitFor(() => {
        expect(screen.getByText('Editor note comment')).toBeInTheDocument();
        expect(screen.queryByText('Admin internal comment')).not.toBeInTheDocument();
        expect(screen.queryByText('Client visible comment')).not.toBeInTheDocument();
      });
    });

    it('should show empty state when no comments exist for selected type', async () => {
      // Setup with only admin comments
      mockUseAdminSubmission.mockReturnValue({
        data: mockSubmission,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      mockUseAdminSubmissionComments.mockReturnValue({
        data: [mockAdminComment] // Only admin comment
      });

      mockUseAdminUpdateSubmissionStatus.mockReturnValue({
        mutate: jest.fn(),
        isPending: false
      });

      mockUseAdminUpdateSubmissionLora.mockReturnValue({
        mutate: jest.fn(),
        isPending: false
      });

      mockUseAdminAddSubmissionComment.mockReturnValue({
        mutate: jest.fn(),
        isPending: false
      });

      render(
        <SubmissionViewer
          submissionId={mockSubmissionId}
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      // Switch to client_visible tab which has no comments
      fireEvent.click(screen.getByText('הערות ללקוח'));
      
      await waitFor(() => {
        expect(screen.getByText('אין הערות עדיין')).toBeInTheDocument();
      });
    });
  });

  describe('Comment Creation', () => {
    describe('Comment Type and Visibility Mapping', () => {
      it('should map admin_internal comment to admin visibility', async () => {
        const { mockAddCommentMutate } = setupDefaultMocks();

        render(
          <SubmissionViewer
            submissionId={mockSubmissionId}
            viewMode="admin"
            context="full-page"
          />,
          { wrapper: createWrapper() }
        );

        // Ensure we're on admin_internal tab (default)
        expect(screen.getByText('הערות פנימיות')).toBeInTheDocument();

        // Type comment and submit
        const commentInput = screen.getByPlaceholderText('כתוב הערה פנימית...');
        const submitButton = screen.getByText('שלח הערה');

        await userEvent.type(commentInput, 'New admin comment');
        fireEvent.click(submitButton);

        expect(mockAddCommentMutate).toHaveBeenCalledWith({
          submissionId: mockSubmissionId,
          commentType: 'admin_internal',
          commentText: 'New admin comment',
          visibility: 'admin'
        });
      });

      it('should map client_visible comment to client visibility', async () => {
        const { mockAddCommentMutate } = setupDefaultMocks();

        render(
          <SubmissionViewer
            submissionId={mockSubmissionId}
            viewMode="admin"
            context="full-page"
          />,
          { wrapper: createWrapper() }
        );

        // Switch to client_visible tab
        fireEvent.click(screen.getByText('הערות ללקוח'));

        // Type comment and submit
        const commentInput = screen.getByPlaceholderText('כתוב הערה ללקוח...');
        const submitButton = screen.getByText('שלח הערה');

        await userEvent.type(commentInput, 'New client comment');
        fireEvent.click(submitButton);

        expect(mockAddCommentMutate).toHaveBeenCalledWith({
          submissionId: mockSubmissionId,
          commentType: 'client_visible',
          commentText: 'New client comment',
          visibility: 'client'
        });
      });

      it('should map editor_note comment to editor visibility', async () => {
        const { mockAddCommentMutate } = setupDefaultMocks();

        render(
          <SubmissionViewer
            submissionId={mockSubmissionId}
            viewMode="admin"
            context="full-page"
          />,
          { wrapper: createWrapper() }
        );

        // Switch to editor_note tab
        fireEvent.click(screen.getByText('הערות לעורך'));

        // Type comment and submit
        const commentInput = screen.getByPlaceholderText('כתוב הערה לעורך...');
        const submitButton = screen.getByText('שלח הערה');

        await userEvent.type(commentInput, 'New editor comment');
        fireEvent.click(submitButton);

        expect(mockAddCommentMutate).toHaveBeenCalledWith({
          submissionId: mockSubmissionId,
          commentType: 'editor_note',
          commentText: 'New editor comment',
          visibility: 'editor'
        });
      });
    });

    describe('Form Validation and UX', () => {
      it('should disable submit button when comment is empty', async () => {
        setupDefaultMocks();

        render(
          <SubmissionViewer
            submissionId={mockSubmissionId}
            viewMode="admin"
            context="full-page"
          />,
          { wrapper: createWrapper() }
        );

        const submitButton = screen.getByText('שלח הערה');
        expect(submitButton).toBeDisabled();
      });

      it('should enable submit button when comment has content', async () => {
        setupDefaultMocks();

        render(
          <SubmissionViewer
            submissionId={mockSubmissionId}
            viewMode="admin"
            context="full-page"
          />,
          { wrapper: createWrapper() }
        );

        const commentInput = screen.getByPlaceholderText('כתוב הערה פנימית...');
        const submitButton = screen.getByText('שלח הערה');

        await userEvent.type(commentInput, 'Test comment');
        
        expect(submitButton).not.toBeDisabled();
      });

      it('should disable submit button when mutation is pending', async () => {
        mockUseAdminSubmission.mockReturnValue({
          data: mockSubmission,
          isLoading: false,
          error: null,
          refetch: jest.fn()
        });

        mockUseAdminSubmissionComments.mockReturnValue({
          data: mockComments
        });

        mockUseAdminUpdateSubmissionStatus.mockReturnValue({
          mutate: jest.fn(),
          isPending: false
        });

        mockUseAdminUpdateSubmissionLora.mockReturnValue({
          mutate: jest.fn(),
          isPending: false
        });

        // Mock pending state
        mockUseAdminAddSubmissionComment.mockReturnValue({
          mutate: jest.fn(),
          isPending: true
        });

        render(
          <SubmissionViewer
            submissionId={mockSubmissionId}
            viewMode="admin"
            context="full-page"
          />,
          { wrapper: createWrapper() }
        );

        const commentInput = screen.getByPlaceholderText('כתוב הערה פנימית...');
        const submitButton = screen.getByText('שולח...');

        await userEvent.type(commentInput, 'Test comment');
        
        expect(submitButton).toBeDisabled();
      });

      it('should clear comment input after successful submission', async () => {
        const { mockAddCommentMutate } = setupDefaultMocks();

        render(
          <SubmissionViewer
            submissionId={mockSubmissionId}
            viewMode="admin"
            context="full-page"
          />,
          { wrapper: createWrapper() }
        );

        const commentInput = screen.getByPlaceholderText('כתוב הערה פנימית...') as HTMLTextAreaElement;
        const submitButton = screen.getByText('שלח הערה');

        await userEvent.type(commentInput, 'Test comment');
        expect(commentInput.value).toBe('Test comment');

        fireEvent.click(submitButton);

        // Input should be cleared after submission
        expect(commentInput.value).toBe('');
      });

      it('should handle character count display', async () => {
        setupDefaultMocks();

        render(
          <SubmissionViewer
            submissionId={mockSubmissionId}
            viewMode="admin"
            context="full-page"
          />,
          { wrapper: createWrapper() }
        );

        const commentInput = screen.getByPlaceholderText('כתוב הערה פנימית...');
        
        await userEvent.type(commentInput, 'Test');
        
        expect(screen.getByText('4/500 תווים')).toBeInTheDocument();
      });

      it('should disable submit when character limit exceeded', async () => {
        setupDefaultMocks();

        render(
          <SubmissionViewer
            submissionId={mockSubmissionId}
            viewMode="admin"
            context="full-page"
          />,
          { wrapper: createWrapper() }
        );

        const commentInput = screen.getByPlaceholderText('כתוב הערה פנימית...');
        const submitButton = screen.getByText('שלח הערה');

        // Type over 500 characters
        const longText = 'A'.repeat(501);
        await userEvent.type(commentInput, longText);
        
        expect(submitButton).toBeDisabled();
        expect(screen.getByText('501/500 תווים')).toBeInTheDocument();
      });
    });

    describe('Hebrew Text and Special Characters', () => {
      it('should handle Hebrew text in comments', async () => {
        const { mockAddCommentMutate } = setupDefaultMocks();

        render(
          <SubmissionViewer
            submissionId={mockSubmissionId}
            viewMode="admin"
            context="full-page"
          />,
          { wrapper: createWrapper() }
        );

        const commentInput = screen.getByPlaceholderText('כתוב הערה פנימית...');
        const submitButton = screen.getByText('שלח הערה');

        const hebrewText = 'זוהי הערה בעברית עם מילים ארוכות';
        await userEvent.type(commentInput, hebrewText);
        fireEvent.click(submitButton);

        expect(mockAddCommentMutate).toHaveBeenCalledWith({
          submissionId: mockSubmissionId,
          commentType: 'admin_internal',
          commentText: hebrewText,
          visibility: 'admin'
        });
      });

      it('should handle special characters and emojis', async () => {
        const { mockAddCommentMutate } = setupDefaultMocks();

        render(
          <SubmissionViewer
            submissionId={mockSubmissionId}
            viewMode="admin"
            context="full-page"
          />,
          { wrapper: createWrapper() }
        );

        const commentInput = screen.getByPlaceholderText('כתוב הערה פנימית...');
        const submitButton = screen.getByText('שלח הערה');

        const specialText = 'Comment with special chars: @#$%^&*()[]{}| and emoji: 🎉👍✨';
        await userEvent.type(commentInput, specialText);
        fireEvent.click(submitButton);

        expect(mockAddCommentMutate).toHaveBeenCalledWith({
          submissionId: mockSubmissionId,
          commentType: 'admin_internal',
          commentText: specialText,
          visibility: 'admin'
        });
      });
    });

    describe('Edge Cases', () => {
      it('should not submit when comment is only whitespace', async () => {
        const { mockAddCommentMutate } = setupDefaultMocks();

        render(
          <SubmissionViewer
            submissionId={mockSubmissionId}
            viewMode="admin"
            context="full-page"
          />,
          { wrapper: createWrapper() }
        );

        const commentInput = screen.getByPlaceholderText('כתוב הערה פנימית...');
        const submitButton = screen.getByText('שלח הערה');

        await userEvent.type(commentInput, '   \n\t   ');
        fireEvent.click(submitButton);

        expect(mockAddCommentMutate).not.toHaveBeenCalled();
      });

      it('should handle rapid consecutive submissions', async () => {
        const { mockAddCommentMutate } = setupDefaultMocks();

        render(
          <SubmissionViewer
            submissionId={mockSubmissionId}
            viewMode="admin"
            context="full-page"
          />,
          { wrapper: createWrapper() }
        );

        const commentInput = screen.getByPlaceholderText('כתוב הערה פנימית...');
        const submitButton = screen.getByText('שלח הערה');

        // Type first comment
        await userEvent.type(commentInput, 'First comment');
        fireEvent.click(submitButton);

        // Type second comment immediately  
        await userEvent.type(commentInput, 'Second comment');
        fireEvent.click(submitButton);

        expect(mockAddCommentMutate).toHaveBeenCalledTimes(2);
        expect(mockAddCommentMutate).toHaveBeenNthCalledWith(1, expect.objectContaining({
          commentText: 'First comment'
        }));
        expect(mockAddCommentMutate).toHaveBeenNthCalledWith(2, expect.objectContaining({
          commentText: 'Second comment'
        }));
      });
    });
  });

  describe('Access Control', () => {
    it('should only show comment input for admin viewMode', async () => {
      setupDefaultMocks();

      // Test admin view
      const { rerender } = render(
        <SubmissionViewer
          submissionId={mockSubmissionId}
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByPlaceholderText('כתוב הערה פנימית...')).toBeInTheDocument();
      expect(screen.getByText('שלח הערה')).toBeInTheDocument();

      // Test client view
      rerender(
        <SubmissionViewer
          submissionId={mockSubmissionId}
          viewMode="client"
          context="full-page"
        />
      );

      expect(screen.queryByPlaceholderText('כתוב הערה פנימית...')).not.toBeInTheDocument();
      expect(screen.queryByText('שלח הערה')).not.toBeInTheDocument();
    });

    it('should show different placeholder text based on comment type', async () => {
      setupDefaultMocks();

      render(
        <SubmissionViewer
          submissionId={mockSubmissionId}
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      // Admin internal (default)
      expect(screen.getByPlaceholderText('כתוב הערה פנימית...')).toBeInTheDocument();

      // Switch to client visible
      fireEvent.click(screen.getByText('הערות ללקוח'));
      expect(screen.getByPlaceholderText('כתוב הערה ללקוח...')).toBeInTheDocument();

      // Switch to editor note
      fireEvent.click(screen.getByText('הערות לעורך'));
      expect(screen.getByPlaceholderText('כתוב הערה לעורך...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle submission loading state gracefully', async () => {
      mockUseAdminSubmission.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn()
      });

      mockUseAdminSubmissionComments.mockReturnValue({
        data: []
      });

      mockUseAdminUpdateSubmissionStatus.mockReturnValue({
        mutate: jest.fn(),
        isPending: false
      });

      mockUseAdminUpdateSubmissionLora.mockReturnValue({
        mutate: jest.fn(),
        isPending: false
      });

      mockUseAdminAddSubmissionComment.mockReturnValue({
        mutate: jest.fn(),
        isPending: false
      });

      render(
        <SubmissionViewer
          submissionId={mockSubmissionId}
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      // Component should handle loading state gracefully
      // This tests that the component doesn't crash when submission data is loading
      expect(screen.queryByText('מערכת הערות')).toBeInTheDocument();
    });
  });

  describe('Integration with Comment System', () => {
    it('should use correct hook based on viewMode', async () => {
      // Test admin viewMode uses admin hooks
      setupDefaultMocks();

      render(
        <SubmissionViewer
          submissionId={mockSubmissionId}
          viewMode="admin"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      expect(mockUseAdminSubmissionComments).toHaveBeenCalledWith(mockSubmissionId);
      expect(mockUseAdminAddSubmissionComment).toHaveBeenCalled();

      jest.clearAllMocks();

      // Setup customer mocks
      (useSubmissions.useSubmission as jest.Mock).mockReturnValue({
        data: mockSubmission,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      (useSubmissions.useSubmissionComments as jest.Mock).mockReturnValue({
        data: [mockClientComment] // Only client-visible comments
      });

      (useSubmissions.useUpdateSubmissionStatus as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        isPending: false
      });

      (useSubmissions.useUpdateSubmissionLora as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        isPending: false
      });

      (useSubmissions.useAddSubmissionComment as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        isPending: false
      });

      // Test client viewMode uses customer hooks
      render(
        <SubmissionViewer
          submissionId={mockSubmissionId}
          viewMode="client"
          context="full-page"
        />,
        { wrapper: createWrapper() }
      );

      expect(useSubmissions.useSubmissionComments).toHaveBeenCalledWith(mockSubmissionId);
    });
  });
}); 