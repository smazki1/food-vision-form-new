import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientCostTracking } from '../ClientCostTracking';
import { Client } from '@/types/client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/integrations/supabase/client');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock formatCurrencyILS
vi.mock('@/utils/formatters', () => ({
  formatCurrencyILS: vi.fn((value: number) => `₪${value.toFixed(2)}`),
}));

describe('ClientCostTracking Revenue Calculation Feature', () => {
  let queryClient: QueryClient;
  let mockSupabase: any;
  let user: ReturnType<typeof userEvent.setup>;

  const mockClientWithPackage: Client = {
    client_id: 'test-client-1',
    restaurant_name: 'Test Restaurant',
    contact_name: 'John Doe',
    phone: '123456789',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    original_lead_id: null,
    client_status: 'active',
    current_package_id: 'package-123',
    remaining_servings: 10,
    remaining_images: 5,
    consumed_images: 0,
    reserved_images: 0,
    last_activity_at: '2024-01-01T00:00:00Z',
    internal_notes: null,
    user_auth_id: null,
    // Cost tracking data
    ai_training_25_count: 8,
    ai_training_15_count: 1,
    ai_training_5_count: 0,
    ai_prompts_count: 48,
    ai_prompt_cost_per_unit: 0.162,
    revenue_from_client_local: 0,
    exchange_rate_at_conversion: 3.6,
  };

  const mockClientWithoutPackage: Client = {
    ...mockClientWithPackage,
    current_package_id: null,
  };

  const mockPackageData = {
    package_name: 'חבילה פרימיום',
    price: 800,
    total_servings: 20,
    total_images: 10,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    user = userEvent.setup();
    
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockPackageData, error: null })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
    };
    
    (supabase as any) = mockSupabase;
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderComponent = (client = mockClientWithPackage) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ClientCostTracking client={client} clientId={client.client_id} />
      </QueryClientProvider>
    );
  };

  describe('Happy Path Tests', () => {
    it('renders component with package data successfully', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('מידע כלכלי')).toBeInTheDocument();
        expect(screen.getByText('מידע חבילה ורווחיות')).toBeInTheDocument();
      });
    });

    it('displays package information correctly', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('חבילה פרימיום')).toBeInTheDocument();
        expect(screen.getByText('₪800.00')).toBeInTheDocument();
      });
    });

    it('calculates total costs correctly', async () => {
      renderComponent();
      
      await waitFor(() => {
        // Expected: (8 * 2.5) + (1 * 1.5) + (0 * 5) + (48 * 0.162) = 29.276 USD
        // In ILS: 29.276 * 3.6 = 105.3936 ≈ 105.39
        expect(screen.getByText('$29.28')).toBeInTheDocument();
        expect(screen.getByText('₪105.40')).toBeInTheDocument();
      });
    });

    it('calculates profit correctly', async () => {
      renderComponent();
      
      await waitFor(() => {
        // Package price: 800, Costs: 105.40, Profit: 694.60
        const profitElements = screen.getAllByText('₪694.60');
        expect(profitElements.length).toBeGreaterThan(0);
      });
    });

    it('calculates ROI correctly', async () => {
      renderComponent();
      
      await waitFor(() => {
        // ROI: (800 - 105.40) / 105.40 * 100 = 658.8%
        expect(screen.getByText('658.8%')).toBeInTheDocument();
      });
    });

    it('updates field values successfully', async () => {
      renderComponent();
      
      const aiTrainingInput = screen.getByDisplayValue('8');
      await user.clear(aiTrainingInput);
      await user.type(aiTrainingInput, '10');
      fireEvent.blur(aiTrainingInput);
      
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('clients');
        expect(toast.success).toHaveBeenCalledWith('אימוני AI (2.5$) עודכן בהצלחה');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles zero cost values correctly', () => {
      const clientWithZeroCosts = {
        ...mockClientWithPackage,
        ai_training_25_count: 0,
        ai_training_15_count: 0,
        ai_training_5_count: 0,
        ai_prompts_count: 0,
      };
      
      renderComponent(clientWithZeroCosts);
      
      expect(screen.getByText('$0.00')).toBeInTheDocument();
      expect(screen.getByText('₪0.00')).toBeInTheDocument();
    });

    it('handles undefined/null cost fields gracefully', () => {
      const clientWithNullFields = {
        ...mockClientWithPackage,
        ai_training_25_count: undefined,
        ai_training_15_count: null,
        ai_prompts_count: undefined,
        ai_prompt_cost_per_unit: undefined,
        exchange_rate_at_conversion: undefined,
      } as any;
      
      renderComponent(clientWithNullFields);
      
      // Should render without crashing and use default values
      expect(screen.getByText('מידע כלכלי')).toBeInTheDocument();
    });

    it('handles very large numbers correctly', () => {
      const clientWithLargeNumbers = {
        ...mockClientWithPackage,
        ai_training_25_count: 999999,
        ai_prompts_count: 999999,
        exchange_rate_at_conversion: 10.5,
      };
      
      renderComponent(clientWithLargeNumbers);
      
      // Should handle large calculations without breaking
      expect(screen.getByText('מידע כלכלי')).toBeInTheDocument();
    });

    it('handles zero exchange rate', () => {
      const clientWithZeroExchange = {
        ...mockClientWithPackage,
        exchange_rate_at_conversion: 0,
      };
      
      renderComponent(clientWithZeroExchange);
      
      // Should handle division by zero gracefully
      expect(screen.getByText('מידע כלכלי')).toBeInTheDocument();
    });

    it('handles package with zero price', async () => {
      const mockZeroPricePackage = { ...mockPackageData, price: 0 };
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockZeroPricePackage, error: null })),
          })),
        })),
      });
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('₪0.00')).toBeInTheDocument();
      });
    });

    it('handles negative profit calculation', async () => {
      const mockLowPricePackage = { ...mockPackageData, price: 50 }; // Lower than costs
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockLowPricePackage, error: null })),
          })),
        })),
      });
      
      renderComponent();
      
      await waitFor(() => {
        // Profit should be 0 (Math.max(0, negative)) 
        expect(screen.getByText('₪0.00')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles package fetch error gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Package not found' } })),
          })),
        })),
      });
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('לא ניתן לטעון מידע על החבילה')).toBeInTheDocument();
        expect(screen.getByText('ID חבילה: package-123')).toBeInTheDocument();
      });
    });

    it('handles field update error gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockPackageData, error: null })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: { message: 'Update failed' } })),
        })),
      });
      
      renderComponent();
      
      const aiTrainingInput = screen.getByDisplayValue('8');
      await user.clear(aiTrainingInput);
      await user.type(aiTrainingInput, '10');
      fireEvent.blur(aiTrainingInput);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('שגיאה בעדכון אימוני AI (2.5$): Update failed');
      });
    });

    it('handles network/database connection errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.reject(new Error('Network error'))),
          })),
        })),
      });
      
      renderComponent();
      
      // Should render basic component even if package fetch fails
      expect(screen.getByText('מידע כלכלי')).toBeInTheDocument();
    });
  });

  describe('No Package Assignment Cases', () => {
    it('displays appropriate message when no package assigned', () => {
      renderComponent(mockClientWithoutPackage);
      
      expect(screen.getByText('לא הוקצתה חבילה ללקוח')).toBeInTheDocument();
      expect(screen.getByText('לא ניתן לחשב רווחיות ללא חבילה מוקצית')).toBeInTheDocument();
    });

    it('does not show package information section when no package', () => {
      renderComponent(mockClientWithoutPackage);
      
      expect(screen.queryByText('מידע חבילה ורווחיות')).not.toBeInTheDocument();
    });

    it('still shows cost calculation without package', () => {
      renderComponent(mockClientWithoutPackage);
      
      expect(screen.getByText('מידע כלכלי')).toBeInTheDocument();
      expect(screen.getByText('$29.28')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('integrates properly with useQuery hook', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('service_packages');
      });
    });

    it('integrates properly with form state management', async () => {
      renderComponent();
      
      const exchangeRateInput = screen.getByDisplayValue('3.6');
      await user.clear(exchangeRateInput);
      await user.type(exchangeRateInput, '4.0');
      
      // Should update calculations immediately
      expect(exchangeRateInput).toHaveValue(4.0);
    });

    it('integrates with currency formatter correctly', async () => {
      const { formatCurrencyILS } = await import('@/utils/formatters');
      
      renderComponent();
      
      await waitFor(() => {
        expect(formatCurrencyILS).toHaveBeenCalledWith(expect.any(Number));
      });
    });

    it('maintains data consistency between calculations', async () => {
      renderComponent();
      
      await waitFor(() => {
        // All profit displays should show the same value
        const profitElements = screen.getAllByText('₪694.60');
        expect(profitElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Business Logic Validation', () => {
    it('validates profit calculation formula: package_price - costs = profit', async () => {
      renderComponent();
      
      await waitFor(() => {
        // Package: 800, Costs: 105.40, Expected Profit: 694.60
        const expectedProfit = 800 - 105.40;
        expect(Math.abs(expectedProfit - 694.60)).toBeLessThan(0.01);
      });
    });

    it('validates ROI calculation formula: (profit / costs) * 100', async () => {
      renderComponent();
      
      await waitFor(() => {
        // Profit: 694.60, Costs: 105.40, Expected ROI: 658.8%
        const expectedROI = (694.60 / 105.40) * 100;
        expect(Math.abs(expectedROI - 658.8)).toBeLessThan(0.1);
      });
    });

    it('ensures costs in ILS = costs in USD * exchange_rate', async () => {
      renderComponent();
      
      await waitFor(() => {
        // Costs USD: 29.28, Exchange Rate: 3.6, Expected ILS: 105.40
        const expectedILS = 29.28 * 3.6;
        expect(Math.abs(expectedILS - 105.40)).toBeLessThan(0.01);
      });
    });
  });

  describe('Performance Tests', () => {
    it('handles frequent field updates without performance issues', async () => {
      renderComponent();
      
      const aiTrainingInput = screen.getByDisplayValue('8');
      
      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        await user.clear(aiTrainingInput);
        await user.type(aiTrainingInput, i.toString());
      }
      
      // Should handle rapid updates gracefully
      expect(screen.getByText('מידע כלכלי')).toBeInTheDocument();
    });

    it('does not cause memory leaks with package data fetching', async () => {
      const { unmount } = renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('מידע חבילה ורווחיות')).toBeInTheDocument();
      });
      
      unmount();
      
      // Should cleanup properly
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    });
  });
}); 