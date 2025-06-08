import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Test component imports
import { LeadDetailPanel } from '../LeadDetailPanel';

// Mock data
const mockLead = {
  lead_id: 'test-lead-id',
  id: 'test-lead-id', // Alias for lead_id
  restaurant_name: 'מסעדת הבדיקה',
  contact_name: 'ישראל ישראלי',
  email: 'test@example.com',
  phone: '050-1234567',
  website_url: 'https://example.com',
  address: 'תל אביב',
  business_type: 'מסעדה',
  lead_status: 'מעוניין',
  lead_source: 'אתר',
  notes: 'הערות ליד ראשוניות',
  created_at: '2025-01-01T10:00:00Z',
  updated_at: '2025-01-01T10:00:00Z',
  next_follow_up_date: '2025-01-10',
  ai_trainings_count: 0,
  ai_training_cost_per_unit: 0,
  ai_prompts_count: 0,
  ai_prompt_cost_per_unit: 0,
  total_ai_costs: 0,
  revenue_from_lead_local: 0,
  exchange_rate_at_conversion: 1,
  free_sample_package_active: false,
  roi: 0
};

const mockActivities = [
  {
    activity_id: 'activity-1',
    lead_id: 'test-lead-id',
    activity_timestamp: '2025-01-01T10:00:00Z',
    activity_description: 'ליד נוצר מהאתר',
    user_id: 'user-1'
  }
];

const mockComments = [
  {
    comment_id: 'comment-1',
    lead_id: 'test-lead-id',
    comment_text: 'תגובה ראשונה',
    created_at: '2025-01-01T12:00:00Z',
    user_id: 'user-1'
  }
];

// Mocked hooks
const mockUpdateLead = vi.fn();
const mockAddLeadComment = vi.fn();

vi.mock('@/hooks/useEnhancedLeads', () => ({
  useUpdateLead: () => ({
    mutateAsync: mockUpdateLead,
    isPending: false
  }),
  useUpdateLeadWithConversion: () => ({
    mutateAsync: mockUpdateLead,
    isPending: false
  }),
  useAddLeadComment: () => ({
    mutateAsync: mockAddLeadComment,
    isPending: false
  }),
  useLeadById: vi.fn(() => ({
    data: mockLead,
    isLoading: false,
    error: null
  })),
  useLeadActivities: vi.fn(() => ({
    data: mockActivities,
    isLoading: false
  })),
  useLeadComments: vi.fn(() => ({
    data: mockComments,
    isLoading: false
  }))
}));

describe('Lead to Client Conversion Tests', () => {
  let queryClient: QueryClient;
  const mockOnClose = vi.fn();
  const user = userEvent.setup();

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
        <LeadDetailPanel leadId="test-lead-id" onClose={mockOnClose} />
      </QueryClientProvider>
    );
  };

  describe('Happy Path Tests', () => {
    it('should display lead information correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('מסעדת הבדיקה')).toBeInTheDocument();
        expect(screen.getByDisplayValue('ישראל ישראלי')).toBeInTheDocument();
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('מעוניין')).toBeInTheDocument();
      });
    });

    it('should successfully convert lead status to "הפך ללקוח"', async () => {
      const { toast } = await import('sonner');
      mockUpdateLead.mockResolvedValueOnce({ success: true });
      
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('מעוניין')).toBeInTheDocument();
      });

      const statusSelect = screen.getByDisplayValue('מעוניין');
      await user.selectOptions(statusSelect, 'הפך ללקוח');

      await waitFor(() => {
        expect(mockUpdateLead).toHaveBeenCalledWith({
          leadId: 'test-lead-id',
          updates: { lead_status: 'הפך ללקוח' }
        });
      });

      expect(toast.success).toHaveBeenCalledWith('הליד הומר ללקוח בהצלחה והמערכת עודכנה!');
    });

    it('should add new comment successfully', async () => {
      const { toast } = await import('sonner');
      mockAddLeadComment.mockResolvedValueOnce({ success: true });
      
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('הוסף תגובה חדשה...')).toBeInTheDocument();
      });

      const commentInput = screen.getByPlaceholderText('הוסף תגובה חדשה...');
      const submitButton = screen.getByText('הוסף תגובה');

      await user.type(commentInput, 'תגובה חדשה לבדיקה');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddLeadComment).toHaveBeenCalledWith({
          leadId: 'test-lead-id',
          comment: 'תגובה חדשה לבדיקה'
        });
      });

      expect(toast.success).toHaveBeenCalledWith('התגובה נוספה בהצלחה');
    });
  });

  describe('Edge Cases', () => {
    it('should handle lead with empty notes', async () => {
      const leadWithoutNotes = { ...mockLead, notes: '' };
      
             const { useLeadById } = await import('@/hooks/useEnhancedLeads');
       vi.mocked(useLeadById).mockReturnValueOnce({
         data: leadWithoutNotes,
         isLoading: false,
         isError: false,
         isPending: false,
         error: null,
         isSuccess: true,
         status: 'success'
       } as any);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('מסעדת הבדיקה')).toBeInTheDocument();
      });
    });

    it('should handle empty comment submission', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('הוסף תגובה')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('הוסף תגובה');
      await user.click(submitButton);

      expect(mockAddLeadComment).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle conversion failure', async () => {
      const { toast } = await import('sonner');
      mockUpdateLead.mockRejectedValueOnce(new Error('Database error'));
      
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('מעוניין')).toBeInTheDocument();
      });

      const statusSelect = screen.getByDisplayValue('מעוניין');
      await user.selectOptions(statusSelect, 'הפך ללקוח');

      await waitFor(() => {
        expect(mockUpdateLead).toHaveBeenCalled();
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('שגיאה בעדכון השדה')
      );
    });

    it('should handle comment submission failure', async () => {
      const { toast } = await import('sonner');
      mockAddLeadComment.mockRejectedValueOnce(new Error('Failed to add comment'));
      
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('הוסף תגובה חדשה...')).toBeInTheDocument();
      });

      const commentInput = screen.getByPlaceholderText('הוסף תגובה חדשה...');
      const submitButton = screen.getByText('הוסף תגובה');

      await user.type(commentInput, 'תגובה שתיכשל');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddLeadComment).toHaveBeenCalled();
      });

      expect(toast.error).toHaveBeenCalledWith('שגיאה בהוספת התגובה');
    });
  });
}); 