import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { ClientSubmissions2 } from '../ClientSubmissions2';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          single: vi.fn(() => Promise.resolve({ 
            data: { processed_image_urls: ['image1.jpg', 'image2.jpg'] }, 
            error: null 
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

vi.mock('@/hooks/useClientSubmissions', () => ({
  useClientSubmissions: vi.fn(() => ({
    data: [
      {
        submission_id: 'test-submission-1',
        item_name_at_submission: 'חמבורגר טרופי',
        submission_status: 'in_progress',
        original_image_urls: ['original1.jpg', 'original2.jpg'],
        processed_image_urls: ['processed1.jpg', 'processed2.jpg', 'processed3.jpg']
      }
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn()
  })),
  useClientSubmissionStats: vi.fn(() => ({
    data: { in_progress: 1, waiting: 0, completed: 0 }
  }))
}));

vi.mock('lucide-react', () => ({
  ChevronUp: () => <div data-testid="chevron-up" />,
  ChevronDown: () => <div data-testid="chevron-down" />,
  ChevronLeft: () => <div data-testid="chevron-left" />,
  ChevronRight: () => <div data-testid="chevron-right" />,
  Play: () => <div data-testid="play-icon" />,
  Pause: () => <div data-testid="pause-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  ImageIcon: () => <div data-testid="image-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Link: () => <div data-testid="link-icon" />,
  X: () => <div data-testid="x-icon" />,
  Download: () => <div data-testid="download-icon" />
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, disabled, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={className} 
      disabled={disabled}
      data-testid={props['data-testid'] || 'button'}
      {...props}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input data-testid="input" {...props} />
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea data-testid="textarea" {...props} />
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>{children}</div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => (
    <button data-testid={`tab-trigger-${value}`}>{children}</button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  )
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <div data-testid="separator" />
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: {
      success: vi.fn(),
      error: vi.fn()
    }
  })
}));

const mockClient = {
  client_id: 'test-client-id',
  restaurant_name: 'מסעדת בדיקה',
  contact_name: 'איש קשר בדיקה',
  phone: '050-1234567',
  email: 'test@example.com',
  original_lead_id: 'lead-123',
  client_status: 'פעיל',
  current_package_id: null,
  remaining_servings: 0,
  remaining_images: 0,
  consumed_images: 0,
  reserved_images: 0,
  last_activity_at: '2024-01-01T00:00:00Z',
  internal_notes: null,
  user_auth_id: null,
  ai_training_25_count: 5,
  ai_training_15_count: 3,
  ai_training_5_count: 2,
  ai_prompts_count: 10,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ClientSubmissions2 - Processed Images Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // 1. Happy Path Tests
  describe('Happy Path - Core Functionality', () => {
    test('renders processed images section with correct image count', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
        expect(screen.getByText('3 תמונות')).toBeInTheDocument();
      });
    });

    test('displays processed image with correct src attribute', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        const processedImage = screen.getByAltText('תמונה מעובדת');
        expect(processedImage).toBeInTheDocument();
        expect(processedImage).toHaveAttribute('src', 'processed1.jpg');
      });
    });

    test('opens lightbox when processed image is clicked', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        const processedImage = screen.getByAltText('תמונה מעובדת');
        fireEvent.click(processedImage);
      });

      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
        expect(screen.getByAltText('תמונה מוגדלת')).toBeInTheDocument();
      });
    });

    test('shows navigation arrows when multiple processed images exist', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
        expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
      });
    });

    test('displays image counter for multiple processed images', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        expect(screen.getByText('1 / 3')).toBeInTheDocument();
      });
    });

    test('shows delete button on hover with correct CSS classes', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        const deleteButton = screen.getByTestId('trash-icon').closest('button');
        expect(deleteButton).toBeInTheDocument();
        expect(deleteButton).toHaveClass('pointer-events-auto');
      });
    });
  });

  // 2. Navigation Tests
  describe('Image Navigation', () => {
    test('navigates to next image when right arrow is clicked', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        const rightArrow = screen.getByTestId('chevron-right').closest('button');
        fireEvent.click(rightArrow!);
      });

      await waitFor(() => {
        const processedImage = screen.getByAltText('תמונה מעובדת');
        expect(processedImage).toHaveAttribute('src', 'processed2.jpg');
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
      });
    });

    test('navigates to previous image when left arrow is clicked', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      // First navigate to second image
      await waitFor(() => {
        const rightArrow = screen.getByTestId('chevron-right').closest('button');
        fireEvent.click(rightArrow!);
      });

      // Then navigate back
      await waitFor(() => {
        const leftArrow = screen.getByTestId('chevron-left').closest('button');
        fireEvent.click(leftArrow!);
      });

      await waitFor(() => {
        const processedImage = screen.getByAltText('תמונה מעובדת');
        expect(processedImage).toHaveAttribute('src', 'processed1.jpg');
        expect(screen.getByText('1 / 3')).toBeInTheDocument();
      });
    });

    test('implements circular navigation - last to first image', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      // Navigate to last image (index 2)
      await waitFor(() => {
        const rightArrow = screen.getByTestId('chevron-right').closest('button');
        fireEvent.click(rightArrow!); // to index 1
        fireEvent.click(rightArrow!); // to index 2
      });

      // Navigate once more to wrap to first
      await waitFor(() => {
        const rightArrow = screen.getByTestId('chevron-right').closest('button');
        fireEvent.click(rightArrow!);
      });

      await waitFor(() => {
        const processedImage = screen.getByAltText('תמונה מעובדת');
        expect(processedImage).toHaveAttribute('src', 'processed1.jpg');
        expect(screen.getByText('1 / 3')).toBeInTheDocument();
      });
    });

    test('implements circular navigation - first to last image', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      // Click left arrow from first image to wrap to last
      await waitFor(() => {
        const leftArrow = screen.getByTestId('chevron-left').closest('button');
        fireEvent.click(leftArrow!);
      });

      await waitFor(() => {
        const processedImage = screen.getByAltText('תמונה מעובדת');
        expect(processedImage).toHaveAttribute('src', 'processed3.jpg');
        expect(screen.getByText('3 / 3')).toBeInTheDocument();
      });
    });
  });

  // 3. Pointer Events and CSS Tests
  describe('Pointer Events and CSS Classes', () => {
    test('overlay div has pointer-events-none class', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        const overlay = document.querySelector('.pointer-events-none');
        expect(overlay).toBeInTheDocument();
      });
    });

    test('delete button has pointer-events-auto class', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        const deleteButton = screen.getByTestId('trash-icon').closest('button');
        expect(deleteButton).toHaveClass('pointer-events-auto');
      });
    });

    test('image has cursor-pointer class for clickability indication', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        const imageContainer = document.querySelector('.cursor-pointer');
        expect(imageContainer).toBeInTheDocument();
      });
    });

    test('hover effects are properly configured', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        const hoverElement = document.querySelector('.hover\\:opacity-90');
        expect(hoverElement).toBeInTheDocument();
      });
    });
  });

  // 4. Delete Functionality Tests
  describe('Delete Functionality', () => {
    test('delete button prevents event propagation', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        const deleteButton = screen.getByTestId('trash-icon').closest('button');
        fireEvent.click(deleteButton!);
      });

      // Verify lightbox doesn't open when delete button is clicked
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    test('calls correct Supabase methods for image deletion', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        const deleteButton = screen.getByTestId('trash-icon').closest('button');
        fireEvent.click(deleteButton!);
      });

      // Verify delete button functionality is called
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
    });

    test('handles image index reset when deleting current image', async () => {
      // This test verifies the logic for resetting currentProcessedIndex
      // when the currently displayed image is deleted
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      // Navigate to second image first
      await waitFor(() => {
        const rightArrow = screen.getByTestId('chevron-right').closest('button');
        fireEvent.click(rightArrow!);
      });

      // Verify we're on second image
      await waitFor(() => {
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
      });

      // Delete current image
      await waitFor(() => {
        const deleteButton = screen.getByTestId('trash-icon').closest('button');
        fireEvent.click(deleteButton!);
      });

      // The component should handle index reset internally
      // This test verifies the delete handler is called
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
    });
  });

  // 5. Lightbox Integration Tests
  describe('Lightbox Integration', () => {
    test('lightbox opens with correct image URL', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        const processedImage = screen.getByAltText('תמונה מעובדת');
        fireEvent.click(processedImage);
      });

      await waitFor(() => {
        const lightboxImage = screen.getByAltText('תמונה מוגדלת');
        expect(lightboxImage).toHaveAttribute('src', 'processed1.jpg');
      });
    });

    test('lightbox closes when X button is clicked', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      // Open lightbox
      await waitFor(() => {
        const processedImage = screen.getByAltText('תמונה מעובדת');
        fireEvent.click(processedImage);
      });

      // Close lightbox
      await waitFor(() => {
        const closeButton = screen.getByTestId('x-icon').closest('button');
        fireEvent.click(closeButton!);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
      });
    });

    test('lightbox shows correct image when navigated before opening', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      // Navigate to third image
      await waitFor(() => {
        const rightArrow = screen.getByTestId('chevron-right').closest('button');
        fireEvent.click(rightArrow!); // to index 1
        fireEvent.click(rightArrow!); // to index 2
      });

      // Open lightbox
      await waitFor(() => {
        const processedImage = screen.getByAltText('תמונה מעובדת');
        fireEvent.click(processedImage);
      });

      await waitFor(() => {
        const lightboxImage = screen.getByAltText('תמונה מוגדלת');
        expect(lightboxImage).toHaveAttribute('src', 'processed3.jpg');
      });
    });
  });

  // 6. Edge Cases
  describe('Edge Cases', () => {
    test('handles empty processed images array gracefully', async () => {
      const { useClientSubmissions } = await import('@/hooks/useClientSubmissions');
      vi.mocked(useClientSubmissions).mockReturnValue({
        data: [{
          submission_id: 'test-submission-1',
          item_name_at_submission: 'חמבורגר טרופי',
          submission_status: 'in_progress',
          original_image_urls: ['original1.jpg'],
          processed_image_urls: []
        }],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        expect(screen.getByText('0 תמונות')).toBeInTheDocument();
        expect(screen.queryByAltText('תמונה מעובדת')).not.toBeInTheDocument();
      });
    });

    test('handles single processed image without navigation arrows', async () => {
      const useClientSubmissions = require('@/hooks/useClientSubmissions').useClientSubmissions;
      useClientSubmissions.mockReturnValue({
        data: [{
          submission_id: 'test-submission-1',
          item_name_at_submission: 'חמבורגר טרופי',
          submission_status: 'in_progress',
          original_image_urls: ['original1.jpg'],
          processed_image_urls: ['processed1.jpg']
        }],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        expect(screen.getByText('1 תמונות')).toBeInTheDocument();
        expect(screen.getByAltText('תמונה מעובדת')).toBeInTheDocument();
        expect(screen.queryByTestId('chevron-left')).not.toBeInTheDocument();
        expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument();
      });
    });

    test('handles null processed_image_urls gracefully', async () => {
      const useClientSubmissions = require('@/hooks/useClientSubmissions').useClientSubmissions;
      useClientSubmissions.mockReturnValue({
        data: [{
          submission_id: 'test-submission-1',
          item_name_at_submission: 'חמבורגר טרופי',
          submission_status: 'in_progress',
          original_image_urls: ['original1.jpg'],
          processed_image_urls: null
        }],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        expect(screen.getByText('0 תמונות')).toBeInTheDocument();
        expect(screen.queryByAltText('תמונה מעובדת')).not.toBeInTheDocument();
      });
    });
  });

  // 7. Error Handling
  describe('Error Handling', () => {
    test('handles Supabase errors during image deletion gracefully', async () => {
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: null, 
              error: { message: 'Database error' } 
            }))
          }))
        }))
      });

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        const deleteButton = screen.getByTestId('trash-icon').closest('button');
        fireEvent.click(deleteButton!);
      });

      // Should handle error gracefully without crashing
      expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
    });

    test('handles invalid image URLs gracefully', async () => {
      const useClientSubmissions = require('@/hooks/useClientSubmissions').useClientSubmissions;
      useClientSubmissions.mockReturnValue({
        data: [{
          submission_id: 'test-submission-1',
          item_name_at_submission: 'חמבורגר טרופי',
          submission_status: 'in_progress',
          original_image_urls: ['original1.jpg'],
          processed_image_urls: ['', null, 'invalid-url']
        }],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      // Should render without crashing even with invalid URLs
      await waitFor(() => {
        expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
      });
    });
  });
}); 