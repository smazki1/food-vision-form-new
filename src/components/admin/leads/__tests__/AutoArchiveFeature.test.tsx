import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { toast } from 'sonner';
import { EnhancedLeadsTable } from '../EnhancedLeadsTable';
import { LeadDetailPanel } from '../LeadDetailPanel';
import { Lead, LeadStatusEnum } from '@/types/lead';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock hooks
const mockUpdateLead = vi.fn();
const mockArchiveLead = vi.fn();
const mockRestoreLead = vi.fn();
const mockDeleteLead = vi.fn();
const mockConvertLead = vi.fn();

vi.mock('@/hooks/useEnhancedLeads', () => ({
  useUpdateLead: () => ({
    mutateAsync: mockUpdateLead,
    isPending: false
  }),
  useArchiveLead: () => ({
    mutateAsync: mockArchiveLead,
    isPending: false
  }),
  useRestoreLead: () => ({
    mutateAsync: mockRestoreLead,
    isPending: false
  }),
  useDeleteLead: () => ({
    mutateAsync: mockDeleteLead,
    isPending: false
  }),
  useDirectConvertLeadToClient: () => ({
    mutate: mockConvertLead,
    isPending: false
  })
}));

// Mock hooks for LeadDetailPanel
vi.mock('@/hooks/useLeads', () => ({
  useLeadById: () => ({
    data: mockLead,
    isLoading: false,
    error: null
  }),
  useUpdateLead: () => ({
    mutateAsync: mockUpdateLead,
    isPending: false
  }),
  useAddLeadComment: () => ({
    mutateAsync: vi.fn(),
    isPending: false
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

// We need to import the real QueryClient and QueryClientProvider
// and mock only specific hooks
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn()
    }),
    useQuery: () => ({
      data: [],
      isLoading: false,
      error: null
    })
  };
});

const mockLead: Lead = {
  lead_id: 'test-lead-1',
  id: 'test-lead-1',
  restaurant_name: 'Test Restaurant',
  contact_name: 'John Doe',
  phone: '123-456-7890',
  email: 'john@test.com',
  lead_status: 'ליד חדש',
  lead_source: 'אתר',
  notes: 'Test notes',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ai_trainings_count: 0,
  ai_training_cost_per_unit: 0,
  ai_prompts_count: 0,
  ai_prompt_cost_per_unit: 0,
  revenue_from_lead_local: 0,
  exchange_rate_at_conversion: 3.6,
  free_sample_package_active: false,
  business_type: 'מסעדה'
};

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

describe('Auto-Archive Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateLead.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('EnhancedLeadsTable Auto-Archive', () => {
    it('should automatically archive lead when status changed to "לא מעוניין"', async () => {
      const user = userEvent.setup();
      const mockOnLeadSelect = vi.fn();
      
      render(
        <EnhancedLeadsTable 
          leads={[mockLead]}
          onLeadSelect={mockOnLeadSelect}
          selectedLeadId={null}
          isArchiveView={false}
        />,
        { wrapper: createWrapper() }
      );

      // Find and click the dropdown menu for the lead
      const dropdownTrigger = screen.getByRole('button', { name: /פתח תפריט/i });
      await user.click(dropdownTrigger);

      // Look for the "לא מעוניין" status option in the dropdown
      const notInterestedOption = screen.getByText('לא מעוניין');
      await user.click(notInterestedOption);

      // Verify that updateLead was called with "ארכיון" instead of "לא מעוניין"
      await waitFor(() => {
        expect(mockUpdateLead).toHaveBeenCalledWith({
          leadId: 'test-lead-1',
          updates: { lead_status: LeadStatusEnum.ARCHIVED }
        });
      });

      // Verify the special auto-archive toast message
      expect(toast.success).toHaveBeenCalledWith('הליד סומן כ"לא מעוניין" והועבר לארכיון אוטומטית');
    });

    it('should NOT auto-archive when status changed to other statuses', async () => {
      const user = userEvent.setup();
      const mockOnLeadSelect = vi.fn();
      
      render(
        <EnhancedLeadsTable 
          leads={[mockLead]}
          onLeadSelect={mockOnLeadSelect}
          selectedLeadId={null}
          isArchiveView={false}
        />,
        { wrapper: createWrapper() }
      );

      // Find and click the dropdown menu for the lead
      const dropdownTrigger = screen.getByRole('button', { name: /פתח תפריט/i });
      await user.click(dropdownTrigger);

      // Look for another status option (e.g., "מעוניין")
      const interestedOption = screen.getByText('מעוניין');
      await user.click(interestedOption);

      // Verify that updateLead was called with the actual status, not archived
      await waitFor(() => {
        expect(mockUpdateLead).toHaveBeenCalledWith({
          leadId: 'test-lead-1',
          updates: { lead_status: LeadStatusEnum.INTERESTED }
        });
      });

      // Verify normal success message
      expect(toast.success).toHaveBeenCalledWith('סטטוס הליד עודכן בהצלחה');
    });
  });

  describe('LeadDetailPanel Auto-Archive', () => {
    it('should automatically archive lead when status changed to "לא מעוניין" in detail panel', async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();
      
      render(
        <LeadDetailPanel 
          leadId="test-lead-1"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('פרטי ליד - Test Restaurant')).toBeInTheDocument();
      });

      // Find the status select dropdown
      const statusSelect = screen.getByDisplayValue('ליד חדש');
      await user.click(statusSelect);

      // Select "לא מעוניין" from dropdown
      const notInterestedOption = screen.getByText('לא מעוניין');
      await user.click(notInterestedOption);

      // Verify that updateLead was called with "ארכיון" status
      await waitFor(() => {
        expect(mockUpdateLead).toHaveBeenCalledWith({
          leadId: 'test-lead-1',
          updates: { lead_status: 'ארכיון' }
        });
      });

      // Verify the special auto-archive toast message
      expect(toast.success).toHaveBeenCalledWith('הליד סומן כ"לא מעוניין" והועבר לארכיון אוטומטית');
    });

    it('should NOT auto-archive when other fields are updated in detail panel', async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();
      
      render(
        <LeadDetailPanel 
          leadId="test-lead-1"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('פרטי ליד - Test Restaurant')).toBeInTheDocument();
      });

      // Find and update the restaurant name field
      const restaurantNameInput = screen.getByDisplayValue('Test Restaurant');
      await user.clear(restaurantNameInput);
      await user.type(restaurantNameInput, 'Updated Restaurant Name');
      
      // Trigger blur event
      await user.click(document.body);

      // Verify that updateLead was called with restaurant_name update only
      await waitFor(() => {
        expect(mockUpdateLead).toHaveBeenCalledWith({
          leadId: 'test-lead-1',
          updates: { restaurant_name: 'Updated Restaurant Name' }
        });
      });

      // Should show normal success message
      expect(toast.success).toHaveBeenCalledWith('השדה נתונים עודכן בהצלחה');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully during auto-archive', async () => {
      const user = userEvent.setup();
      const mockOnLeadSelect = vi.fn();
      
      // Mock updateLead to throw an error
      mockUpdateLead.mockRejectedValueOnce(new Error('Database error'));
      
      render(
        <EnhancedLeadsTable 
          leads={[mockLead]}
          onLeadSelect={mockOnLeadSelect}
          selectedLeadId={null}
          isArchiveView={false}
        />,
        { wrapper: createWrapper() }
      );

      // Find and click the dropdown menu for the lead
      const dropdownTrigger = screen.getByRole('button', { name: /פתח תפריט/i });
      await user.click(dropdownTrigger);

      // Look for the "לא מעוניין" status option in the dropdown
      const notInterestedOption = screen.getByText('לא מעוניין');
      await user.click(notInterestedOption);

      // Verify error handling
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('שגיאה בעדכון סטטוס הליד');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should maintain existing functionality while adding auto-archive', async () => {
      const user = userEvent.setup();
      const mockOnLeadSelect = vi.fn();
      
      render(
        <EnhancedLeadsTable 
          leads={[mockLead]}
          onLeadSelect={mockOnLeadSelect}
          selectedLeadId={null}
          isArchiveView={false}
        />,
        { wrapper: createWrapper() }
      );

      // Verify table renders correctly
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      
      // Verify dropdown functionality still works
      const dropdownTrigger = screen.getByRole('button', { name: /פתח תפריט/i });
      await user.click(dropdownTrigger);
      
      // Should show status change options
      expect(screen.getByText('שינוי סטטוס')).toBeInTheDocument();
      expect(screen.getByText('לא מעוניין')).toBeInTheDocument();
      expect(screen.getByText('מעוניין')).toBeInTheDocument();
    });
  });
}); 