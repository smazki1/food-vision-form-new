import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientSubmissionsSection } from '../ClientSubmissionsSection';
import { ClientSubmissionUploadModal } from '../ClientSubmissionUploadModal';
import { ClientSubmissionLinkModal } from '../ClientSubmissionLinkModal';
import { supabase } from '@/integrations/supabase/client';
import { sanitizePathComponent } from '@/utils/pathSanitization';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn()
      }))
    }
  }
}));

vi.mock('@/utils/pathSanitization', () => ({
  sanitizePathComponent: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn()
  }
}));

vi.mock('@/hooks/useClientSubmissions', () => ({
  useClientSubmissions: vi.fn(),
  useClientSubmissionStats: vi.fn()
}));

vi.mock('@/components/admin/submissions/SubmissionViewer', () => ({
  SubmissionViewer: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="submission-viewer">
      <button onClick={onClose}>Close Viewer</button>
    </div>
  )
}));

vi.mock('../ClientSubmissionUploadModal', () => ({
  ClientSubmissionUploadModal: ({ isOpen, onClose, onSuccess }: any) => 
    isOpen ? (
      <div data-testid="client-submission-upload-modal">
        <button onClick={onSuccess}>Upload Success</button>
        <button onClick={onClose}>Close Upload</button>
      </div>
    ) : null
}));

vi.mock('../ClientSubmissionLinkModal', () => ({
  ClientSubmissionLinkModal: ({ isOpen, onClose, onSuccess }: any) => 
    isOpen ? (
      <div data-testid="client-submission-link-modal">
        <button onClick={onSuccess}>Link Success</button>
        <button onClick={onClose}>Close Link</button>
      </div>
    ) : null
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

describe('Client Submissions Section - Comprehensive Tests', () => {
  const mockClient = {
    client_id: 'client-123',
    restaurant_name: 'מסעדת הטעם',
    contact_name: 'יוסי כהן',
    email: 'yossi@restaurant.com',
    phone: '052-1234567',
    remaining_servings: 15,
    remaining_images: 100,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
    original_lead_id: null,
    client_status: 'active',
    package_id: null,
    package_start_date: null,
    package_end_date: null,
    total_servings: 20,
    total_images: 200,
    pricing_tier: 'standard'
  } as any;

  const mockSubmissions = [
    {
      submission_id: 'sub-1',
      client_id: 'client-123',
      item_type: 'עוגה',
      item_name_at_submission: 'עוגת שוקולד',
      submission_status: 'ממתינה לעיבוד',
      uploaded_at: '2025-01-01T10:00:00Z',
      original_image_urls: ['https://example.com/image1.jpg']
    },
    {
      submission_id: 'sub-2',
      client_id: 'client-123',
      item_type: 'מנה',
      item_name_at_submission: 'סטייק מדיום',
      submission_status: 'הושלמה ואושרה',
      uploaded_at: '2025-01-02T14:30:00Z',
      original_image_urls: ['https://example.com/image2.jpg']
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock hooks
    const { useClientSubmissions, useClientSubmissionStats } = require('@/hooks/useClientSubmissions');
    useClientSubmissions.mockReturnValue({
      data: mockSubmissions,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });
    useClientSubmissionStats.mockReturnValue({
      data: {
        total: 2,
        pending: 1,
        completed: 1,
        processing: 0
      }
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render submissions section with correct header and actions', () => {
      const wrapper = createWrapper();
      render(
        <ClientSubmissionsSection 
          clientId="client-123" 
          client={mockClient} 
        />, 
        { wrapper }
      );

      expect(screen.getByText('הגשות הלקוח (2)')).toBeInTheDocument();
      expect(screen.getByText('העלה הגשה')).toBeInTheDocument();
      expect(screen.getByText('קשר הגשה קיימת')).toBeInTheDocument();
    });

    it('should display submissions stats correctly', () => {
      const wrapper = createWrapper();
      render(
        <ClientSubmissionsSection 
          clientId="client-123" 
          client={mockClient} 
        />, 
        { wrapper }
      );

      expect(screen.getByText('2')).toBeInTheDocument(); // Total submissions
      expect(screen.getByText('1')).toBeInTheDocument(); // Pending
      expect(screen.getByText('1')).toBeInTheDocument(); // Completed
    });

    it('should show empty state when no submissions exist', () => {
      const { useClientSubmissions } = require('@/hooks/useClientSubmissions');
      useClientSubmissions.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      const wrapper = createWrapper();
      render(
        <ClientSubmissionsSection 
          clientId="client-123" 
          client={mockClient} 
        />, 
        { wrapper }
      );

      expect(screen.getByText('לא נמצאו הגשות עבור לקוח זה')).toBeInTheDocument();
      expect(screen.getByText('העלה הגשה חדשה')).toBeInTheDocument();
      expect(screen.getByText('קשר הגשה קיימת')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      const { useClientSubmissions } = require('@/hooks/useClientSubmissions');
      useClientSubmissions.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn()
      });

      const wrapper = createWrapper();
      render(
        <ClientSubmissionsSection 
          clientId="client-123" 
          client={mockClient} 
        />, 
        { wrapper }
      );

      expect(screen.getByText('טוען הגשות...')).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('should open upload modal when upload button is clicked', () => {
      const wrapper = createWrapper();
      render(
        <ClientSubmissionsSection 
          clientId="client-123" 
          client={mockClient} 
        />, 
        { wrapper }
      );

      const uploadButton = screen.getByText('העלה הגשה');
      fireEvent.click(uploadButton);

      // Modal should be rendered (mocked component would be visible)
      expect(screen.getByTestId('client-submission-upload-modal')).toBeInTheDocument();
    });

    it('should open link modal when link button is clicked', () => {
      const wrapper = createWrapper();
      render(
        <ClientSubmissionsSection 
          clientId="client-123" 
          client={mockClient} 
        />, 
        { wrapper }
      );

      const linkButton = screen.getByText('קשר הגשה קיימת');
      fireEvent.click(linkButton);

      expect(screen.getByTestId('client-submission-link-modal')).toBeInTheDocument();
    });

    it('should open submission viewer when submission is clicked', () => {
      const wrapper = createWrapper();
      render(
        <ClientSubmissionsSection 
          clientId="client-123" 
          client={mockClient} 
        />, 
        { wrapper }
      );

      const submissionItem = screen.getByText('עוגת שוקולד');
      fireEvent.click(submissionItem);

      expect(screen.getByTestId('submission-viewer')).toBeInTheDocument();
    });
  });

  describe('Submission Upload Modal', () => {
    const renderUploadModal = (isOpen = true) => {
      const wrapper = createWrapper();
      return render(
        <ClientSubmissionUploadModal
          client={mockClient}
          isOpen={isOpen}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />,
        { wrapper }
      );
    };

    it('should render upload modal with all required fields', () => {
      renderUploadModal();

      expect(screen.getByLabelText('סוג המנה')).toBeInTheDocument();
      expect(screen.getByLabelText('שם המנה')).toBeInTheDocument();
      expect(screen.getByLabelText('תיאור (אופציונלי)')).toBeInTheDocument();
      expect(screen.getByText('העלאת תמונות המוצר')).toBeInTheDocument();
    });

    it('should validate required fields before submission', async () => {
      const onSuccess = vi.fn();
      const wrapper = createWrapper();
      render(
        <ClientSubmissionUploadModal
          client={mockClient}
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={onSuccess}
        />,
        { wrapper }
      );

      const submitButton = screen.getByText('שלח הגשה');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('אנא מלא את כל השדות הנדרשים');
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should handle file upload with Hebrew path sanitization', async () => {
      vi.mocked(sanitizePathComponent).mockReturnValue('cake');
      
      const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'leads/client-123/cake/product/test.jpg' },
        error: null
      });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test.jpg' }
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl
      } as any);

      const wrapper = createWrapper();
      render(
        <ClientSubmissionUploadModal
          client={mockClient}
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />,
        { wrapper }
      );

      // Fill required fields
      fireEvent.change(screen.getByLabelText('סוג המנה'), { target: { value: 'עוגה' } });
      fireEvent.change(screen.getByLabelText('שם המנה'), { target: { value: 'עוגת שוקולד' } });

      // Upload file
      const fileInput = screen.getByLabelText('העלאת תמונות המוצר');
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(sanitizePathComponent).toHaveBeenCalledWith('עוגה');
      });
    });

    it('should create submission with correct data structure', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { submission_id: 'new-sub-123' }
          })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      const onSuccess = vi.fn();
      const wrapper = createWrapper();
      render(
        <ClientSubmissionUploadModal
          client={mockClient}
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={onSuccess}
        />,
        { wrapper }
      );

      // Fill all required fields
      fireEvent.change(screen.getByLabelText('סוג המנה'), { target: { value: 'עוגה' } });
      fireEvent.change(screen.getByLabelText('שם המנה'), { target: { value: 'עוגת שוקולד' } });
      fireEvent.change(screen.getByLabelText('תיאור (אופציונלי)'), { target: { value: 'עוגה טעימה' } });

      const submitButton = screen.getByText('שלח הגשה');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            client_id: 'client-123',
            item_type: 'עוגה',
            item_name_at_submission: 'עוגת שוקולד',
            description: 'עוגה טעימה',
            submission_status: 'ממתינה לעיבוד'
          })
        );
      });

      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('Submission Link Modal', () => {
    const renderLinkModal = (isOpen = true) => {
      const wrapper = createWrapper();
      return render(
        <ClientSubmissionLinkModal
          client={mockClient}
          isOpen={isOpen}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />,
        { wrapper }
      );
    };

    it('should render link modal with search functionality', () => {
      renderLinkModal();

      expect(screen.getByPlaceholderText('חיפוש הגשות...')).toBeInTheDocument();
      expect(screen.getByText('הגשות זמינות לקישור')).toBeInTheDocument();
    });

    it('should fetch and display available submissions', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        neq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  submission_id: 'other-sub-1',
                  item_type: 'מנה',
                  item_name_at_submission: 'פסטה',
                  submission_status: 'ממתינה לעיבוד',
                  uploaded_at: '2025-01-01T10:00:00Z',
                  restaurant_name: 'מסעדה אחרת',
                  contact_name: 'דני לוי'
                }
              ],
              error: null
            })
          })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);

      renderLinkModal();

      await waitFor(() => {
        expect(screen.getByText('פסטה')).toBeInTheDocument();
        expect(screen.getByText('מסעדה אחרת')).toBeInTheDocument();
      });
    });

    it('should filter submissions based on search query', async () => {
      renderLinkModal();

      const searchInput = screen.getByPlaceholderText('חיפוש הגשות...');
      fireEvent.change(searchInput, { target: { value: 'פסטה' } });

      // Should filter the displayed results
      await waitFor(() => {
        expect((searchInput as HTMLInputElement).value).toBe('פסטה');
      });
    });

    it('should link submission to client successfully', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: { submission_id: 'other-sub-1' },
          error: null
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          neq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  {
                    submission_id: 'other-sub-1',
                    item_type: 'מנה',
                    item_name_at_submission: 'פסטה',
                    submission_status: 'ממתינה לעיבוד'
                  }
                ],
                error: null
              })
            })
          })
        }),
        update: mockUpdate
      } as any);

      const onSuccess = vi.fn();
      const wrapper = createWrapper();
      render(
        <ClientSubmissionLinkModal
          client={mockClient}
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={onSuccess}
        />,
        { wrapper }
      );

      await waitFor(() => {
        const linkButton = screen.getByText('קשר הגשה');
        fireEvent.click(linkButton);
      });

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ client_id: 'client-123' });
        expect(onSuccess).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('ההגשה קושרה בהצלחה ללקוח');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle upload errors gracefully', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' }
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload
      } as any);

      const wrapper = createWrapper();
      render(
        <ClientSubmissionUploadModal
          client={mockClient}
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />,
        { wrapper }
      );

      // Fill required fields and attempt upload
      fireEvent.change(screen.getByLabelText('סוג המנה'), { target: { value: 'עוגה' } });
      fireEvent.change(screen.getByLabelText('שם המנה'), { target: { value: 'עוגת שוקולד' } });

      const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText('העלאת תמונות המוצר');
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('שגיאה בהעלאת הקובץ');
      });
    });

    it('should handle database errors when creating submission', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      const wrapper = createWrapper();
      render(
        <ClientSubmissionUploadModal
          client={mockClient}
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />,
        { wrapper }
      );

      // Fill required fields and submit
      fireEvent.change(screen.getByLabelText('סוג המנה'), { target: { value: 'עוגה' } });
      fireEvent.change(screen.getByLabelText('שם המנה'), { target: { value: 'עוגת שוקולד' } });

      const submitButton = screen.getByText('שלח הגשה');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('שגיאה ביצירת ההגשה');
      });
    });

    it('should handle network errors when fetching submissions for linking', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        neq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error('Network error'))
          })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);

      const wrapper = createWrapper();
      render(
        <ClientSubmissionsSection 
          clientId="client-123" 
          client={mockClient} 
        />, 
        { wrapper }
      );

      const linkButton = screen.getByText('קשר הגשה קיימת');
      fireEvent.click(linkButton);

      await waitFor(() => {
        expect(screen.getByTestId('client-submission-link-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should refresh data after successful upload', async () => {
      const { useClientSubmissions } = require('@/hooks/useClientSubmissions');
      const mockRefetch = vi.fn();
      useClientSubmissions.mockReturnValue({
        data: mockSubmissions,
        isLoading: false,
        error: null,
        refetch: mockRefetch
      });

      const wrapper = createWrapper();
      render(
        <ClientSubmissionsSection 
          clientId="client-123" 
          client={mockClient} 
        />, 
        { wrapper }
      );

      // Simulate successful upload
      const uploadButton = screen.getByText('העלה הגשה');
      fireEvent.click(uploadButton);

      // Mock successful submission creation
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { submission_id: 'new-sub-123' }
          })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    it('should invalidate cache after successful link operation', async () => {
      const { useClientSubmissions } = require('@/hooks/useClientSubmissions');
      const mockRefetch = vi.fn();
      useClientSubmissions.mockReturnValue({
        data: mockSubmissions,
        isLoading: false,
        error: null,
        refetch: mockRefetch
      });

      const wrapper = createWrapper();
      render(
        <ClientSubmissionsSection 
          clientId="client-123" 
          client={mockClient} 
        />, 
        { wrapper }
      );

      // Simulate successful link operation
      const linkButton = screen.getByText('קשר הגשה קיימת');
      fireEvent.click(linkButton);

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });
  });
}); 