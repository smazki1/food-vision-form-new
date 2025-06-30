import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { affiliateApi, PACKAGE_PRICING } from '../affiliateApi';
import type { CreateAffiliateForm, LinkClientToAffiliateForm, PurchasePackageForm } from '@/types/affiliate';

// Mock Supabase client
const mockSupabaseSelect = vi.fn();
const mockSupabaseInsert = vi.fn();
const mockSupabaseUpdate = vi.fn();
const mockSupabaseDelete = vi.fn();
const mockSupabaseEq = vi.fn();
const mockSupabaseSingle = vi.fn();
const mockSupabaseOrder = vi.fn();
const mockSupabaseIn = vi.fn();
const mockSupabaseFrom = vi.fn();
const mockSupabaseAuth = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockSupabaseFrom,
    auth: {
      getUser: mockSupabaseAuth
    }
  }
}));

// Mock supabase admin
const mockAdminCreateUser = vi.fn();
vi.mock('@/integrations/supabase/supabaseAdmin', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: mockAdminCreateUser
      }
    }
  }
}));

describe('affiliateApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default chain
    mockSupabaseFrom.mockReturnValue({
      select: mockSupabaseSelect,
      insert: mockSupabaseInsert,
      update: mockSupabaseUpdate,
      delete: mockSupabaseDelete
    });
    
    mockSupabaseSelect.mockReturnValue({
      eq: mockSupabaseEq,
      order: mockSupabaseOrder,
      in: mockSupabaseIn
    });
    
    mockSupabaseInsert.mockReturnValue({
      select: mockSupabaseSelect
    });
    
    mockSupabaseUpdate.mockReturnValue({
      eq: mockSupabaseEq
    });
    
    mockSupabaseDelete.mockReturnValue({
      eq: mockSupabaseEq
    });
    
    mockSupabaseEq.mockReturnValue({
      single: mockSupabaseSingle,
      select: mockSupabaseSelect
    });
    
    mockSupabaseOrder.mockReturnValue({
      data: [],
      error: null
    });
    
    mockSupabaseSingle.mockReturnValue({
      data: null,
      error: null
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('PACKAGE_PRICING Constants', () => {
    it('should have correct pricing structure', () => {
      expect(PACKAGE_PRICING.tasting).toEqual({
        dishes: 12,
        images: 60,
        price: 550,
        commission_rate: 30
      });
      
      expect(PACKAGE_PRICING.full_menu).toEqual({
        dishes: 30,
        images: 150,
        price: 990,
        commission_rate: 25
      });
      
      expect(PACKAGE_PRICING.deluxe).toEqual({
        dishes: 65,
        images: 325,
        price: 1690,
        commission_rate: 20
      });
    });
  });

  describe('getAllAffiliates', () => {
    it('should fetch all affiliates successfully', async () => {
      const mockAffiliates = [
        {
          affiliate_id: 'aff1',
          name: 'Affiliate 1',
          email: 'aff1@test.com',
          username: 'aff1',
          password: 'pass1'
        },
        {
          affiliate_id: 'aff2',
          name: 'Affiliate 2',
          email: 'aff2@test.com'
        }
      ];

      mockSupabaseOrder.mockReturnValue({
        data: mockAffiliates,
        error: null
      });

      const result = await affiliateApi.getAllAffiliates();

      expect(mockSupabaseFrom).toHaveBeenCalledWith('affiliates');
      expect(mockSupabaseSelect).toHaveBeenCalledWith('*');
      expect(mockSupabaseOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      
      expect(result).toEqual([
        {
          affiliate_id: 'aff1',
          name: 'Affiliate 1',
          email: 'aff1@test.com',
          username: 'aff1',
          password: 'pass1'
        },
        {
          affiliate_id: 'aff2',
          name: 'Affiliate 2',
          email: 'aff2@test.com',
          username: null,
          password: null
        }
      ]);
    });

    it('should handle database errors', async () => {
      mockSupabaseOrder.mockReturnValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(affiliateApi.getAllAffiliates()).rejects.toThrow();
    });

    it('should handle empty result', async () => {
      mockSupabaseOrder.mockReturnValue({
        data: [],
        error: null
      });

      const result = await affiliateApi.getAllAffiliates();
      expect(result).toEqual([]);
    });
  });

  describe('getAffiliateById', () => {
    it('should fetch affiliate by ID successfully', async () => {
      const mockAffiliate = {
        affiliate_id: 'aff1',
        name: 'Test Affiliate',
        email: 'test@affiliate.com',
        username: 'testuser',
        password: 'testpass'
      };

      mockSupabaseSingle.mockReturnValue({
        data: mockAffiliate,
        error: null
      });

      const result = await affiliateApi.getAffiliateById('aff1');

      expect(mockSupabaseEq).toHaveBeenCalledWith('affiliate_id', 'aff1');
      expect(result).toEqual(mockAffiliate);
    });

    it('should return null when affiliate not found', async () => {
      mockSupabaseSingle.mockReturnValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await affiliateApi.getAffiliateById('nonexistent');
      expect(result).toBeNull();
    });

    it('should handle other database errors', async () => {
      mockSupabaseSingle.mockReturnValue({
        data: null,
        error: { code: 'PGRST000', message: 'Database error' }
      });

      await expect(affiliateApi.getAffiliateById('aff1')).rejects.toThrow();
    });

    it('should add default values for missing username/password', async () => {
      const mockAffiliate = {
        affiliate_id: 'aff1',
        name: 'Test Affiliate',
        email: 'test@affiliate.com'
      };

      mockSupabaseSingle.mockReturnValue({
        data: mockAffiliate,
        error: null
      });

      const result = await affiliateApi.getAffiliateById('aff1');

      expect(result).toEqual({
        ...mockAffiliate,
        username: null,
        password: null
      });
    });
  });

  describe('getCurrentAffiliate', () => {
    it('should fetch current user affiliate successfully', async () => {
      const mockUser = { id: 'user123' };
      const mockAffiliate = {
        affiliate_id: 'aff1',
        name: 'Current Affiliate',
        email: 'current@test.com',
        user_auth_id: 'user123'
      };

      mockSupabaseAuth.mockResolvedValue({
        data: { user: mockUser }
      });

      mockSupabaseSingle.mockReturnValue({
        data: mockAffiliate,
        error: null
      });

      const result = await affiliateApi.getCurrentAffiliate();

      expect(mockSupabaseAuth).toHaveBeenCalled();
      expect(mockSupabaseEq).toHaveBeenCalledWith('user_auth_id', 'user123');
      expect(result).toEqual({
        ...mockAffiliate,
        username: null,
        password: null
      });
    });

    it('should return null when user not authenticated', async () => {
      mockSupabaseAuth.mockResolvedValue({
        data: { user: null }
      });

      const result = await affiliateApi.getCurrentAffiliate();
      expect(result).toBeNull();
    });

    it('should return null when affiliate not found for user', async () => {
      mockSupabaseAuth.mockResolvedValue({
        data: { user: { id: 'user123' } }
      });

      mockSupabaseSingle.mockReturnValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await affiliateApi.getCurrentAffiliate();
      expect(result).toBeNull();
    });
  });

  describe('createAffiliate', () => {
    it('should create affiliate successfully with admin client', async () => {
      const formData: CreateAffiliateForm = {
        name: 'New Affiliate',
        email: 'new@affiliate.com',
        phone: '+1234567890',
        commission_rate_tasting: 30,
        commission_rate_full_menu: 25,
        commission_rate_deluxe: 20
      };

      const mockAuthUser = { user: { id: 'auth123' } };
      const mockCreatedAffiliate = {
        affiliate_id: 'aff123',
        ...formData,
        user_auth_id: 'auth123',
        username: 'new@affiliate.com',
        password: 'generated-pass'
      };

      mockAdminCreateUser.mockResolvedValue({
        data: mockAuthUser,
        error: null
      });

      mockSupabaseSingle.mockReturnValue({
        data: mockCreatedAffiliate,
        error: null
      });

      const result = await affiliateApi.createAffiliate(formData);

      expect(mockAdminCreateUser).toHaveBeenCalledWith({
        email: formData.email,
        password: expect.any(String),
        email_confirm: true,
        user_metadata: {
          role: 'affiliate',
          name: formData.name,
          username: formData.email
        }
      });

      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          commission_rate_tasting: 30,
          commission_rate_full_menu: 25,
          commission_rate_deluxe: 20,
          user_auth_id: 'auth123',
          username: formData.email,
          password: expect.any(String)
        })
      );

      expect(result).toEqual(mockCreatedAffiliate);
    });

    it('should create affiliate without admin client', async () => {
      const formData: CreateAffiliateForm = {
        name: 'New Affiliate',
        email: 'new@affiliate.com',
        phone: '+1234567890'
      };

      // Mock import failure for admin client
      vi.doMock('@/integrations/supabase/supabaseAdmin', () => {
        throw new Error('Admin client not available');
      });

      const mockCreatedAffiliate = {
        affiliate_id: 'aff123',
        ...formData,
        commission_rate_tasting: 30,
        commission_rate_full_menu: 25,
        commission_rate_deluxe: 20,
        user_auth_id: null,
        username: formData.email,
        password: 'generated-pass'
      };

      mockSupabaseSingle.mockReturnValue({
        data: mockCreatedAffiliate,
        error: null
      });

      const result = await affiliateApi.createAffiliate(formData);

      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          commission_rate_tasting: 30,
          commission_rate_full_menu: 25,
          commission_rate_deluxe: 20,
          user_auth_id: null,
          username: formData.email,
          password: expect.any(String)
        })
      );

      expect(result).toEqual(mockCreatedAffiliate);
    });

    it('should handle schema errors gracefully', async () => {
      const formData: CreateAffiliateForm = {
        name: 'New Affiliate',
        email: 'new@affiliate.com',
        phone: '+1234567890'
      };

      // First insert fails due to schema
      mockSupabaseSingle
        .mockReturnValueOnce({
          data: null,
          error: { message: 'column "password" of relation does not exist schema cache' }
        })
        .mockReturnValueOnce({
          data: {
            affiliate_id: 'aff123',
            ...formData,
            commission_rate_tasting: 30,
            commission_rate_full_menu: 25,
            commission_rate_deluxe: 20
          },
          error: null
        });

      const result = await affiliateApi.createAffiliate(formData);

      // Should have called insert twice
      expect(mockSupabaseInsert).toHaveBeenCalledTimes(2);
      
      // Second call should not include username/password
      expect(mockSupabaseInsert).toHaveBeenLastCalledWith(
        expect.objectContaining({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          commission_rate_tasting: 30,
          commission_rate_full_menu: 25,
          commission_rate_deluxe: 20,
          user_auth_id: null
        })
      );

      expect(result.username).toBe(formData.email);
      expect(result.password).toBeDefined();
    });

    it('should handle auth user creation failure', async () => {
      const formData: CreateAffiliateForm = {
        name: 'New Affiliate',
        email: 'new@affiliate.com',
        phone: '+1234567890'
      };

      mockAdminCreateUser.mockResolvedValue({
        data: null,
        error: { message: 'Auth creation failed' }
      });

      const mockCreatedAffiliate = {
        affiliate_id: 'aff123',
        ...formData,
        commission_rate_tasting: 30,
        commission_rate_full_menu: 25,
        commission_rate_deluxe: 20,
        user_auth_id: null,
        username: formData.email,
        password: 'generated-pass'
      };

      mockSupabaseSingle.mockReturnValue({
        data: mockCreatedAffiliate,
        error: null
      });

      const result = await affiliateApi.createAffiliate(formData);

      expect(result.user_auth_id).toBeNull();
      expect(result.username).toBe(formData.email);
    });

    it('should generate secure password', async () => {
      const formData: CreateAffiliateForm = {
        name: 'New Affiliate',
        email: 'new@affiliate.com',
        phone: '+1234567890'
      };

      mockSupabaseSingle.mockReturnValue({
        data: {
          affiliate_id: 'aff123',
          ...formData,
          username: formData.email,
          password: 'generated-pass'
        },
        error: null
      });

      const result = await affiliateApi.createAffiliate(formData);

      expect(result.password).toBeDefined();
      expect(result.password?.length).toBeGreaterThanOrEqual(12);
    });
  });

  describe('updateAffiliate', () => {
    it('should update affiliate successfully', async () => {
      const updates = {
        name: 'Updated Name',
        email: 'updated@email.com',
        commission_rate_tasting: 35
      };

      const mockUpdatedAffiliate = {
        affiliate_id: 'aff123',
        ...updates,
        phone: '+1234567890'
      };

      mockSupabaseSingle.mockReturnValue({
        data: mockUpdatedAffiliate,
        error: null
      });

      const result = await affiliateApi.updateAffiliate('aff123', updates);

      expect(mockSupabaseUpdate).toHaveBeenCalledWith(updates);
      expect(mockSupabaseEq).toHaveBeenCalledWith('affiliate_id', 'aff123');
      expect(result).toEqual({
        ...mockUpdatedAffiliate,
        username: null,
        password: null
      });
    });

    it('should handle update errors', async () => {
      mockSupabaseSingle.mockReturnValue({
        data: null,
        error: { message: 'Update failed' }
      });

      await expect(affiliateApi.updateAffiliate('aff123', { name: 'Updated' }))
        .rejects.toThrow();
    });
  });

  describe('deleteAffiliate', () => {
    it('should delete affiliate successfully', async () => {
      mockSupabaseEq.mockReturnValue({
        data: null,
        error: null
      });

      await affiliateApi.deleteAffiliate('aff123');

      expect(mockSupabaseDelete).toHaveBeenCalled();
      expect(mockSupabaseEq).toHaveBeenCalledWith('affiliate_id', 'aff123');
    });

    it('should handle delete errors', async () => {
      mockSupabaseEq.mockReturnValue({
        data: null,
        error: { message: 'Delete failed' }
      });

      await expect(affiliateApi.deleteAffiliate('aff123')).rejects.toThrow();
    });
  });

  describe('getAffiliateClients', () => {
    it('should fetch affiliate clients successfully', async () => {
      const mockClients = [
        {
          client_id: 'client1',
          restaurant_name: 'Restaurant 1',
          affiliate_id: 'aff123'
        }
      ];

      mockSupabaseOrder.mockReturnValue({
        data: mockClients,
        error: null
      });

      const result = await affiliateApi.getAffiliateClients('aff123');

      expect(mockSupabaseEq).toHaveBeenCalledWith('affiliate_id', 'aff123');
      expect(result).toEqual(mockClients);
    });

    it('should handle empty client list', async () => {
      mockSupabaseOrder.mockReturnValue({
        data: [],
        error: null
      });

      const result = await affiliateApi.getAffiliateClients('aff123');
      expect(result).toEqual([]);
    });
  });

  describe('linkClientToAffiliate', () => {
    it('should link client to affiliate successfully', async () => {
      const formData: LinkClientToAffiliateForm = {
        client_id: 'client123',
        affiliate_id: 'aff123'
      };

      const mockAffiliateClient = {
        client_id: 'client123',
        affiliate_id: 'aff123',
        created_at: new Date().toISOString()
      };

      mockSupabaseSingle.mockReturnValue({
        data: mockAffiliateClient,
        error: null
      });

      const result = await affiliateApi.linkClientToAffiliate(formData);

      expect(mockSupabaseInsert).toHaveBeenCalledWith(formData);
      expect(result).toEqual(mockAffiliateClient);
    });

    it('should handle link errors', async () => {
      const formData: LinkClientToAffiliateForm = {
        client_id: 'client123',
        affiliate_id: 'aff123'
      };

      mockSupabaseSingle.mockReturnValue({
        data: null,
        error: { message: 'Link failed' }
      });

      await expect(affiliateApi.linkClientToAffiliate(formData)).rejects.toThrow();
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle network timeouts', async () => {
      mockSupabaseOrder.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      await expect(affiliateApi.getAllAffiliates()).rejects.toThrow('Network timeout');
    });

    it('should handle malformed data responses', async () => {
      mockSupabaseOrder.mockReturnValue({
        data: 'invalid-data-format',
        error: null
      });

      const result = await affiliateApi.getAllAffiliates();
      // Should handle gracefully and return empty array with nullish coalescing
      expect(result).toEqual([]);
    });

    it('should handle null data responses', async () => {
      mockSupabaseOrder.mockReturnValue({
        data: null,
        error: null
      });

      const result = await affiliateApi.getAllAffiliates();
      expect(result).toEqual([]);
    });
  });

  describe('Input Validation', () => {
    it('should handle empty affiliate ID in getAffiliateById', async () => {
      mockSupabaseSingle.mockReturnValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await affiliateApi.getAffiliateById('');
      expect(result).toBeNull();
    });

    it('should handle special characters in affiliate data', async () => {
      const formData: CreateAffiliateForm = {
        name: 'שגשדג מיוחד @#$%',
        email: 'special+test@domain.co.il',
        phone: '+972-50-123-4567'
      };

      mockSupabaseSingle.mockReturnValue({
        data: {
          affiliate_id: 'aff123',
          ...formData,
          username: formData.email,
          password: 'pass123'
        },
        error: null
      });

      const result = await affiliateApi.createAffiliate(formData);
      expect(result.name).toBe(formData.name);
      expect(result.email).toBe(formData.email);
    });

    it('should handle very long input strings', async () => {
      const longName = 'a'.repeat(1000);
      const formData: CreateAffiliateForm = {
        name: longName,
        email: 'test@test.com',
        phone: '+1234567890'
      };

      mockSupabaseSingle.mockReturnValue({
        data: {
          affiliate_id: 'aff123',
          ...formData,
          username: formData.email,
          password: 'pass123'
        },
        error: null
      });

      const result = await affiliateApi.createAffiliate(formData);
      expect(result.name).toBe(longName);
    });
  });
}); 