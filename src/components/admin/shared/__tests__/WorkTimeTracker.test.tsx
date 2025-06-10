import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock modules before any imports
vi.mock('@/hooks/useCurrentUserRole', () => ({
  useCurrentUserRole: vi.fn(() => ({
    userId: 'test-user-123',
    isLoading: false,
    status: 'ROLE_DETERMINED'
  }))
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({
                data: [
                  {
                    id: 'session-1',
                    start_time: '2024-01-02T10:00:00Z',
                    end_time: '2024-01-02T10:30:00Z',
                    duration_minutes: 30,
                    notes: 'Testing feature|מכירה',
                    is_active: false,
                    created_at: '2024-01-02T10:00:00Z'
                  }
                ],
                error: null
              }))
            }))
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'new-session-id' },
            error: null
          }))
        }))
      }))
    }))
  }
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

// Mock fetch
global.fetch = vi.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ 
      success: true, 
      data: { id: 'test-session-id' } 
    })
  }) as Promise<Response>
);

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
});

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_SUPABASE_URL: 'https://test-supabase.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key'
  }
});

// Now import the component after mocks are set up
import { WorkTimeTracker } from '../WorkTimeTracker';

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: 0 },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('WorkTimeTracker - Comprehensive Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Component Rendering and Authentication', () => {
    it('should render loading state correctly', () => {
      const useCurrentUserRole = require('@/hooks/useCurrentUserRole').useCurrentUserRole;
      vi.mocked(useCurrentUserRole).mockReturnValue({
        userId: null,
        isLoading: true,
        status: 'LOADING'
      });

      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      expect(screen.getByText('טוען...')).toBeInTheDocument();
    });

    it('should render authentication error when user is not logged in', () => {
      const useCurrentUserRole = require('@/hooks/useCurrentUserRole').useCurrentUserRole;
      vi.mocked(useCurrentUserRole).mockReturnValue({
        userId: null,
        isLoading: false,
        status: 'ROLE_DETERMINED'
      });

      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      expect(screen.getByText('אנא התחבר לחשבון')).toBeInTheDocument();
    });

    it('should render main component when authenticated', () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      expect(screen.getByText('מעקב זמני עבודה')).toBeInTheDocument();
      expect(screen.getByText('התחל')).toBeInTheDocument();
    });

    it('should have RTL direction support', () => {
      const { container } = renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      const rtlElement = container.querySelector('[dir="rtl"]');
      expect(rtlElement).toBeInTheDocument();
    });
  });

  describe('Timer Display and Formatting', () => {
    it('should display initial timer as 00:00:00', () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      expect(screen.getByText('00:00:00')).toBeInTheDocument();
    });

    it('should display total time correctly formatted', () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={125} />
      );

      expect(screen.getByText('02:05:00')).toBeInTheDocument();
    });

    it('should display zero total time correctly', () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={0} />
      );

      expect(screen.getByText('00:00:00')).toBeInTheDocument();
    });
  });

  describe('Category Management', () => {
    it('should render category selector', () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      expect(screen.getByPlaceholderText('בחר קטגוריה...')).toBeInTheDocument();
    });

    it('should show categories when dropdown is opened', async () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      const categorySelect = screen.getByRole('combobox');
      fireEvent.click(categorySelect);

      await waitFor(() => {
        expect(screen.getByText('מכירה')).toBeInTheDocument();
        expect(screen.getByText('יצירה')).toBeInTheDocument();
        expect(screen.getByText('עריכה')).toBeInTheDocument();
      });
    });

    it('should allow category selection', async () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      const categorySelect = screen.getByRole('combobox');
      fireEvent.click(categorySelect);

      await waitFor(() => {
        fireEvent.click(screen.getByText('מכירה'));
      });

      expect(categorySelect).toHaveValue('מכירה');
    });
  });

  describe('Timer Operations', () => {
    it('should prevent starting timer without category', async () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      const startButton = screen.getByText('התחל');
      fireEvent.click(startButton);

      const toast = require('sonner').toast;
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('אנא בחר קטגוריה');
      });
    });

    it('should start timer with category selected', async () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      // Select category
      const categorySelect = screen.getByRole('combobox');
      fireEvent.click(categorySelect);
      await waitFor(() => {
        fireEvent.click(screen.getByText('מכירה'));
      });

      // Start timer
      const startButton = screen.getByText('התחל');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://test-supabase.supabase.co/functions/v1/work-time-manager',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              action: 'start',
              entityType: 'client',
              entityId: 'test-client-1',
              notes: '|מכירה'
            })
          })
        );
      });
    });

    it('should update timer display in real-time', async () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      // Select category and start timer
      const categorySelect = screen.getByRole('combobox');
      fireEvent.click(categorySelect);
      await waitFor(() => {
        fireEvent.click(screen.getByText('מכירה'));
      });

      const startButton = screen.getByText('התחל');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('עצור')).toBeInTheDocument();
      });

      // Advance time and check display
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.getByText('00:00:03')).toBeInTheDocument();
      });
    });
  });

  describe('Session Description', () => {
    it('should allow entering session description', () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      const descriptionInput = screen.getByPlaceholderText('תיאור מה אני עושה...');
      fireEvent.change(descriptionInput, { target: { value: 'Working on feature' } });

      expect(descriptionInput).toHaveValue('Working on feature');
    });

    it('should include description in timer start call', async () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      // Enter description
      const descriptionInput = screen.getByPlaceholderText('תיאור מה אני עושה...');
      fireEvent.change(descriptionInput, { target: { value: 'Feature development' } });

      // Select category
      const categorySelect = screen.getByRole('combobox');
      fireEvent.click(categorySelect);
      await waitFor(() => {
        fireEvent.click(screen.getByText('יצירה'));
      });

      // Start timer
      const startButton = screen.getByText('התחל');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({
              action: 'start',
              entityType: 'client',
              entityId: 'test-client-1',
              notes: 'Feature development|יצירה'
            })
          })
        );
      });
    });
  });

  describe('Activities Display', () => {
    it('should display activities section when data exists', async () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      await waitFor(() => {
        expect(screen.getByText('פעילויות שנרשמו:')).toBeInTheDocument();
      });
    });

    it('should display activity table headers', async () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      await waitFor(() => {
        expect(screen.getByText('זמן')).toBeInTheDocument();
        expect(screen.getByText('תיאור')).toBeInTheDocument();
        expect(screen.getByText('קטגוריה')).toBeInTheDocument();
        expect(screen.getByText('משך')).toBeInTheDocument();
      });
    });

    it('should display category summary section', async () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      await waitFor(() => {
        expect(screen.getByText('סיכום זמנים:')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      // Select category and try to start timer
      const categorySelect = screen.getByRole('combobox');
      fireEvent.click(categorySelect);
      await waitFor(() => {
        fireEvent.click(screen.getByText('מכירה'));
      });

      const startButton = screen.getByText('התחל');
      fireEvent.click(startButton);

      const toast = require('sonner').toast;
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should handle database query errors', async () => {
      const supabase = require('@/integrations/supabase/client').supabase;
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: null,
                  error: { message: 'Database error' }
                }))
              }))
            }))
          }))
        }))
      });

      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      // Component should still render despite error
      expect(screen.getByText('מעקב זמני עבודה')).toBeInTheDocument();
    });
  });

  describe('Entity Type Support', () => {
    it('should work with client entity type', () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      expect(screen.getByText('מעקב זמני עבודה')).toBeInTheDocument();
    });

    it('should work with lead entity type', () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="lead" entityId="test-lead-1" totalWorkTimeMinutes={90} />
      );

      expect(screen.getByText('מעקב זמני עבודה')).toBeInTheDocument();
    });
  });

  describe('Hebrew Language Support', () => {
    it('should display Hebrew interface elements', () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      expect(screen.getByText('מעקב זמני עבודה')).toBeInTheDocument();
      expect(screen.getByText('התחל')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('בחר קטגוריה...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('תיאור מה אני עושה...')).toBeInTheDocument();
    });

    it('should display Hebrew category names', async () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={120} />
      );

      const categorySelect = screen.getByRole('combobox');
      fireEvent.click(categorySelect);

      await waitFor(() => {
        expect(screen.getByText('מכירה')).toBeInTheDocument();
        expect(screen.getByText('יצירה')).toBeInTheDocument();
        expect(screen.getByText('עריכה')).toBeInTheDocument();
        expect(screen.getByText('אפיון')).toBeInTheDocument();
        expect(screen.getByText('לוגיסטיקה')).toBeInTheDocument();
        expect(screen.getByText('אחר')).toBeInTheDocument();
      });
    });
  });

  describe('Component Behavior Edge Cases', () => {
    it('should handle zero total work time', () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={0} />
      );

      expect(screen.getByText('00:00:00')).toBeInTheDocument();
    });

    it('should handle large total work time values', () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={7200} />
      );

      expect(screen.getByText('120:00:00')).toBeInTheDocument(); // 7200 minutes = 120 hours
    });

    it('should handle undefined total work time', () => {
      renderWithQueryClient(
        <WorkTimeTracker entityType="client" entityId="test-client-1" totalWorkTimeMinutes={undefined as any} />
      );

      expect(screen.getByText('00:00:00')).toBeInTheDocument();
    });
  });
});