import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getPackages, 
  getPackageById, 
  createPackage, 
  updatePackageViaRPC, 
  togglePackageActiveStatus,
  deletePackage 
} from '../packageApi';
import { supabase } from '@/integrations/supabase/client';

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

  const mockPackageData = {
    package_id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Package',
    description: 'Test Description',
    total_servings: 10,
    price: '500.00',
    is_active: true,
    features_tags: ['feature1', 'feature2'],
    max_processing_time_days: 7,
    max_edits_per_serving: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const expectedTransformedPackage = {
    package_id: '123e4567-e89b-12d3-a456-426614174000',
    package_name: 'Test Package', // Note: transformed from 'name'
    description: 'Test Description',
    total_servings: 10,
    price: '500.00',
    is_active: true,
    features_tags: ['feature1', 'feature2'],
    max_processing_time_days: 7,
    max_edits_per_serving: 2,
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
        'package_id, name, description, total_servings, price, is_active, created_at, updated_at, features_tags, max_processing_time_days, max_edits_per_serving'
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
        features_tags: ['new-feature'],
        max_processing_time_days: 5,
        max_edits_per_serving: 1
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...mockPackageData, name: 'New Package' },
            error: null
          })
        })
      });
      
      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      });

      const result = await createPackage(newPackageData);

      expect(mockSupabase.from).toHaveBeenCalledWith('service_packages');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Package', // Should be transformed to 'name'
          description: 'New Description',
          total_servings: 5,
          price: 300
        })
      );
      expect(result).toEqual(expect.objectContaining({
        package_name: 'New Package'
      }));
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
        data: { ...mockPackageData, name: 'Updated Package' },
        error: null
      });

      const result = await updatePackageViaRPC('123e4567-e89b-12d3-a456-426614174000', updateData);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_service_package', 
        expect.objectContaining({
          p_package_id: '123e4567-e89b-12d3-a456-426614174000',
          p_name: 'Updated Package',
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