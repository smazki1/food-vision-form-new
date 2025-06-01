
import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { LeadDetailsSheet } from './LeadDetailsSheet';
import { Lead } from '@/types/models';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </QueryClientProvider>
);

const mockLead: Lead = {
  lead_id: 'test-lead-id',
  restaurant_name: 'Test Restaurant',
  contact_name: 'Test Contact',
  phone: '1234567890',
  email: 'test@example.com',
  lead_status: 'ליד חדש',
  lead_source: 'אתר',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  notes: 'Test notes',
  ai_trainings_count: 0,
  ai_training_cost_per_unit: 1.5,
  ai_prompts_count: 0,
  ai_prompt_cost_per_unit: 0.16,
  free_sample_package_active: false
};

const mockOnUpdate = jest.fn();
const mockOnDeleteLeadConfirm = jest.fn();

describe('LeadDetailsSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(
      <TestWrapper>
        <LeadDetailsSheet
          isOpen={true}
          onOpenChange={() => {}}
          lead={mockLead}
          onUpdate={mockOnUpdate}
          onDeleteLeadConfirm={mockOnDeleteLeadConfirm}
        />
      </TestWrapper>
    );

    expect(screen.getByText('פרטי ליד')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <TestWrapper>
        <LeadDetailsSheet
          isOpen={false}
          onOpenChange={() => {}}
          lead={mockLead}
          onUpdate={mockOnUpdate}
          onDeleteLeadConfirm={mockOnDeleteLeadConfirm}
        />
      </TestWrapper>
    );

    expect(screen.queryByText('פרטי ליד')).not.toBeInTheDocument();
  });
});
