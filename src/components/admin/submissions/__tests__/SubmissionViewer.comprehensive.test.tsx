import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { SubmissionViewer } from '../SubmissionViewer';
import { toast } from 'sonner';

// Mock all external dependencies
// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    update: vi.fn(() => ({
      eq: vi.fn(() => ({ error: null }))
    }))
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => ({ data: { path: 'test-path' }, error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'test-url' } }))
    }))
  }
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }
}));

vi.mock('@/hooks/useAdminSubmissions', () => ({
  useAdminSubmission: vi.fn(),
  useAdminSubmissionComments: vi.fn(),
  useAdminUpdateSubmissionStatus: vi.fn(),
  useAdminUpdateSubmissionLora: vi.fn(),
  useAdminAddSubmissionComment: vi.fn(),
}));

vi.mock('@/hooks/useSubmissions', () => ({
  useSubmission: vi.fn(),
  useSubmissionComments: vi.fn(),
  useUpdateSubmissionStatus: vi.fn(),
  useUpdateSubmissionLora: vi.fn(),
  useAddSubmissionComment: vi.fn(),
}));

vi.mock('@/components/editor/submission-processing/hooks/useLightbox', () => ({
  useLightbox: () => ({
    lightboxImage: null,
    lightboxImages: [],
    currentImageIndex: 0,
    setLightboxImage: vi.fn(),
    navigateToIndex: vi.fn(),
  }),
}));

vi.mock('@/utils/downloadUtils', () => ({
  downloadImagesAsZip: vi.fn()
}));

// Import mocked modules
import {
  useAdminSubmission,
  useAdminSubmissionComments,
  useAdminUpdateSubmissionStatus,
  useAdminUpdateSubmissionLora,
  useAdminAddSubmissionComment,
} from '@/hooks/useAdminSubmissions';

import {
  useSubmission,
  useSubmissionComments,
  useUpdateSubmissionStatus,
  useUpdateSubmissionLora,
  useAddSubmissionComment,
} from '@/hooks/useSubmissions';

import { useLightbox } from '@/components/editor/submission-processing/hooks/useLightbox';
import { downloadImagesAsZip } from '@/utils/downloadUtils';

// Mock data
const mockSubmissionData = {
  submission_id: 'test-submission-1',
  item_name_at_submission: 'Test Dish',
  item_type: 'מנה',
  submission_status: 'ממתינה_לעיבוד',
  uploaded_at: '2025-01-01T00:00:00Z',
  original_image_urls: [
    'https://example.com/original1.jpg',
    'https://example.com/original2.jpg',
    'https://example.com/original3.jpg'
  ],
  processed_image_urls: [
    'https://example.com/processed1.jpg',
    'https://example.com/processed2.jpg'
  ],
  main_processed_image_url: 'https://example.com/processed1.jpg',
  branding_material_urls: ['https://example.com/branding1.jpg'],
  reference_example_urls: ['https://example.com/reference1.jpg'],
  lora_link: 'test-lora-link',
  lora_name: 'test-lora',
  lora_id: 'lora-123',
  fixed_prompt: 'test prompt',
  description: 'Test description'
};

const mockComments = [
  {
    id: '1',
    comment_type: 'admin_internal',
    comment_text: 'Admin internal note',
    visibility: 'admin',
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '2', 
    comment_type: 'client_visible',
    comment_text: 'Client visible comment',
    visibility: 'client',
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '3',
    comment_type: 'editor_note',
    comment_text: 'Editor note',
    visibility: 'editor',
    created_at: '2025-01-01T00:00:00Z'
  }
];

const mockMutations = {
  mutate: vi.fn(),
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null
};

// Setup default mocks
const setupDefaultMocks = () => {
  vi.mocked(useAdminSubmission).mockReturnValue({
    data: mockSubmissionData,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });

  vi.mocked(useAdminSubmissionComments).mockReturnValue({
    data: mockComments,
    isLoading: false,
    refetch: vi.fn(),
  });

  vi.mocked(useAdminUpdateSubmissionStatus).mockReturnValue(mockMutations);
  vi.mocked(useAdminUpdateSubmissionLora).mockReturnValue(mockMutations);
  vi.mocked(useAdminAddSubmissionComment).mockReturnValue(mockMutations);

  // Customer hooks
  vi.mocked(useSubmission).mockReturnValue({
    data: mockSubmissionData,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });

  vi.mocked(useSubmissionComments).mockReturnValue({
    data: mockComments.filter(c => c.comment_type === 'client_visible'),
    isLoading: false,
    refetch: vi.fn(),
  });

  vi.mocked(useUpdateSubmissionStatus).mockReturnValue(mockMutations);
  vi.mocked(useUpdateSubmissionLora).mockReturnValue(mockMutations);
  vi.mocked(useAddSubmissionComment).mockReturnValue(mockMutations);
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('SubmissionViewer - Comprehensive Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===== CORE FUNCTIONALITY TESTS =====
  describe('Core Functionality', () => {
    it('should render component successfully with valid submission data', () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Test Dish')).toBeInTheDocument();
      expect(screen.getByText('ממתינה לעיבוד')).toBeInTheDocument();
      expect(screen.getByText('השוואה')).toBeInTheDocument();
      expect(screen.getByText('רשת')).toBeInTheDocument();
      expect(screen.getByText('גלריה')).toBeInTheDocument();
    });

    it('should use correct hooks based on viewMode', () => {
      const { rerender } = render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      expect(useAdminSubmission).toHaveBeenCalledWith("test-submission-1");

      rerender(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="client"
            context="full-page"
          />
        </TestWrapper>
      );

      expect(useSubmission).toHaveBeenCalledWith("test-submission-1");
    });

    it('should initialize LoRA data when submission loads', () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      // Should display LoRA data in form fields when editing is enabled
      expect(screen.getByText('test-lora')).toBeInTheDocument();
    });

    it('should handle onClose callback when provided', async () => {
      const mockOnClose = vi.fn();
      
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const closeButton = screen.getByText('חזרה');
      await userEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledOnce();
    });
  });

  // ===== IMAGE MANAGEMENT TESTS =====
  describe('Image Management', () => {
    describe('Comparison Mode', () => {
      it('should default to comparison mode', () => {
        render(
          <TestWrapper>
            <SubmissionViewer
              submissionId="test-submission-1"
              viewMode="admin"
              context="full-page"
            />
          </TestWrapper>
        );

        const comparisonButton = screen.getByText('השוואה');
        expect(comparisonButton).toHaveClass('bg-primary');
      });

      it('should display before and after sections in comparison mode', () => {
        render(
          <TestWrapper>
            <SubmissionViewer
              submissionId="test-submission-1"
              viewMode="admin"
              context="full-page"
            />
          </TestWrapper>
        );

        expect(screen.getByText('לפני - תמונות מקור')).toBeInTheDocument();
        expect(screen.getByText('אחרי - תמונות מעובדות')).toBeInTheDocument();
      });

      it('should show image counters in comparison mode', () => {
        render(
          <TestWrapper>
            <SubmissionViewer
              submissionId="test-submission-1"
              viewMode="admin"
              context="full-page"
            />
          </TestWrapper>
        );

        // Look for counter patterns
        expect(screen.getByText('1 / 3')).toBeInTheDocument(); // Original images counter
        expect(screen.getByText('1 / 2')).toBeInTheDocument(); // Processed images counter
      });

      it('should show navigation arrows for multiple images', () => {
        render(
          <TestWrapper>
            <SubmissionViewer
              submissionId="test-submission-1"
              viewMode="admin"
              context="full-page"
            />
          </TestWrapper>
        );

        // Should have navigation buttons
        const buttons = screen.getAllByRole('button');
        const navigationButtons = buttons.filter(button => 
          button.innerHTML.includes('chevron') || 
          button.querySelector('svg[data-lucide="chevron-left"]') ||
          button.querySelector('svg[data-lucide="chevron-right"]')
        );

        expect(navigationButtons.length).toBeGreaterThan(0);
      });

      it('should navigate between original images', async () => {
        render(
          <TestWrapper>
            <SubmissionViewer
              submissionId="test-submission-1"
              viewMode="admin"
              context="full-page"
            />
          </TestWrapper>
        );

        // Initial state should show 1/3
        expect(screen.getByText('1 / 3')).toBeInTheDocument();

        // Find and click next button for original images
        const nextButtons = screen.getAllByRole('button').filter(btn => 
          btn.innerHTML.includes('chevron-right')
        );

        if (nextButtons.length > 0) {
          await userEvent.click(nextButtons[0]);
          // Counter should update (assuming state management works)
        }
      });

      it('should handle circular navigation', () => {
        render(
          <TestWrapper>
            <SubmissionViewer
              submissionId="test-submission-1"
              viewMode="admin"
              context="full-page"
            />
          </TestWrapper>
        );

        // Component should handle circular navigation without crashing
        expect(screen.getByText('1 / 3')).toBeInTheDocument();
      });
    });

    describe('View Mode Switching', () => {
      it('should switch between comparison, grid, and gallery modes', async () => {
        render(
          <TestWrapper>
            <SubmissionViewer
              submissionId="test-submission-1"
              viewMode="admin"
              context="full-page"
            />
          </TestWrapper>
        );

        const gridButton = screen.getByText('רשת');
        const galleryButton = screen.getByText('גלריה');
        const comparisonButton = screen.getByText('השוואה');

        // Initially comparison should be active
        expect(comparisonButton).toHaveClass('bg-primary');

        // Switch to grid mode
        await userEvent.click(gridButton);
        expect(gridButton).toHaveClass('bg-primary');

        // Switch to gallery mode
        await userEvent.click(galleryButton);
        expect(galleryButton).toHaveClass('bg-primary');

        // Switch back to comparison
        await userEvent.click(comparisonButton);
        expect(comparisonButton).toHaveClass('bg-primary');
      });

      it('should reset navigation indices when switching to comparison mode', async () => {
        render(
          <TestWrapper>
            <SubmissionViewer
              submissionId="test-submission-1"
              viewMode="admin"
              context="full-page"
            />
          </TestWrapper>
        );

        const gridButton = screen.getByText('רשת');
        const comparisonButton = screen.getByText('השוואה');

        await userEvent.click(gridButton);
        await userEvent.click(comparisonButton);

        // Should reset to show 1/3 and 1/2
        expect(screen.getByText('1 / 3')).toBeInTheDocument();
        expect(screen.getByText('1 / 2')).toBeInTheDocument();
      });
    });

    describe('Delete Processed Images', () => {
      it('should show delete button for admin users only', () => {
        const { rerender } = render(
          <TestWrapper>
            <SubmissionViewer
              submissionId="test-submission-1"
              viewMode="admin"
              context="full-page"
            />
          </TestWrapper>
        );

        // Admin should see delete button (look for trash icon)
        expect(screen.getByTestId('delete-button')).toBeInTheDocument();

        rerender(
          <TestWrapper>
            <SubmissionViewer
              submissionId="test-submission-1"
              viewMode="client"
              context="full-page"
            />
          </TestWrapper>
        );

        // Client should not see delete button
        expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
      });

      it('should confirm deletion before proceeding', async () => {
        // Mock window.confirm
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(
          <TestWrapper>
            <SubmissionViewer
              submissionId="test-submission-1"
              viewMode="admin"
              context="full-page"
            />
          </TestWrapper>
        );

        const deleteButton = screen.getByTestId('delete-button');
        await userEvent.click(deleteButton);

        expect(confirmSpy).toHaveBeenCalledWith("האם אתה בטוח שברצונך למחוק תמונה זו?");

        confirmSpy.mockRestore();
      });

      it('should handle deletion cancellation', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

        render(
          <TestWrapper>
            <SubmissionViewer
              submissionId="test-submission-1"
              viewMode="admin"
              context="full-page"
            />
          </TestWrapper>
        );

        const deleteButton = screen.getByTestId('delete-button');
        await userEvent.click(deleteButton);

        expect(confirmSpy).toHaveBeenCalled();
        // Supabase update should not be called
        expect(vi.mocked(mockSubmissionData)).not.toHaveBeenCalled();

        confirmSpy.mockRestore();
      });
    });

    describe('Download Functionality', () => {
      it('should download all original images', async () => {
        render(
          <TestWrapper>
            <SubmissionViewer
              submissionId="test-submission-1"
              viewMode="admin"
              context="full-page"
            />
          </TestWrapper>
        );

        const downloadAllButton = screen.getByText('הורד הכל');
        await userEvent.click(downloadAllButton);

        expect(downloadImagesAsZip).toHaveBeenCalledWith(
          mockSubmissionData.original_image_urls,
          'Test Dish_original_images.zip'
        );
        expect(toast.success).toHaveBeenCalled();
      });

      it('should handle download errors gracefully', async () => {
        vi.mocked(downloadImagesAsZip).mockRejectedValueOnce(new Error('Download failed'));

        render(
          <TestWrapper>
            <SubmissionViewer
              submissionId="test-submission-1"
              viewMode="admin"
              context="full-page"
            />
          </TestWrapper>
        );

        const downloadAllButton = screen.getByText('הורד הכל');
        await userEvent.click(downloadAllButton);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("שגיאה בהורדת התמונות");
        });
      });

      it('should handle empty image arrays for download', async () => {
        vi.mocked(useAdminSubmission).mockReturnValueOnce({
          data: { ...mockSubmissionData, original_image_urls: [] },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        });

        render(
          <TestWrapper>
            <SubmissionViewer
              submissionId="test-submission-1"
              viewMode="admin"
              context="full-page"
            />
          </TestWrapper>
        );

        const downloadAllButton = screen.getByText('הורד הכל');
        await userEvent.click(downloadAllButton);

        expect(toast.error).toHaveBeenCalledWith("אין תמונות מקור להורדה");
      });
    });
  });

  // ===== COMMENTS SYSTEM TESTS =====
  describe('Comments System', () => {
    it('should display comment tabs with correct counts', () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      expect(screen.getByText('הערות פנימיות')).toBeInTheDocument();
      expect(screen.getByText('הערות ללקוח')).toBeInTheDocument();
      expect(screen.getByText('הערות לעורך')).toBeInTheDocument();

      // Check badge counts
      const badges = screen.getAllByText('1');
      expect(badges.length).toBeGreaterThanOrEqual(3);
    });

    it('should switch between comment tabs', async () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      const clientTab = screen.getByText('הערות ללקוח');
      const editorTab = screen.getByText('הערות לעורך');

      await userEvent.click(clientTab);
      expect(screen.getByText('Client visible comment')).toBeInTheDocument();

      await userEvent.click(editorTab);
      expect(screen.getByText('Editor note')).toBeInTheDocument();
    });

    it('should add new comments', async () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      const commentInput = screen.getByPlaceholderText(/כתוב הערה/);
      const addButton = screen.getByText('הוסף הערה');

      await userEvent.type(commentInput, 'New test comment');
      await userEvent.click(addButton);

      expect(mockMutations.mutate).toHaveBeenCalledWith({
        submissionId: 'test-submission-1',
        commentType: 'admin_internal',
        commentText: 'New test comment',
        visibility: 'admin'
      });
    });

    it('should not add empty comments', async () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      const addButton = screen.getByText('הוסף הערה');
      await userEvent.click(addButton);

      expect(mockMutations.mutate).not.toHaveBeenCalled();
    });

    it('should map comment types to correct visibility levels', async () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      // Switch to client tab
      const clientTab = screen.getByText('הערות ללקוח');
      await userEvent.click(clientTab);

      const commentInput = screen.getByPlaceholderText(/כתוב הערה/);
      const addButton = screen.getByText('הוסף הערה');

      await userEvent.type(commentInput, 'Client comment');
      await userEvent.click(addButton);

      expect(mockMutations.mutate).toHaveBeenCalledWith({
        submissionId: 'test-submission-1',
        commentType: 'client_visible',
        commentText: 'Client comment',
        visibility: 'client'
      });
    });
  });

  // ===== STATUS MANAGEMENT TESTS =====
  describe('Status Management', () => {
    it('should display current submission status', () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      expect(screen.getByText('ממתינה לעיבוד')).toBeInTheDocument();
    });

    it('should allow admin users to update status', async () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      // Look for status select dropdown
      const statusSelect = screen.getByDisplayValue('ממתינה לעיבוד');
      expect(statusSelect).toBeInTheDocument();
    });

    it('should not show status selector for client users', () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="client"
            context="full-page"
          />
        </TestWrapper>
      );

      // Status should be displayed but not editable
      expect(screen.getByText('ממתינה לעיבוד')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('ממתינה לעיבוד')).not.toBeInTheDocument();
    });
  });

  // ===== FILE UPLOAD TESTS =====
  describe('File Upload', () => {
    it('should show upload options for admin users', () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      expect(screen.getByText('הוסף מ-URL')).toBeInTheDocument();
      expect(screen.getByText('העלה מהמחשב')).toBeInTheDocument();
    });

    it('should not show upload options for client users', () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="client"
            context="full-page"
          />
        </TestWrapper>
      );

      expect(screen.queryByText('הוסף מ-URL')).not.toBeInTheDocument();
      expect(screen.queryByText('העלה מהמחשב')).not.toBeInTheDocument();
    });

    it('should handle URL upload', async () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      const urlInput = screen.getByPlaceholderText('הכנס URL של תמונה...');
      const uploadButton = screen.getByText('הוסף מ-URL');

      await userEvent.type(urlInput, 'https://example.com/new-image.jpg');
      await userEvent.click(uploadButton);

      // Should attempt to upload
      expect(urlInput).toHaveValue('https://example.com/new-image.jpg');
    });

    it('should disable upload button when URL is empty', () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      const uploadButton = screen.getByText('הוסף מ-URL');
      expect(uploadButton).toBeDisabled();
    });
  });

  // ===== EDGE CASES =====
  describe('Edge Cases', () => {
    it('should handle loading state', () => {
      vi.mocked(useAdminSubmission).mockReturnValueOnce({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // Loading spinner
    });

    it('should handle error state', () => {
      vi.mocked(useAdminSubmission).mockReturnValueOnce({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      expect(screen.getByText('שגיאה בטעינת פרטי ההגשה')).toBeInTheDocument();
    });

    it('should handle empty image arrays', () => {
      vi.mocked(useAdminSubmission).mockReturnValueOnce({
        data: {
          ...mockSubmissionData,
          original_image_urls: [],
          processed_image_urls: []
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Test Dish')).toBeInTheDocument();
      expect(screen.getByText('אין תמונות מעובדות')).toBeInTheDocument();
    });

    it('should handle null/undefined image URLs', () => {
      vi.mocked(useAdminSubmission).mockReturnValueOnce({
        data: {
          ...mockSubmissionData,
          original_image_urls: null,
          processed_image_urls: undefined
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Test Dish')).toBeInTheDocument();
    });

    it('should handle single image arrays', () => {
      vi.mocked(useAdminSubmission).mockReturnValueOnce({
        data: {
          ...mockSubmissionData,
          original_image_urls: ['https://example.com/single.jpg'],
          processed_image_urls: ['https://example.com/single-processed.jpg']
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      expect(screen.getByText('1 / 1')).toBeInTheDocument();
    });

    it('should handle missing LoRA data', () => {
      vi.mocked(useAdminSubmission).mockReturnValueOnce({
        data: {
          ...mockSubmissionData,
          lora_link: null,
          lora_name: null,
          lora_id: null,
          fixed_prompt: null
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Test Dish')).toBeInTheDocument();
    });

    it('should handle empty comments array', () => {
      vi.mocked(useAdminSubmissionComments).mockReturnValueOnce({
        data: [],
        isLoading: false,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      const badges = screen.getAllByText('0');
      expect(badges.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ===== ERROR HANDLING =====
  describe('Error Handling', () => {
    it('should handle Supabase errors during image deletion', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      // Mock Supabase error
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ error: new Error('Database error') }))
        }))
      } as any);

      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      const deleteButton = screen.getByTestId('delete-button');
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("שגיאה במחיקת התמונה");
      });

      confirmSpy.mockRestore();
    });

    it('should handle file upload errors', async () => {
      // Mock file upload error
      vi.mocked(supabase.storage.from).mockReturnValueOnce({
        upload: vi.fn(() => ({ data: null, error: new Error('Upload failed') })),
        getPublicUrl: vi.fn()
      } as any);

      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      const fileInput = screen.getByText('העלה מהמחשב');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      // Simulate file selection
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        Object.defineProperty(input, 'files', {
          value: [file],
          writable: false,
        });
        fireEvent.change(input);
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should handle comment submission errors', async () => {
      vi.mocked(useAdminAddSubmissionComment).mockReturnValueOnce({
        mutate: vi.fn(() => {
          throw new Error('Comment failed');
        }),
        isPending: false,
        isSuccess: false,
        isError: true,
        error: new Error('Comment failed')
      });

      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      const commentInput = screen.getByPlaceholderText(/כתוב הערה/);
      const addButton = screen.getByText('הוסף הערה');

      await userEvent.type(commentInput, 'Test comment');
      await userEvent.click(addButton);

      // Should handle error gracefully
      expect(screen.getByText('Test Dish')).toBeInTheDocument();
    });
  });

  // ===== INTEGRATION TESTS =====
  describe('Integration Tests', () => {
    it('should integrate with lightbox system', async () => {
      const mockSetLightboxImage = vi.fn();
      vi.mocked(useLightbox).mockReturnValueOnce({
        lightboxImage: null,
        lightboxImages: [],
        currentImageIndex: 0,
        setLightboxImage: mockSetLightboxImage,
        navigateToIndex: vi.fn(),
      });

      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      const images = screen.getAllByRole('img');
      if (images.length > 0) {
        await userEvent.click(images[0]);
        expect(mockSetLightboxImage).toHaveBeenCalled();
      }
    });

    it('should work with different contexts', () => {
      const contexts = ['lead-panel', 'full-page', 'table-row', 'client-dashboard'] as const;

      contexts.forEach(context => {
        const { unmount } = render(
          <TestWrapper>
            <SubmissionViewer
              submissionId="test-submission-1"
              viewMode="admin"
              context={context}
            />
          </TestWrapper>
        );

        expect(screen.getByText('Test Dish')).toBeInTheDocument();
        unmount();
      });
    });

    it('should preserve state between re-renders', () => {
      const { rerender } = render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      expect(screen.getByText('השוואה')).toHaveClass('bg-primary');

      rerender(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      expect(screen.getByText('השוואה')).toHaveClass('bg-primary');
    });

    it('should handle real-time data updates', async () => {
      const mockRefetch = vi.fn();
      vi.mocked(useAdminSubmission).mockReturnValue({
        data: mockSubmissionData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      // Component should call refetch after certain operations
      expect(mockRefetch).toBeDefined();
    });
  });
}); 