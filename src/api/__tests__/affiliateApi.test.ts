import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  affiliateApi, 
  affiliateClientApi, 
  affiliatePackageApi, 
  affiliateCommissionApi,
  affiliateDashboardApi,
  PACKAGE_PRICING 
} from '../affiliateApi';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/supabaseAdmin';
import type { 
  Affiliate, 
  CreateAffiliateForm, 
  LinkClientToAffiliateForm,
  PurchasePackageForm,
  AllocatePackageForm 
} from '@/types/affiliate';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn()
    }
  }
}));

vi.mock('@/integrations/supabase/supabaseAdmin', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: vi.fn()
      }
    }
  }
}));

// Mock data
const mockAffiliate: Affiliate = {
  affiliate_id: 'test-affiliate-1',
  user_auth_id: null,
  name: 'Test Affiliate',
  email: 'test@affiliate.com',
  phone: '+972501234567',
  status: 'active',
  commission_rate_tasting: 30,
  commission_rate_full_menu: 25,
  commission_rate_deluxe: 20,
  total_earnings: 0,
  total_referrals: 0,
  username: null,
  password: null,
  internal_notes: null,
  current_package_id: null,
  remaining_servings: 0,
  remaining_images: 0,
  consumed_images: 0,
  reserved_images: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockCreateForm: CreateAffiliateForm = {
  name: 'New Affiliate',
  email: 'new@affiliate.com',
  phone: '+972509876543',
  commission_rate_tasting: 35,
  commission_rate_full_menu: 30,
  commission_rate_deluxe: 25
};

const mockSupabaseQuery = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  head: vi.fn().mockReturnThis()
};

describe('affiliateApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.from as any).mockReturnValue(mockSupabaseQuery);
  });

  describe('getAllAffiliates', () => {
    it('should fetch all affiliates successfully', async () => {
      const mockData = [mockAffiliate];
      // getAllAffiliates doesn't use .single(), it returns directly from the query chain
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockData, error: null })
        })
      });

      const result = await affiliateApi.getAllAffiliates();

      expect(supabase.from).toHaveBeenCalledWith('affiliates');
      expect(result).toEqual(mockData);
    });

    it('should return empty array when no affiliates exist', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      });

      const result = await affiliateApi.getAllAffiliates();

      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      const mockError = new Error('Database connection failed');
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: mockError })
        })
      });

      await expect(affiliateApi.getAllAffiliates()).rejects.toThrow('Database connection failed');
    });
  });

  describe('getAffiliateById', () => {
    it('should fetch affiliate by ID successfully', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: mockAffiliate, error: null });

      const result = await affiliateApi.getAffiliateById('test-affiliate-1');

      expect(supabase.from).toHaveBeenCalledWith('affiliates');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('affiliate_id', 'test-affiliate-1');
      expect(result).toEqual(mockAffiliate);
    });

    it('should return null when affiliate not found', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });

      const result = await affiliateApi.getAffiliateById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should throw error for database failures', async () => {
      const mockError = { code: 'OTHER_ERROR', message: 'Database error' };
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: mockError });

      await expect(affiliateApi.getAffiliateById('test-id')).rejects.toEqual(mockError);
    });
  });

  describe('getCurrentAffiliate', () => {
    it('should fetch current user affiliate successfully', async () => {
      const mockUser = { id: 'user-123' };
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
      mockSupabaseQuery.single.mockResolvedValue({ data: mockAffiliate, error: null });

      const result = await affiliateApi.getCurrentAffiliate();

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('user_auth_id', 'user-123');
      expect(result).toEqual(mockAffiliate);
    });

    it('should return null when no user is authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

      const result = await affiliateApi.getCurrentAffiliate();

      expect(result).toBeNull();
    });

    it('should return null when user has no affiliate profile', async () => {
      const mockUser = { id: 'user-123' };
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
      mockSupabaseQuery.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });

      const result = await affiliateApi.getCurrentAffiliate();

      expect(result).toBeNull();
    });
  });

  describe('createAffiliate', () => {
    beforeEach(() => {
      // Mock successful auth user creation
      (supabaseAdmin.auth.admin.createUser as any).mockResolvedValue({
        data: {
          user: { id: 'auth-user-123' }
        },
        error: null
      });
    });

    it('should create affiliate successfully with default commission rates', async () => {
      const mockAffiliateWithAuth = {
        ...mockAffiliate,
        user_auth_id: 'auth-user-123',
        username: mockCreateForm.email,
        password: expect.any(String)
      };
      
      mockSupabaseQuery.single.mockResolvedValue({ data: mockAffiliateWithAuth, error: null });

      const result = await affiliateApi.createAffiliate(mockCreateForm);

      expect(supabaseAdmin.auth.admin.createUser).toHaveBeenCalledWith({
        email: mockCreateForm.email,
        password: expect.any(String),
        email_confirm: true,
        user_metadata: {
          role: 'affiliate',
          name: mockCreateForm.name,
          username: mockCreateForm.email
        }
      });
      
      expect(supabase.from).toHaveBeenCalledWith('affiliates');
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith({
        name: mockCreateForm.name,
        email: mockCreateForm.email,
        phone: mockCreateForm.phone,
        commission_rate_tasting: 35,
        commission_rate_full_menu: 30,
        commission_rate_deluxe: 25,
        user_auth_id: 'auth-user-123',
        username: mockCreateForm.email,
        password: expect.any(String)
      });
      expect(result).toEqual(mockAffiliateWithAuth);
    });

    it('should create affiliate with default commission rates when not provided', async () => {
      const formWithoutRates = {
        name: 'Test Affiliate',
        email: 'test@example.com'
      };
      
      const mockAffiliateWithAuth = {
        ...mockAffiliate,
        user_auth_id: 'auth-user-123',
        username: formWithoutRates.email,
        password: expect.any(String)
      };
      
      mockSupabaseQuery.single.mockResolvedValue({ data: mockAffiliateWithAuth, error: null });

      const result = await affiliateApi.createAffiliate(formWithoutRates);

      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith({
        name: formWithoutRates.name,
        email: formWithoutRates.email,
        phone: undefined,
        commission_rate_tasting: 30,
        commission_rate_full_menu: 25,
        commission_rate_deluxe: 20,
        user_auth_id: 'auth-user-123',
        username: formWithoutRates.email,
        password: expect.any(String)
      });
      expect(result).toEqual(mockAffiliateWithAuth);
    });

    it('should throw error when auth user creation fails', async () => {
      const authError = new Error('Auth user creation failed');
      (supabaseAdmin.auth.admin.createUser as any).mockResolvedValue({
        data: null,
        error: authError
      });

      await expect(affiliateApi.createAffiliate(mockCreateForm)).rejects.toThrow(authError);
    });

    it('should throw error when database insert fails', async () => {
      const mockError = { code: '23505', message: 'Email already exists' };
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: mockError });

      await expect(affiliateApi.createAffiliate(mockCreateForm)).rejects.toEqual(mockError);
    });
  });

  describe('updateAffiliate', () => {
    it('should update affiliate successfully', async () => {
      const updates = { name: 'Updated Name', commission_rate_tasting: 35 };
      mockSupabaseQuery.single.mockResolvedValue({ data: { ...mockAffiliate, ...updates }, error: null });

      const result = await affiliateApi.updateAffiliate('test-affiliate-1', updates);

      expect(supabase.from).toHaveBeenCalledWith('affiliates');
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith(updates);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('affiliate_id', 'test-affiliate-1');
      expect(result).toEqual({ ...mockAffiliate, ...updates });
    });

    it('should throw error when affiliate not found', async () => {
      const mockError = { code: 'PGRST116', message: 'Affiliate not found' };
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: mockError });

      await expect(affiliateApi.updateAffiliate('non-existent', { name: 'Test' }))
        .rejects.toEqual(mockError);
    });
  });

  describe('deleteAffiliate', () => {
    it('should delete affiliate successfully', async () => {
      (supabase.from as any).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      });

      await affiliateApi.deleteAffiliate('test-affiliate-1');

      expect(supabase.from).toHaveBeenCalledWith('affiliates');
    });

    it('should throw error when deletion fails', async () => {
      const mockError = { code: 'FK_CONSTRAINT', message: 'Cannot delete affiliate with active clients' };
      (supabase.from as any).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: mockError })
        })
      });

      await expect(affiliateApi.deleteAffiliate('test-affiliate-1')).rejects.toEqual(mockError);
    });
  });
});

describe('affiliateClientApi', () => {
  describe('getAffiliateClients', () => {
    it('should fetch affiliate clients successfully', async () => {
      const mockClientData = [{
        id: 'rel-1',
        affiliate_id: 'aff-1',
        client_id: 'client-1',
        status: 'active',
        clients: {
          client_id: 'client-1',
          restaurant_name: 'Test Restaurant',
          contact_name: 'John Doe',
          email: 'john@restaurant.com',
          phone: '+972501234567'
        }
      }];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockClientData, error: null })
            })
          })
        })
      });

      const result = await affiliateClientApi.getAffiliateClients('aff-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        client_id: 'client-1',
        name: 'Test Restaurant',
        email: 'john@restaurant.com',
        phone: '+972501234567',
        status: 'active',
        restaurant_name: 'Test Restaurant',
        contact_name: 'John Doe'
      });
    });

    it('should handle empty client list', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: null })
            })
          })
        })
      });

      const result = await affiliateClientApi.getAffiliateClients('aff-1');

      expect(result).toEqual([]);
    });
  });

  describe('linkClientToAffiliate', () => {
    it('should link client to affiliate successfully', async () => {
      const linkForm: LinkClientToAffiliateForm = {
        affiliate_id: 'aff-1',
        client_id: 'client-1',
        referral_source: 'direct_contact'
      };

      const mockResult = {
        id: 'rel-1',
        affiliate_id: 'aff-1',
        client_id: 'client-1',
        referral_source: 'direct_contact',
        referral_method: 'name_reference',
        status: 'active'
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockResult, error: null })
          })
        })
      });

      const result = await affiliateClientApi.linkClientToAffiliate(linkForm);

      expect(result).toEqual(mockResult);
    });
  });
});

describe('affiliatePackageApi', () => {
  describe('getAffiliatePackages', () => {
    it('should fetch packages with calculated properties', async () => {
      const mockPackageData = [{
        package_id: 'pkg-1',
        affiliate_id: 'aff-1',
        package_type: 'tasting',
        total_dishes: 10,
        total_images: 20,
        dishes_used: 3,
        images_used: 7,
        purchase_price: 550,
        status: 'active'
      }];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPackageData, error: null })
          })
        })
      });

      const result = await affiliatePackageApi.getAffiliatePackages('aff-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockPackageData[0],
        used_dishes: 3,
        used_images: 7,
        remaining_dishes: 7,
        remaining_images: 13
      });
    });
  });

  describe('purchasePackage', () => {
    it('should purchase package successfully', async () => {
      const purchaseForm: PurchasePackageForm = {
        affiliate_id: 'aff-1',
        package_type: 'tasting',
        quantity: 1
      };

      const mockResult = {
        package_id: 'pkg-1',
        affiliate_id: 'aff-1',
        package_type: 'tasting',
        total_dishes: 12,
        total_images: 60,
        dishes_used: 0,
        images_used: 0,
        purchase_price: 550
      };

      // Mock the complete insert().select().single() chain
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockResult, error: null })
          })
        })
      });

      const result = await affiliatePackageApi.purchasePackage('aff-1', purchaseForm);

      expect(supabase.from).toHaveBeenCalledWith('affiliate_packages');
      expect(result).toEqual({
        ...mockResult,
        used_dishes: 0,
        used_images: 0,
        remaining_dishes: 12,
        remaining_images: 60
      });
    });
  });
});

describe('affiliateDashboardApi', () => {
  describe('getDashboardStats', () => {
    it('should calculate dashboard statistics correctly', async () => {
      // Use dynamic dates that work with current month/year
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15).toISOString(); // 15th of current month
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString(); // 15th of last month
      const someRandomDate = new Date(2022, 5, 15).toISOString(); // June 2022 - won't affect monthly calculations
      
      const mockCommissionsData = [
        { commission_amount: 100, payment_status: 'paid', created_at: thisMonth },
        { commission_amount: 50, payment_status: 'pending', created_at: someRandomDate },
        { commission_amount: 75, payment_status: 'paid', created_at: lastMonth }
      ];

      const mockPackagesData = [
        { total_dishes: 10, total_images: 20, dishes_used: 5, images_used: 10 },
        { total_dishes: 15, total_images: 30, dishes_used: 15, images_used: 30 }
      ];

      // Mock different Supabase query chains used by getDashboardStats
      let callCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'affiliate_clients') {
          callCount++;
          if (callCount === 1) {
            // First call: total_clients count
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 15 })
              })
            };
          } else {
            // Second call: active_clients count
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ count: 12 })
                })
              })
            };
          }
        } else if (table === 'affiliate_commissions') {
          // Commissions data query
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockCommissionsData })
            })
          };
        } else if (table === 'affiliate_packages') {
          callCount++;
          if (callCount === 3) {
            // Packages count query
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 3 })
              })
            };
          } else {
            // Packages data query
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ data: mockPackagesData })
                })
              })
            };
          }
        }
      });

      const result = await affiliateDashboardApi.getDashboardStats('aff-1');

      expect(result).toEqual({
        total_clients: 15,
        active_clients: 12,
        total_earnings: 175, // 100 + 75 (paid commissions)
        pending_commissions: 50,
        packages_purchased: 3,
        packages_remaining: 1, // Only first package has remaining items
        this_month_earnings: 100, // Current month commission
        last_month_earnings: 75 // Last month commission
      });
    });

    it('should handle empty data gracefully', async () => {
      // Mock empty responses for all queries
      let callCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'affiliate_clients') {
          callCount++;
          if (callCount === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 0 })
              })
            };
          } else {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ count: 0 })
                })
              })
            };
          }
        } else if (table === 'affiliate_commissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null })
            })
          };
        } else if (table === 'affiliate_packages') {
          callCount++;
          if (callCount === 3) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 0 })
              })
            };
          } else {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ data: null })
                })
              })
            };
          }
        }
      });

      const result = await affiliateDashboardApi.getDashboardStats('aff-1');

      expect(result).toEqual({
        total_clients: 0,
        active_clients: 0,
        total_earnings: 0,
        pending_commissions: 0,
        packages_purchased: 0,
        packages_remaining: 0,
        this_month_earnings: 0,
        last_month_earnings: 0
      });
    });
  });
});

describe('PACKAGE_PRICING', () => {
  it('should have correct pricing configuration', () => {
    expect(PACKAGE_PRICING).toEqual({
      tasting: { dishes: 12, images: 60, price: 550, commission_rate: 30 },
      full_menu: { dishes: 30, images: 150, price: 990, commission_rate: 25 },
      deluxe: { dishes: 65, images: 325, price: 1690, commission_rate: 20 }
    });
  });
}); 