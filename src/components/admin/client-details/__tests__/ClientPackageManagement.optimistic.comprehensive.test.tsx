import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientPackageManagement } from '../ClientPackageManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }))
  }
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@/hooks/usePackages', () => ({
  usePackages: vi.fn(() => ({
    data: [
      {
        package_id: 'pkg-1',
        package_name: 'חבילה בסיסית',
        included_servings: 10,
        included_images: 50
      },
      {
        package_id: 'pkg-2', 
        package_name: 'חבילה מתקדמת',
        included_servings: 20,
        included_images: 100
      }
    ],
    isLoading: false
  }))
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('ClientPackageManagement - Optimistic Updates Tests', () => {
  const mockClient = {
    client_id: 'client-123',
    restaurant_name: 'מסעדת הטעם',
    contact_name: 'יוסי כהן',
    email: 'yossi@restaurant.com',
    phone: '052-1234567',
    remaining_servings: 15,
    remaining_images: 100,
    package_id: 'pkg-1',
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
    original_lead_id: null,
    client_status: 'active',
    package_start_date: null,
    package_end_date: null,
    total_servings: 20,
    total_images: 200,
    pricing_tier: 'standard'
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockClient,
          error: null
        })
      })
    });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockClient,
            error: null
          })
        })
      })
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
      update: mockUpdate
    } as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Happy Path Tests', () => {
    it('should render component with correct initial values', async () => {
      const wrapper = createWrapper();
      render(<ClientPackageManagement client={mockClient} />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument(); // servings
        expect(screen.getByText('100')).toBeInTheDocument(); // images
      });
    });

    it('should show optimistic update for servings +1', async () => {
      const wrapper = createWrapper();
      render(<ClientPackageManagement client={mockClient} />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
      });

      const plusButtons = screen.getAllByText('+1');
      fireEvent.click(plusButtons[0]); // Servings +1

      await waitFor(() => {
        expect(screen.getByText('16')).toBeInTheDocument();
      });
    });

    it('should show optimistic update for images +1', async () => {
      const wrapper = createWrapper();
      render(<ClientPackageManagement client={mockClient} />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
      });

      const plusButtons = screen.getAllByText('+1');
      fireEvent.click(plusButtons[1]); // Images +1

      await waitFor(() => {
        expect(screen.getByText('101')).toBeInTheDocument();
      });
    });

    it('should handle multiple quick clicks', async () => {
      const wrapper = createWrapper();
      render(<ClientPackageManagement client={mockClient} />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
      });

      const plusButtons = screen.getAllByText('+1');
      
      // Click multiple times quickly
      fireEvent.click(plusButtons[0]);
      fireEvent.click(plusButtons[0]);
      fireEvent.click(plusButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('18')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should rollback on API failure', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('API Error'))
          })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockClient,
              error: null
            })
          })
        }),
        update: mockUpdate
      } as any);

      const wrapper = createWrapper();
      render(<ClientPackageManagement client={mockClient} />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
      });

      const plusButtons = screen.getAllByText('+1');
      fireEvent.click(plusButtons[0]);

      // Should show optimistic update
      await waitFor(() => {
        expect(screen.getByText('16')).toBeInTheDocument();
      });

      // Should rollback on error
      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(toast.error).toHaveBeenCalled();
    });

    it('should prevent negative values', async () => {
      const clientWithZeroServings = {
        ...mockClient,
        remaining_servings: 0
      };

      const wrapper = createWrapper();
      render(<ClientPackageManagement client={clientWithZeroServings} />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });

      const minusButtons = screen.getAllByText('-1');
      fireEvent.click(minusButtons[0]); // Try to go negative

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument(); // Should stay at 0
      });

      expect(toast.error).toHaveBeenCalledWith('לא ניתן להוריד מתחת לאפס');
    });
  });

  describe('Loading States', () => {
    it('should disable buttons during mutation', async () => {
      let resolveUpdate: (value: any) => void;
      const slowUpdatePromise = new Promise(resolve => {
        resolveUpdate = resolve;
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() => slowUpdatePromise)
          })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockClient,
              error: null
            })
          })
        }),
        update: mockUpdate
      } as any);

      const wrapper = createWrapper();
      render(<ClientPackageManagement client={mockClient} />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
      });

      const plusButtons = screen.getAllByText('+1');
      fireEvent.click(plusButtons[0]);

      await waitFor(() => {
        expect(plusButtons[0]).toBeDisabled();
      });

      // Resolve the promise
      resolveUpdate!({ data: { ...mockClient, remaining_servings: 16 }, error: null });

      await waitFor(() => {
        expect(plusButtons[0]).not.toBeDisabled();
      });
    });
  });

  describe('Cache Integration', () => {
    it('should use fresh data when available', async () => {
      const freshClient = {
        ...mockClient,
        remaining_servings: 25
      };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: freshClient,
            error: null
          })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);

      const wrapper = createWrapper();
      render(<ClientPackageManagement client={mockClient} />, { wrapper });

      // Should show fresh data (25) not props data (15)
      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument();
      });
    });
  });
}); 