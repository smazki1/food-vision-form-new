import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeadDetailPanel } from '../LeadDetailPanel';

// Mock the hooks
const mockConvertLeadToClient = vi.fn();
const mockUpdateLead = vi.fn();
const mockAddLeadComment = vi.fn();

// Mock all required hooks
vi.mock('@/hooks/useEnhancedLeads', () => ({
  useUpdateLead: () => ({
    mutateAsync: mockUpdateLead,
    isPending: false
  }),
  useAddLeadComment: () => ({
    mutateAsync: mockAddLeadComment,
    isPending: false
  }),
  useLeadById: () => ({
    data: mockLead,
    isLoading: false,
    error: null
  }),
  useLeadActivities: () => ({
    data: [],
    isLoading: false
  }),
  useLeadComments: () => ({
    data: [],
    isLoading: false
  })
}));

// Mock react-query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn()
    })
  };
});

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null })
        })
      })
    })
  }
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const mockLead = {
  lead_id: 'test-lead-id',
  restaurant_name: 'מסעדת הדוגמה',
  contact_name: 'ישראל ישראלי',
  email: 'test@example.com',
  phone: '050-1234567',
  website_url: 'https://example.com',
  address: 'תל אביב',
  business_type: 'מסעדה',
  lead_status: 'מעוניין',
  lead_source: 'אתר',
  notes: 'הערות ראשוניות על הליד',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  next_follow_up_date: '2025-01-10',
  ai_trainings_count: 0,
  ai_prompts_count: 0,
  total_ai_costs: 0,
  revenue_from_lead_local: 0,
  roi: 0
};

describe('Lead to Client Conversion', () => {
  let queryClient: QueryClient;
  const mockOnClose = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should allow lead status change to "הפך ללקוח"', async () => {
    renderWithQueryClient(
      <LeadDetailPanel leadId="test-lead-id" onClose={mockOnClose} />
    );

    // Find the status selector - wait for it to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('מעוניין')).toBeInTheDocument();
    });

    const statusSelect = screen.getByDisplayValue('מעוניין');

    // Change status to "הפך ללקוח"
    fireEvent.change(statusSelect, { target: { value: 'הפך ללקוח' } });
    fireEvent.blur(statusSelect);

    await waitFor(() => {
      expect(mockUpdateLead).toHaveBeenCalledWith({
        leadId: 'test-lead-id',
        updates: { lead_status: 'הפך ללקוח' }
      });
    });
  });

  it('should preserve lead notes during conversion', async () => {
    renderWithQueryClient(
      <LeadDetailPanel leadId="test-lead-id" onClose={mockOnClose} />
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('הערות ראשוניות על הליד')).toBeInTheDocument();
    });

    // Verify notes are displayed
    expect(screen.getByDisplayValue('הערות ראשוניות על הליד')).toBeInTheDocument();
  });

  it('should display consistent comments section interface', async () => {
    renderWithQueryClient(
      <LeadDetailPanel leadId="test-lead-id" onClose={mockOnClose} />
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('תגובות')).toBeInTheDocument();
    });

    // Check that comments section exists with direct input capability
    expect(screen.getByText('תגובות')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('הוסף תגובה חדשה...')).toBeInTheDocument();
    expect(screen.getByText('הוסף תגובה')).toBeInTheDocument();
  });

  it('should handle automatic archiving for "לא מעוניין" status', async () => {
    renderWithQueryClient(
      <LeadDetailPanel leadId="test-lead-id" onClose={mockOnClose} />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('מעוניין')).toBeInTheDocument();
    });

    const statusSelect = screen.getByDisplayValue('מעוניין');
    
    // Change status to "לא מעוניין" which should automatically archive
    fireEvent.change(statusSelect, { target: { value: 'לא מעוניין' } });
    fireEvent.blur(statusSelect);

    await waitFor(() => {
      expect(mockUpdateLead).toHaveBeenCalledWith({
        leadId: 'test-lead-id',
        updates: { lead_status: 'ארכיון' }
      });
    });
  });

  it('should handle error in status update gracefully', async () => {
    // Mock update failure
    mockUpdateLead.mockRejectedValueOnce(new Error('Update failed'));

    renderWithQueryClient(
      <LeadDetailPanel leadId="test-lead-id" onClose={mockOnClose} />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('מעוניין')).toBeInTheDocument();
    });

    const statusSelect = screen.getByDisplayValue('מעוניין');
    fireEvent.change(statusSelect, { target: { value: 'הפך ללקוח' } });
    fireEvent.blur(statusSelect);

    // The component should handle the error gracefully
    await waitFor(() => {
      expect(mockUpdateLead).toHaveBeenCalled();
    });
  });
}); 