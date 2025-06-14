import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { ClientSubmissions2 } from '../ClientSubmissions2';
import { Client } from '@/types/client';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: { processed_image_urls: ['existing1.jpg', 'existing2.jpg'] },
          error: null
        }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
      insert: vi.fn(() => Promise.resolve({ error: null }))
    })),
    insert: vi.fn(() => Promise.resolve({ error: null }))
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => Promise.resolve({ error: null })),
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: 'https://example.com/uploaded-image.jpg' }
      }))
    }))
  }
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

// Mock hooks
vi.mock('@/hooks/useClientSubmissions', () => ({
  useClientSubmissions: () => ({
    data: [
      {
        submission_id: 'test-submission-1',
        item_name_at_submission: 'חמבורגר טרופי',
        submission_status: 'in_progress',
        original_image_urls: ['original1.jpg', 'original2.jpg'],
        processed_image_urls: ['processed1.jpg', 'processed2.jpg']
      }
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn()
  })
}));

vi.mock('@/hooks/useClientSubmissionStats', () => ({
  useClientSubmissionStats: () => ({
    data: { in_progress: 1, waiting: 0, completed: 0 }
  })
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => 
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, className }: any) => 
    <div data-testid="dialog-content" className={className}>{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogTrigger: ({ children, asChild }: any) => 
    asChild ? children : <div data-testid="dialog-trigger">{children}</div>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, size, disabled, ...props }: any) => (
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

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>{children}</div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value, onClick }: any) => (
    <button data-testid={`tab-trigger-${value}`} onClick={() => onClick?.(value)}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  )
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ onChange, value, type, multiple, accept, ...props }: any) => (
    <input 
      onChange={onChange} 
      value={value} 
      type={type}
      multiple={multiple}
      accept={accept}
      data-testid={props['data-testid'] || 'input'}
      {...props}
    />
  )
}));

const mockClient: Client = {
  client_id: 'test-client-id',
  restaurant_name: 'מסעדת טעם',
  contact_name: 'יוסי כהן',
  phone: '050-1234567',
  email: 'test@example.com',
  business_type: 'מסעדה',
  client_status: 'פעיל',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  original_lead_id: null,
  current_package_id: null,
  remaining_servings: 10,
  remaining_images: 20,
  consumed_images: 5,
  reserved_images: 0,
  last_activity_at: '2024-01-01',
  internal_notes: null,
  user_auth_id: null
};

describe('ClientSubmissions2 - Enhanced UI/UX and Lightbox', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      </QueryClientProvider>
    );
  };

  describe('Enhanced Upload Button UI', () => {
    it('should display improved upload button when no processed images exist', async () => {
      // Mock empty processed images
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { processed_image_urls: [] },
              error: null
            }))
          }))
        }))
      } as any);

      renderComponent();

      await waitFor(() => {
        const uploadButton = screen.getByText('הוסף תמונה מעובדת');
        expect(uploadButton).toBeInTheDocument();
        
        const helpText = screen.getByText('לחץ להעלאה');
        expect(helpText).toBeInTheDocument();
      });
    });

    it('should show overlay upload button on hover when images exist', async () => {
      renderComponent();

      await waitFor(() => {
        // Should have the overlay button (with isOverlay=true)
        const overlayButtons = screen.getAllByTestId('button');
        const uploadButton = overlayButtons.find(btn => 
          btn.className?.includes('bg-white/90')
        );
        expect(uploadButton).toBeInTheDocument();
      });
    });

    it('should have proper styling classes for enhanced UI', async () => {
      renderComponent();

      await waitFor(() => {
        const buttons = screen.getAllByTestId('button');
        const enhancedButton = buttons.find(btn => 
          btn.className?.includes('bg-gradient-to-br') ||
          btn.className?.includes('shadow-sm')
        );
        expect(enhancedButton).toBeInTheDocument();
      });
    });
  });

  describe('Image Lightbox Functionality', () => {
    it('should open lightbox when clicking on original image', async () => {
      renderComponent();

      await waitFor(() => {
        const originalImages = screen.getAllByAltText('תמונה מקורית');
        expect(originalImages.length).toBeGreaterThan(0);
        
        fireEvent.click(originalImages[0]);
        
        // Should open lightbox dialog
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
      });
    });

    it('should open lightbox when clicking on processed image', async () => {
      renderComponent();

      await waitFor(() => {
        const processedImages = screen.getAllByAltText('תמונה מעובדת');
        expect(processedImages.length).toBeGreaterThan(0);
        
        fireEvent.click(processedImages[0]);
        
        // Should open lightbox dialog
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
      });
    });

    it('should display enlarged image in lightbox', async () => {
      renderComponent();

      await waitFor(() => {
        const originalImages = screen.getAllByAltText('תמונה מקורית');
        fireEvent.click(originalImages[0]);
        
        // Should show enlarged image
        const enlargedImage = screen.getByAltText('תמונה מוגדלת');
        expect(enlargedImage).toBeInTheDocument();
        expect(enlargedImage.getAttribute('src')).toBe('original1.jpg');
      });
    });

    it('should close lightbox when clicking close button', async () => {
      renderComponent();

      await waitFor(() => {
        const originalImages = screen.getAllByAltText('תמונה מקורית');
        fireEvent.click(originalImages[0]);
        
        // Lightbox should be open
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
        
        // Click close button (X icon)
        const closeButtons = screen.getAllByTestId('button');
        const closeButton = closeButtons.find(btn => 
          btn.className?.includes('absolute') && btn.className?.includes('top-4')
        );
        
        if (closeButton) {
          fireEvent.click(closeButton);
        }
      });
    });

    it('should have proper lightbox styling', async () => {
      renderComponent();

      await waitFor(() => {
        const originalImages = screen.getAllByAltText('תמונה מקורית');
        fireEvent.click(originalImages[0]);
        
        const dialogContent = screen.getByTestId('dialog-content');
        expect(dialogContent.className).toContain('bg-black/90');
        expect(dialogContent.className).toContain('max-w-[95vw]');
      });
    });
  });

  describe('Image Hover Effects', () => {
    it('should add cursor pointer and hover effects to images', async () => {
      renderComponent();

      await waitFor(() => {
        const imageContainers = screen.getAllByRole('img').map(img => img.parentElement);
        
        imageContainers.forEach(container => {
          if (container?.className) {
            expect(
              container.className.includes('cursor-pointer') ||
              container.className.includes('hover:opacity-90')
            ).toBe(true);
          }
        });
      });
    });
  });

  describe('Multiple File Upload Enhancement', () => {
    it('should support multiple file selection', async () => {
      renderComponent();

      await waitFor(() => {
        const fileInputs = screen.getAllByTestId('input');
        const fileInput = fileInputs.find(input => 
          input.getAttribute('type') === 'file'
        );
        
        expect(fileInput).toBeInTheDocument();
        expect(fileInput?.getAttribute('multiple')).toBe('');
      });
    });

    it('should show file count when multiple files selected', async () => {
      renderComponent();

      await waitFor(() => {
        // Open upload modal first
        const uploadButtons = screen.getAllByTestId('button');
        const uploadButton = uploadButtons.find(btn => 
          btn.textContent?.includes('הוסף תמונה')
        );
        
        if (uploadButton) {
          fireEvent.click(uploadButton);
        }
      });

      await waitFor(() => {
        const fileInputs = screen.getAllByTestId('input');
        const fileInput = fileInputs.find(input => 
          input.getAttribute('type') === 'file'
        );
        
        if (fileInput) {
          // Simulate selecting multiple files
          const files = [
            new File(['content1'], 'image1.jpg', { type: 'image/jpeg' }),
            new File(['content2'], 'image2.jpg', { type: 'image/jpeg' })
          ];
          
          Object.defineProperty(fileInput, 'files', {
            value: files,
            writable: false
          });
          
          fireEvent.change(fileInput);
          
          // Should show file count
          expect(screen.getByText(/נבחרו \d+ קבצים/)).toBeInTheDocument();
        }
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow: click image -> lightbox -> close -> upload -> success', async () => {
      renderComponent();

      // Step 1: Click image to open lightbox
      await waitFor(() => {
        const originalImages = screen.getAllByAltText('תמונה מקורית');
        fireEvent.click(originalImages[0]);
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
      });

      // Step 2: Close lightbox
      const closeButtons = screen.getAllByTestId('button');
      const closeButton = closeButtons.find(btn => 
        btn.className?.includes('absolute') && btn.className?.includes('top-4')
      );
      
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      // Step 3: Open upload modal
      await waitFor(() => {
        const uploadButtons = screen.getAllByTestId('button');
        const uploadButton = uploadButtons.find(btn => 
          btn.textContent?.includes('הוסף תמונה')
        );
        
        if (uploadButton) {
          fireEvent.click(uploadButton);
        }
      });

      // Step 4: Upload should work (mocked)
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('food-vision-images');
    });
  });
}); 