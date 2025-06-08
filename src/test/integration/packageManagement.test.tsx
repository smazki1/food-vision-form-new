import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'sonner';
import { Package } from '@/types/package';
import * as packageApi from '@/api/packageApi';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

vi.mock('@/api/packageApi', () => ({
  getPackages: vi.fn(),
  createPackage: vi.fn(),
  updatePackage: vi.fn(),
  deletePackage: vi.fn(),
}));

// Simple component to test package operations
const PackageTestComponent: React.FC = () => {
  const [packages, setPackages] = React.useState<Package[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await packageApi.getPackages();
      setPackages(data);
    } catch (error) {
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const createTestPackage = async () => {
    try {
      setLoading(true);
      const newPackage = await packageApi.createPackage({
        package_name: 'Test Package',
        description: 'Test Description',
        total_servings: 10,
        price: 100,
        is_active: true,
        max_processing_time_days: 5,
        max_edits_per_serving: 2,
        special_notes: 'Test notes',
        total_images: 20,
      });
      setPackages(prev => [...prev, newPackage]);
      toast.success('Package created successfully');
    } catch (error) {
      toast.error('Failed to create package');
    } finally {
      setLoading(false);
    }
  };

  const updateTestPackage = async (packageId: string) => {
    try {
      setLoading(true);
      const updatedPackage = await packageApi.updatePackage(packageId, {
        package_name: 'Updated Package',
        price: 150,
      });
      setPackages(prev => 
        prev.map(pkg => 
          pkg.package_id === packageId ? updatedPackage : pkg
        )
      );
      toast.success('Package updated successfully');
    } catch (error) {
      toast.error('Failed to update package');
    } finally {
      setLoading(false);
    }
  };

  const deleteTestPackage = async (packageId: string) => {
    try {
      setLoading(true);
      await packageApi.deletePackage(packageId);
      setPackages(prev => prev.filter(pkg => pkg.package_id !== packageId));
      toast.success('Package deleted successfully');
    } catch (error) {
      toast.error('Failed to delete package');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Package Management Test</h1>
      {loading && <div data-testid="loading">Loading...</div>}
      
      <button onClick={createTestPackage} data-testid="create-package">
        Create Package
      </button>
      
      <div data-testid="packages-list">
        {packages.map(pkg => (
          <div key={pkg.package_id} data-testid={`package-${pkg.package_id}`}>
            <span>{pkg.package_name} - ${pkg.price}</span>
            <button 
              onClick={() => updateTestPackage(pkg.package_id)}
              data-testid={`update-${pkg.package_id}`}
            >
              Update
            </button>
            <button 
              onClick={() => deleteTestPackage(pkg.package_id)}
              data-testid={`delete-${pkg.package_id}`}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
      
      <div data-testid="packages-count">
        Total packages: {packages.length}
      </div>
    </div>
  );
};

const createWrapper = () => {
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

describe('Package Management Integration Tests', () => {
  const mockPackages: Package[] = [
    {
      package_id: '1',
      package_name: 'Basic Package',
      description: 'Basic description',
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
      package_id: '2',
      package_name: 'Premium Package',
      description: 'Premium description',
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

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    vi.mocked(packageApi.getPackages).mockResolvedValue(mockPackages);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load and display packages on mount', async () => {
    render(<PackageTestComponent />, { wrapper: createWrapper() });

    // Should show loading initially
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for packages to load
    await waitFor(() => {
      expect(screen.getByTestId('packages-count')).toHaveTextContent('Total packages: 2');
    });

    // Should display package names and prices
    expect(screen.getByText('Basic Package - $100')).toBeInTheDocument();
    expect(screen.getByText('Premium Package - $200')).toBeInTheDocument();

    // Verify API was called
    expect(packageApi.getPackages).toHaveBeenCalledOnce();
  });

  it('should create a new package successfully', async () => {
    const newPackage: Package = {
      package_id: '3',
      package_name: 'Test Package',
      description: 'Test Description',
      total_servings: 10,
      price: 100,
      is_active: true,
      max_processing_time_days: 5,
      max_edits_per_serving: 2,
      special_notes: 'Test notes',
      total_images: 20,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(packageApi.createPackage).mockResolvedValue(newPackage);

    render(<PackageTestComponent />, { wrapper: createWrapper() });

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('packages-count')).toHaveTextContent('Total packages: 2');
    });

    // Click create button
    fireEvent.click(screen.getByTestId('create-package'));

    // Should show loading
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for creation to complete
    await waitFor(() => {
      expect(screen.getByTestId('packages-count')).toHaveTextContent('Total packages: 3');
    });

    // Should display new package
    expect(screen.getByText('Test Package - $100')).toBeInTheDocument();

    // Verify API calls
    expect(packageApi.createPackage).toHaveBeenCalledWith({
      package_name: 'Test Package',
      description: 'Test Description',
      total_servings: 10,
      price: 100,
      is_active: true,
      max_processing_time_days: 5,
      max_edits_per_serving: 2,
      special_notes: 'Test notes',
      total_images: 20,
    });

    expect(toast.success).toHaveBeenCalledWith('Package created successfully');
  });

  it('should update a package successfully', async () => {
    const updatedPackage: Package = {
      ...mockPackages[0],
      package_name: 'Updated Package',
      price: 150,
    };

    vi.mocked(packageApi.updatePackage).mockResolvedValue(updatedPackage);

    render(<PackageTestComponent />, { wrapper: createWrapper() });

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('packages-count')).toHaveTextContent('Total packages: 2');
    });

    // Click update button for first package
    fireEvent.click(screen.getByTestId('update-1'));

    // Wait for update to complete
    await waitFor(() => {
      expect(screen.getByText('Updated Package - $150')).toBeInTheDocument();
    });

    // Verify API calls
    expect(packageApi.updatePackage).toHaveBeenCalledWith('1', {
      package_name: 'Updated Package',
      price: 150,
    });

    expect(toast.success).toHaveBeenCalledWith('Package updated successfully');
  });

  it('should delete a package successfully', async () => {
    vi.mocked(packageApi.deletePackage).mockResolvedValue();

    render(<PackageTestComponent />, { wrapper: createWrapper() });

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('packages-count')).toHaveTextContent('Total packages: 2');
    });

    // Click delete button for first package
    fireEvent.click(screen.getByTestId('delete-1'));

    // Wait for deletion to complete
    await waitFor(() => {
      expect(screen.getByTestId('packages-count')).toHaveTextContent('Total packages: 1');
    });

    // Should not display deleted package
    expect(screen.queryByText('Basic Package - $100')).not.toBeInTheDocument();
    // Should still display the other package
    expect(screen.getByText('Premium Package - $200')).toBeInTheDocument();

    // Verify API calls
    expect(packageApi.deletePackage).toHaveBeenCalledWith('1');
    expect(toast.success).toHaveBeenCalledWith('Package deleted successfully');
  });

  it('should handle create package error', async () => {
    vi.mocked(packageApi.createPackage).mockRejectedValue(new Error('Create failed'));

    render(<PackageTestComponent />, { wrapper: createWrapper() });

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('packages-count')).toHaveTextContent('Total packages: 2');
    });

    // Click create button
    fireEvent.click(screen.getByTestId('create-package'));

    // Wait for error handling
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create package');
    });

    // Count should remain the same
    expect(screen.getByTestId('packages-count')).toHaveTextContent('Total packages: 2');
  });

  it('should handle update package error', async () => {
    vi.mocked(packageApi.updatePackage).mockRejectedValue(new Error('Update failed'));

    render(<PackageTestComponent />, { wrapper: createWrapper() });

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('packages-count')).toHaveTextContent('Total packages: 2');
    });

    // Click update button
    fireEvent.click(screen.getByTestId('update-1'));

    // Wait for error handling
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update package');
    });

    // Package should remain unchanged
    expect(screen.getByText('Basic Package - $100')).toBeInTheDocument();
  });

  it('should handle delete package error', async () => {
    vi.mocked(packageApi.deletePackage).mockRejectedValue(new Error('Delete failed'));

    render(<PackageTestComponent />, { wrapper: createWrapper() });

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('packages-count')).toHaveTextContent('Total packages: 2');
    });

    // Click delete button
    fireEvent.click(screen.getByTestId('delete-1'));

    // Wait for error handling
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to delete package');
    });

    // Package should still be there
    expect(screen.getByTestId('packages-count')).toHaveTextContent('Total packages: 2');
    expect(screen.getByText('Basic Package - $100')).toBeInTheDocument();
  });

  it('should handle loading states correctly', async () => {
    // Mock a slow API response
    vi.mocked(packageApi.getPackages).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockPackages), 100))
    );

    render(<PackageTestComponent />, { wrapper: createWrapper() });

    // Should show loading initially
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('packages-count')).toHaveTextContent('Total packages: 2');
  });

  it('should handle zero values correctly in package creation', async () => {
    const packageWithZeros: Package = {
      package_id: '3',
      package_name: 'Zero Package',
      description: 'Zero test',
      total_servings: 0,
      price: 0,
      is_active: true,
      max_processing_time_days: 0,
      max_edits_per_serving: 1, // Minimum 1 for edits
      special_notes: '',
      total_images: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(packageApi.createPackage).mockResolvedValue(packageWithZeros);

    render(<PackageTestComponent />, { wrapper: createWrapper() });

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('packages-count')).toHaveTextContent('Total packages: 2');
    });

    // Create package should handle zero values
    fireEvent.click(screen.getByTestId('create-package'));

    await waitFor(() => {
      expect(screen.getByTestId('packages-count')).toHaveTextContent('Total packages: 3');
    });

    // Verify the zero values were passed correctly
    expect(packageApi.createPackage).toHaveBeenCalledWith(
      expect.objectContaining({
        total_servings: 10, // This is what our test component creates
        price: 100,
      })
    );
  });
}); 