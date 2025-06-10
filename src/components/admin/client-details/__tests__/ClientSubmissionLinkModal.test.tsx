import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientSubmissionLinkModal } from '../ClientSubmissionLinkModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Client } from '@/types/client';

// Mock dependencies
vi.mock('@/integrations/supabase/client');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockSupabase = vi.mocked(supabase);
const mockToast = vi.mocked(toast);

const mockClient: Client = {
  client_id: 'client-123',
  restaurant_name: 'Test Restaurant',
  contact_name: 'John Doe',
  email: 'test@example.com',
  phone: '123-456-7890',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  remaining_servings: 10,
  remaining_images: 5,
  consumed_images: 0,
  reserved_images: 0,
  last_activity_at: '2024-01-01T00:00:00Z',
  internal_notes: null,
  user_auth_id: null,
  original_lead_id: null,
  client_status: 'פעיל',
  current_package_id: null,
  business_type: null,
  address: null,
  website_url: null,
  notes: null,
};

const mockSubmissions = [
  {
    submission_id: 'sub-1',
    client_id: 'other-client-1',
    lead_id: null,
    item_type: 'מנה',
    item_name_at_submission: 'פסטה',
    submission_status: 'ממתין לעיבוד',
    uploaded_at: '2024-01-02T10:00:00Z',
    original_image_urls: ['https://example.com/image1.jpg'],
  },
  {
    submission_id: 'sub-2',
    client_id: null,
    lead_id: 'lead-1',
    item_type: 'מנה',
    item_name_at_submission: 'סלט',
    submission_status: 'בעיבוד',
    uploaded_at: '2024-01-01T15:00:00Z',
    original_image_urls: ['https://example.com/image2.jpg'],
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
      {children}
    </QueryClientProvider>
  );
};

const setupMockSupabase = (data = mockSubmissions, error = null) => {
  mockSupabase.from = vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data, error })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({
        data: null,
        error: null,
      })),
    })),
  })) as any;
};

describe('ClientSubmissionLinkModal Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMockSupabase();
  });

  const renderModal = (props = {}) => {
    const defaultProps = {
      client: mockClient,
      isOpen: true,
      onClose: vi.fn(),
      onSuccess: vi.fn(),
      ...props,
    };

    return render(
      <ClientSubmissionLinkModal {...defaultProps} />,
      { wrapper: createWrapper() }
    );
  };

  describe('Happy Path Tests', () => {
    it('should render modal with correct title', () => {
      renderModal();
      expect(screen.getByText(`קשר הגשה קיימת ללקוח ${mockClient.restaurant_name}`)).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      renderModal();
      const loadingSpinner = document.querySelector('.animate-spin');
      expect(loadingSpinner).toBeInTheDocument();
    });

    it('should fetch and display submissions', async () => {
      renderModal();
      
      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
        expect(screen.getByText('סלט')).toBeInTheDocument();
      });
    });

    it('should show Hebrew RTL interface', () => {
      renderModal();
      expect(screen.getByText('חיפוש הגשות')).toBeInTheDocument();
      expect(screen.getByText('ביטול')).toBeInTheDocument();
    });

    it('should have disabled link button initially', async () => {
      renderModal();
      
      await waitFor(() => {
        const linkButton = screen.getByText('קשר הגשה ללקוח');
        expect(linkButton).toBeDisabled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty submissions', async () => {
      setupMockSupabase([], null);
      renderModal();
      
      await waitFor(() => {
        expect(screen.getByText('לא נמצאו הגשות זמינות לקישור')).toBeInTheDocument();
      });
    });

    it('should handle submissions without images', async () => {
      const submissionNoImages = [{
        ...mockSubmissions[0],
        original_image_urls: null,
      }];
      setupMockSupabase(submissionNoImages);

      renderModal();
      
      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
      });
    });

    it('should show +X indicator for many images', async () => {
      const submissionManyImages = [{
        ...mockSubmissions[0],
        original_image_urls: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg'],
      }];
      setupMockSupabase(submissionManyImages);

      renderModal();
      
      await waitFor(() => {
        expect(screen.getByText('+2')).toBeInTheDocument();
      });
    });

    it('should filter submissions by search', async () => {
      renderModal();
      
      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
        expect(screen.getByText('סלט')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('חפש לפי שם פריט, סוג או מזהה הגשה...');
      fireEvent.change(searchInput, { target: { value: 'פסטה' } });

      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
        expect(screen.queryByText('סלט')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch error', async () => {
      setupMockSupabase(null, { message: 'Fetch failed' });

      renderModal();
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('שגיאה בטעינת הגשות');
      });
    });

    it('should handle link error', async () => {
      mockSupabase.from = vi.fn((table) => {
        if (table === 'customer_submissions') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: [mockSubmissions[0]],
                  error: null,
                })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                data: null,
                error: { message: 'Update failed' },
              })),
            })),
          };
        }
        return {} as any;
      }) as any;

      renderModal();
      
      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
      });

      // Find and click submission card
      const submissionText = screen.getByText('פסטה');
      const submissionCard = submissionText.closest('[data-testid="submission-card"]') || 
                            submissionText.closest('div[role="button"]') ||
                            submissionText.closest('.cursor-pointer');
      
      if (submissionCard) {
        fireEvent.click(submissionCard);
        
        await waitFor(() => {
          const linkButton = screen.getByText('קשר הגשה ללקוח');
          expect(linkButton).not.toBeDisabled();
          fireEvent.click(linkButton);
        });

        await waitFor(() => {
          expect(mockToast.error).toHaveBeenCalledWith('שגיאה בקישור ההגשה: Update failed');
        });
      }
    });
  });

  describe('Integration Tests', () => {
    it('should complete successful link workflow', async () => {
      const onSuccess = vi.fn();
      const onClose = vi.fn();

      renderModal({ onSuccess, onClose });
      
      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
      });

      // Find submission card and click it
      const submissionText = screen.getByText('פסטה');
      const submissionCard = submissionText.closest('div[role="button"]') ||
                            submissionText.closest('.cursor-pointer') ||
                            submissionText.parentElement;
      
      if (submissionCard) {
        fireEvent.click(submissionCard);
        
        await waitFor(() => {
          const linkButton = screen.getByText('קשר הגשה ללקוח');
          expect(linkButton).not.toBeDisabled();
          fireEvent.click(linkButton);
        });

        await waitFor(() => {
          expect(mockToast.success).toHaveBeenCalledWith('ההגשה נקשרה בהצלחה ללקוח!');
          expect(onSuccess).toHaveBeenCalled();
          expect(onClose).toHaveBeenCalled();
        });
      }
    });

    it('should maintain scrollable container', () => {
      renderModal();
      const scrollContainer = document.querySelector('.h-\\[400px\\]');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('should handle modal open/close states', () => {
      const { rerender } = renderModal({ isOpen: false });
      
      expect(screen.queryByText('קשר הגשה קיימת ללקוח')).not.toBeInTheDocument();

      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <ClientSubmissionLinkModal
            client={mockClient}
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </QueryClientProvider>
      );

      expect(screen.getByText(`קשר הגשה קיימת ללקוח ${mockClient.restaurant_name}`)).toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    it('should handle search with no results', async () => {
      renderModal();
      
      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('חפש לפי שם פריט, סוג או מזהה הגשה...');
      fireEvent.change(searchInput, { target: { value: 'NonExistentItem' } });

      await waitFor(() => {
        expect(screen.getByText('לא נמצאו הגשות זמינות לקישור')).toBeInTheDocument();
      });
    });

    it('should clear search filter', async () => {
      renderModal();
      
      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
        expect(screen.getByText('סלט')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('חפש לפי שם פריט, סוג או מזהה הגשה...');
      
      // Apply filter
      fireEvent.change(searchInput, { target: { value: 'פסטה' } });
      await waitFor(() => {
        expect(screen.queryByText('סלט')).not.toBeInTheDocument();
      });

      // Clear filter
      fireEvent.change(searchInput, { target: { value: '' } });
      await waitFor(() => {
        expect(screen.getByText('סלט')).toBeInTheDocument();
      });
    });
  });
}); 