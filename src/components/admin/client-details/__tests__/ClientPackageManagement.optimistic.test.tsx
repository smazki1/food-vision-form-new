import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ClientPackageManagement } from '../ClientPackageManagement';
import { usePackages } from '@/hooks/usePackages';
import { useClientSubmissionStats } from '@/hooks/useClientSubmissions';
import { updateClientServings, updateClientImages } from '@/api/clientApi';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/hooks/usePackages', () => ({
  usePackages: vi.fn()
}));

vi.mock('@/hooks/useClientSubmissions', () => ({
  useClientSubmissionStats: vi.fn()
}));

vi.mock('@/api/clientApi', () => ({
  updateClientServings: vi.fn(),
  updateClientImages: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));

describe('ClientPackageManagement Optimistic Updates', () => {
  let queryClient: QueryClient;
  const mockClient = {
    client_id: 'test-client-123',
    restaurant_name: 'Test Restaurant',
    contact_name: 'Test Contact',
    email: 'test@example.com',
    phone: '123-456-7890',
    current_package_id: 'package-123',
    remaining_servings: 10,
    remaining_images: 15,
    consumed_images: 5,
    reserved_images: 0,
    client_status: 'פעיל',
    last_activity_at: new Date().toISOString()
  };

  const mockUpdatedClientServings = {
    ...mockClient,
    remaining_servings: 11
  };

  const mockUpdatedClientImages = {
    ...mockClient,
    remaining_images: 16
  };

  const mockPackages = [
    {
      package_id: 'package-123',
      package_name: 'Test Package',
      total_dishes: 20,
      total_images: 30,
      price: 100,
      is_active: true
    }
  ];

  const mockSubmissionStats = {
    total: 5,
    processed: 3,
    pending: 2,
    byStatus: {},
    byType: {}
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    // Mock the hooks
    (usePackages as any).mockReturnValue({
      packages: mockPackages,
      isLoading: false,
      invalidateCache: vi.fn().mockResolvedValue(true)
    });

    (useClientSubmissionStats as any).mockReturnValue({
      data: mockSubmissionStats,
      refetch: vi.fn().mockResolvedValue({ data: mockSubmissionStats })
    });

    // Mock API functions
    (updateClientServings as any).mockResolvedValue(mockUpdatedClientServings);
    (updateClientImages as any).mockResolvedValue(mockUpdatedClientImages);

    // Clear toast mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should show optimistic update immediately when increasing servings', async () => {
    renderWithQueryClient(
      <ClientPackageManagement 
        clientId={mockClient.client_id} 
        client={mockClient as any}
      />
    );

    // Find the current servings count
    const servingsBadge = screen.getByText('10');
    expect(servingsBadge).toBeInTheDocument();

    // Find and click the +1 servings button
    const increaseButton = screen.getByRole('button', { name: '' });
    fireEvent.click(increaseButton);

    // The UI should show optimistic update immediately
    await waitFor(() => {
      expect(updateClientServings).toHaveBeenCalledWith(
        'test-client-123', 
        11, 
        'הוספת 1 מנות ידנית (10 → 11)'
      );
    });

    // Verify the API was called
    expect(updateClientServings).toHaveBeenCalledTimes(1);
  });

  it('should show optimistic update immediately when increasing images', async () => {
    renderWithQueryClient(
      <ClientPackageManagement 
        clientId={mockClient.client_id} 
        client={mockClient as any}
      />
    );

    // Find the current images count
    const imagesBadge = screen.getByText('15');
    expect(imagesBadge).toBeInTheDocument();

    // Find images section buttons (they should be after servings section)
    const allButtons = screen.getAllByRole('button');
    const imageIncreaseButton = allButtons.find(button => 
      button.querySelector('.h-3.w-3') && 
      button.getAttribute('class')?.includes('h-7 w-7')
    );

    if (imageIncreaseButton) {
      fireEvent.click(imageIncreaseButton);

      await waitFor(() => {
        expect(updateClientImages).toHaveBeenCalledWith(
          'test-client-123', 
          16, 
          'הוספת 1 תמונות ידנית (15 → 16)'
        );
      });
    }
  });

  it('should handle +5 servings correctly', async () => {
    renderWithQueryClient(
      <ClientPackageManagement 
        clientId={mockClient.client_id} 
        client={mockClient as any}
      />
    );

    // Find and click the +5 servings button
    const increaseFiveButton = screen.getByText('+5');
    fireEvent.click(increaseFiveButton);

    await waitFor(() => {
      expect(updateClientServings).toHaveBeenCalledWith(
        'test-client-123', 
        15, 
        'הוספת 5 מנות ידנית (10 → 15)'
      );
    });
  });

  it('should handle -1 servings correctly and respect minimum of 0', async () => {
    const clientWithLowServings = {
      ...mockClient,
      remaining_servings: 1
    };

    renderWithQueryClient(
      <ClientPackageManagement 
        clientId={clientWithLowServings.client_id} 
        client={clientWithLowServings as any}
      />
    );

    // Find the decrease button (minus sign)
    const decreaseButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('.h-3.w-3')
    );
    const decreaseButton = decreaseButtons[0]; // First minus button should be for servings

    fireEvent.click(decreaseButton);

    await waitFor(() => {
      expect(updateClientServings).toHaveBeenCalledWith(
        'test-client-123', 
        0, 
        'הפחתת 1 מנות ידנית (1 → 0)'
      );
    });
  });

  it('should update cache immediately on successful mutation', async () => {
    renderWithQueryClient(
      <ClientPackageManagement 
        clientId={mockClient.client_id} 
        client={mockClient as any}
      />
    );

    // Spy on queryClient setQueryData
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

    // Click increase servings
    const increaseButton = screen.getByRole('button', { name: '' });
    fireEvent.click(increaseButton);

    await waitFor(() => {
      // Check that cache was updated with optimistic value first
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['client-detail', 'test-client-123'],
        expect.any(Function)
      );
    });

    // Wait for successful mutation
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('מנות עודכנו ל-11');
    });

    // Verify cache was updated with real data
    expect(setQueryDataSpy).toHaveBeenCalledWith(
      ['client-detail', 'test-client-123'],
      mockUpdatedClientServings
    );
  });

  it('should rollback optimistic update on mutation error', async () => {
    // Mock API to fail
    (updateClientServings as any).mockRejectedValue(new Error('Network error'));

    renderWithQueryClient(
      <ClientPackageManagement 
        clientId={mockClient.client_id} 
        client={mockClient as any}
      />
    );

    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Click increase servings
    const increaseButton = screen.getByRole('button', { name: '' });
    fireEvent.click(increaseButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('שגיאה בעדכון המנות');
    });

    // Verify rollback occurred
    expect(setQueryDataSpy).toHaveBeenCalledTimes(2); // Once for optimistic, once for rollback

    consoleSpy.mockRestore();
  });

  it('should disable buttons during mutation', async () => {
    // Mock a slow API call
    (updateClientServings as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockUpdatedClientServings), 100))
    );

    renderWithQueryClient(
      <ClientPackageManagement 
        clientId={mockClient.client_id} 
        client={mockClient as any}
      />
    );

    const increaseButton = screen.getByRole('button', { name: '' });
    fireEvent.click(increaseButton);

    // Button should be disabled during mutation
    await waitFor(() => {
      expect(increaseButton).toBeDisabled();
    });

    // Wait for mutation to complete
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('מנות עודכנו ל-11');
    }, { timeout: 200 });
  });
}); 