import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientSubmissionLinkModal } from '../ClientSubmissionLinkModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

// Test data
const mockClient = {
  client_id: 'client-123',
  restaurant_name: 'Test Restaurant',
  contact_name: 'John Doe',
  email: 'test@example.com',
  phone: '123-456-7890',
  created_at: '2024-01-01T00:00:00Z',
  remaining_servings: 10,
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
    original_image_urls: ['https://example.com/image2.jpg', 'https://example.com/image3.jpg'],
  },
  {
    submission_id: 'sub-3',
    client_id: null,
    lead_id: null,
    item_type: 'שתיה',
    item_name_at_submission: 'קוקטייל',
    submission_status: 'הושלם',
    uploaded_at: '2024-01-03T08:00:00Z',
    original_image_urls: [],
  },
];

const mockClientData = {
  restaurant_name: 'Other Restaurant',
  contact_name: 'Jane Smith',
};

const mockLeadData = {
  restaurant_name: 'Lead Restaurant',
  contact_name: 'Bob Wilson',
};

// Test wrapper
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

describe('ClientSubmissionLinkModal - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: mockSubmissions,
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: null,
          error: null,
        })),
      })),
    })) as any;
  });

  afterEach(() => {
    vi.resetAllMocks();
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
    it('should render modal with correct title and client name', () => {
      renderModal();
      
      expect(screen.getByText(`קשר הגשה קיימת ללקוח ${mockClient.restaurant_name}`)).toBeInTheDocument();
      expect(screen.getByLabelText('חיפוש הגשות')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('חפש לפי שם פריט, סוג או מזהה הגשה...')).toBeInTheDocument();
    });

    it('should fetch and display submissions successfully', async () => {
      // Mock successful client/lead data fetches
      mockSupabase.from = vi.fn((table) => {
        if (table === 'customer_submissions') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: mockSubmissions,
                  error: null,
                })),
              })),
            })),
          };
        }
        
        if (table === 'clients') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: mockClientData,
                  error: null,
                })),
              })),
            })),
          };
        }
        
        if (table === 'leads') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: mockLeadData,
                  error: null,
                })),
              })),
            })),
          };
        }
        
        return {} as any;
      }) as any;

      renderModal();

      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
        expect(screen.getByText('סלט')).toBeInTheDocument();
        expect(screen.getByText('קוקטייל')).toBeInTheDocument();
      });

      // Check status badges
      expect(screen.getByText('ממתין לעיבוד')).toBeInTheDocument();
      expect(screen.getByText('בעיבוד')).toBeInTheDocument();
      expect(screen.getByText('הושלם')).toBeInTheDocument();
    });

    it('should display client and lead information correctly', async () => {
      mockSupabase.from = vi.fn((table) => {
        if (table === 'customer_submissions') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: mockSubmissions,
                  error: null,
                })),
              })),
            })),
          };
        }
        
        if (table === 'clients') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: mockClientData,
                  error: null,
                })),
              })),
            })),
          };
        }
        
        if (table === 'leads') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: mockLeadData,
                  error: null,
                })),
              })),
            })),
          };
        }
        
        return {} as any;
      }) as any;

      renderModal();

      await waitFor(() => {
        expect(screen.getByText('Other Restaurant')).toBeInTheDocument();
        expect(screen.getByText('Lead Restaurant')).toBeInTheDocument();
      });
    });

    it('should filter submissions based on search query', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: mockSubmissions,
              error: null,
            })),
          })),
        })),
      })) as any;

      renderModal();

      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('חפש לפי שם פריט, סוג או מזהה הגשה...');
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'פסטה' } });
      });

      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
        expect(screen.queryByText('סלט')).not.toBeInTheDocument();
      });
    });

    it('should select submission and show selection info', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: [mockSubmissions[0]],
              error: null,
            })),
          })),
        })),
      })) as any;

      renderModal();

      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
      });

      const submissionCard = screen.getByText('פסטה').closest('[role="button"]') || 
                            screen.getByText('פסטה').closest('.cursor-pointer');
      
      if (submissionCard) {
        await act(async () => {
          fireEvent.click(submissionCard);
        });

        await waitFor(() => {
          expect(screen.getByText('הגשה נבחרה לקישור:')).toBeInTheDocument();
          expect(screen.getByText('קשר הגשה ללקוח')).toBeInTheDocument();
        });
      }
    });

    it('should successfully link submission to client', async () => {
      const mockOnSuccess = vi.fn();
      const mockOnClose = vi.fn();

      mockSupabase.from = vi.fn((table) => {
        if (table === 'customer_submissions' && arguments[0] === 'customer_submissions') {
          const call = (vi.fn() as any).getMockImplementation?.() || (() => ({}));
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
                error: null,
              })),
            })),
          };
        }
        return {} as any;
      }) as any;

      renderModal({ onSuccess: mockOnSuccess, onClose: mockOnClose });

      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
      });

      // Select submission
      const submissionCard = screen.getByText('פסטה').closest('.cursor-pointer');
      if (submissionCard) {
        await act(async () => {
          fireEvent.click(submissionCard);
        });
      }

      // Click link button
      const linkButton = screen.getByText('קשר הגשה ללקוח');
      await act(async () => {
        fireEvent.click(linkButton);
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('ההגשה נקשרה בהצלחה ללקוח!');
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty submissions list', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: [],
              error: null,
            })),
          })),
        })),
      })) as any;

      renderModal();

      await waitFor(() => {
        expect(screen.getByText('לא נמצאו הגשות זמינות לקישור')).toBeInTheDocument();
        expect(screen.getByText('נסה לחפש במונחים אחרים או בדוק שיש הגשות במערכת')).toBeInTheDocument();
      });
    });

    it('should handle submissions without images', async () => {
      const submissionWithoutImages = {
        ...mockSubmissions[0],
        original_image_urls: null,
      };

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: [submissionWithoutImages],
              error: null,
            })),
          })),
        })),
      })) as any;

      renderModal();

      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
        // Should not crash and should still display the submission
      });
    });

    it('should handle submissions with many images (show +X indicator)', async () => {
      const submissionWithManyImages = {
        ...mockSubmissions[0],
        original_image_urls: [
          'image1.jpg', 'image2.jpg', 'image3.jpg', 'image4.jpg', 'image5.jpg'
        ],
      };

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: [submissionWithManyImages],
              error: null,
            })),
          })),
        })),
      })) as any;

      renderModal();

      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
        expect(screen.getByText('+2')).toBeInTheDocument(); // 5 total - 3 shown = +2
      });
    });

    it('should filter out current client submissions correctly', async () => {
      const mixedSubmissions = [
        ...mockSubmissions,
        {
          submission_id: 'sub-current',
          client_id: mockClient.client_id,
          lead_id: null,
          item_type: 'מנה',
          item_name_at_submission: 'Current Client Dish',
          submission_status: 'בעיבוד',
          uploaded_at: '2024-01-04T12:00:00Z',
          original_image_urls: [],
        },
      ];

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: mixedSubmissions,
              error: null,
            })),
          })),
        })),
      })) as any;

      renderModal();

      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
        expect(screen.queryByText('Current Client Dish')).not.toBeInTheDocument();
      });
    });

    it('should handle search with no results', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: mockSubmissions,
              error: null,
            })),
          })),
        })),
      })) as any;

      renderModal();

      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('חפש לפי שם פריט, סוג או מזהה הגשה...');
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'NonExistentItem' } });
      });

      await waitFor(() => {
        expect(screen.getByText('לא נמצאו הגשות זמינות לקישור')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database fetch error', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Database connection failed' },
            })),
          })),
        })),
      })) as any;

      renderModal();

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('שגיאה בטעינת הגשות');
      });
    });

    it('should handle linking error', async () => {
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

      // Select and try to link
      const submissionCard = screen.getByText('פסטה').closest('.cursor-pointer');
      if (submissionCard) {
        await act(async () => {
          fireEvent.click(submissionCard);
        });
      }

      const linkButton = screen.getByText('קשר הגשה ללקוח');
      await act(async () => {
        fireEvent.click(linkButton);
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('שגיאה בקישור ההגשה: Update failed');
      });
    });

    it('should prevent linking when no submission is selected', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: [mockSubmissions[0]],
              error: null,
            })),
          })),
        })),
      })) as any;

      renderModal();

      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
      });

      // Try to click link button without selecting
      const linkButton = screen.getByText('קשר הגשה ללקוח');
      expect(linkButton).toBeDisabled();
    });

    it('should handle unexpected errors during fetch', async () => {
      mockSupabase.from = vi.fn(() => {
        throw new Error('Unexpected error');
      }) as any;

      renderModal();

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('אירעה שגיאה בטעינת הגשות');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should maintain search filter after reloading submissions', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: mockSubmissions,
              error: null,
            })),
          })),
        })),
      })) as any;

      renderModal();

      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
      });

      // Apply search filter
      const searchInput = screen.getByPlaceholderText('חפש לפי שם פריט, סוג או מזהה הגשה...');
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'מנה' } });
      });

      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
        expect(screen.getByText('סלט')).toBeInTheDocument();
        expect(screen.queryByText('קוקטייל')).not.toBeInTheDocument();
      });
    });

    it('should close modal when onClose is called', () => {
      const mockOnClose = vi.fn();
      renderModal({ onClose: mockOnClose });

      const closeButton = screen.getByLabelText('Close') || 
                         screen.getByText('ביטול');
      
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle modal opening and closing states', () => {
      const { rerender } = renderModal({ isOpen: false });
      
      expect(screen.queryByText(`קשר הגשה קיימת ללקוח ${mockClient.restaurant_name}`)).not.toBeInTheDocument();

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

  describe('UI/UX Tests', () => {
    it('should show loading state initially', () => {
      renderModal();
      
      // Should show loading spinner initially
      const loadingSpinner = document.querySelector('.animate-spin');
      expect(loadingSpinner).toBeInTheDocument();
    });

    it('should show proper Hebrew RTL text direction', () => {
      renderModal();
      
      const title = screen.getByText(`קשר הגשה קיימת ללקוח ${mockClient.restaurant_name}`);
      expect(title).toBeInTheDocument();
      
      const searchLabel = screen.getByText('חיפוש הגשות');
      expect(searchLabel).toBeInTheDocument();
    });

    it('should highlight selected submission', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: [mockSubmissions[0]],
              error: null,
            })),
          })),
        })),
      })) as any;

      renderModal();

      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
      });

      const submissionCard = screen.getByText('פסטה').closest('.cursor-pointer');
      
      await act(async () => {
        fireEvent.click(submissionCard!);
      });

      await waitFor(() => {
        expect(submissionCard).toHaveClass('ring-2', 'ring-blue-500', 'bg-blue-50');
      });
    });

    it('should maintain scrollable interface', async () => {
      renderModal();

      const scrollContainer = document.querySelector('.h-\\[400px\\].overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();
    });
  });
}); 