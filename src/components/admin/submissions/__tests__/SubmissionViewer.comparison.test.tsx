import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SubmissionViewer } from '../SubmissionViewer';

// Mock all external dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
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
  }
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/editor/submission/LightboxDialog', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div data-testid="lightbox-dialog">Lightbox</div> : null
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
  downloadImagesAsZip: vi.fn(),
}));

// Mock hooks
const mockSubmissionData = {
  submission_id: 'test-submission-1',
  item_name_at_submission: 'Test Dish',
  item_type: 'dish',
  submission_status: 'ממתינה לעיבוד',
  original_image_urls: [
    'https://example.com/original1.jpg',
    'https://example.com/original2.jpg',
    'https://example.com/original3.jpg',
  ],
  processed_image_urls: [
    'https://example.com/processed1.jpg',
    'https://example.com/processed2.jpg',
  ],
  main_processed_image_url: 'https://example.com/processed1.jpg',
};

const mockUseAdminSubmission = vi.fn();
const mockUseAdminSubmissionComments = vi.fn(() => ({ data: [] }));

const mockMutations = {
  mutate: vi.fn(),
};

vi.mock('@/hooks/useAdminSubmissions', () => ({
  useAdminSubmission: () => mockUseAdminSubmission(),
  useAdminSubmissionComments: () => mockUseAdminSubmissionComments(),
  useAdminUpdateSubmissionStatus: () => mockMutations,
  useAdminUpdateSubmissionLora: () => mockMutations,
  useAdminAddSubmissionComment: () => mockMutations,
}));

vi.mock('@/hooks/useSubmissions', () => ({
  useSubmission: () => mockUseAdminSubmission(),
  useSubmissionComments: () => mockUseAdminSubmissionComments(),
  useUpdateSubmissionStatus: () => mockMutations,
  useUpdateSubmissionLora: () => mockMutations,
  useAddSubmissionComment: () => mockMutations,
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('SubmissionViewer - Comparison Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAdminSubmission.mockReturnValue({
      data: mockSubmissionData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  // CORE FUNCTIONALITY TESTS
  describe('Core Functionality', () => {
    it('should render component successfully with valid data', () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      // Should render basic elements
      expect(screen.getByText('Test Dish')).toBeInTheDocument();
      expect(screen.getAllByText('ממתינה לעיבוד')).toHaveLength(3); // Status appears in multiple places
    });

    it('should render mode switching buttons', () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      // Should have mode switching buttons
      expect(screen.getByText('השוואה')).toBeInTheDocument();
      expect(screen.getByText('רשת')).toBeInTheDocument();
      expect(screen.getByText('גלריה')).toBeInTheDocument();
    });

    it('should handle mode switching', async () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      // Test mode switching functionality
      const gridButton = screen.getByText('רשת');
      const comparisonButton = screen.getByText('השוואה');

      expect(comparisonButton).toHaveClass('bg-primary'); // Default active
      expect(gridButton).not.toHaveClass('bg-primary');

      fireEvent.click(gridButton);
      await waitFor(() => {
        expect(gridButton).toHaveClass('bg-primary');
      });

      fireEvent.click(comparisonButton);
      await waitFor(() => {
        expect(comparisonButton).toHaveClass('bg-primary');
      });
    });

    it('should display main image badge when main processed image exists', () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      // Main image badge should be visible
      expect(screen.getByText('ראשית')).toBeInTheDocument();
    });
  });

  // IMAGE RENDERING TESTS
  describe('Image Rendering', () => {
    it('should render images when data is available', () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      // Check for image elements
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
    });

    it('should handle image counter display', () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      // Look for image counter patterns (flexible search)
      const counterElements = screen.getAllByText(/\d+ \/ \d+/);
      expect(counterElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  // COMPARISON MODE SPECIFIC TESTS
  describe('Comparison Mode Features', () => {
    it('should show comparison mode by default', () => {
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

    it('should display before and after section headers', () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      // Check for comparison mode section headers
      expect(screen.getByText('לפני - תמונות מקור')).toBeInTheDocument();
      expect(screen.getByText('אחרי - תמונות מעובדות')).toBeInTheDocument();
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

      // Look for chevron icons in SVGs
      const chevronElements = screen.getAllByRole('button').filter(button => {
        return button.innerHTML.includes('chevron-left') || button.innerHTML.includes('chevron-right');
      });

      // Should have some navigation elements when multiple images exist
      expect(chevronElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  // EDGE CASES
  describe('Edge Cases', () => {
    it('should handle empty image arrays gracefully', () => {
      const emptyImageSubmission = {
        ...mockSubmissionData,
        original_image_urls: [],
        processed_image_urls: [],
      };

      mockUseAdminSubmission.mockReturnValueOnce({
        data: emptyImageSubmission,
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

      // Should not crash
      expect(screen.getByText('Test Dish')).toBeInTheDocument();
    });

    it('should handle single image arrays', () => {
      const singleImageSubmission = {
        ...mockSubmissionData,
        original_image_urls: ['https://example.com/single-original.jpg'],
        processed_image_urls: ['https://example.com/single-processed.jpg'],
      };

      mockUseAdminSubmission.mockReturnValueOnce({
        data: singleImageSubmission,
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

      // Should render without navigation arrows
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
    });

    it('should handle loading state', () => {
      mockUseAdminSubmission.mockReturnValueOnce({
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

      // Should handle loading gracefully (component should not crash)
      expect(screen.queryByText('Test Dish')).not.toBeInTheDocument();
    });

    it('should handle error state', () => {
      mockUseAdminSubmission.mockReturnValueOnce({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch submission'),
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

      // Should handle error gracefully without crashing
      expect(screen.queryByText('Test Dish')).not.toBeInTheDocument();
    });
  });

  // INTEGRATION TESTS
  describe('Integration', () => {
    it('should preserve download functionality', () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      // Should have download-related functionality
      expect(screen.getByText('הורד הכל')).toBeInTheDocument();
    });

    it('should work with different view modes', () => {
      render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="client"
            context="full-page"
          />
        </TestWrapper>
      );

      // Should work for client view mode
      expect(screen.getByText('השוואה')).toBeInTheDocument();
    });

    it('should handle client vs admin view differences', () => {
      const { rerender } = render(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="admin"
            context="full-page"
          />
        </TestWrapper>
      );

      // Admin view should have upload functionality
      expect(screen.getByText('הוסף תמונה')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <SubmissionViewer
            submissionId="test-submission-1"
            viewMode="client"
            context="full-page"
          />
        </TestWrapper>
      );

      // Client view should not have upload functionality
      expect(screen.queryByText('הוסף תמונה')).not.toBeInTheDocument();
    });
  });
}); 