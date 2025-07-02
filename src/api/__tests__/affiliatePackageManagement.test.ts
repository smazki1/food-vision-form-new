import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { affiliatePackageManagementApi } from '../affiliateApi';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase completely
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('Affiliate Package Management API', () => {
  const mockSupabaseFrom = vi.mocked(supabase.from);
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('assignPackageToAffiliateWithImages', () => {
    it('should successfully assign package to affiliate - happy path', async () => {
      const mockPackageData = {
        package_id: 'pkg-123',
        package_name: 'Premium Package',
        total_images: 10,
        total_servings: 5
      };

      const mockAffiliateData = {
        affiliate_id: 'aff-123',
        remaining_servings: 3,
        remaining_images: 8
      };

      // Create a mock query chain that allows method chaining
      const createMockChain = (finalResult: any) => {
        const chain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(finalResult),
          update: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null })
        };
        return chain;
      };

      // Mock the different table queries in sequence
      mockSupabaseFrom
        .mockReturnValueOnce(createMockChain({ data: mockPackageData, error: null })) // service_packages
        .mockReturnValueOnce(createMockChain({ data: mockAffiliateData, error: null })) // affiliates select
        .mockReturnValueOnce(createMockChain({ data: { ...mockAffiliateData, current_package_id: 'pkg-123' }, error: null })) // affiliates update
        .mockReturnValueOnce(createMockChain({ error: null })); // affiliate_assigned_packages insert

      const result = await affiliatePackageManagementApi.assignPackageToAffiliateWithImages(
        'pkg-123', 
        'aff-123', 
        5
      );

      expect(result.success).toBe(true);
      expect(result.affiliate).toBeDefined();
      expect(mockSupabaseFrom).toHaveBeenCalledTimes(4);
    });

    it('should handle package not found error', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Package not found', code: 'PGRST116' }
        })
      };

      mockSupabaseFrom.mockReturnValue(mockChain);

      const result = await affiliatePackageManagementApi.assignPackageToAffiliateWithImages(
        'invalid-pkg', 
        'aff-123', 
        5
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Package not found');
    });

    it('should handle null total_images gracefully', async () => {
      const packageWithNullImages = {
        package_id: 'pkg-123',
        package_name: 'Premium Package',
        total_images: null,
        total_servings: 5
      };

      const mockAffiliateData = {
        affiliate_id: 'aff-123',
        remaining_servings: 3,
        remaining_images: 8
      };

      const createMockChain = (finalResult: any) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(finalResult),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null })
      });

      mockSupabaseFrom
        .mockReturnValueOnce(createMockChain({ data: packageWithNullImages, error: null }))
        .mockReturnValueOnce(createMockChain({ data: mockAffiliateData, error: null }))
        .mockReturnValueOnce(createMockChain({ data: mockAffiliateData, error: null }))
        .mockReturnValueOnce(createMockChain({ error: null }));

      const result = await affiliatePackageManagementApi.assignPackageToAffiliateWithImages(
        'pkg-123', 
        'aff-123', 
        5
      );

      expect(result.success).toBe(true);
    });
  });

  describe('updateAffiliateServings', () => {
    it('should successfully update affiliate servings', async () => {
      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { affiliate_id: 'aff-123', remaining_servings: 15 },
          error: null
        })
      };

      mockSupabaseFrom.mockReturnValue(mockChain);

      const result = await affiliatePackageManagementApi.updateAffiliateServings('aff-123', 15);

      expect(result.success).toBe(true);
      expect(result.affiliate.remaining_servings).toBe(15);
    });

    it('should handle update errors', async () => {
      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' }
        })
      };

      mockSupabaseFrom.mockReturnValue(mockChain);

      const result = await affiliatePackageManagementApi.updateAffiliateServings('invalid-id', 15);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Update failed');
    });
  });

  describe('updateAffiliateImages', () => {
    it('should successfully update affiliate images', async () => {
      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { affiliate_id: 'aff-123', remaining_images: 25 },
          error: null
        })
      };

      mockSupabaseFrom.mockReturnValue(mockChain);

      const result = await affiliatePackageManagementApi.updateAffiliateImages('aff-123', 25);

      expect(result.success).toBe(true);
      expect(result.affiliate.remaining_images).toBe(25);
    });
  });

  describe('getAffiliateAssignedPackages', () => {
    it('should successfully fetch assigned packages', async () => {
      const mockPackages = [
        {
          id: 'ap-1',
          affiliate_id: 'aff-123',
          package_name: 'Premium Package',
          total_dishes: 10,
          remaining_dishes: 8
        }
      ];

      // Create a proper chain that handles select().eq().eq().order()
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockPackages, error: null })
      };

      mockSupabaseFrom.mockReturnValue(mockChain);

      const result = await affiliatePackageManagementApi.getAffiliateAssignedPackages('aff-123');

      expect(result.success).toBe(true);
      expect(result.packages).toHaveLength(1);
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('affiliate_id', 'aff-123');
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should handle empty results', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      };

      mockSupabaseFrom.mockReturnValue(mockChain);

      const result = await affiliatePackageManagementApi.getAffiliateAssignedPackages('aff-123');

      expect(result.success).toBe(true);
      expect(result.packages).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' }
        })
      };

      mockSupabaseFrom.mockReturnValue(mockChain);

      const result = await affiliatePackageManagementApi.getAffiliateAssignedPackages('aff-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });
  });
}); 