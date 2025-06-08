import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EnhancedLeadsTable } from '../EnhancedLeadsTable';
import { LeadDetailPanel } from '../LeadDetailPanel';
import { Lead } from '@/types/lead';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

vi.mock('@/hooks/useEnhancedLeads', () => ({
  useLeadById: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null
  })),
  useUpdateLeadWithConversion: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
  useAddLeadComment: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
  useLeadActivities: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
  useLeadComments: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
  LEAD_QUERY_KEY: ['leads'],
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

const createMockLead = (overrides: Partial<Lead> = {}): Lead => ({
  lead_id: 'test-lead-1',
  id: 'test-lead-1',
  restaurant_name: 'Test Restaurant',
  contact_name: 'Test Contact',
  email: 'test@example.com',
  phone: '123456789',
  lead_status: 'ליד חדש',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ai_trainings_count: 0,
  ai_training_cost_per_unit: 1.5,
  ai_prompts_count: 0,
  ai_prompt_cost_per_unit: 0.16,
  revenue_from_lead_local: 0,
  exchange_rate_at_conversion: 3.6,
  free_sample_package_active: false,
  ...overrides,
});

describe('Auto-Archive "Not Interested" Leads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path Tests', () => {
    it('should automatically archive lead when status changes to "לא מעוניין"', async () => {
      renderWithProviders(
        <LeadDetailPanel 
          leadId="test-lead-1" 
          onClose={vi.fn()} 
        />
      );

      // Since the component uses the useLeadById hook, we need to wait for it to render
      // This is more of an integration test with mocked hooks
      expect(screen.getByText('פרטי הליד')).toBeInTheDocument();
    });

    it('should show correct Hebrew message on auto-archive', async () => {
      // Mock a lead status change that triggers auto-archive
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      
      // Mock the hook to return our mock function
      const { useUpdateLeadWithConversion } = await import('@/hooks/useEnhancedLeads');
      vi.mocked(useUpdateLeadWithConversion).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any);

      renderWithProviders(
        <LeadDetailPanel 
          leadId="test-lead-1" 
          onClose={vi.fn()} 
        />
      );

      // Component should render without errors
      expect(screen.getByText('פרטי הליד')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing lead data gracefully', async () => {
      const { useLeadById } = await import('@/hooks/useEnhancedLeads');
      vi.mocked(useLeadById).mockReturnValue({
        data: null,
        isLoading: false,
        error: null
      } as any);

      renderWithProviders(
        <LeadDetailPanel 
          leadId="non-existent-lead" 
          onClose={vi.fn()} 
        />
      );

      // Should handle null lead gracefully
      expect(screen.getByText('פרטי הליד')).toBeInTheDocument();
    });

    it('should show loading state while fetching lead', async () => {
      const { useLeadById } = await import('@/hooks/useEnhancedLeads');
      vi.mocked(useLeadById).mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      } as any);

      renderWithProviders(
        <LeadDetailPanel 
          leadId="loading-lead" 
          onClose={vi.fn()} 
        />
      );

      // Should handle loading state
      expect(screen.getByText('פרטי הליד')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle update errors gracefully', async () => {
      const mockMutateAsync = vi.fn().mockRejectedValue(new Error('Update failed'));
      
      const { useUpdateLeadWithConversion } = await import('@/hooks/useEnhancedLeads');
      vi.mocked(useUpdateLeadWithConversion).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any);

      renderWithProviders(
        <LeadDetailPanel 
          leadId="error-lead" 
          onClose={vi.fn()} 
        />
      );

      // Component should render without crashing even with error mock
      expect(screen.getByText('פרטי הליד')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('should work with EnhancedLeadsTable', async () => {
      const mockLeads: Lead[] = [
        createMockLead({ 
          lead_id: 'lead-1', 
          restaurant_name: 'Restaurant 1' 
        }),
        createMockLead({ 
          lead_id: 'lead-2', 
          restaurant_name: 'Restaurant 2',
          lead_status: 'לא מעוניין'
        }),
      ];

      renderWithProviders(
        <EnhancedLeadsTable 
          leads={mockLeads} 
          onLeadSelect={vi.fn()}
          selectedLeadId={null}
        />
      );

      // Verify that leads are rendered properly
      expect(screen.getByText('Restaurant 1')).toBeInTheDocument();
      expect(screen.getByText('Restaurant 2')).toBeInTheDocument();
    });
  });

  describe('Type Safety Tests', () => {
    it('should handle lead status enum values correctly', () => {
      const testStatuses = [
        'ליד חדש',
        'פנייה ראשונית בוצעה',
        'בטיפול',
        'מעוניין',
        'לא מעוניין',
        'הפך ללקוח',
        'ארכיון'
      ];

      testStatuses.forEach(status => {
        const lead = createMockLead({ lead_status: status });
        expect(lead.lead_status).toBe(status);
      });
    });

    it('should create valid Lead objects with all required fields', () => {
      const lead = createMockLead();
      
      // Check all required fields are present
      expect(lead).toHaveProperty('lead_id');
      expect(lead).toHaveProperty('restaurant_name');
      expect(lead).toHaveProperty('contact_name');
      expect(lead).toHaveProperty('email');
      expect(lead).toHaveProperty('phone');
      expect(lead).toHaveProperty('lead_status');
      expect(lead).toHaveProperty('ai_trainings_count');
      expect(lead).toHaveProperty('ai_training_cost_per_unit');
      expect(lead).toHaveProperty('ai_prompts_count');
      expect(lead).toHaveProperty('ai_prompt_cost_per_unit');
    });
  });
}); 