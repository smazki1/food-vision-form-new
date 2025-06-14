import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { toast } from 'sonner';
import { ClientSubmissions2 } from '../ClientSubmissions2';

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
        eq: vi.fn(() => ({ error: null }))
      })),
      insert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({ data: [], error: null }))
          }))
        }))
      }))
    }))
  }
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props} data-testid="button">
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div data-testid="select" data-value={value}>
      <div onClick={() => onValueChange && onValueChange('עיצוב')}>{children}</div>
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-testid="select-item" data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <div data-testid="select-value">{placeholder}</div>,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, ...props }: any) => (
    <textarea 
      value={value} 
      onChange={onChange} 
      {...props} 
      data-testid="textarea"
    />
  ),
}));

vi.mock('lucide-react', () => ({
  ChevronUp: () => <div data-testid="chevron-up" />,
  ChevronDown: () => <div data-testid="chevron-down" />,
  ChevronLeft: () => <div data-testid="chevron-left" />,
  ChevronRight: () => <div data-testid="chevron-right" />,
  Play: () => <div data-testid="play-icon" />,
  Square: () => <div data-testid="stop-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  ImageIcon: () => <div data-testid="image-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
}));

// Mock client data
const mockClient = {
  client_id: 'test-client-id',
  restaurant_name: 'Test Restaurant',
  contact_name: 'Test Contact',
  phone: '123-456-7890',
  email: 'test@example.com',
  original_lead_id: null,
  client_status: 'פעיל',
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
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('ClientSubmissions2 - Cost Persistence Feature', () => {
  let queryClient: QueryClient;

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Happy Path Tests', () => {
    it('should display initial cost values from client prop', () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      // Check that initial values are displayed
      expect(screen.getByText('5')).toBeInTheDocument(); // ai_training_25_count
      expect(screen.getByText('3')).toBeInTheDocument(); // ai_training_15_count
      expect(screen.getByText('2')).toBeInTheDocument(); // ai_training_5_count
      expect(screen.getByText('10')).toBeInTheDocument(); // ai_prompts_count
    });

    it('should update GPT-4 training count successfully', async () => {
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      });

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      // Find and click the increment button for GPT-4 (2.5$)
      const gpt4Section = screen.getByText('אימוני AI (2.5$)').closest('div');
      const incrementButton = gpt4Section?.querySelector('button:last-child');
      
      await act(async () => {
        fireEvent.click(incrementButton!);
      });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('clients');
        expect(toast.success).toHaveBeenCalledWith('נתוני העלויות עודכנו בהצלחה');
      });
    });

    it('should update Claude training count successfully', async () => {
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      });

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      // Find and click the increment button for Claude (1.5$)
      const claudeSection = screen.getByText('אימוני AI (1.5$)').closest('div');
      const incrementButton = claudeSection?.querySelector('button:last-child');
      
      await act(async () => {
        fireEvent.click(incrementButton!);
      });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('clients');
        expect(toast.success).toHaveBeenCalledWith('נתוני העלויות עודכנו בהצלחה');
      });
    });

    it('should update DALL-E training count successfully', async () => {
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      });

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      // Find and click the increment button for DALL-E (5$)
      const dalleSection = screen.getByText('אימוני AI (5$)').closest('div');
      const incrementButton = dalleSection?.querySelector('button:last-child');
      
      await act(async () => {
        fireEvent.click(incrementButton!);
      });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('clients');
        expect(toast.success).toHaveBeenCalledWith('נתוני העלויות עודכנו בהצלחה');
      });
    });

    it('should update prompts count successfully', async () => {
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      });

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      // Find and click the increment button for prompts
      const promptsSection = screen.getByText('פרומפטים (0.162$)').closest('div');
      const incrementButton = promptsSection?.querySelector('button:last-child');
      
      await act(async () => {
        fireEvent.click(incrementButton!);
      });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('clients');
        expect(toast.success).toHaveBeenCalledWith('נתוני העלויות עודכנו בהצלחה');
      });
    });

    it('should update cache data correctly after successful database update', async () => {
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');
      
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      });

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      const gpt4Section = screen.getByText('אימוני AI (2.5$)').closest('div');
      const incrementButton = gpt4Section?.querySelector('button:last-child');
      
      await act(async () => {
        fireEvent.click(incrementButton!);
      });

      await waitFor(() => {
        expect(setQueryDataSpy).toHaveBeenCalledWith(['clients'], expect.any(Function));
        expect(setQueryDataSpy).toHaveBeenCalledWith(['clients_simplified'], expect.any(Function));
        expect(setQueryDataSpy).toHaveBeenCalledWith(['clients_list_for_admin'], expect.any(Function));
        expect(setQueryDataSpy).toHaveBeenCalledWith(['client', 'test-client-id'], expect.any(Function));
        expect(setQueryDataSpy).toHaveBeenCalledWith(['client-detail', 'test-client-id'], expect.any(Function));
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle decrement to zero correctly', async () => {
      const clientWithZero = { ...mockClient, ai_training_25_count: 1 };
      
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      });

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={clientWithZero} />
      );

      const gpt4Section = screen.getByText('אימוני AI (2.5$)').closest('div');
      const decrementButton = gpt4Section?.querySelector('button:first-child');
      
      await act(async () => {
        fireEvent.click(decrementButton!);
      });

      await waitFor(() => {
        expect(mockSupabase.from().update).toHaveBeenCalledWith({ ai_training_25_count: 0 });
      });
    });

    it('should not allow negative values', async () => {
      const clientWithZero = { ...mockClient, ai_training_25_count: 0 };
      
      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={clientWithZero} />
      );

      const gpt4Section = screen.getByText('אימוני AI (2.5$)').closest('div');
      const decrementButton = gpt4Section?.querySelector('button:first-child');
      
      await act(async () => {
        fireEvent.click(decrementButton!);
      });

      // Should not call database update for negative values
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      expect(mockSupabase.from().update).not.toHaveBeenCalled();
    });

    it('should handle missing client data gracefully', () => {
      const clientWithMissingData = {
        ...mockClient,
        ai_training_25_count: undefined,
        ai_training_15_count: null,
      };

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={clientWithMissingData} />
      );

      // Should display 0 for missing values
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle empty clientId gracefully', async () => {
      renderWithQueryClient(
        <ClientSubmissions2 clientId="" client={mockClient} />
      );

      const gpt4Section = screen.getByText('אימוני AI (2.5$)').closest('div');
      const incrementButton = gpt4Section?.querySelector('button:last-child');
      
      await act(async () => {
        fireEvent.click(incrementButton!);
      });

      // Should not call database update without clientId
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      expect(mockSupabase.from().update).not.toHaveBeenCalled();
    });

    it('should update local state when client prop changes', () => {
      const { rerender } = renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      // Update client prop with new values
      const updatedClient = { ...mockClient, ai_training_25_count: 10 };
      
      rerender(
        <QueryClientProvider client={queryClient}>
          <ClientSubmissions2 clientId="test-client-id" client={updatedClient} />
        </QueryClientProvider>
      );

      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle database update errors gracefully', async () => {
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ error: { message: 'Database error' } }))
        }))
      });

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      const gpt4Section = screen.getByText('אימוני AI (2.5$)').closest('div');
      const incrementButton = gpt4Section?.querySelector('button:last-child');
      
      await act(async () => {
        fireEvent.click(incrementButton!);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('שגיאה בעדכון נתונים: Database error');
      });
    });

    it('should handle network errors during update', async () => {
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Network error');
      });

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      const gpt4Section = screen.getByText('אימוני AI (2.5$)').closest('div');
      const incrementButton = gpt4Section?.querySelector('button:last-child');
      
      await act(async () => {
        fireEvent.click(incrementButton!);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('שגיאה בעדכון נתונים: Network error');
      });
    });

    it('should disable buttons during update', async () => {
      let resolveUpdate: any;
      const updatePromise = new Promise(resolve => {
        resolveUpdate = resolve;
      });

      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => updatePromise)
        }))
      });

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      const gpt4Section = screen.getByText('אימוני AI (2.5$)').closest('div');
      const incrementButton = gpt4Section?.querySelector('button:last-child');
      
      await act(async () => {
        fireEvent.click(incrementButton!);
      });

      // Buttons should be disabled during update
      expect(incrementButton).toBeDisabled();

      // Resolve the update
      await act(async () => {
        resolveUpdate({ error: null });
      });

      await waitFor(() => {
        expect(incrementButton).not.toBeDisabled();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should invalidate costs report queries after successful update', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const refetchQueriesSpy = vi.spyOn(queryClient, 'refetchQueries');
      
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      });

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      const gpt4Section = screen.getByText('אימוני AI (2.5$)').closest('div');
      const incrementButton = gpt4Section?.querySelector('button:last-child');
      
      await act(async () => {
        fireEvent.click(incrementButton!);
      });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['client-costs-report'] });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['ai-costs-report'] });
        expect(refetchQueriesSpy).toHaveBeenCalledWith({ 
          queryKey: ['client-costs-report'],
          type: 'active'
        });
      });
    });

    it('should maintain state consistency across multiple updates', async () => {
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      });

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      // Perform multiple updates
      const gpt4Section = screen.getByText('אימוני AI (2.5$)').closest('div');
      const incrementButton = gpt4Section?.querySelector('button:last-child');
      
      // Click increment button multiple times
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.click(incrementButton!);
        });
        
        await waitFor(() => {
          expect(mockSupabase.from().update).toHaveBeenCalled();
        });
      }

      // Should have called update 3 times
      expect(mockSupabase.from().update).toHaveBeenCalledTimes(3);
      expect(toast.success).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent updates correctly', async () => {
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      });

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      const gpt4Section = screen.getByText('אימוני AI (2.5$)').closest('div');
      const claudeSection = screen.getByText('אימוני AI (1.5$)').closest('div');
      
      const gpt4Button = gpt4Section?.querySelector('button:last-child');
      const claudeButton = claudeSection?.querySelector('button:last-child');
      
      // Trigger concurrent updates
      await act(async () => {
        fireEvent.click(gpt4Button!);
        fireEvent.click(claudeButton!);
      });

      await waitFor(() => {
        expect(mockSupabase.from().update).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Cache Management', () => {
    it('should update all cache variations correctly', async () => {
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');
      
      // Mock cache data
      queryClient.setQueryData(['clients'], [mockClient]);
      queryClient.setQueryData(['client', 'test-client-id'], mockClient);
      
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      });

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      const gpt4Section = screen.getByText('אימוני AI (2.5$)').closest('div');
      const incrementButton = gpt4Section?.querySelector('button:last-child');
      
      await act(async () => {
        fireEvent.click(incrementButton!);
      });

      await waitFor(() => {
        // Verify all cache keys are updated
        expect(setQueryDataSpy).toHaveBeenCalledWith(['clients'], expect.any(Function));
        expect(setQueryDataSpy).toHaveBeenCalledWith(['clients_simplified'], expect.any(Function));
        expect(setQueryDataSpy).toHaveBeenCalledWith(['clients_list_for_admin'], expect.any(Function));
        expect(setQueryDataSpy).toHaveBeenCalledWith(['client', 'test-client-id'], expect.any(Function));
        expect(setQueryDataSpy).toHaveBeenCalledWith(['client-detail', 'test-client-id'], expect.any(Function));
      });
    });

    it('should handle missing cache data gracefully', async () => {
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');
      
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        }))
      });

      renderWithQueryClient(
        <ClientSubmissions2 clientId="test-client-id" client={mockClient} />
      );

      const gpt4Section = screen.getByText('אימוני AI (2.5$)').closest('div');
      const incrementButton = gpt4Section?.querySelector('button:last-child');
      
      await act(async () => {
        fireEvent.click(incrementButton!);
      });

      await waitFor(() => {
        // Should not throw errors even with missing cache data
        expect(setQueryDataSpy).toHaveBeenCalled();
      });
    });
  });
}); 