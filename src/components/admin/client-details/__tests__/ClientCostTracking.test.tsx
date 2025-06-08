import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClientCostTracking } from '../ClientCostTracking';
import { Client } from '@/types/client';

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
        eq: vi.fn(() => ({
          error: null,
        })),
      })),
    })),
  },
}));

const mockQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

// Mock client data with cost tracking fields
const mockClient: Client = {
  client_id: 'test-client-id',
  restaurant_name: 'Test Restaurant',
  contact_name: 'Test Contact',
  phone: '123-456-7890',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  original_lead_id: 'test-lead-id',
  client_status: 'active',
  current_package_id: null,
  remaining_servings: 0,
  remaining_images: 0,
  consumed_images: 0,
  reserved_images: 0,
  last_activity_at: '2024-01-01T00:00:00Z',
  internal_notes: null,
  user_auth_id: null,
  ai_training_25_count: 5,
  ai_training_15_count: 3,
  ai_training_5_count: 2,
  ai_prompts_count: 10,
  ai_training_cost_per_unit: 1.50,
  ai_prompt_cost_per_unit: 0.162,
  revenue_from_client_local: 1000,
  exchange_rate_at_conversion: 3.6,
};

const renderWithQueryClient = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={mockQueryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ClientCostTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryClient.clear();
  });

  describe('Happy Path Tests', () => {
    it('renders cost tracking component without crashing', () => {
      renderWithQueryClient(
        <ClientCostTracking client={mockClient} clientId="test-client-id" />
      );

      // Check that the component renders
      expect(screen.getByText('מידע כלכלי')).toBeInTheDocument();
    });

    it('displays cost tracking fields with initial values', () => {
      renderWithQueryClient(
        <ClientCostTracking client={mockClient} clientId="test-client-id" />
      );

      // Check that input fields are rendered
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('calculates total costs correctly', () => {
      renderWithQueryClient(
        <ClientCostTracking client={mockClient} clientId="test-client-id" />
      );

      // Expected calculation: (5 * 2.5) + (3 * 1.5) + (2 * 5) + (10 * 0.162) = 28.62
      expect(screen.getByText('$28.62')).toBeInTheDocument();
    });

    it('calculates total costs in ILS correctly', () => {
      renderWithQueryClient(
        <ClientCostTracking client={mockClient} clientId="test-client-id" />
      );

      // Expected calculation: 28.62 * 3.6 = 103.032
      expect(screen.getByText('₪103.03')).toBeInTheDocument();
    });

    it('calculates ROI correctly', () => {
      renderWithQueryClient(
        <ClientCostTracking client={mockClient} clientId="test-client-id" />
      );

      // Revenue USD: 1000 / 3.6 = 277.78
      // Total costs: 28.62
      // ROI: ((277.78 - 28.62) / 28.62) * 100 = 870.6%
      expect(screen.getByText('870.6%')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero values correctly', () => {
      const clientWithZeros = {
        ...mockClient,
        ai_training_25_count: 0,
        ai_training_15_count: 0,
        ai_training_5_count: 0,
        ai_prompts_count: 0,
      };

      renderWithQueryClient(
        <ClientCostTracking client={clientWithZeros} clientId="test-client-id" />
      );

      expect(screen.getByText('$0.00')).toBeInTheDocument();
      expect(screen.getByText('₪0.00')).toBeInTheDocument();
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });

    it('handles undefined cost fields gracefully', () => {
      const clientWithUndefinedFields = {
        ...mockClient,
        ai_training_25_count: undefined,
        ai_training_15_count: undefined,
        ai_training_5_count: undefined,
        ai_prompts_count: undefined,
        ai_prompt_cost_per_unit: undefined,
        revenue_from_client_local: undefined,
        exchange_rate_at_conversion: undefined,
      };

      renderWithQueryClient(
        <ClientCostTracking client={clientWithUndefinedFields} clientId="test-client-id" />
      );

      // Should render without crashing and show default values
      expect(screen.getByText('מידע כלכלי')).toBeInTheDocument();
    });

    it('handles zero revenue correctly', () => {
      const clientWithZeroRevenue = {
        ...mockClient,
        revenue_from_client_local: 0,
      };

      renderWithQueryClient(
        <ClientCostTracking client={clientWithZeroRevenue} clientId="test-client-id" />
      );

      // ROI should be negative when revenue is 0 but costs exist
      expect(screen.getByText('-100.0%')).toBeInTheDocument();
    });
  });

  describe('Calculation Logic', () => {
    it('calculates costs correctly with different training types', () => {
      const testClient = {
        ...mockClient,
        ai_training_25_count: 4,  // 4 * 2.5 = 10
        ai_training_15_count: 6,  // 6 * 1.5 = 9
        ai_training_5_count: 2,   // 2 * 5 = 10
        ai_prompts_count: 5,      // 5 * 0.162 = 0.81
        ai_prompt_cost_per_unit: 0.162,
      };

      renderWithQueryClient(
        <ClientCostTracking client={testClient} clientId="test-client-id" />
      );

      // Total: 10 + 9 + 10 + 0.81 = 29.81
      expect(screen.getByText('$29.81')).toBeInTheDocument();
    });

    it('displays cost breakdown sections', () => {
      renderWithQueryClient(
        <ClientCostTracking client={mockClient} clientId="test-client-id" />
      );

      expect(screen.getByText('פירוט עלויות:')).toBeInTheDocument();
      expect(screen.getByText('סיכום כללי:')).toBeInTheDocument();
    });
  });

  describe('UI Components', () => {
    it('renders financial information card', () => {
      renderWithQueryClient(
        <ClientCostTracking client={mockClient} clientId="test-client-id" />
      );

      expect(screen.getByText('מידע כלכלי')).toBeInTheDocument();
    });

    it('renders ROI and revenue card', () => {
      renderWithQueryClient(
        <ClientCostTracking client={mockClient} clientId="test-client-id" />
      );

      expect(screen.getByText('תשואה והכנסות')).toBeInTheDocument();
    });

    it('displays Hebrew labels correctly', () => {
      renderWithQueryClient(
        <ClientCostTracking client={mockClient} clientId="test-client-id" />
      );

      // Check that Hebrew labels are displayed
      expect(screen.getByText('אימוני AI (2.5$)')).toBeInTheDocument();
      expect(screen.getByText('אימוני AI (1.5$)')).toBeInTheDocument();
      expect(screen.getByText('אימוני AI (5$)')).toBeInTheDocument();
      expect(screen.getByText('פרומפטים (0.162$)')).toBeInTheDocument();
    });
  });
}); 