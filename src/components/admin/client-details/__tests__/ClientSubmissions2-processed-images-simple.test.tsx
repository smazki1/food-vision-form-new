import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { ClientSubmissions2 } from '../ClientSubmissions2';

// Mock all dependencies with simple implementations
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
  Image: () => <div data-testid="image-icon" />,
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

describe('ClientSubmissions2 - Processed Images Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Basic Rendering Tests
  describe('Basic Rendering', () => {
    test('renders processed images section', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
      });
    });

    test('displays correct image count', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        expect(screen.getByText('3 תמונות')).toBeInTheDocument();
      });
    });

    test('displays processed image with correct alt text', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        expect(screen.getByAltText('תמונה מעובדת')).toBeInTheDocument();
      });
    });
  });

  // 2. Navigation Tests
  describe('Navigation Controls', () => {
    test('shows navigation arrows for multiple images', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
        expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
      });
    });

    test('displays image counter', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        expect(screen.getByText('1 / 3')).toBeInTheDocument();
      });
    });

    test('navigation arrows are clickable', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        const rightArrow = screen.getByTestId('chevron-right').closest('button');
        expect(rightArrow).toBeInTheDocument();
        
        fireEvent.click(rightArrow!);
        // Navigation should work without errors
      });
    });
  });

  // 3. Interaction Tests
  describe('User Interactions', () => {
    test('processed image is clickable', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        const processedImage = screen.getByAltText('תמונה מעובדת');
        fireEvent.click(processedImage);
        // Click should work without errors
      });
    });

    test('delete button is present and clickable', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        const deleteButton = screen.getByTestId('trash-icon').closest('button');
        expect(deleteButton).toBeInTheDocument();
        
        fireEvent.click(deleteButton!);
        // Delete click should work without errors
      });
    });
  });

  // 4. CSS Classes Tests
  describe('CSS Classes and Styling', () => {
    test('has pointer-events-none class on overlay', async () => {
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

    test('has cursor-pointer class for clickability', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        const imageContainer = document.querySelector('.cursor-pointer');
        expect(imageContainer).toBeInTheDocument();
      });
    });

    test('has hover effects configured', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        const hoverElement = document.querySelector('.hover\\:opacity-90');
        expect(hoverElement).toBeInTheDocument();
      });
    });
  });

  // 5. Component Integration Tests
  describe('Component Integration', () => {
    test('renders without crashing', async () => {
      expect(() => {
        renderWithQueryClient(
          <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
        );
      }).not.toThrow();
    });

    test('handles component state updates', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        // Component should render and update state without errors
        expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
        
        // Test state change through navigation
        const rightArrow = screen.getByTestId('chevron-right').closest('button');
        fireEvent.click(rightArrow!);
        
        // Should handle state change gracefully
        expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
      });
    });

    test('maintains component stability during interactions', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        // Test multiple interactions
        const processedImage = screen.getByAltText('תמונה מעובדת');
        const deleteButton = screen.getByTestId('trash-icon').closest('button');
        const rightArrow = screen.getByTestId('chevron-right').closest('button');

        // Multiple clicks should not break the component
        fireEvent.click(processedImage);
        fireEvent.click(rightArrow!);
        fireEvent.click(deleteButton!);
        
        // Component should still be functional
        expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
      });
    });
  });

  // 6. Error Resilience Tests
  describe('Error Resilience', () => {
    test('handles missing elements gracefully', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        // Component should render even if some elements are missing
        expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
      });
    });

    test('maintains functionality with rapid interactions', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      await waitFor(() => {
        const rightArrow = screen.getByTestId('chevron-right').closest('button');
        
        // Rapid clicks should not break functionality
        fireEvent.click(rightArrow!);
        fireEvent.click(rightArrow!);
        fireEvent.click(rightArrow!);
        
        expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
      });
    });
  });
}); 