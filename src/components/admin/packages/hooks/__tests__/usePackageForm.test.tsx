import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePackageForm } from '../usePackageForm';
import { Package } from '@/types/package';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/api/packageApi', () => ({
  createPackage: vi.fn(),
  updatePackage: vi.fn(),
}));

import * as packageApi from '@/api/packageApi';

const mockPackage: Package = {
  package_id: 'test-id',
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

describe('usePackageForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty form for create mode', () => {
    const { result } = renderHook(() => usePackageForm(), {
      wrapper: createWrapper(),
    });

    expect(result.current.form.getValues()).toEqual({
      package_name: '',
      description: '',
      total_servings: '',
      price: '',
      is_active: true,
      max_processing_time_days: '',
      max_edits_per_serving: '',
      special_notes: '',
      total_images: '',
    });
  });

  it('should initialize with package data for edit mode', () => {
    const { result } = renderHook(() => usePackageForm(mockPackage), {
      wrapper: createWrapper(),
    });

    expect(result.current.form.getValues()).toEqual({
      package_name: 'Test Package',
      description: 'Test Description',
      total_servings: '10',
      price: '100',
      is_active: true,
      max_processing_time_days: '5',
      max_edits_per_serving: '2',
      special_notes: 'Test notes',
      total_images: '20',
    });
  });

  it('should create package successfully', async () => {
    const createdPackage = { ...mockPackage };
    vi.mocked(packageApi.createPackage).mockResolvedValue(createdPackage);
    
    const mockOnSuccess = vi.fn();
    const { result } = renderHook(() => usePackageForm(undefined, mockOnSuccess), {
      wrapper: createWrapper(),
    });

    const formData = {
      package_name: 'New Package',
      description: 'New Description',
      total_servings: '15',
      price: '150',
      is_active: true,
      max_processing_time_days: '7',
      max_edits_per_serving: '3',
      special_notes: 'New notes',
      total_images: '25',
    };

    await act(async () => {
      await result.current.onSubmit(formData);
    });

    expect(packageApi.createPackage).toHaveBeenCalledWith({
      package_name: 'New Package',
      description: 'New Description',
      total_servings: 15,
      price: 150,
      is_active: true,
      max_processing_time_days: 7,
      max_edits_per_serving: 3,
      special_notes: 'New notes',
      total_images: 25,
    });

    expect(toast.success).toHaveBeenCalledWith('החבילה נוצרה בהצלחה');
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('should update package successfully', async () => {
    const updatedPackage = { ...mockPackage, package_name: 'Updated Package' };
    vi.mocked(packageApi.updatePackage).mockResolvedValue(updatedPackage);
    
    const mockOnSuccess = vi.fn();
    const { result } = renderHook(() => usePackageForm(mockPackage, mockOnSuccess), {
      wrapper: createWrapper(),
    });

    const formData = {
      package_name: 'Updated Package',
      description: 'Test Description',
      total_servings: '10',
      price: '100',
      is_active: true,
      max_processing_time_days: '5',
      max_edits_per_serving: '2',
      special_notes: 'Test notes',
      total_images: '20',
    };

    await act(async () => {
      await result.current.onSubmit(formData);
    });

    expect(packageApi.updatePackage).toHaveBeenCalledWith('test-id', {
      package_name: 'Updated Package',
      description: 'Test Description',
      total_servings: 10,
      price: 100,
      is_active: true,
      max_processing_time_days: 5,
      max_edits_per_serving: 2,
      special_notes: 'Test notes',
      total_images: 20,
    });

    expect(toast.success).toHaveBeenCalledWith('החבילה עודכנה בהצלחה');
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('should handle create error', async () => {
    vi.mocked(packageApi.createPackage).mockRejectedValue(new Error('Create failed'));
    
    const { result } = renderHook(() => usePackageForm(), {
      wrapper: createWrapper(),
    });

    const formData = {
      package_name: 'New Package',
      description: '',
      total_servings: '',
      price: '',
      is_active: true,
      max_processing_time_days: '',
      max_edits_per_serving: '',
      special_notes: '',
      total_images: '',
    };

    await act(async () => {
      await result.current.onSubmit(formData);
    });

    expect(toast.error).toHaveBeenCalledWith('שגיאה ביצירת החבילה');
  });

  it('should handle update error', async () => {
    vi.mocked(packageApi.updatePackage).mockRejectedValue(new Error('Update failed'));
    
    const { result } = renderHook(() => usePackageForm(mockPackage), {
      wrapper: createWrapper(),
    });

    const formData = {
      package_name: 'Updated Package',
      description: 'Test Description',
      total_servings: '10',
      price: '100',
      is_active: true,
      max_processing_time_days: '5',
      max_edits_per_serving: '2',
      special_notes: 'Test notes',
      total_images: '20',
    };

    await act(async () => {
      await result.current.onSubmit(formData);
    });

    expect(toast.error).toHaveBeenCalledWith('שגיאה בעדכון החבילה');
  });

  it('should handle empty string to null conversion', async () => {
    const createdPackage = { ...mockPackage };
    vi.mocked(packageApi.createPackage).mockResolvedValue(createdPackage);
    
    const { result } = renderHook(() => usePackageForm(), {
      wrapper: createWrapper(),
    });

    const formData = {
      package_name: 'Minimal Package',
      description: '',
      total_servings: '',
      price: '',
      is_active: true,
      max_processing_time_days: '',
      max_edits_per_serving: '',
      special_notes: '',
      total_images: '',
    };

    await act(async () => {
      await result.current.onSubmit(formData);
    });

    expect(packageApi.createPackage).toHaveBeenCalledWith({
      package_name: 'Minimal Package',
      description: null,
      total_servings: null,
      price: null,
      is_active: true,
      max_processing_time_days: null,
      max_edits_per_serving: null,
      special_notes: null,
      total_images: null,
    });
  });

  it('should handle zero values correctly', async () => {
    const createdPackage = { ...mockPackage };
    vi.mocked(packageApi.createPackage).mockResolvedValue(createdPackage);
    
    const { result } = renderHook(() => usePackageForm(), {
      wrapper: createWrapper(),
    });

    const formData = {
      package_name: 'Zero Values Package',
      description: 'Zero test',
      total_servings: '0',
      price: '0',
      is_active: true,
      max_processing_time_days: '0',
      max_edits_per_serving: '0',
      special_notes: 'Zero notes',
      total_images: '0',
    };

    await act(async () => {
      await result.current.onSubmit(formData);
    });

    expect(packageApi.createPackage).toHaveBeenCalledWith({
      package_name: 'Zero Values Package',
      description: 'Zero test',
      total_servings: 0,
      price: 0,
      is_active: true,
      max_processing_time_days: 0,
      max_edits_per_serving: 0,
      special_notes: 'Zero notes',
      total_images: 0,
    });
  });

  it('should show loading state during submission', async () => {
    vi.mocked(packageApi.createPackage).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    const { result } = renderHook(() => usePackageForm(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    const formData = {
      package_name: 'Test Package',
      description: '',
      total_servings: '',
      price: '',
      is_active: true,
      max_processing_time_days: '',
      max_edits_per_serving: '',
      special_notes: '',
      total_images: '',
    };

    act(() => {
      result.current.onSubmit(formData);
    });

    expect(result.current.isPending).toBe(true);
  });
}); 