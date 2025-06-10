import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientPackageManagement } from '../ClientPackageManagement';
import { usePackages } from '@/hooks/usePackages';
import { useClientSubmissionStats } from '@/hooks/useClientSubmissions';
import { assignPackageToClientWithImages } from '@/api/clientApi';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/hooks/usePackages');
vi.mock('@/hooks/useClientSubmissions');
vi.mock('@/api/clientApi');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: null,
          }))
        }))
      }))
    }))
  }
}));

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const mockClient = {
  client_id: 'client-1',
  restaurant_name: 'Test Restaurant',
  contact_name: 'Test Contact',
  phone: '123-456-7890',
  email: 'test@example.com',
  current_package_id: null,
  remaining_servings: 10,
  remaining_images: 5,
  notes: '',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ai_trainings_count: 0,
  original_lead_id: null,
  client_status: 'active',
  consumed_images: 0,
  reserved_images: 0,
  last_activity: null,
  priority: 'normal',
} as any;

const mockPackages = [
  {
    package_id: 'package-1',
    package_name: 'Basic Package',
    total_servings: 15,
    total_images: 8,
    price: 100,
    max_edits_per_serving: 3,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    description: null,
  },
  {
    package_id: 'package-2',
    package_name: 'Premium Package',
    total_servings: 25,
    total_images: 12,
    price: 200,
    max_edits_per_serving: 5,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    description: null,
  }
] as any[];

describe('OptimisticPackageAssignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(usePackages).mockReturnValue({
      packages: mockPackages,
      isLoading: false,
      isError: false,
      error: new Error('Test error'),
      invalidateCache: vi.fn(),
    });
    
    vi.mocked(useClientSubmissionStats).mockReturnValue({
      data: { 
        total: 3, 
        processed: 2, 
        pending: 1,
        byStatus: { processed: 2, pending: 1 },
        byType: { dish: 2, drink: 1 }
      },
      refetch: vi.fn(),
    });
  });

  describe('Happy Path Tests', () => {
    it('should successfully assign package with optimistic updates', async () => {
      const updatedClient = {
        ...mockClient,
        current_package_id: 'package-1',
        remaining_servings: 25, // 10 + 15
        remaining_images: 13,   // 5 + 8
      };

      vi.mocked(assignPackageToClientWithImages).mockResolvedValue(updatedClient);

      render(
        <ClientPackageManagement clientId="client-1" client={mockClient} />,
        { wrapper: createTestWrapper() }
      );

      // Find and click package
      const packageCard = screen.getByText('Basic Package').closest('div');
      expect(packageCard).toBeInTheDocument();

      fireEvent.click(packageCard!);

      // Should show immediate loading on clicked package
      await waitFor(() => {
        expect(screen.getByText('מקצה חבילה...')).toBeInTheDocument();
      });

      // Should show immediate success toast (optimistic)
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          '✅ החבילה "Basic Package" הוקצתה ללקוח Test Restaurant!'
        );
      });

      // Should call API with correct parameters
      await waitFor(() => {
        expect(assignPackageToClientWithImages).toHaveBeenCalledWith(
          'client-1',
          'package-1',
          15,  // servings
          8,   // images
          'הוקצתה חבילה: Basic Package (15 מנות, 8 תמונות)',
          undefined
        );
      });

      // Loading should clear after completion
      await waitFor(() => {
        expect(screen.queryByText('מקצה חבילה...')).not.toBeInTheDocument();
      });
    });

    it('should handle package with zero values correctly', async () => {
      const zeroPackage = {
        ...mockPackages[0],
        package_id: 'package-zero',
        package_name: 'Zero Package',
        total_servings: 0,
        total_images: 0,
        price: 0,
      };

      vi.mocked(usePackages).mockReturnValue({
        packages: [zeroPackage],
        isLoading: false,
        isError: false,
        error: new Error('Test error'),
        invalidateCache: vi.fn(),
      });

      vi.mocked(assignPackageToClientWithImages).mockResolvedValue({
        ...mockClient,
        current_package_id: 'package-zero',
        remaining_servings: 11, // Should add 1 when both are zero
      });

      render(
        <ClientPackageManagement clientId="client-1" client={mockClient} />,
        { wrapper: createTestWrapper() }
      );

      const packageCard = screen.getByText('Zero Package').closest('div');
      fireEvent.click(packageCard!);

      // Should assign 1 serving when both values are zero
      await waitFor(() => {
        expect(assignPackageToClientWithImages).toHaveBeenCalledWith(
          'client-1',
          'package-zero',
          1,  // Should be 1, not 0
          0,  // Images stay 0
          'הוקצתה חבילה: Zero Package (1 מנות, 0 תמונות)',
          undefined
        );
      });
    });

    it('should show correct styling for current package', async () => {
      const clientWithPackage = {
        ...mockClient,
        current_package_id: 'package-1',
      };

      render(
        <ClientPackageManagement clientId="client-1" client={clientWithPackage} />,
        { wrapper: createTestWrapper() }
      );

      // Current package should have green styling - simplified check
      // Use getAllByText to handle multiple instances of the same text
      const currentPackageElements = screen.getAllByText('חבילה נוכחית');
      expect(currentPackageElements).toHaveLength(2); // Header and badge
      
      // Header element should be present (first element is in header)
      expect(currentPackageElements[0]).toBeInTheDocument();
      
      // Badge element should be present (second element is the badge)
      expect(currentPackageElements[1]).toBeInTheDocument();
      expect(currentPackageElements[1]).toHaveClass('bg-green-100', 'text-green-800');
    });
  });

  describe('Edge Cases', () => {
    it('should prevent double-clicking during assignment', async () => {
      // Setup slow assignment
      vi.mocked(assignPackageToClientWithImages).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          ...mockClient,
          current_package_id: 'package-1'
        }), 200))
      );

      render(
        <ClientPackageManagement clientId="client-1" client={mockClient} />,
        { wrapper: createTestWrapper() }
      );

      const packageCard = screen.getByText('Basic Package').closest('div');
      
      // First click
      fireEvent.click(packageCard!);
      
      // Wait for loading state before second click
      await waitFor(() => {
        expect(screen.getByText('מקצה חבילה...')).toBeInTheDocument();
      });
      
      // Second click while loading (should be ignored)
      fireEvent.click(packageCard!);

      // API should only be called once
      await waitFor(() => {
        expect(assignPackageToClientWithImages).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle missing package gracefully', async () => {
      vi.mocked(usePackages).mockReturnValue({
        packages: [],
        isLoading: false,
        isError: false,
        error: new Error('Test error'),
        invalidateCache: vi.fn(),
      });

      render(
        <ClientPackageManagement clientId="client-1" client={mockClient} />,
        { wrapper: createTestWrapper() }
      );

      // Should show empty state
      expect(screen.getByText('לא נמצאו חבילות פעילות במערכת')).toBeInTheDocument();

      // No API call should be made for missing packages
      expect(assignPackageToClientWithImages).not.toHaveBeenCalled();
    });

    it('should filter inactive packages', async () => {
      const inactivePackage = {
        ...mockPackages[0],
        package_id: 'package-inactive',
        package_name: 'Inactive Package',
        is_active: false,
      };

      vi.mocked(usePackages).mockReturnValue({
        packages: [...mockPackages, inactivePackage],
        isLoading: false,
        isError: false,
        error: new Error('Test error'),
        invalidateCache: vi.fn(),
      });

      render(
        <ClientPackageManagement clientId="client-1" client={mockClient} />,
        { wrapper: createTestWrapper() }
      );

      // Active packages should be visible
      expect(screen.getByText('Basic Package')).toBeInTheDocument();
      expect(screen.getByText('Premium Package')).toBeInTheDocument();

      // Inactive package should not be visible
      expect(screen.queryByText('Inactive Package')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should rollback optimistic updates on assignment failure', async () => {
      // Setup failing assignment
      vi.mocked(assignPackageToClientWithImages).mockRejectedValue(
        new Error('Network error')
      );

      render(
        <ClientPackageManagement clientId="client-1" client={mockClient} />,
        { wrapper: createTestWrapper() }
      );

      const packageCard = screen.getByText('Basic Package').closest('div');
      fireEvent.click(packageCard!);

      // Should show immediate success first (optimistic)
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          '✅ החבילה "Basic Package" הוקצתה ללקוח Test Restaurant!'
        );
      });

      // Then should show error after API fails
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'שגיאה בהקצאת החבילה "Basic Package": Network error'
        );
      });

      // Loading state should be cleared
      await waitFor(() => {
        expect(screen.queryByText('מקצה חבילה...')).not.toBeInTheDocument();
      });
    });

    it('should handle API error without message', async () => {
      // Setup failing assignment with non-Error object
      vi.mocked(assignPackageToClientWithImages).mockRejectedValue('String error');

      render(
        <ClientPackageManagement clientId="client-1" client={mockClient} />,
        { wrapper: createTestWrapper() }
      );

      const packageCard = screen.getByText('Basic Package').closest('div');
      fireEvent.click(packageCard!);

      // Should show error with unknown message
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'שגיאה בהקצאת החבילה "Basic Package": Unknown error'
        );
      });
    });
  });

  describe('Performance Tests', () => {
    it('should complete optimistic update in under 100ms', async () => {
      vi.mocked(assignPackageToClientWithImages).mockResolvedValue({
        ...mockClient,
        current_package_id: 'package-1'
      });

      const startTime = performance.now();
      
      render(
        <ClientPackageManagement clientId="client-1" client={mockClient} />,
        { wrapper: createTestWrapper() }
      );

      const packageCard = screen.getByText('Basic Package').closest('div');
      fireEvent.click(packageCard!);

      // Check that success toast appears quickly (optimistic)
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Optimistic update should be fast
      expect(duration).toBeLessThan(100);
    });

    it('should handle concurrent package assignments correctly', async () => {
      vi.mocked(assignPackageToClientWithImages)
        .mockResolvedValueOnce({ ...mockClient, current_package_id: 'package-1' })
        .mockResolvedValueOnce({ ...mockClient, current_package_id: 'package-2' });

      render(
        <ClientPackageManagement clientId="client-1" client={mockClient} />,
        { wrapper: createTestWrapper() }
      );

      const package1Card = screen.getByText('Basic Package').closest('div');
      const package2Card = screen.getByText('Premium Package').closest('div');

      // Click both packages rapidly
      fireEvent.click(package1Card!);
      fireEvent.click(package2Card!);

      // Should handle both clicks - concurrent assignment may allow both if no loading state check
      await waitFor(() => {
        expect(assignPackageToClientWithImages).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should refresh data correctly on button click', async () => {
      const mockRefetch = vi.fn();
      
      vi.mocked(useClientSubmissionStats).mockReturnValue({
        data: { 
          total: 3, 
          processed: 2, 
          pending: 1,
          byStatus: { processed: 2, pending: 1 },
          byType: { dish: 2, drink: 1 }
        },
        refetch: mockRefetch,
      });

      render(
        <ClientPackageManagement clientId="client-1" client={mockClient} />,
        { wrapper: createTestWrapper() }
      );

      // Find refresh button
      const refreshButton = screen.getByTitle('רענן נתונים');
      expect(refreshButton).toBeInTheDocument();

      fireEvent.click(refreshButton);

      // Should show loading state
      await waitFor(() => {
        expect(refreshButton.querySelector('.animate-spin')).toBeInTheDocument();
      });

      // Should call refetch functions
      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });

      // Should show success message
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('הנתונים רוענו בהצלחה');
      });
    });

    it('should display submission stats correctly', async () => {
      render(
        <ClientPackageManagement clientId="client-1" client={mockClient} />,
        { wrapper: createTestWrapper() }
      );

      // Should show stats from mock data
      expect(screen.getByText('הגשות: 3')).toBeInTheDocument();
      expect(screen.getByText('מעובדות: 2')).toBeInTheDocument();
      expect(screen.getByText('בהמתנה: 1')).toBeInTheDocument();
    });

    it('should handle loading state during packages fetch', async () => {
      vi.mocked(usePackages).mockReturnValue({
        packages: [],
        isLoading: true,
        isError: false,
        error: new Error('Test error'),
        invalidateCache: vi.fn(),
      });

      render(
        <ClientPackageManagement clientId="client-1" client={mockClient} />,
        { wrapper: createTestWrapper() }
      );

      // Should show loading state
      expect(screen.getByText('טוען חבילות...')).toBeInTheDocument();
      // Find the specific spinner element
      const spinner = screen.getByText('טוען חבילות...').parentElement?.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should handle null package values correctly', async () => {
      const nullPackage = {
        ...mockPackages[0],
        package_id: 'package-null',
        package_name: 'Null Package',
        total_servings: null,
        total_images: null,
      };

      vi.mocked(usePackages).mockReturnValue({
        packages: [nullPackage],
        isLoading: false,
        isError: false,
        error: new Error('Test error'),
        invalidateCache: vi.fn(),
      });

      vi.mocked(assignPackageToClientWithImages).mockResolvedValue({
        ...mockClient,
        current_package_id: 'package-null',
        remaining_servings: 11, // Should add 1 when both are null
      });

      render(
        <ClientPackageManagement clientId="client-1" client={mockClient} />,
        { wrapper: createTestWrapper() }
      );

      // Should display 0 for null values
      expect(screen.getByText('0 מנות')).toBeInTheDocument();
      expect(screen.getByText('0 תמונות')).toBeInTheDocument();

      const packageCard = screen.getByText('Null Package').closest('div');
      fireEvent.click(packageCard!);

      // Should handle null values properly (convert to 0, then apply default of 1)
      await waitFor(() => {
        expect(assignPackageToClientWithImages).toHaveBeenCalledWith(
          'client-1',
          'package-null',
          1,  // Default when both are null/0
          0,  // Null converted to 0
          'הוקצתה חבילה: Null Package (1 מנות, 0 תמונות)',
          undefined
        );
      });
    });
  });
}); 