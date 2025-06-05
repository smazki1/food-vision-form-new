import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usePackageForm, formValuesToApiData, packageToDefaultValues } from '../usePackageForm';
import * as packageApi from '@/api/packageApi';
import { Package } from '@/types/package';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@/api/packageApi', () => ({
  createPackage: vi.fn(),
  updatePackageViaRPC: vi.fn()
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('usePackageForm', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPackage: Package = {
    package_id: '123e4567-e89b-12d3-a456-426614174000',
    package_name: 'Test Package',
    description: 'Test Description',
    total_servings: 10,
    price: 500,
    is_active: true,
    max_processing_time_days: 7,
    max_edits_per_serving: 2,
    special_notes: 'Special notes for testing',
    total_images: 25,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  describe('formValuesToApiData', () => {
    it('should transform form values to API data correctly', () => {
      const formData = {
        package_name: 'Test Package',
        description: 'Test Description',
        total_servings: 10,
        price: 500,
        is_active: true,
        max_edits_per_serving: 2,
        max_processing_time_days: 7,
        special_notes: 'Special notes for testing',
        total_images: 25,
      };

      const result = formValuesToApiData(formData);

      expect(result).toEqual({
        package_name: 'Test Package',
        description: 'Test Description',
        total_servings: 10,
        price: 500,
        is_active: true,
        max_edits_per_serving: 2,
        max_processing_time_days: 7,
        special_notes: 'Special notes for testing',
        total_images: 25,
      });
    });

    it('should handle empty special_notes and total_images', () => {
      const formData = {
        package_name: 'Test Package',
        description: 'Test Description',
        total_servings: 10,
        price: 500,
        is_active: true,
        max_edits_per_serving: 2,
        max_processing_time_days: null,
        special_notes: '',
        total_images: null,
      };

      const result = formValuesToApiData(formData);
      expect(result.special_notes).toBe('');
      expect(result.total_images).toBeUndefined();
    });
  });

  describe('packageToDefaultValues', () => {
    it('should convert package to default form values', () => {
      const result = packageToDefaultValues(mockPackage);

      expect(result).toEqual({
        package_name: 'Test Package',
        description: 'Test Description',
        total_servings: 10,
        price: 500,
        is_active: true,
        max_edits_per_serving: 2,
        max_processing_time_days: 7,
        special_notes: 'Special notes for testing',
        total_images: 25,
      });
    });

    it('should return default values when package is null', () => {
      const result = packageToDefaultValues(null);

      expect(result).toEqual({
        package_name: '',
        description: '',
        total_servings: 0,
        price: 0,
        is_active: true,
        max_edits_per_serving: 1,
        max_processing_time_days: null,
        special_notes: '',
        total_images: null,
      });
    });

    it('should handle packages with missing optional fields', () => {
      const packageWithMissingFields = {
        ...mockPackage,
        description: undefined,
        special_notes: undefined,
        total_images: undefined,
        max_processing_time_days: undefined,
      };

      const result = packageToDefaultValues(packageWithMissingFields);

      expect(result.description).toBe('');
      expect(result.special_notes).toBe('');
      expect(result.total_images).toBeNull();
      expect(result.max_processing_time_days).toBeNull();
    });
  });

  describe('usePackageForm hook', () => {
    it('should initialize in create mode when no package provided', () => {
      const { result } = renderHook(
        () => usePackageForm(null, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.isEditMode).toBe(false);
      expect(result.current.isPending).toBe(false);
      expect(result.current.defaultValues).toEqual({
        package_name: '',
        description: '',
        total_servings: 0,
        price: 0,
        is_active: true,
        max_edits_per_serving: 1,
        max_processing_time_days: null,
        special_notes: '',
        total_images: null,
      });
    });

    it('should initialize in edit mode when package provided', () => {
      const { result } = renderHook(
        () => usePackageForm(mockPackage, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.isEditMode).toBe(true);
      expect(result.current.isPending).toBe(false);
      expect(result.current.defaultValues.package_name).toBe('Test Package');
    });

    it('should handle successful package creation', async () => {
      const mockCreatedPackage = { ...mockPackage };
      vi.mocked(packageApi.createPackage).mockResolvedValue(mockCreatedPackage);

      const { result } = renderHook(
        () => usePackageForm(null, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      const formData = {
        package_name: 'New Package',
        description: 'New Description',
        total_servings: 5,
        price: 300,
        is_active: true,
        max_edits_per_serving: 1,
        max_processing_time_days: null,
        special_notes: '',
        total_images: null,
      };

      await act(async () => {
        result.current.handleSubmit(formData);
      });

      expect(packageApi.createPackage).toHaveBeenCalledWith(
        expect.objectContaining({
          package_name: 'New Package',
          description: 'New Description',
          total_servings: 5,
          price: 300,
          is_active: true,
          max_edits_per_serving: 1,
          special_notes: '',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('החבילה נוצרה בהצלחה');
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('should handle successful package update', async () => {
      const mockUpdatedPackage = { ...mockPackage, package_name: 'Updated Package' };
      vi.mocked(packageApi.updatePackageViaRPC).mockResolvedValue(mockUpdatedPackage);

      const { result } = renderHook(
        () => usePackageForm(mockPackage, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      const formData = {
        package_name: 'Updated Package',
        description: 'Updated Description',
        total_servings: 15,
        price: 600,
        is_active: true,
        max_edits_per_serving: 3,
        max_processing_time_days: 10,
        special_notes: 'Updated notes',
        total_images: 30,
      };

      await act(async () => {
        result.current.handleSubmit(formData);
      });

      expect(packageApi.updatePackageViaRPC).toHaveBeenCalledWith(
        mockPackage.package_id,
        expect.objectContaining({
          package_name: 'Updated Package',
          description: 'Updated Description',
          total_servings: 15,
          price: 600,
          is_active: true,
          max_edits_per_serving: 3,
          max_processing_time_days: 10,
          special_notes: 'Updated notes',
          total_images: 30,
        })
      );
      expect(toast.success).toHaveBeenCalledWith('החבילה עודכנה בהצלחה');
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('should handle creation errors', async () => {
      const mockError = new Error('Creation failed');
      vi.mocked(packageApi.createPackage).mockRejectedValue(mockError);

      const { result } = renderHook(
        () => usePackageForm(null, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      const formData = {
        package_name: 'New Package',
        description: 'New Description',
        total_servings: 5,
        price: 300,
        is_active: true,
        max_edits_per_serving: 1,
        max_processing_time_days: null,
        special_notes: '',
        total_images: null,
      };

      await act(async () => {
        result.current.handleSubmit(formData);
      });

      expect(toast.error).toHaveBeenCalledWith('שגיאה ביצירת החבילה');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should handle update errors', async () => {
      const mockError = new Error('Update failed');
      vi.mocked(packageApi.updatePackageViaRPC).mockRejectedValue(mockError);

      const { result } = renderHook(
        () => usePackageForm(mockPackage, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      const formData = {
        package_name: 'Updated Package',
        description: 'Updated Description',
        total_servings: 15,
        price: 600,
        is_active: true,
        max_edits_per_serving: 3,
        max_processing_time_days: 10,
        special_notes: '',
        total_images: null,
      };

      await act(async () => {
        result.current.handleSubmit(formData);
      });

      expect(toast.error).toHaveBeenCalledWith('שגיאה בעדכון החבילה');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should throw error when trying to update without package in edit mode', async () => {
      // Start with edit mode but then clear the package (edge case)
      const { result } = renderHook(
        () => usePackageForm(mockPackage, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      // Manually trigger update without package (shouldn't happen in real usage)
      vi.mocked(packageApi.updatePackageViaRPC).mockImplementation(() => {
        throw new Error('No package to edit');
      });

      const formData = {
        package_name: 'Test',
        description: '',
        total_servings: 1,
        price: 100,
        is_active: true,
        max_edits_per_serving: 1,
        max_processing_time_days: null,
        special_notes: '',
        total_images: null,
      };

      await act(async () => {
        result.current.handleSubmit(formData);
      });

      expect(toast.error).toHaveBeenCalledWith('שגיאה בעדכון החבילה');
    });
  });
}); 