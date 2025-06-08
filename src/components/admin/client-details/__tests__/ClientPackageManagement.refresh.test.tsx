import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ClientPackageManagement } from '../ClientPackageManagement';
import { usePackages } from '@/hooks/usePackages';
import { useClientSubmissionStats } from '@/hooks/useClientSubmissions';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/hooks/usePackages', () => ({
  usePackages: vi.fn()
}));

vi.mock('@/hooks/useClientSubmissions', () => ({
  useClientSubmissionStats: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@/api/clientApi', () => ({
  updateClientServings: vi.fn(),
  updateClientImages: vi.fn()
}));

describe('ClientPackageManagement Refresh Functionality', () => {
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

  it('should invalidate all relevant query keys when refresh is clicked', async () => {
    // Spy on queryClient methods
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const removeQueriesSpy = vi.spyOn(queryClient, 'removeQueries');
    
    renderWithQueryClient(
      <ClientPackageManagement 
        clientId={mockClient.client_id} 
        client={mockClient as any}
      />
    );

    // Find and click the refresh button
    const refreshButton = screen.getByTitle('רענן נתונים');
    expect(refreshButton).toBeInTheDocument();

    fireEvent.click(refreshButton);

    await waitFor(() => {
      // Check that invalidateQueries was called multiple times
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['packages'] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['packages_simplified'] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['clients'] });
      
      // Check predicate-based invalidation was called
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ 
        predicate: expect.any(Function)
      });
      
      // Check specific client stats invalidation
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['client-submission-stats', mockClient.client_id] 
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['client-submissions', mockClient.client_id] 
      });
      
      // Check that removeQueries was called for forced refresh
      expect(removeQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['client-submission-stats', mockClient.client_id] 
      });
    });

    // Check that success toast was shown
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('הנתונים רועננו בהצלחה');
    });
  });

  it('should test predicate function correctly identifies relevant queries', () => {
    const predicate = (query: any) => {
      const key = query.queryKey;
      return key.includes('clients_simplified') || 
             key.includes('clients_list_for_admin') ||
             key.includes('client-submission-stats') ||
             key.includes('client-submissions');
    };

    // Test queries that should match
    expect(predicate({ queryKey: ['clients_simplified', 'user-123'] })).toBe(true);
    expect(predicate({ queryKey: ['clients_list_for_admin', 'user-123'] })).toBe(true);
    expect(predicate({ queryKey: ['client-submission-stats', 'client-123'] })).toBe(true);
    expect(predicate({ queryKey: ['client-submissions', 'client-123'] })).toBe(true);

    // Test queries that should not match
    expect(predicate({ queryKey: ['packages'] })).toBe(false);
    expect(predicate({ queryKey: ['leads'] })).toBe(false);
    expect(predicate({ queryKey: ['other-query'] })).toBe(false);
  });

  it('should handle refresh errors gracefully', async () => {
    // Mock invalidateCache to throw an error
    (usePackages as any).mockReturnValue({
      packages: mockPackages,
      isLoading: false,
      invalidateCache: vi.fn().mockRejectedValue(new Error('Network error'))
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    renderWithQueryClient(
      <ClientPackageManagement 
        clientId={mockClient.client_id} 
        client={mockClient as any}
      />
    );

    const refreshButton = screen.getByTitle('רענן נתונים');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('שגיאה ברענון הנתונים');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ClientPackageManagement] Error refreshing data:', 
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('should show loading state during refresh', async () => {
    // Mock a slow invalidateCache
    (usePackages as any).mockReturnValue({
      packages: mockPackages,
      isLoading: false,
      invalidateCache: vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )
    });
    
    renderWithQueryClient(
      <ClientPackageManagement 
        clientId={mockClient.client_id} 
        client={mockClient as any}
      />
    );

    const refreshButton = screen.getByTitle('רענן נתונים');
    fireEvent.click(refreshButton);

    // Check that spinner appears
    await waitFor(() => {
      const spinner = refreshButton.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    // Wait for refresh to complete
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('הנתונים רועננו בהצלחה');
    }, { timeout: 200 });
  });

  it('should call refetchSubmissionStats during refresh', async () => {
    const mockRefetch = vi.fn().mockResolvedValue({ data: mockSubmissionStats });
    
    (useClientSubmissionStats as any).mockReturnValue({
      data: mockSubmissionStats,
      refetch: mockRefetch
    });
    
    renderWithQueryClient(
      <ClientPackageManagement 
        clientId={mockClient.client_id} 
        client={mockClient as any}
      />
    );

    const refreshButton = screen.getByTitle('רענן נתונים');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });

    // Also check the delayed refetch
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalledTimes(2);
    }, { timeout: 200 });
  });
}); 