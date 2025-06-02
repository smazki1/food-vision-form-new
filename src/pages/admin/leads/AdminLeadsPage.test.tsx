import { render, screen, fireEvent } from '@testing-library/react';
import AdminLeadsPage from './AdminLeadsPage';
import { useEnhancedLeads } from '@/hooks/useEnhancedLeads';
import { Lead, LeadStatusEnum, LeadSourceEnum } from '@/types/lead';

// Mock hooks
jest.mock('@/hooks/useEnhancedLeads');

// Mock child components
jest.mock('@/components/admin/leads/EnhancedLeadsFilters', () => ({
  EnhancedLeadsFilters: jest.fn(() => <div data-testid="mock-leads-filters">Filters</div>),
}));
jest.mock('@/components/admin/leads/EnhancedLeadsTable', () => ({
  EnhancedLeadsTable: jest.fn(({ leads }) => (
    <div data-testid="mock-enhanced-leads-table">
      {leads && leads.length > 0 ? leads.map((l: Lead) => <div key={l.lead_id}>{l.restaurant_name}</div>) : <p>No leads in table</p>}
    </div>
  )),
}));
jest.mock('@/components/admin/leads/LeadDetailPanel', () => ({
  LeadDetailPanel: jest.fn(() => <div data-testid="mock-lead-detail-panel">Detail Panel</div>),
}));
jest.mock('@/components/admin/leads/CreateLeadModal', () => ({
  CreateLeadModal: jest.fn(() => <div data-testid="mock-create-lead-modal">Create Modal</div>),
}));
jest.mock('sonner', () => ({ toast: { error: jest.fn() } }));
// Mock react-router-dom Link
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // import and retain default behavior
  Link: jest.fn(({ children }) => <div>{children}</div>), // Simplified mock for Link
}));

describe('AdminLeadsPage', () => {
  const mockUseEnhancedLeads = useEnhancedLeads as jest.Mock;
  const now = new Date().toISOString();

  const initialMockLeads: Lead[] = [
    {
      lead_id: '1',
      restaurant_name: 'Pizza Place',
      contact_name: 'Test User1',
      phone: '1234567890',
      email: 'test1@example.com',
      lead_status: LeadStatusEnum.NEW,
      ai_trainings_count: 0,
      ai_training_cost_per_unit: 0,
      ai_prompts_count: 0,
      ai_prompt_cost_per_unit: 0,
      created_at: now,
      updated_at: now,
      free_sample_package_active: false,
      total_ai_costs: 0,
      revenue_from_lead_local: 0,
      lead_source: LeadSourceEnum.WEBSITE,
    },
    {
      lead_id: '2',
      restaurant_name: 'Burger Joint',
      contact_name: 'Test User2',
      phone: '0987654321',
      email: 'test2@example.com',
      lead_status: LeadStatusEnum.CONTACTED,
      ai_trainings_count: 1,
      ai_training_cost_per_unit: 0.5,
      ai_prompts_count: 2,
      ai_prompt_cost_per_unit: 0.1,
      created_at: now,
      updated_at: now,
      free_sample_package_active: true,
      total_ai_costs: 0.7,
      revenue_from_lead_local: 100,
      lead_source: LeadSourceEnum.REFERRAL,
      next_follow_up_date: new Date(Date.now() + 86400000).toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEnhancedLeads.mockReturnValue({
      data: { data: [...initialMockLeads], total: initialMockLeads.length },
      isLoading: false,
      error: null,
    });
  });

  test('renders page title and action buttons', () => {
    render(<AdminLeadsPage />);
    expect(screen.getByText('ניהול לידים')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ליד חדש/ })).toBeInTheDocument();
  });

  test('renders filters and table with leads by default', () => {
    render(<AdminLeadsPage />);
    expect(screen.getByTestId('mock-leads-filters')).toBeInTheDocument();
    expect(screen.getByTestId('mock-enhanced-leads-table')).toBeInTheDocument();
    expect(screen.getByText('Pizza Place')).toBeInTheDocument();
    expect(screen.getByText('Burger Joint')).toBeInTheDocument();
  });

  test('handles loading state', () => {
    mockUseEnhancedLeads.mockReturnValue({ data: null, isLoading: true, error: null });
    render(<AdminLeadsPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('handles error state', () => {
    const error = new Error('Failed to load leads');
    mockUseEnhancedLeads.mockReturnValue({ data: null, isLoading: false, error });
    render(<AdminLeadsPage />);
    expect(screen.getByText('שגיאה בטעינת לידים')).toBeInTheDocument();
    expect(screen.getByText(error.message)).toBeInTheDocument();
  });

  test('handles null or undefined leadsData or leadsData.data gracefully', () => {
    mockUseEnhancedLeads.mockReturnValue({ data: null, isLoading: false, error: null });
    const { rerender } = render(<AdminLeadsPage />);
    expect(screen.getByTestId('mock-enhanced-leads-table')).toHaveTextContent('No leads in table');

    mockUseEnhancedLeads.mockReturnValue({ data: { data: null, total: 0 }, isLoading: false, error: null });
    rerender(<AdminLeadsPage />);
    expect(screen.getByTestId('mock-enhanced-leads-table')).toHaveTextContent('No leads in table');

    mockUseEnhancedLeads.mockReturnValue({ data: { data: undefined, total: 0 }, isLoading: false, error: null });
    rerender(<AdminLeadsPage />);
    expect(screen.getByTestId('mock-enhanced-leads-table')).toHaveTextContent('No leads in table');
  });

  // Add more tests for tab switching, filter changes, opening create modal, selecting lead, etc.
}); 