import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
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
        upload: vi.fn(() => Promise.resolve({ data: { path: 'test-path' }, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'test-url' } }))
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

// Mock all hooks
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

// Mock data with proper status from SUBMISSION_STATUSES
const mockSubmissionData = {
  submission_id: 'test-submission-1',
  item_name_at_submission: 'Test Dish',
  item_type: 'מנה',
  submission_status: 'ממתינה_לעיבוד', // Valid status key
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
    comment_id: '1',
    submission_id: 'test-submission-1',
    comment_type: 'admin_internal',
    comment_text: 'Admin internal note',
    visibility: 'admin',
    created_at: '2025-01-01T00:00:00Z',
    tagged_users: [],
    created_by: 'admin-user',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

const mockMutations = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  data: undefined,
  variables: undefined,
  isIdle: true,
  status: 'idle' as const,
  reset: vi.fn(),
  context: undefined,
  failureCount: 0,
  failureReason: null,
  isLoading: false,
  isPaused: false,
  submittedAt: 0
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

describe('SubmissionViewer - Fix StatusInfo Error', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup admin hooks
    vi.mocked(useAdminSubmission).mockReturnValue({
      data: mockSubmissionData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useAdminSubmissionComments).mockReturnValue({
      data: mockComments,
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useAdminUpdateSubmissionStatus).mockReturnValue(mockMutations as any);
    vi.mocked(useAdminUpdateSubmissionLora).mockReturnValue(mockMutations as any);
    vi.mocked(useAdminAddSubmissionComment).mockReturnValue(mockMutations as any);

    // Setup customer hooks
    vi.mocked(useSubmission).mockReturnValue({
      data: mockSubmissionData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useSubmissionComments).mockReturnValue({
      data: mockComments.filter(c => c.comment_type === 'client_visible'),
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useUpdateSubmissionStatus).mockReturnValue(mockMutations as any);
    vi.mocked(useUpdateSubmissionLora).mockReturnValue(mockMutations as any);
    vi.mocked(useAddSubmissionComment).mockReturnValue(mockMutations as any);
  });

  it('should render component without statusInfo error', async () => {
    render(
      <TestWrapper>
        <SubmissionViewer
          submissionId="test-submission-1"
          viewMode="admin"
          context="full-page"
        />
      </TestWrapper>
    );

    // Basic rendering test - the main issue was statusInfo being undefined
    await waitFor(() => {
      expect(screen.getByText('Test Dish')).toBeInTheDocument();
    });
  });

  it('should handle loading state properly', () => {
    vi.mocked(useAdminSubmission).mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
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

    // Should render loading spinner without crashing - just verify it renders
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('should handle error state gracefully', () => {
    vi.mocked(useAdminSubmission).mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: vi.fn(),
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

    expect(screen.getByText('שגיאה בטעינת פרטי ההגשה')).toBeInTheDocument();
  });

  it('should use correct hooks for admin vs client view', () => {
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

  it('should render comparison mode buttons', async () => {
    render(
      <TestWrapper>
        <SubmissionViewer
          submissionId="test-submission-1"
          viewMode="admin"
          context="full-page"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('השוואה')).toBeInTheDocument();
      expect(screen.getByText('רשת')).toBeInTheDocument();
      expect(screen.getByText('גלריה')).toBeInTheDocument();
    });
  });

  it('should show image counters when images exist', async () => {
    render(
      <TestWrapper>
        <SubmissionViewer
          submissionId="test-submission-1"
          viewMode="admin"
          context="full-page"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      // Look for image counter patterns  
      expect(screen.getByText('1 / 3')).toBeInTheDocument(); // Original images
      expect(screen.getByText('1 / 2')).toBeInTheDocument(); // Processed images
    });
  });

  it('should handle empty image arrays without crashing', async () => {
    vi.mocked(useAdminSubmission).mockReturnValueOnce({
      data: {
        ...mockSubmissionData,
        original_image_urls: [],
        processed_image_urls: []
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
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

    await waitFor(() => {
      expect(screen.getByText('Test Dish')).toBeInTheDocument();
      // Just verify that component renders properly without images - no specific text check needed
      expect(screen.getByText('השוואה')).toBeInTheDocument(); // Comparison mode button
    });
  });

  it('should call onClose when provided', async () => {
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

    await waitFor(() => {
      const closeButton = screen.getByText('חזרה');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledOnce();
    });
  });

  it('should show admin features for admin users only', async () => {
    const { rerender } = render(
      <TestWrapper>
        <SubmissionViewer
          submissionId="test-submission-1"
          viewMode="admin"
          context="full-page"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      // Admin should see upload functionality
      expect(screen.getByText('הוסף תמונה')).toBeInTheDocument();
    });

    rerender(
      <TestWrapper>
        <SubmissionViewer
          submissionId="test-submission-1"
          viewMode="client"
          context="full-page"
        />
      </TestWrapper>
    );

    // Client should not see upload functionality
    expect(screen.queryByText('הוסף תמונה')).not.toBeInTheDocument();
  });
}); 