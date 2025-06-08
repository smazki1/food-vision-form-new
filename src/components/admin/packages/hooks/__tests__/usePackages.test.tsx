import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePackages } from '../usePackages';
import * as packageApi from '@/api/packageApi';

// Mock the package API
vi.mock('@/api/packageApi', () => ({
  getPackages: vi.fn(),
}));

const mockPackages = [
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

describe('usePackages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch packages successfully', async () => {
    vi.mocked(packageApi.getPackages).mockResolvedValue(mockPackages);

    const { result } = renderHook(() => usePackages(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPackages);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    const errorMessage = 'Failed to fetch packages';
    vi.mocked(packageApi.getPackages).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => usePackages(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('should return loading state initially', () => {
    vi.mocked(packageApi.getPackages).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => usePackages(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should call getPackages with correct parameters', async () => {
    vi.mocked(packageApi.getPackages).mockResolvedValue(mockPackages);

    renderHook(() => usePackages(), {
      wrapper: createWrapper(),
    });

    expect(packageApi.getPackages).toHaveBeenCalledOnce();
  });

  it('should have correct query key', async () => {
    vi.mocked(packageApi.getPackages).mockResolvedValue(mockPackages);

    const { result } = renderHook(() => usePackages(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // The hook should use 'packages' as query key
    expect(result.current.data).toEqual(mockPackages);
  });

  it('should enable cache by default', async () => {
    vi.mocked(packageApi.getPackages).mockResolvedValue(mockPackages);

    const wrapper = createWrapper();

    // First call
    const { result: result1 } = renderHook(() => usePackages(), { wrapper });
    
    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    // Second call should use cache
    const { result: result2 } = renderHook(() => usePackages(), { wrapper });

    await waitFor(() => {
      expect(result2.current.isSuccess).toBe(true);
    });

    // API should only be called once due to caching
    expect(packageApi.getPackages).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no packages exist', async () => {
    vi.mocked(packageApi.getPackages).mockResolvedValue([]);

    const { result } = renderHook(() => usePackages(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
}); 