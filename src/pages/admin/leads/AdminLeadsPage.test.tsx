
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminLeadsPage from '../LeadsManagement';
import { LeadStatusEnum, LeadSourceEnum, Lead } from '@/types/lead';

// Mock the hooks
vi.mock('@/hooks/useEnhancedLeads', () => ({
  useEnhancedLeads: vi.fn(() => ({
    data: { data: mockLeads, total: mockLeads.length },
    isLoading: false,
    error: null
  })),
  useCreateLead: vi.fn(() => ({
    mutateAsync: vi.fn()
  })),
  useUpdateLead: vi.fn(() => ({
    mutateAsync: vi.fn()
  })),
  useDeleteLead: vi.fn(() => ({
    mutateAsync: vi.fn()
  }))
}));

const mockLeads: Lead[] = [
  {
    lead_id: '1',
    restaurant_name: 'Test Restaurant 1',
    contact_name: 'John Doe',
    phone: '123-456-7890',
    email: 'john@test.com',
    lead_status: LeadStatusEnum.NEW,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    ai_trainings_count: 0,
    ai_training_cost_per_unit: 1.5,
    ai_prompts_count: 0,
    ai_prompt_cost_per_unit: 0.16,
    revenue_from_lead_local: 0,
    exchange_rate_at_conversion: 3.6,
    free_sample_package_active: false,
    lead_source: LeadSourceEnum.WEBSITE,
    id: '1'
  },
  {
    lead_id: '2',
    restaurant_name: 'Test Restaurant 2',
    contact_name: 'Jane Smith',
    phone: '098-765-4321',
    email: 'jane@test.com',
    lead_status: LeadStatusEnum.IN_TREATMENT,
    ai_trainings_count: 5,
    ai_training_cost_per_unit: 1.5,
    ai_prompts_count: 10,
    ai_prompt_cost_per_unit: 0.16,
    revenue_from_lead_local: 1000,
    exchange_rate_at_conversion: 3.6,
    free_sample_package_active: true,
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
    next_follow_up_date: '2023-02-01T00:00:00Z',
    lead_source: LeadSourceEnum.FACEBOOK,
    id: '2'
  }
];

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AdminLeadsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders leads management page correctly', async () => {
    renderWithProviders(<AdminLeadsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Restaurant 1')).toBeInTheDocument();
      expect(screen.getByText('Test Restaurant 2')).toBeInTheDocument();
    });
  });

  it('displays lead information correctly', async () => {
    renderWithProviders(<AdminLeadsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('123-456-7890')).toBeInTheDocument();
    });
  });

  it('allows filtering leads', async () => {
    renderWithProviders(<AdminLeadsPage />);
    
    const searchInput = screen.getByPlaceholderText('חיפוש לפי שם מסעדה, איש קשר, אימייל או טלפון...');
    fireEvent.change(searchInput, { target: { value: 'Test Restaurant 1' } });
    
    expect(searchInput).toHaveValue('Test Restaurant 1');
  });

  it('handles lead creation', async () => {
    renderWithProviders(<AdminLeadsPage />);
    
    const createButtons = screen.getAllByText('ליד חדש');
    // Click the first "ליד חדש" button (the main one, not the badge)
    fireEvent.click(createButtons[0]);
    
    // Should open the form modal/sheet
    // Additional test logic would go here
  });
});
