import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import PackagesManagementPage from '../PackagesManagementPage';
import { usePackages } from '@/hooks/usePackages';

// Mock dependencies
vi.mock('@/hooks/usePackages', () => ({
  usePackages: vi.fn(),
}));
// Updated mocks to call the relevant props on click
vi.mock('@/components/admin/packages/components/PackagesHeader', () => ({
  default: (props: any) => (
    <div data-testid="header" onClick={props.onAddPackage} />
  )
}));
vi.mock('@/components/admin/packages/components/PackagesTable', () => ({
  default: (props: any) => (
    <div data-testid="table" onClick={() => props.onEditPackage && props.onEditPackage({ package_id: 'mock', package_name: 'Mock', total_servings: 1, price: 1, is_active: true, max_edits_per_serving: 1, created_at: '', updated_at: '' })} />
  )
}));
vi.mock('@/components/admin/packages/PackageFormDialog', () => ({
  default: (props: any) => props.open ? <div data-testid="dialog">Dialog</div> : null
}));
vi.mock('@/components/admin/packages/components/PackagesLoadingState', () => ({
  default: () => <div data-testid="loading">Loading...</div>
}));

describe('PackagesManagementPage', () => {
  const mockUsePackages = vi.fn();
  
  beforeEach(() => {
    vi.mocked(usePackages).mockImplementation(mockUsePackages);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUsePackages.mockReturnValue({ isLoading: true });
    render(<PackagesManagementPage />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders error state', () => {
    usePackages.mockReturnValue({ isLoading: false, isError: true, error: new Error('fail') });
    render(<PackagesManagementPage />);
    expect(screen.getByText(/Failed to Load Packages/i)).toBeInTheDocument();
    expect(screen.getByText(/fail/)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    usePackages.mockReturnValue({ isLoading: false, isError: false, packages: [] });
    render(<PackagesManagementPage />);
    expect(screen.getByText(/No Packages Found/i)).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders table with packages (happy path)', () => {
    usePackages.mockReturnValue({
      isLoading: false,
      isError: false,
      packages: [
        { package_id: '1', package_name: 'Basic', total_servings: 5, price: 100, is_active: true, max_edits_per_serving: 1, created_at: '', updated_at: '' },
      ],
    });
    render(<PackagesManagementPage />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  it('opens dialog on add click (integration)', async () => {
    usePackages.mockReturnValue({ isLoading: false, isError: false, packages: [] });
    render(<PackagesManagementPage />);
    // Simulate add click
    fireEvent.click(screen.getByTestId('header'));
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
  });

  it('opens dialog on edit click (integration)', async () => {
    usePackages.mockReturnValue({
      isLoading: false,
      isError: false,
      packages: [
        { package_id: '1', package_name: 'Basic', total_servings: 5, price: 100, is_active: true, max_edits_per_serving: 1, created_at: '', updated_at: '' },
      ],
    });
    render(<PackagesManagementPage />);
    // Simulate edit click via table
    fireEvent.click(screen.getByTestId('table'));
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
  });

  // Edge case: package with missing fields
  it('handles package with missing optional fields', () => {
    usePackages.mockReturnValue({
      isLoading: false,
      isError: false,
      packages: [
        { package_id: '2', package_name: 'Edge', total_servings: 0, price: 0, is_active: false, max_edits_per_serving: 0, created_at: '', updated_at: '' },
      ],
    });
    render(<PackagesManagementPage />);
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });
}); 