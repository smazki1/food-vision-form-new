import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClientPackageManagement } from '../ClientPackageManagement';
import { Client } from '@/types/client';
import { Package } from '@/types/package';
import * as packageHooks from '@/hooks/usePackages';
import * as clientApi from '@/api/clientApi';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock the package hooks
vi.mock('@/hooks/usePackages');

// Mock client API
vi.mock('@/api/clientApi');

// Mock the PackageFormDialog
vi.mock('../../packages/PackageFormDialog', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) => (
    open ? (
      <div data-testid="package-form-dialog">
        <button onClick={onClose} data-testid="close-dialog">Close</button>
      </div>
    ) : null
  ),
}));

// Mock ClientsPackageName
vi.mock('../../clients/ClientsPackageName', () => ({
  default: ({ packageId }: { packageId: string | null }) => (
    <span data-testid="package-name">{packageId ? `Package-${packageId}` : 'No Package'}</span>
  ),
}));

describe('ClientPackageManagement', () => {
  let queryClient: QueryClient;
  
  const mockClient: Client = {
    client_id: 'client-1',
    restaurant_name: 'Test Restaurant',
    contact_name: 'John Doe',
    phone: '123456789',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    original_lead_id: null,
    client_status: 'active',
    current_package_id: 'package-1',
    remaining_servings: 10,
    last_activity_at: '2024-01-01T00:00:00Z',
    internal_notes: null,
    user_auth_id: 'user-1',
  };

  const mockPackages: Package[] = [
    {
      package_id: 'package-1',
      package_name: 'Basic Package',
      description: 'A basic package',
      total_servings: 20,
      price: 100,
      is_active: true,
      max_edits_per_serving: 2,
      max_processing_time_days: 7,
      special_notes: null,
      total_images: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      package_id: 'package-2',
      package_name: 'Premium Package',
      description: 'A premium package',
      total_servings: 50,
      price: 250,
      is_active: true,
      max_edits_per_serving: 5,
      max_processing_time_days: 5,
      special_notes: null,
      total_images: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    vi.clearAllMocks();
  });

  const renderComponent = (client = mockClient) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ClientPackageManagement clientId={client.client_id} client={client} />
      </QueryClientProvider>
    );
  };

  describe('Package Loading States', () => {
    it('should show loading state when packages are loading', () => {
      vi.mocked(packageHooks.usePackages).mockReturnValue({
        packages: [],
        isLoading: true,
        isError: false,
        error: null,
        invalidateCache: vi.fn(),
      });

      renderComponent();
      
      expect(screen.getByText('טוען חבילות...')).toBeInTheDocument();
    });

    it('should show packages when loaded successfully', () => {
      vi.mocked(packageHooks.usePackages).mockReturnValue({
        packages: mockPackages,
        isLoading: false,
        isError: false,
        error: null,
        invalidateCache: vi.fn(),
      });

      renderComponent();
      
      expect(screen.getByText('Basic Package')).toBeInTheDocument();
      expect(screen.getByText('Premium Package')).toBeInTheDocument();
    });
  });

  describe('Current Package Display', () => {
    it('should display current package information', () => {
      vi.mocked(packageHooks.usePackages).mockReturnValue({
        packages: mockPackages,
        isLoading: false,
        isError: false,
        error: null,
        invalidateCache: vi.fn(),
      });

      renderComponent();
      
      expect(screen.getByTestId('package-name')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument(); // remaining servings
      expect(screen.getByText('פעיל')).toBeInTheDocument(); // active badge
    });

    it('should show no package message when client has no package', () => {
      const clientWithoutPackage = { ...mockClient, current_package_id: null };
      
      vi.mocked(packageHooks.usePackages).mockReturnValue({
        packages: mockPackages,
        isLoading: false,
        isError: false,
        error: null,
        invalidateCache: vi.fn(),
      });

      renderComponent(clientWithoutPackage);
      
      expect(screen.getByText('לא הוקצתה חבילה')).toBeInTheDocument();
    });
  });

  describe('Package Selection', () => {
    beforeEach(() => {
      vi.mocked(packageHooks.usePackages).mockReturnValue({
        packages: mockPackages,
        isLoading: false,
        isError: false,
        error: null,
        invalidateCache: vi.fn(),
      });
    });

         it('should allow selecting a package', async () => {
       renderComponent();
       
       const premiumPackage = screen.getByText('Premium Package');
       fireEvent.click(premiumPackage.closest('div')!);
       
       await waitFor(() => {
         const packageCard = premiumPackage.closest('div')!;
         expect(packageCard).toHaveClass('border-blue-500', 'bg-blue-50');
       });
     });

    it('should update servings count when package is selected', async () => {
      renderComponent();
      
      const premiumPackage = screen.getByText('Premium Package');
      fireEvent.click(premiumPackage.closest('div')!);
      
      await waitFor(() => {
        const servingsInput = screen.getByDisplayValue('50');
        expect(servingsInput).toBeInTheDocument();
      });
    });

    it('should show assignment section when package is selected', async () => {
      renderComponent();
      
      const premiumPackage = screen.getByText('Premium Package');
      fireEvent.click(premiumPackage.closest('div')!);
      
      await waitFor(() => {
        expect(screen.getByText('הקצאת חבילה')).toBeInTheDocument();
        expect(screen.getByText('הקצה חבילה')).toBeInTheDocument();
      });
    });
  });

  describe('Package Assignment', () => {
    beforeEach(() => {
      vi.mocked(packageHooks.usePackages).mockReturnValue({
        packages: mockPackages,
        isLoading: false,
        isError: false,
        error: null,
        invalidateCache: vi.fn(),
      });
      
      vi.mocked(clientApi.assignPackageToClient).mockResolvedValue(mockClient);
    });

    it('should assign selected package to client', async () => {
      renderComponent();
      
      // Select premium package
      const premiumPackage = screen.getByText('Premium Package');
      fireEvent.click(premiumPackage.closest('div')!);
      
      await waitFor(() => {
        const assignButton = screen.getByText('הקצה חבילה');
        fireEvent.click(assignButton);
      });
      
      await waitFor(() => {
        expect(clientApi.assignPackageToClient).toHaveBeenCalledWith(
          'client-1',
          'package-2',
          50,
          'הוקצתה חבילה: Premium Package',
          undefined
        );
      });
    });

    it('should allow custom servings count', async () => {
      renderComponent();
      
      // Select premium package
      const premiumPackage = screen.getByText('Premium Package');
      fireEvent.click(premiumPackage.closest('div')!);
      
      await waitFor(() => {
        const servingsInput = screen.getByDisplayValue('50');
        fireEvent.change(servingsInput, { target: { value: '30' } });
      });
      
      const assignButton = screen.getByText('הקצה חבילה');
      fireEvent.click(assignButton);
      
      await waitFor(() => {
        expect(clientApi.assignPackageToClient).toHaveBeenCalledWith(
          'client-1',
          'package-2',
          30,
          'הוקצתה חבילה: Premium Package',
          undefined
        );
      });
    });

    it('should show error when no package is selected', async () => {
      const { toast } = await import('sonner');
      
      renderComponent();
      
      // Try to assign without selecting a package (current package is selected by default)
      // First clear the selection by clicking cancel
      const premiumPackage = screen.getByText('Premium Package');
      fireEvent.click(premiumPackage.closest('div')!);
      
      await waitFor(() => {
        const cancelButton = screen.getByText('ביטול');
        fireEvent.click(cancelButton);
      });
      
      // Now try to assign
      await waitFor(() => {
        const assignButton = screen.getByText('הקצה חבילה');
        fireEvent.click(assignButton);
      });
      
      expect(toast.error).toHaveBeenCalledWith('אנא בחר חבילה לפני ההקצאה');
    });
  });

  describe('Package Creation', () => {
    beforeEach(() => {
      vi.mocked(packageHooks.usePackages).mockReturnValue({
        packages: mockPackages,
        isLoading: false,
        isError: false,
        error: null,
        invalidateCache: vi.fn(),
      });
    });

    it('should open package creation dialog', async () => {
      renderComponent();
      
      const createButton = screen.getByText('צור חבילה חדשה');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('package-form-dialog')).toBeInTheDocument();
      });
    });

    it('should handle package creation success', async () => {
      renderComponent();
      
      const createButton = screen.getByText('צור חבילה חדשה');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        const closeButton = screen.getByTestId('close-dialog');
        fireEvent.click(closeButton);
      });
      
      // Dialog should be closed after creation
      await waitFor(() => {
        expect(screen.queryByTestId('package-form-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no packages exist', () => {
      vi.mocked(packageHooks.usePackages).mockReturnValue({
        packages: [],
        isLoading: false,
        isError: false,
        error: null,
        invalidateCache: vi.fn(),
      });

      renderComponent();
      
      expect(screen.getByText('לא נמצאו חבילות פעילות במערכת')).toBeInTheDocument();
      expect(screen.getByText('צור חבילה חדשה להתחיל')).toBeInTheDocument();
    });

    it('should filter out inactive packages', () => {
      const packagesWithInactive = [
        ...mockPackages,
        {
          ...mockPackages[0],
          package_id: 'package-3',
          package_name: 'Inactive Package',
          is_active: false,
        },
      ];

      vi.mocked(packageHooks.usePackages).mockReturnValue({
        packages: packagesWithInactive,
        isLoading: false,
        isError: false,
        error: null,
        invalidateCache: vi.fn(),
      });

      renderComponent();
      
      expect(screen.getByText('Basic Package')).toBeInTheDocument();
      expect(screen.getByText('Premium Package')).toBeInTheDocument();
      expect(screen.queryByText('Inactive Package')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle assignment errors gracefully', async () => {
      const { toast } = await import('sonner');
      
      vi.mocked(packageHooks.usePackages).mockReturnValue({
        packages: mockPackages,
        isLoading: false,
        isError: false,
        error: null,
        invalidateCache: vi.fn(),
      });
      
      vi.mocked(clientApi.assignPackageToClient).mockRejectedValue(new Error('API Error'));

      renderComponent();
      
      // Select and assign package
      const premiumPackage = screen.getByText('Premium Package');
      fireEvent.click(premiumPackage.closest('div')!);
      
      await waitFor(() => {
        const assignButton = screen.getByText('הקצה חבילה');
        fireEvent.click(assignButton);
      });
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('שגיאה בהקצאת החבילה');
      });
    });
  });
}); 