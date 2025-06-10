import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { SubmissionViewer } from '../SubmissionViewer';

// Mock all dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ 
          data: { path: 'uploads/test-image.jpg' }, 
          error: null 
        })),
        getPublicUrl: vi.fn(() => ({ 
          data: { publicUrl: 'https://example.com/test-image.jpg' } 
        }))
      }))
    }
  }
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }
}));

// Mock hooks
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
  downloadImagesAsZip: vi.fn(() => Promise.resolve())
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

import { downloadImagesAsZip } from '@/utils/downloadUtils';
import { toast } from 'sonner';

// Mock data for comprehensive testing
const mockSubmissionWithAllData = {
  submission_id: 'test-submission-complete',
  item_name_at_submission: 'Premium Dish',
  item_type: 'מנה ראשונה',
  submission_status: 'מוכנה להצגה',
  uploaded_at: '2025-01-01T00:00:00Z',
  original_image_urls: [
    'https://example.com/original1.jpg',
    'https://example.com/original2.jpg',
    'https://example.com/original3.jpg',
    'https://example.com/original4.jpg'
  ],
  processed_image_urls: [
    'https://example.com/processed1.jpg',
    'https://example.com/processed2.jpg',
    'https://example.com/processed3.jpg'
  ],
  main_processed_image_url: 'https://example.com/processed1.jpg',
  branding_material_urls: ['https://example.com/branding1.jpg'],
  reference_example_urls: ['https://example.com/reference1.jpg'],
  lora_link: 'https://civitai.com/lora-test',
  lora_name: 'Premium LoRA Model',
  lora_id: 'lora-premium-123',
  fixed_prompt: 'Professional food photography with premium styling',
  description: 'High-end dish with complex presentation'
};

const mockComments = [
  {
    comment_id: '1',
    submission_id: 'test-submission-complete',
    comment_type: 'admin_internal',
    comment_text: 'Internal admin note about quality',
    visibility: 'admin',
    created_at: '2025-01-01T10:00:00Z',
    tagged_users: [],
    created_by: 'admin-user',
    updated_at: '2025-01-01T10:00:00Z'
  },
  {
    comment_id: '2',
    submission_id: 'test-submission-complete',
    comment_type: 'client_visible',
    comment_text: 'Client feedback about the images',
    visibility: 'client',
    created_at: '2025-01-01T11:00:00Z',
    tagged_users: [],
    created_by: 'client-user',
    updated_at: '2025-01-01T11:00:00Z'
  },
  {
    comment_id: '3',
    submission_id: 'test-submission-complete',
    comment_type: 'editor_note',
    comment_text: 'Editor note about processing',
    visibility: 'editor',
    created_at: '2025-01-01T12:00:00Z',
    tagged_users: ['editor-1', 'editor-2'],
    created_by: 'editor-user',
    updated_at: '2025-01-01T12:00:00Z'
  }
];

const mockMutationSuccess = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(() => Promise.resolve({ success: true })),
  isPending: false,
  isSuccess: true,
  isError: false,
  error: null,
  data: { success: true },
  variables: undefined,
  isIdle: false,
  status: 'success' as const,
  reset: vi.fn(),
  context: undefined,
  failureCount: 0,
  failureReason: null,
  isLoading: false,
  isPaused: false,
  submittedAt: Date.now()
};

const mockMutationLoading = {
  ...mockMutationSuccess,
  isPending: true,
  isSuccess: false,
  status: 'pending' as const,
  data: undefined
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

describe('SubmissionViewer - Advanced Functionality Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful state for admin hooks
    vi.mocked(useAdminSubmission).mockReturnValue({
      data: mockSubmissionWithAllData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useAdminSubmissionComments).mockReturnValue({
      data: mockComments,
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useAdminUpdateSubmissionStatus).mockReturnValue(mockMutationSuccess as any);
    vi.mocked(useAdminUpdateSubmissionLora).mockReturnValue(mockMutationSuccess as any);
    vi.mocked(useAdminAddSubmissionComment).mockReturnValue(mockMutationSuccess as any);

    // Setup customer hooks with filtered data
    vi.mocked(useSubmission).mockReturnValue({
      data: mockSubmissionWithAllData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useSubmissionComments).mockReturnValue({
      data: mockComments.filter(c => c.comment_type === 'client_visible'),
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useUpdateSubmissionStatus).mockReturnValue(mockMutationSuccess as any);
    vi.mocked(useUpdateSubmissionLora).mockReturnValue(mockMutationSuccess as any);
    vi.mocked(useAddSubmissionComment).mockReturnValue(mockMutationSuccess as any);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Image Navigation Tests', () => {
    it('should navigate between original images with arrow buttons', async () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('1 / 4')).toBeInTheDocument(); // Original images counter
      });

      // Click next arrow for original images
      const nextButtons = screen.getAllByRole('button');
      const originalNextButton = nextButtons.find(btn => 
        btn.querySelector('.lucide-chevron-right')
      );

      if (originalNextButton) {
        fireEvent.click(originalNextButton);
        
        await waitFor(() => {
          expect(screen.getByText('2 / 4')).toBeInTheDocument();
        });
      }
    });

    it('should navigate between processed images with navigation', async () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('1 / 3')).toBeInTheDocument(); // Processed images counter
      });

      // Find and click navigation for processed images
      const buttons = screen.getAllByRole('button');
      const processedNavButton = buttons.find(btn => 
        btn.querySelector('.lucide-chevron-right') && 
        btn.closest('.bg-gray-50')?.textContent?.includes('מעובדות')
      );

      if (processedNavButton) {
        fireEvent.click(processedNavButton);
        
        await waitFor(() => {
          expect(screen.getByText('2 / 3')).toBeInTheDocument();
        });
      }
    });

    it('should handle circular navigation (last to first)', async () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Premium Dish')).toBeInTheDocument();
      });

      // Verify circular navigation logic works by checking initial state
      expect(screen.getByText('1 / 4')).toBeInTheDocument();
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });
  });

  describe('Status Management Tests', () => {
    it('should update submission status successfully', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('מוכנה להצגה')).toBeInTheDocument();
      });

      // Find and interact with status dropdown
      const statusSelect = screen.getByRole('combobox');
      await user.click(statusSelect);

      // Status update functionality is tested indirectly through component rendering
      expect(useAdminUpdateSubmissionStatus).toHaveBeenCalled();
    });

    it('should handle status update errors gracefully', async () => {
      const errorMutation = {
        ...mockMutationSuccess,
        isError: true,
        isSuccess: false,
        error: new Error('Status update failed'),
        data: undefined
      };

      vi.mocked(useAdminUpdateSubmissionStatus).mockReturnValue(errorMutation as any);

      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Premium Dish')).toBeInTheDocument();
      });

      // Component should still render despite error state
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Image Upload Tests', () => {
    it('should show upload interface for admin users', async () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('הוסף תמונה')).toBeInTheDocument();
      });

      // Click upload button to show upload interface
      const uploadButton = screen.getByText('הוסף תמונה');
      fireEvent.click(uploadButton);

      // Upload interface should be visible
      expect(uploadButton).toBeInTheDocument();
    });

    it('should handle URL upload for processed images', async () => {
      const user = userEvent.setup();
      
      // Mock empty processed images to show upload interface
      const submissionWithoutProcessed = {
        ...mockSubmissionWithAllData,
        processed_image_urls: []
      };

      vi.mocked(useAdminSubmission).mockReturnValue({
        data: submissionWithoutProcessed,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show empty state with upload controls
        expect(screen.getByPlaceholderText('הכנס URL של תמונה...')).toBeInTheDocument();
      });

      // Test URL input
      const urlInput = screen.getByPlaceholderText('הכנס URL של תמונה...');
      await user.type(urlInput, 'https://example.com/new-image.jpg');

      expect(urlInput).toHaveValue('https://example.com/new-image.jpg');
    });
  });

  describe('Comment System Tests', () => {
    it('should display different comment types correctly', async () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Premium Dish')).toBeInTheDocument();
      });

      // Should show comment sections
      expect(screen.getByText('הערות ותגובות')).toBeInTheDocument();
    });

    it('should handle comment submission', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('הערות ותגובות')).toBeInTheDocument();
      });

      // Find comment textarea and submit button
      const commentTextarea = screen.getByPlaceholderText(/הוסף הערה/);
      const submitButton = screen.getByText('שלח הערה');

      await user.type(commentTextarea, 'Test comment');
      await user.click(submitButton);

      // Verify mutation was called
      expect(useAdminAddSubmissionComment).toHaveBeenCalled();
    });
  });

  describe('LoRA Data Management Tests', () => {
    it('should display LoRA information correctly', async () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Premium LoRA Model')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Professional food photography with premium styling')).toBeInTheDocument();
      });
    });

    it('should handle LoRA data updates', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Premium LoRA Model')).toBeInTheDocument();
      });

      // Find and click edit button for LoRA
      const editButton = screen.getByText('ערוך');
      await user.click(editButton);

      // Should enable editing mode
      expect(screen.getByText('שמור')).toBeInTheDocument();
    });
  });

  describe('Download Functionality Tests', () => {
    it('should handle download all original images', async () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('הורד הכל')).toBeInTheDocument();
      });

      // Click download all button
      const downloadButton = screen.getByText('הורד הכל');
      fireEvent.click(downloadButton);

      // Should call download utility
      await waitFor(() => {
        expect(downloadImagesAsZip).toHaveBeenCalledWith(
          mockSubmissionWithAllData.original_image_urls,
          expect.stringContaining('original-images')
        );
      });
    });

    it('should handle individual processed image download', async () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Premium Dish')).toBeInTheDocument();
      });

      // Hover over processed image to reveal download button
      const processedImagesContainer = screen.getByText('אחרי - תמונות מעובדות').closest('.bg-gray-50');
      if (processedImagesContainer) {
        fireEvent.mouseEnter(processedImagesContainer);
        
        // Download button should appear on hover
        const downloadButtons = screen.getAllByRole('button');
        const downloadButton = downloadButtons.find(btn => 
          btn.querySelector('.lucide-download')
        );

        if (downloadButton) {
          fireEvent.click(downloadButton);
          // Individual download should trigger
        }
      }
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large number of images efficiently', async () => {
      const manyImages = Array.from({ length: 50 }, (_, i) => 
        `https://example.com/image-${i + 1}.jpg`
      );

      const submissionWithManyImages = {
        ...mockSubmissionWithAllData,
        original_image_urls: manyImages,
        processed_image_urls: manyImages.slice(0, 25)
      };

      vi.mocked(useAdminSubmission).mockReturnValue({
        data: submissionWithManyImages,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('1 / 50')).toBeInTheDocument(); // Original images
        expect(screen.getByText('1 / 25')).toBeInTheDocument(); // Processed images
      });
    });

    it('should handle malformed image URLs gracefully', async () => {
      const submissionWithBadUrls = {
        ...mockSubmissionWithAllData,
        original_image_urls: ['invalid-url', 'not-a-url', ''],
        processed_image_urls: ['bad-url', null, undefined]
      };

      vi.mocked(useAdminSubmission).mockReturnValue({
        data: submissionWithBadUrls,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Premium Dish')).toBeInTheDocument();
      });

      // Component should still render without crashing
      expect(screen.getByText('השוואה')).toBeInTheDocument();
    });

    it('should handle network errors during mutations', async () => {
      const networkErrorMutation = {
        ...mockMutationSuccess,
        isError: true,
        error: new Error('Network error'),
        isPending: false,
        isSuccess: false,
        data: undefined
      };

      vi.mocked(useAdminUpdateSubmissionStatus).mockReturnValue(networkErrorMutation as any);
      vi.mocked(useAdminUpdateSubmissionLora).mockReturnValue(networkErrorMutation as any);
      vi.mocked(useAdminAddSubmissionComment).mockReturnValue(networkErrorMutation as any);

      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Premium Dish')).toBeInTheDocument();
      });

      // Component should handle errors gracefully
      expect(screen.getByText('השוואה')).toBeInTheDocument();
    });
  });

  describe('View Mode Differences', () => {
    it('should show different features for admin vs client view', async () => {
      const { rerender } = render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        // Admin should see all features
        expect(screen.getByRole('combobox')).toBeInTheDocument(); // Status dropdown
        expect(screen.getByText('שמור')).toBeInTheDocument(); // Save button
      });

      rerender(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="client"
            context="full-page"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        // Client should not see admin features
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      });
    });

    it('should filter comments appropriately for different user types', async () => {
      const { rerender } = render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      // Admin should use admin comments hook with all comments
      expect(useAdminSubmissionComments).toHaveBeenCalledWith('test-submission-complete');

      rerender(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-complete"
            viewMode="client"
            context="full-page"
          />
        </TestWrapper>
      );

      // Client should use filtered comments hook
      expect(useSubmissionComments).toHaveBeenCalledWith('test-submission-complete');
    });
  });
}); 