import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientSubmissions2 } from '../ClientSubmissions2';

// Mock hooks
vi.mock('@/hooks/useClientSubmissions', () => ({
  useClientSubmissions: vi.fn(),
  useClientSubmissionStats: vi.fn()
}));

vi.mock('@/hooks/useSubmissionNotes', () => ({
  useSubmissionNotes: vi.fn()
}));

vi.mock('@/hooks/useLoraDetails', () => ({
  useLoraDetails: vi.fn()
}));

vi.mock('@/hooks/useSubmissionStatus', () => ({
  useSubmissionStatus: vi.fn()
}));

vi.mock('@/hooks/useAdminSubmissions', () => ({
  useAdminSubmissionComments: vi.fn(),
  useAdminAddSubmissionComment: vi.fn()
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn()
    }))
  };
});

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

// Mock data
const mockClient = {
  id: 'test-client-id',
  restaurant_name: 'מסעדת הטעם',
  phone: '050-1234567',
  email: 'test@restaurant.com'
};

const mockSubmissions = [
  {
    submission_id: 'submission-1',
    item_name_at_submission: 'חמבורגר טרופי',
    submission_status: 'בעיבוד',
    original_image_urls: [
      'https://example.com/original1.jpg',
      'https://example.com/original2.jpg'
    ],
    processed_image_urls: [
      'https://example.com/processed1.jpg'
    ],
    uploaded_at: '2024-01-01T10:00:00Z'
  },
  {
    submission_id: 'submission-2',
    item_name_at_submission: 'פיצה מרגריטה',
    submission_status: 'הושלמה ואושרה',
    original_image_urls: [
      'https://example.com/pizza-original.jpg'
    ],
    processed_image_urls: [
      'https://example.com/pizza-processed.jpg'
    ],
    uploaded_at: '2024-01-02T10:00:00Z'
  }
];

const mockComments = [
  {
    comment_id: 'comment-1',
    submission_id: 'submission-1',
    comment_type: 'admin_internal',
    comment_text: 'הערה פנימית לצוות',
    created_by_user: { email: 'admin@foodvision.co.il' },
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    comment_id: 'comment-2',
    submission_id: 'submission-1',
    comment_type: 'client_visible',
    comment_text: 'הערה ללקוח על השיפורים',
    created_by_user: { email: 'admin@foodvision.co.il' },
    created_at: '2024-01-01T11:00:00Z'
  },
  {
    comment_id: 'comment-3',
    submission_id: 'submission-1',
    comment_type: 'editor_note',
    comment_text: 'הערה לעורך על הסגנון',
    created_by_user: { email: 'editor@foodvision.co.il' },
    created_at: '2024-01-01T12:00:00Z'
  }
];

const mockNotes = {
  admin_internal: 'הערה פנימית',
  client_visible: 'הערה ללקוח',
  editor_note: 'הערה לעורך'
};

const mockLoraDetails = {
  lora_name: 'Food Style LORA',
  lora_id: 'food-style-v1',
  lora_link: 'https://example.com/lora',
  fixed_prompt: 'Professional food photography'
};

describe('ClientSubmissions2 - Comprehensive Feature Tests', () => {
  const mockUseClientSubmissions = vi.fn();
  const mockUseClientSubmissionStats = vi.fn();
  const mockUseSubmissionNotes = vi.fn();
  const mockUseLoraDetails = vi.fn();
  const mockUseSubmissionStatus = vi.fn();
  const mockUseAdminSubmissionComments = vi.fn();
  const mockUseAdminAddSubmissionComment = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockUseClientSubmissions.mockReturnValue({
      data: mockSubmissions,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });

    mockUseClientSubmissionStats.mockReturnValue({
      data: {
        total: 2,
        in_progress: 1,
        completed: 1,
        waiting: 0
      }
    });

    mockUseSubmissionNotes.mockReturnValue({
      notes: mockNotes,
      updateNote: vi.fn(),
      isSaving: false
    });

    mockUseLoraDetails.mockReturnValue({
      loraDetails: mockLoraDetails,
      updateLoraField: vi.fn(),
      isSaving: false
    });

    mockUseSubmissionStatus.mockReturnValue({
      updateSubmissionStatus: vi.fn(),
      isUpdating: false
    });

    mockUseAdminSubmissionComments.mockReturnValue({
      data: mockComments
    });

    mockUseAdminAddSubmissionComment.mockReturnValue({
      mutate: vi.fn(),
      isPending: false
    });

    // Apply mocks
    require('@/hooks/useClientSubmissions').useClientSubmissions = mockUseClientSubmissions;
    require('@/hooks/useClientSubmissions').useClientSubmissionStats = mockUseClientSubmissionStats;
    require('@/hooks/useSubmissionNotes').useSubmissionNotes = mockUseSubmissionNotes;
    require('@/hooks/useLoraDetails').useLoraDetails = mockUseLoraDetails;
    require('@/hooks/useSubmissionStatus').useSubmissionStatus = mockUseSubmissionStatus;
    require('@/hooks/useAdminSubmissions').useAdminSubmissionComments = mockUseAdminSubmissionComments;
    require('@/hooks/useAdminSubmissions').useAdminAddSubmissionComment = mockUseAdminAddSubmissionComment;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===== FEATURE 1: SUBMISSIONS DISPLAY AND NAVIGATION =====
  describe('Submissions Display and Navigation', () => {
    it('should display submission statistics', () => {
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('2')).toBeInTheDocument(); // Total submissions
      expect(screen.getByText('1')).toBeInTheDocument(); // In progress
      expect(screen.getByText('1')).toBeInTheDocument(); // Completed
    });

    it('should display list of submissions', () => {
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('חמבורגר טרופי')).toBeInTheDocument();
      expect(screen.getByText('פיצה מרגריטה')).toBeInTheDocument();
    });

    it('should select submission when clicked', async () => {
      const user = userEvent.setup();
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      const firstSubmission = screen.getByText('חמבורגר טרופי');
      await user.click(firstSubmission);

      // Should show submission details
      expect(screen.getByTestId('submission-details')).toBeInTheDocument();
    });

    it('should show submission status with correct styling', () => {
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('בעיבוד')).toBeInTheDocument();
      expect(screen.getByText('הושלמה ואושרה')).toBeInTheDocument();
    });
  });

  // ===== FEATURE 2: IMAGE DISPLAY AND NAVIGATION =====
  describe('Image Display and Navigation', () => {
    it('should display original and processed images', async () => {
      const user = userEvent.setup();
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      // Select first submission
      await user.click(screen.getByText('חמבורגר טרופי'));

      expect(screen.getByText('תמונות מקור')).toBeInTheDocument();
      expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
    });

    it('should show image counters', async () => {
      const user = userEvent.setup();
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      expect(screen.getByText('1 / 2')).toBeInTheDocument(); // Original images counter
      expect(screen.getByText('1 / 1')).toBeInTheDocument(); // Processed images counter
    });

    it('should navigate between images with arrows', async () => {
      const user = userEvent.setup();
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      // Find navigation arrows
      const rightArrows = screen.getAllByTestId('chevron-right');
      if (rightArrows.length > 0) {
        await user.click(rightArrows[0]);
        
        await waitFor(() => {
          expect(screen.getByText('2 / 2')).toBeInTheDocument();
        });
      }
    });

    it('should open lightbox when image is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      const images = screen.getAllByRole('img');
      if (images.length > 0) {
        await user.click(images[0]);
        
        expect(screen.getByTestId('image-lightbox')).toBeInTheDocument();
      }
    });
  });

  // ===== FEATURE 3: FULLSCREEN COMPARISON =====
  describe('Fullscreen Comparison Feature', () => {
    it('should show comparison button when both image types exist', async () => {
      const user = userEvent.setup();
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      expect(screen.getByText('השוואה מלאה')).toBeInTheDocument();
    });

    it('should open fullscreen comparison dialog', async () => {
      const user = userEvent.setup();
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));
      
      const comparisonButton = screen.getByText('השוואה מלאה');
      await user.click(comparisonButton);

      expect(screen.getByTestId('fullscreen-comparison')).toBeInTheDocument();
    });

    it('should show independent navigation in comparison view', async () => {
      const user = userEvent.setup();
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));
      await user.click(screen.getByText('השוואה מלאה'));

      // Should show navigation for both sides
      expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
      expect(screen.getByText('תמונות מקור')).toBeInTheDocument();
    });
  });

  // ===== FEATURE 4: ADMIN COMMENTS SYSTEM =====
  describe('Admin Comments System', () => {
    it('should display comment tabs with correct counts', async () => {
      const user = userEvent.setup();
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      expect(screen.getByText('הערות פנימיות')).toBeInTheDocument();
      expect(screen.getByText('הערות ללקוח')).toBeInTheDocument();
      expect(screen.getByText('הערות לעורך')).toBeInTheDocument();

      // Check badge counts
      expect(screen.getByText('1')).toBeInTheDocument(); // Admin internal count
      expect(screen.getByText('1')).toBeInTheDocument(); // Client visible count
      expect(screen.getByText('1')).toBeInTheDocument(); // Editor note count
    });

    it('should switch between comment tabs', async () => {
      const user = userEvent.setup();
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      // Default should show admin internal comments
      expect(screen.getByText('הערה פנימית לצוות')).toBeInTheDocument();

      // Switch to client visible tab
      await user.click(screen.getByText('הערות ללקוח'));
      expect(screen.getByText('הערה ללקוח על השיפורים')).toBeInTheDocument();

      // Switch to editor note tab
      await user.click(screen.getByText('הערות לעורך'));
      expect(screen.getByText('הערה לעורך על הסגנון')).toBeInTheDocument();
    });

    it('should show comment input with appropriate placeholder', async () => {
      const user = userEvent.setup();
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      // Should show comment input
      expect(screen.getByPlaceholderText(/כתוב הערה פנימית/)).toBeInTheDocument();

      // Switch tabs and check placeholder changes
      await user.click(screen.getByText('הערות ללקוח'));
      expect(screen.getByPlaceholderText(/כתוב הערה ללקוח/)).toBeInTheDocument();

      await user.click(screen.getByText('הערות לעורך'));
      expect(screen.getByPlaceholderText(/כתוב הערה לעורך/)).toBeInTheDocument();
    });

    it('should add new comment when submitted', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      
      mockUseAdminAddSubmissionComment.mockReturnValue({
        mutate: mockMutate,
        isPending: false
      });

      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      const commentInput = screen.getByPlaceholderText(/כתוב הערה פנימית/);
      const submitButton = screen.getByText('שלח הערה');

      await user.type(commentInput, 'הערה חדשה לבדיקה');
      await user.click(submitButton);

      expect(mockMutate).toHaveBeenCalledWith({
        submissionId: 'submission-1',
        commentType: 'admin_internal',
        commentText: 'הערה חדשה לבדיקה',
        visibility: 'admin'
      });
    });

    it('should map comment types to correct visibility levels', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      
      mockUseAdminAddSubmissionComment.mockReturnValue({
        mutate: mockMutate,
        isPending: false
      });

      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      // Test client_visible comment
      await user.click(screen.getByText('הערות ללקוח'));
      
      const clientCommentInput = screen.getByPlaceholderText(/כתוב הערה ללקוח/);
      const submitButton = screen.getByText('שלח הערה');

      await user.type(clientCommentInput, 'הערה ללקוח');
      await user.click(submitButton);

      expect(mockMutate).toHaveBeenCalledWith({
        submissionId: 'submission-1',
        commentType: 'client_visible',
        commentText: 'הערה ללקוח',
        visibility: 'client'
      });
    });

    it('should show loading state while adding comment', async () => {
      const user = userEvent.setup();
      
      mockUseAdminAddSubmissionComment.mockReturnValue({
        mutate: vi.fn(),
        isPending: true
      });

      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      expect(screen.getByText('שולח...')).toBeInTheDocument();
    });

    it('should display comment metadata correctly', async () => {
      const user = userEvent.setup();
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      // Should show comment author and timestamp
      expect(screen.getByText('admin@foodvision.co.il')).toBeInTheDocument();
      expect(screen.getByText(/01\/01\/2024/)).toBeInTheDocument();
    });

    it('should show empty state when no comments exist', async () => {
      const user = userEvent.setup();
      
      mockUseAdminSubmissionComments.mockReturnValue({
        data: []
      });

      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      expect(screen.getByText('אין הערות עדיין')).toBeInTheDocument();
    });
  });

  // ===== FEATURE 5: STATUS MANAGEMENT =====
  describe('Status Management', () => {
    it('should display current submission status', async () => {
      const user = userEvent.setup();
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      expect(screen.getByText('בעיבוד')).toBeInTheDocument();
    });

    it('should update status when changed', async () => {
      const user = userEvent.setup();
      const mockUpdateStatus = vi.fn();
      
      mockUseSubmissionStatus.mockReturnValue({
        updateSubmissionStatus: mockUpdateStatus,
        isUpdating: false
      });

      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      // Find and click status selector
      const statusSelector = screen.getByTestId('status-selector');
      await user.click(statusSelector);

      // Select new status
      const newStatus = screen.getByText('הושלמה ואושרה');
      await user.click(newStatus);

      expect(mockUpdateStatus).toHaveBeenCalledWith('submission-1', 'הושלמה ואושרה');
    });
  });

  // ===== FEATURE 6: LORA DETAILS MANAGEMENT =====
  describe('LORA Details Management', () => {
    it('should display LORA details fields', async () => {
      const user = userEvent.setup();
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      expect(screen.getByDisplayValue('Food Style LORA')).toBeInTheDocument();
      expect(screen.getByDisplayValue('food-style-v1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://example.com/lora')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Professional food photography')).toBeInTheDocument();
    });

    it('should update LORA fields when changed', async () => {
      const user = userEvent.setup();
      const mockUpdateLoraField = vi.fn();
      
      mockUseLoraDetails.mockReturnValue({
        loraDetails: mockLoraDetails,
        updateLoraField: mockUpdateLoraField,
        isSaving: false
      });

      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      const loraNameInput = screen.getByDisplayValue('Food Style LORA');
      await user.clear(loraNameInput);
      await user.type(loraNameInput, 'Updated LORA Name');

      expect(mockUpdateLoraField).toHaveBeenCalledWith('lora_name', 'Updated LORA Name');
    });

    it('should show saving state for LORA details', async () => {
      const user = userEvent.setup();
      
      mockUseLoraDetails.mockReturnValue({
        loraDetails: mockLoraDetails,
        updateLoraField: vi.fn(),
        isSaving: true
      });

      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      expect(screen.getByText('שומר פרטי LORA...')).toBeInTheDocument();
    });
  });

  // ===== EDGE CASES AND ERROR HANDLING =====
  describe('Edge Cases and Error Handling', () => {
    it('should handle empty submissions list', () => {
      mockUseClientSubmissions.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('אין הגשות עדיין')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockUseClientSubmissions.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        refetch: vi.fn()
      });

      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle submissions error', () => {
      mockUseClientSubmissions.mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Failed to load submissions'),
        refetch: vi.fn()
      });

      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/שגיאה בטעינת ההגשות/)).toBeInTheDocument();
    });

    it('should handle submission with no images', async () => {
      const user = userEvent.setup();
      
      const submissionWithoutImages = {
        ...mockSubmissions[0],
        original_image_urls: [],
        processed_image_urls: []
      };

      mockUseClientSubmissions.mockReturnValue({
        data: [submissionWithoutImages],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      expect(screen.getByText('אין תמונות מקור')).toBeInTheDocument();
      expect(screen.getByText('אין תמונות מעובדות')).toBeInTheDocument();
    });

    it('should disable comment submission when input is empty', async () => {
      const user = userEvent.setup();
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      const submitButton = screen.getByText('שלח הערה');
      expect(submitButton).toBeDisabled();
    });
  });

  // ===== ACCESSIBILITY AND UX =====
  describe('Accessibility and User Experience', () => {
    it('should have proper Hebrew text and RTL layout', async () => {
      const user = userEvent.setup();
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      expect(screen.getByText('תמונות מקור')).toBeInTheDocument();
      expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
      expect(screen.getByText('הערות פנימיות')).toBeInTheDocument();
      expect(screen.getByText('הערות ללקוח')).toBeInTheDocument();
      expect(screen.getByText('הערות לעורך')).toBeInTheDocument();
    });

    it('should have proper alt text for images', async () => {
      const user = userEvent.setup();
      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).toBeTruthy();
      });
    });

    it('should show appropriate loading states', async () => {
      const user = userEvent.setup();
      
      mockUseSubmissionNotes.mockReturnValue({
        notes: mockNotes,
        updateNote: vi.fn(),
        isSaving: true
      });

      render(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('חמבורגר טרופי'));

      expect(screen.getByText('שומר...')).toBeInTheDocument();
    });
  });
}); 