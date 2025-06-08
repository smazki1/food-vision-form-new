import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'sonner';
import { ClientPackageManagement } from '@/components/admin/client-details/ClientPackageManagement';
import { Client } from '@/types/client';
import { Package } from '@/types/package';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/hooks/usePackages', () => ({
  usePackages: () => ({
    packages: mockPackages,
    isLoading: false,
    invalidateCache: vi.fn(),
  }),
}));

vi.mock('@/api/clientApi', () => ({
  assignPackageToClient: vi.fn(),
}));

vi.mock('@/api/packageApi', () => ({
  deletePackage: vi.fn(),
}));

vi.mock('../clients/ClientsPackageName', () => ({
  default: ({ packageId }: { packageId: string }) => <span>Package {packageId}</span>,
}));

vi.mock('../packages/PackageFormDialog', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="package-form-dialog">Package Form Dialog</div> : null,
}));

const mockClient: Client = {
  client_id: 'client-1',
  restaurant_name: 'Test Restaurant',
  current_package_id: 'package-1',
  remaining_servings: 5,
  contact_name: 'John Doe',
  phone: '123-456-7890',
  email: 'test@example.com',
  client_status: 'פעיל',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  original_lead_id: null,
  last_activity_at: '2024-01-01T00:00:00Z',
  internal_notes: null,
  user_auth_id: null,
};

const mockPackages: Package[] = [
  {
    package_id: 'package-1',
    package_name: 'Basic Package',
    description: 'Basic package description',
    total_servings: 10,
    price: 100,
    is_active: true,
    max_processing_time_days: 5,
    max_edits_per_serving: 2,
    special_notes: 'Basic notes',
    total_images: 20,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    package_id: 'package-2',
    package_name: 'Premium Package',
    description: 'Premium package description',
    total_servings: 20,
    price: 200,
    is_active: true,
    max_processing_time_days: 3,
    max_edits_per_serving: 5,
    special_notes: 'Premium notes',
    total_images: 50,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('ClientPackageManagement - Package Assignment Confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render current package status', () => {
    renderWithQueryClient(
      <ClientPackageManagement clientId="client-1" client={mockClient} />
    );

    expect(screen.getByText('חבילה נוכחית')).toBeInTheDocument();
    expect(screen.getByText('Package package-1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // remaining servings
  });

  it('should show package selection interface', () => {
    renderWithQueryClient(
      <ClientPackageManagement clientId="client-1" client={mockClient} />
    );

    expect(screen.getByText('בחירת חבילה')).toBeInTheDocument();
    expect(screen.getByText('Basic Package')).toBeInTheDocument();
    expect(screen.getByText('Premium Package')).toBeInTheDocument();
  });

  it('should show current package badge for assigned package', () => {
    renderWithQueryClient(
      <ClientPackageManagement clientId="client-1" client={mockClient} />
    );

    // The Basic Package (package-1) should have a "נוכחי" badge since it's the current package
    const basicPackageCard = screen.getByText('Basic Package').closest('div');
    expect(basicPackageCard).toContainHTML('נוכחי');
  });

  it('should show confirmation section when selecting a different package', async () => {
    renderWithQueryClient(
      <ClientPackageManagement clientId="client-1" client={mockClient} />
    );

    // Click on Premium Package (different from current)
    const premiumPackageCard = screen.getByText('Premium Package').closest('div');
    fireEvent.click(premiumPackageCard!);

    await waitFor(() => {
      expect(screen.getByText('אישור בחירת חבילה')).toBeInTheDocument();
      expect(screen.getByText('אשר והקצה חבילה')).toBeInTheDocument();
    });
  });

  it('should NOT show confirmation section when selecting the same package', async () => {
    renderWithQueryClient(
      <ClientPackageManagement clientId="client-1" client={mockClient} />
    );

    // Click on Basic Package (same as current)
    const basicPackageCard = screen.getByText('Basic Package').closest('div');
    fireEvent.click(basicPackageCard!);

    await waitFor(() => {
      expect(screen.queryByText('אישור בחירת חבילה')).not.toBeInTheDocument();
    });
  });

  it('should show package details in confirmation section', async () => {
    renderWithQueryClient(
      <ClientPackageManagement clientId="client-1" client={mockClient} />
    );

    // Select Premium Package
    const premiumPackageCard = screen.getByText('Premium Package').closest('div');
    fireEvent.click(premiumPackageCard!);

    await waitFor(() => {
      expect(screen.getByText('פרטי החבילה שנבחרה:')).toBeInTheDocument();
      expect(screen.getByText('Premium Package')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument(); // total servings
      expect(screen.getByText('₪200')).toBeInTheDocument(); // price
    });
  });

  it('should allow editing servings count in confirmation section', async () => {
    renderWithQueryClient(
      <ClientPackageManagement clientId="client-1" client={mockClient} />
    );

    // Select Premium Package
    const premiumPackageCard = screen.getByText('Premium Package').closest('div');
    fireEvent.click(premiumPackageCard!);

    await waitFor(() => {
      const servingsInput = screen.getByDisplayValue('20');
      fireEvent.change(servingsInput, { target: { value: '15' } });
      expect(servingsInput).toHaveValue(15);
    });
  });

  it('should show confirmation dialog when clicking confirm button', async () => {
    renderWithQueryClient(
      <ClientPackageManagement clientId="client-1" client={mockClient} />
    );

    // Select Premium Package
    const premiumPackageCard = screen.getByText('Premium Package').closest('div');
    fireEvent.click(premiumPackageCard!);

    await waitFor(() => {
      const confirmButton = screen.getByText('אשר והקצה חבילה');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(screen.getByText('אישור הקצאת חבילה')).toBeInTheDocument();
      expect(screen.getByText('Premium Package')).toBeInTheDocument();
      expect(screen.getByText('מספר מנות: 20')).toBeInTheDocument();
    });
  });

  it('should call assignPackageToClient when confirming assignment', async () => {
    const mockAssignPackage = vi.fn().mockResolvedValue(mockClient);
    vi.mocked(require('@/api/clientApi').assignPackageToClient).mockImplementation(mockAssignPackage);

    renderWithQueryClient(
      <ClientPackageManagement clientId="client-1" client={mockClient} />
    );

    // Select Premium Package
    const premiumPackageCard = screen.getByText('Premium Package').closest('div');
    fireEvent.click(premiumPackageCard!);

    await waitFor(() => {
      const confirmButton = screen.getByText('אשר והקצה חבילה');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      const finalConfirmButton = screen.getByText('אשר והקצה');
      fireEvent.click(finalConfirmButton);
    });

    await waitFor(() => {
      expect(mockAssignPackage).toHaveBeenCalledWith(
        'client-1',
        'package-2',
        20,
        'הוקצתה חבילה: Premium Package (20 מנות)',
        undefined
      );
    });
  });

  it('should show success toast when assignment succeeds', async () => {
    const mockAssignPackage = vi.fn().mockResolvedValue(mockClient);
    vi.mocked(require('@/api/clientApi').assignPackageToClient).mockImplementation(mockAssignPackage);

    renderWithQueryClient(
      <ClientPackageManagement clientId="client-1" client={mockClient} />
    );

    // Select and confirm Premium Package
    const premiumPackageCard = screen.getByText('Premium Package').closest('div');
    fireEvent.click(premiumPackageCard!);

    await waitFor(() => {
      fireEvent.click(screen.getByText('אשר והקצה חבילה'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByText('אשר והקצה'));
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'החבילה "Premium Package" הוקצתה בהצלחה ללקוח!'
      );
    });
  });

  it('should handle assignment errors gracefully', async () => {
    const mockAssignPackage = vi.fn().mockRejectedValue(new Error('Assignment failed'));
    vi.mocked(require('@/api/clientApi').assignPackageToClient).mockImplementation(mockAssignPackage);

    renderWithQueryClient(
      <ClientPackageManagement clientId="client-1" client={mockClient} />
    );

    // Select and confirm Premium Package
    const premiumPackageCard = screen.getByText('Premium Package').closest('div');
    fireEvent.click(premiumPackageCard!);

    await waitFor(() => {
      fireEvent.click(screen.getByText('אשר והקצה חבילה'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByText('אשר והקצה'));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('שגיאה בהקצאת החבילה');
    });
  });

  it('should reset selection when clicking cancel', async () => {
    renderWithQueryClient(
      <ClientPackageManagement clientId="client-1" client={mockClient} />
    );

    // Select Premium Package
    const premiumPackageCard = screen.getByText('Premium Package').closest('div');
    fireEvent.click(premiumPackageCard!);

    await waitFor(() => {
      expect(screen.getByText('אישור בחירת חבילה')).toBeInTheDocument();
    });

    // Click cancel
    const cancelButton = screen.getByText('ביטול');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('אישור בחירת חבילה')).not.toBeInTheDocument();
    });
  });
}); 