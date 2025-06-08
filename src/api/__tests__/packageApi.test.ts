import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getPackages, 
  getPackageById, 
  createPackage, 
  updatePackageViaRPC, 
  togglePackageActiveStatus,
  deletePackage 
} from '../packageApi';
import { supabase } from '@/integrations/supabase/client';
import { Package } from '@/types/package';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn()
  }
}));

const mockSupabase = supabase as any;

describe('Package API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockPackageData = {
    package_id: '123e4567-e89b-12d3-a456-426614174000',
    package_name: 'Test Package',
    description: 'Test Description',
    total_servings: 10,
    price: '500.00',
    is_active: true,
    max_processing_time_days: 7,
    max_edits_per_serving: 2,
    special_notes: 'Special notes for testing',
    total_images: 25,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const expectedTransformedPackage = {
    package_id: '123e4567-e89b-12d3-a456-426614174000',
    package_name: 'Test Package',
    description: 'Test Description',
    total_servings: 10,
    price: '500.00',
    is_active: true,
    max_processing_time_days: 7,
    max_edits_per_serving: 2,
    special_notes: 'Special notes for testing',
    total_images: 25,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  describe('getPackages', () => {
    it('should fetch and transform packages successfully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [mockPackageData],
          error: null
        })
      });
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      const result = await getPackages();

      expect(mockSupabase.from).toHaveBeenCalledWith('service_packages');
      expect(mockSelect).toHaveBeenCalledWith(
        'package_id, package_name, description, total_servings, price, is_active, created_at, updated_at, max_processing_time_days, max_edits_per_serving, special_notes, total_images'
      );
      expect(result).toEqual([expectedTransformedPackage]);
    });

    it('should handle errors when fetching packages', async () => {
      const mockError = new Error('Database error');
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: mockError
          })
        })
      });

      await expect(getPackages()).rejects.toThrow(mockError);
    });
  });

  describe('getPackageById', () => {
    it('should fetch package by ID successfully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockPackageData,
            error: null
          })
        })
      });
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      const result = await getPackageById('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual(expectedTransformedPackage);
    });

    it('should return null when package not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      const result = await getPackageById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('createPackage', () => {
    it('should create package successfully', async () => {
      const newPackageData = {
        package_name: 'New Package',
        description: 'New Description',
        total_servings: 5,
        price: 300,
        is_active: true,
        max_processing_time_days: 5,
        max_edits_per_serving: 1
      };

      // Mock the RPC response that createPackage actually uses
      mockSupabase.rpc.mockResolvedValue({
        data: { ...mockPackageData, package_name: 'New Package' },
        error: null
      });

      const result = await createPackage(newPackageData);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_service_package', 
        expect.objectContaining({
          p_package_name: 'New Package',
          p_description: 'New Description',
          p_total_servings: 5,
          p_price: 300,
          p_is_active: true,
          p_max_processing_time_days: 5,
          p_max_edits_per_serving: 1
        })
      );
      expect(result).toEqual(expect.objectContaining({
        package_name: 'New Package'
      }));
    });

    it('should handle zero values correctly', async () => {
      const zeroValueData = {
        ...mockPackageData,
        total_servings: 0,
        price: 0,
        max_processing_time_days: 0,
        max_edits_per_serving: 0,
        total_images: 0,
      };

      const mockResponse = {
        package_id: 'test-id',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        ...zeroValueData,
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      await createPackage(zeroValueData);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_service_package', {
        p_package_name: 'Test Package',
        p_description: 'Test Description',
        p_total_servings: 0,
        p_price: 0,
        p_is_active: true,
        p_max_processing_time_days: 0,
        p_max_edits_per_serving: 0,
        p_special_notes: 'Special notes for testing',
        p_total_images: 0,
      });
    });

    it('should fallback to direct insert when RPC fails', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' },
      });

      const mockFromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockPackageData,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockFromChain);

      const result = await createPackage(mockPackageData);

      expect(mockSupabase.from).toHaveBeenCalledWith('service_packages');
      expect(mockFromChain.insert).toHaveBeenCalled();
      expect(result.package_name).toBe('Test Package');
    });

    it('should throw error when both RPC and direct insert fail', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' },
      });

      const mockFromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockFromChain);

      await expect(createPackage(mockPackageData)).rejects.toThrow('Insert failed');
    });

    it('should handle undefined optional fields', async () => {
      const minimalData = {
        package_name: 'Minimal Package',
        description: undefined,
        total_servings: undefined,
        price: undefined,
        is_active: undefined,
        max_processing_time_days: undefined,
        max_edits_per_serving: undefined,
        special_notes: undefined,
        total_images: undefined,
      };

      mockSupabase.rpc.mockResolvedValue({
        data: { ...mockPackageData, ...minimalData },
        error: null,
      });

      await createPackage(minimalData as any);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_service_package', {
        p_package_name: 'Minimal Package',
        p_description: null,
        p_total_servings: null,
        p_price: null,
        p_is_active: true,
        p_max_processing_time_days: null,
        p_max_edits_per_serving: null,
        p_special_notes: null,
        p_total_images: null,
      });
    });
  });

  describe('updatePackageViaRPC', () => {
    it('should update package via RPC successfully', async () => {
      const updateData = {
        package_name: 'Updated Package',
        description: 'Updated Description',
        price: 600
      };

      mockSupabase.rpc.mockResolvedValue({
        data: { ...mockPackageData, package_name: 'Updated Package' },
        error: null
      });

      const result = await updatePackageViaRPC('123e4567-e89b-12d3-a456-426614174000', updateData);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_service_package', 
        expect.objectContaining({
          p_package_id: '123e4567-e89b-12d3-a456-426614174000',
          p_package_name: 'Updated Package',
          p_description: 'Updated Description',
          p_price: 600
        })
      );
      expect(result).toEqual(expect.objectContaining({
        package_name: 'Updated Package'
      }));
    });

    it('should handle RPC errors', async () => {
      const mockError = new Error('RPC error');
      
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(updatePackageViaRPC('123', {})).rejects.toThrow(mockError);
    });
  });

  describe('togglePackageActiveStatus', () => {
    it('should toggle package active status', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { ...mockPackageData, is_active: false },
        error: null
      });

      const result = await togglePackageActiveStatus('123e4567-e89b-12d3-a456-426614174000', false);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_service_package', 
        expect.objectContaining({
          p_package_id: '123e4567-e89b-12d3-a456-426614174000',
          p_is_active: false
        })
      );
      expect(result.is_active).toBe(false);
    });
  });

  describe('deletePackage', () => {
    it('should delete package successfully', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null
        })
      });
      
      mockSupabase.from.mockReturnValue({
        delete: mockDelete
      });

      await deletePackage('123e4567-e89b-12d3-a456-426614174000');

      expect(mockSupabase.from).toHaveBeenCalledWith('service_packages');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should handle delete errors', async () => {
      const mockError = new Error('Delete failed');
      
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: mockError
          })
        })
      });

      await expect(deletePackage('123')).rejects.toThrow(mockError);
    });
  });
}); 