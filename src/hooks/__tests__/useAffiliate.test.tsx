import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import React from 'react';
import {
  useCurrentAffiliate,
  useAffiliates,
  useAffiliate,
  useCreateAffiliate,
  useUpdateAffiliate,
  useDeleteAffiliate,
  useAffiliateClients,
  useLinkClientToAffiliate,
  useUnlinkClientFromAffiliate,
  useAffiliatePackages,
  usePurchasePackage,
  usePackageAllocations,
  useAllocatePackage,
  useAffiliateCommissions,
  useUpdateCommissionPaymentStatus,
  useAffiliateDashboard,
  useAffiliateAuth
} from '../useAffiliate';
import { affiliateApi, affiliateClientApi, affiliatePackageApi, affiliateCommissionApi, affiliateDashboardApi } from '@/api/affiliateApi';
import type { Affiliate, CreateAffiliateForm, AffiliateDashboardStats } from '@/types/affiliate';

// Mock the API
vi.mock('@/api/affiliateApi', () => ({
  affiliateApi: {
    getCurrentAffiliate: vi.fn(),
    getAllAffiliates: vi.fn(),
    getAffiliateById: vi.fn(),
    createAffiliate: vi.fn(),
    updateAffiliate: vi.fn(),
    deleteAffiliate: vi.fn()
  },
  affiliateClientApi: {
    getAffiliateClients: vi.fn(),
    linkClientToAffiliate: vi.fn(),
    unlinkClientFromAffiliate: vi.fn()
  },
  affiliatePackageApi: {
    getAffiliatePackages: vi.fn(),
    purchasePackage: vi.fn(),
    getPackageAllocations: vi.fn(),
    allocatePackage: vi.fn()
  },
  affiliateCommissionApi: {
    getAffiliateCommissions: vi.fn(),
    createCommission: vi.fn(),
    updateCommissionPaymentStatus: vi.fn()
  },
  affiliateDashboardApi: {
    getDashboardStats: vi.fn()
  }
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
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
  total_earnings: 1500,
  total_referrals: 5,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockDashboardStats: AffiliateDashboardStats = {
  total_earnings: 1500,
  pending_commissions: 300,
  total_clients: 10,
  active_clients: 8,
  packages_purchased: 3,
  packages_remaining: 2,
  this_month_earnings: 400,
  last_month_earnings: 350
};

// Helper function to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAffiliate hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCurrentAffiliate', () => {
    it('should fetch current affiliate successfully', async () => {
      (affiliateApi.getCurrentAffiliate as any).mockResolvedValue(mockAffiliate);

      const { result } = renderHook(() => useCurrentAffiliate(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAffiliate);
      expect(affiliateApi.getCurrentAffiliate).toHaveBeenCalledTimes(1);
    });

    it('should handle no current affiliate', async () => {
      (affiliateApi.getCurrentAffiliate as any).mockResolvedValue(null);

      const { result } = renderHook(() => useCurrentAffiliate(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it('should handle error when fetching current affiliate', async () => {
      const mockError = new Error('Authentication failed');
      (affiliateApi.getCurrentAffiliate as any).mockRejectedValue(mockError);

      const { result } = renderHook(() => useCurrentAffiliate(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useAffiliates', () => {
    it('should fetch all affiliates successfully', async () => {
      const mockAffiliates = [mockAffiliate];
      (affiliateApi.getAllAffiliates as any).mockResolvedValue(mockAffiliates);

      const { result } = renderHook(() => useAffiliates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAffiliates);
      expect(affiliateApi.getAllAffiliates).toHaveBeenCalledTimes(1);
    });

    it('should handle empty affiliates list', async () => {
      (affiliateApi.getAllAffiliates as any).mockResolvedValue([]);

      const { result } = renderHook(() => useAffiliates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useAffiliate', () => {
    it('should fetch affiliate by ID successfully', async () => {
      (affiliateApi.getAffiliateById as any).mockResolvedValue(mockAffiliate);

      const { result } = renderHook(() => useAffiliate('test-affiliate-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAffiliate);
      expect(affiliateApi.getAffiliateById).toHaveBeenCalledWith('test-affiliate-1');
    });

    it('should not fetch when affiliateId is empty', () => {
      const { result } = renderHook(() => useAffiliate(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(affiliateApi.getAffiliateById).not.toHaveBeenCalled();
    });

    it('should return null when affiliate not found', async () => {
      (affiliateApi.getAffiliateById as any).mockResolvedValue(null);

      const { result } = renderHook(() => useAffiliate('non-existent-id'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });
  });

  describe('useCreateAffiliate', () => {
    it('should create affiliate successfully', async () => {
      const mockCreateForm: CreateAffiliateForm = {
        name: 'New Affiliate',
        email: 'new@affiliate.com',
        phone: '+972509876543'
      };

      (affiliateApi.createAffiliate as any).mockResolvedValue(mockAffiliate);

      const { result } = renderHook(() => useCreateAffiliate(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockCreateForm);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(affiliateApi.createAffiliate).toHaveBeenCalledWith(mockCreateForm);
      expect(toast.success).toHaveBeenCalledWith(`שותף ${mockAffiliate.name} נוצר בהצלחה`);
    });

    it('should handle creation error', async () => {
      const mockCreateForm: CreateAffiliateForm = {
        name: 'New Affiliate',
        email: 'existing@affiliate.com'
      };

      const mockError = new Error('Email already exists');
      (affiliateApi.createAffiliate as any).mockRejectedValue(mockError);

      const { result } = renderHook(() => useCreateAffiliate(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockCreateForm);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith(`שגיאה ביצירת שותף: ${mockError.message}`);
    });
  });

  describe('useUpdateAffiliate', () => {
    it('should update affiliate successfully', async () => {
      const updates = { name: 'Updated Name', commission_rate_tasting: 35 };
      const updatedAffiliate = { ...mockAffiliate, ...updates };
      
      (affiliateApi.updateAffiliate as any).mockResolvedValue(updatedAffiliate);

      const { result } = renderHook(() => useUpdateAffiliate(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ affiliateId: 'test-affiliate-1', updates });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(affiliateApi.updateAffiliate).toHaveBeenCalledWith('test-affiliate-1', updates);
      expect(toast.success).toHaveBeenCalledWith('פרטי השותף עודכנו בהצלחה');
    });

    it('should handle update error', async () => {
      const mockError = new Error('Affiliate not found');
      (affiliateApi.updateAffiliate as any).mockRejectedValue(mockError);

      const { result } = renderHook(() => useUpdateAffiliate(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ affiliateId: 'non-existent', updates: { name: 'Test' } });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith(`שגיאה בעדכון פרטי השותף: ${mockError.message}`);
    });
  });

  describe('useDeleteAffiliate', () => {
    it('should delete affiliate successfully', async () => {
      (affiliateApi.deleteAffiliate as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteAffiliate(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('test-affiliate-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(affiliateApi.deleteAffiliate).toHaveBeenCalledWith('test-affiliate-1');
      expect(toast.success).toHaveBeenCalledWith('השותף נמחק בהצלחה');
    });

    it('should handle deletion error', async () => {
      const mockError = new Error('Cannot delete affiliate with active clients');
      (affiliateApi.deleteAffiliate as any).mockRejectedValue(mockError);

      const { result } = renderHook(() => useDeleteAffiliate(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('test-affiliate-1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith(`שגיאה במחיקת השותף: ${mockError.message}`);
    });
  });

  describe('useAffiliateClients', () => {
    it('should fetch affiliate clients successfully', async () => {
      const mockClients = [
        {
          client_id: 'client-1',
          name: 'Test Restaurant',
          email: 'test@restaurant.com',
          phone: '+972501234567',
          status: 'active',
          restaurant_name: 'Test Restaurant',
          contact_name: 'John Doe'
        }
      ];

      (affiliateClientApi.getAffiliateClients as any).mockResolvedValue(mockClients);

      const { result } = renderHook(() => useAffiliateClients('test-affiliate-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockClients);
      expect(affiliateClientApi.getAffiliateClients).toHaveBeenCalledWith('test-affiliate-1');
    });

    it('should not fetch when affiliateId is empty', () => {
      const { result } = renderHook(() => useAffiliateClients(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(affiliateClientApi.getAffiliateClients).not.toHaveBeenCalled();
    });
  });

  describe('useLinkClientToAffiliate', () => {
    it('should link client to affiliate successfully', async () => {
      const linkForm = {
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

      (affiliateClientApi.linkClientToAffiliate as any).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useLinkClientToAffiliate(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(linkForm);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(affiliateClientApi.linkClientToAffiliate).toHaveBeenCalledWith(linkForm);
      expect(toast.success).toHaveBeenCalledWith('הלקוח קושר לשותף בהצלחה');
    });
  });

  describe('useAffiliateDashboard', () => {
    it('should fetch dashboard stats successfully', async () => {
      (affiliateDashboardApi.getDashboardStats as any).mockResolvedValue(mockDashboardStats);

      const { result } = renderHook(() => useAffiliateDashboard('test-affiliate-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboardStats);
      expect(affiliateDashboardApi.getDashboardStats).toHaveBeenCalledWith('test-affiliate-1');
    });

    it('should not fetch when affiliateId is empty', () => {
      const { result } = renderHook(() => useAffiliateDashboard(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(affiliateDashboardApi.getDashboardStats).not.toHaveBeenCalled();
    });

    it('should handle dashboard stats error', async () => {
      const mockError = new Error('Database connection failed');
      (affiliateDashboardApi.getDashboardStats as any).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAffiliateDashboard('test-affiliate-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useAffiliateAuth', () => {
    it('should return affiliate auth information when affiliate exists', async () => {
      (affiliateApi.getCurrentAffiliate as any).mockResolvedValue(mockAffiliate);

      const { result } = renderHook(() => useAffiliateAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isAffiliate).toBe(true);
      });

      expect(result.current.affiliate).toEqual(mockAffiliate);
      expect(result.current.affiliateId).toBe('test-affiliate-1');
      expect(result.current.isLoading).toBe(false);
    });

    it('should return non-affiliate when no affiliate profile', async () => {
      (affiliateApi.getCurrentAffiliate as any).mockResolvedValue(null);

      const { result } = renderHook(() => useAffiliateAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isAffiliate).toBe(false);
      });

      expect(result.current.affiliate).toBeNull();
      expect(result.current.affiliateId).toBeUndefined();
    });

    it('should handle loading state', () => {
      (affiliateApi.getCurrentAffiliate as any).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useAffiliateAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAffiliate).toBe(false);
    });

    it('should handle error state', async () => {
      const mockError = new Error('Authentication failed');
      (affiliateApi.getCurrentAffiliate as any).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAffiliateAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
      });

      expect(result.current.isAffiliate).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('useAffiliatePackages', () => {
    it('should fetch affiliate packages successfully', async () => {
      const mockPackages = [
        {
          package_id: 'pkg-1',
          affiliate_id: 'aff-1',
          package_type: 'tasting',
          total_dishes: 5,
          total_images: 10,
          dishes_used: 2,
          images_used: 4,
          used_dishes: 2,
          used_images: 4,
          remaining_dishes: 3,
          remaining_images: 6,
          purchase_price: 550,
          purchased_at: '2024-01-01T00:00:00Z',
          status: 'active'
        }
      ];

      (affiliatePackageApi.getAffiliatePackages as any).mockResolvedValue(mockPackages);

      const { result } = renderHook(() => useAffiliatePackages('test-affiliate-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPackages);
      expect(affiliatePackageApi.getAffiliatePackages).toHaveBeenCalledWith('test-affiliate-1');
    });
  });

  describe('usePurchasePackage', () => {
    it('should purchase package successfully', async () => {
      const purchaseForm = {
        affiliate_id: 'aff-1',
        package_type: 'tasting' as const,
        quantity: 1
      };

      const mockResult = {
        package_id: 'pkg-1',
        affiliate_id: 'aff-1',
        package_type: 'tasting',
        total_dishes: 5,
        total_images: 10,
        dishes_used: 0,
        images_used: 0,
        used_dishes: 0,
        used_images: 0,
        remaining_dishes: 5,
        remaining_images: 10,
        purchase_price: 550,
        purchased_at: '2024-01-01T00:00:00Z',
        status: 'active'
      };

      (affiliatePackageApi.purchasePackage as any).mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePurchasePackage(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ affiliateId: 'aff-1', formData: purchaseForm });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(affiliatePackageApi.purchasePackage).toHaveBeenCalledWith('aff-1', purchaseForm);
      expect(toast.success).toHaveBeenCalledWith('החבילה נרכשה בהצלחה');
    });

    it('should handle purchase error', async () => {
      const purchaseForm = {
        affiliate_id: 'aff-1',
        package_type: 'tasting' as const,
        quantity: 1
      };

      const mockError = new Error('Insufficient funds');
      (affiliatePackageApi.purchasePackage as any).mockRejectedValue(mockError);

      const { result } = renderHook(() => usePurchasePackage(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ affiliateId: 'aff-1', formData: purchaseForm });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith(`שגיאה ברכישת החבילה: ${mockError.message}`);
    });
  });
}); 