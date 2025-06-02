import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { LeadDetailsSheet } from './LeadDetailsSheet';
import { LeadStatusEnum, LeadSourceEnum, Lead } from '@/types/lead';

const mockLead: Lead = {
  lead_id: 'test-lead-1',
  restaurant_name: 'Test Restaurant',
  contact_name: 'John Doe',
  email: 'john@test.com',
  phone: '123-456-7890',
  lead_status: LeadStatusEnum.NEW,
  lead_source: LeadSourceEnum.WEBSITE,
  notes: 'Test notes',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ai_trainings_count: 0,
  ai_training_cost_per_unit: 1.5,
  ai_prompts_count: 0,
  ai_prompt_cost_per_unit: 0.16,
  revenue_from_lead_local: 0,
  exchange_rate_at_conversion: 3.6,
  free_sample_package_active: false,
  id: 'test-lead-1',
  revenue_from_lead_usd: 0,
  business_type: '',
  lora_page_url: '',
  style_description: '',
  custom_prompt: '',
  reminder_notes: '',
  conversion_reason: '',
  rejection_reason: '',
  archived_at: '',
  total_ai_costs: 0,
  roi: 0,
  ai_training_5_count: 0,
  ai_training_15_count: 0,
  ai_training_25_count: 0,
  is_archived: false,
};

interface LeadDetailsSheetProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadData: Partial<Lead>) => void;
}

const renderComponent = (props: Partial<LeadDetailsSheetProps> = {}) => {
  const defaultProps: LeadDetailsSheetProps = {
    isOpen: true,
    onClose: vi.fn(),
    lead: mockLead,
    onSave: vi.fn(),
  };
  return render(<LeadDetailsSheet {...defaultProps} {...props} />);
};

describe('LeadDetailsSheet', () => {
  it('renders lead details correctly', () => {
    renderComponent();
    expect(screen.getByText(`מסעדה: ${mockLead.restaurant_name}`)).toBeInTheDocument();
    expect(screen.getByText(`איש קשר: ${mockLead.contact_name}`)).toBeInTheDocument();
    expect(screen.getByText(`טלפון: ${mockLead.phone}`)).toBeInTheDocument();
    expect(screen.getByText(`אימייל: ${mockLead.email}`)).toBeInTheDocument();
  });

  it('opens and closes the sheet', () => {
    const onClose = vi.fn();
    renderComponent({ onClose });
    userEvent.click(screen.getByRole('button', { name: 'ערוך' }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('allows editing and saving lead details', async () => {
    const onSave = vi.fn();
    renderComponent({ onSave });

    userEvent.click(screen.getByRole('button', { name: 'ערוך' }));
    
    const saveButton = screen.getByRole('button', { name: 'שמור' });
    expect(saveButton).toBeInTheDocument();

    userEvent.click(saveButton);
    expect(onSave).toHaveBeenCalled();
  });
});
