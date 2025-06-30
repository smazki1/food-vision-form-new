import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  affiliateApi, 
  affiliateClientApi, 
  affiliatePackageApi, 
  affiliateCommissionApi,
  affiliateDashboardApi 
} from '@/api/affiliateApi';
import type {
  Affiliate,
  CreateAffiliateForm,
  LinkClientToAffiliateForm,
  PurchasePackageForm,
  AllocatePackageForm
} from '@/types/affiliate';

// Main affiliate hooks
export const useCurrentAffiliate = () => {
  return useQuery({
    queryKey: ['currentAffiliate'],
    queryFn: affiliateApi.getCurrentAffiliate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAffiliates = () => {
  return useQuery({
    queryKey: ['affiliates'],
    queryFn: affiliateApi.getAllAffiliates,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAffiliate = (affiliateId: string) => {
  return useQuery({
    queryKey: ['affiliate', affiliateId],
    queryFn: () => affiliateApi.getAffiliateById(affiliateId),
    enabled: !!affiliateId,
  });
};

// Affiliate mutations
export const useCreateAffiliate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: CreateAffiliateForm) => affiliateApi.createAffiliate(formData),
    onSuccess: (newAffiliate) => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
      toast.success(`שותף ${newAffiliate.name} נוצר בהצלחה`);
    },
    onError: (error: Error) => {
      console.error('Failed to create affiliate:', error);
      toast.error(`שגיאה ביצירת שותף: ${error.message}`);
    },
  });
};

export const useUpdateAffiliate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ affiliateId, updates }: { affiliateId: string; updates: Partial<Affiliate> }) => 
      affiliateApi.updateAffiliate(affiliateId, updates),
    onSuccess: (updatedAffiliate) => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate', updatedAffiliate.affiliate_id] });
      queryClient.invalidateQueries({ queryKey: ['currentAffiliate'] });
      toast.success('פרטי השותף עודכנו בהצלחה');
    },
    onError: (error: Error) => {
      console.error('Failed to update affiliate:', error);
      toast.error(`שגיאה בעדכון פרטי השותף: ${error.message}`);
    },
  });
};

export const useDeleteAffiliate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (affiliateId: string) => affiliateApi.deleteAffiliate(affiliateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
      toast.success('השותף נמחק בהצלחה');
    },
    onError: (error: Error) => {
      console.error('Failed to delete affiliate:', error);
      toast.error(`שגיאה במחיקת השותף: ${error.message}`);
    },
  });
};

// Client management hooks
export const useAffiliateClients = (affiliateId: string) => {
  return useQuery({
    queryKey: ['affiliateClients', affiliateId],
    queryFn: () => affiliateClientApi.getAffiliateClients(affiliateId),
    enabled: !!affiliateId,
  });
};

export const useLinkClientToAffiliate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: LinkClientToAffiliateForm) => 
      affiliateClientApi.linkClientToAffiliate(formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['affiliateClients', data.affiliate_id] });
      queryClient.invalidateQueries({ queryKey: ['affiliateDashboard', data.affiliate_id] });
      toast.success('הלקוח קושר לשותף בהצלחה');
    },
    onError: (error: Error) => {
      console.error('Failed to link client to affiliate:', error);
      toast.error(`שגיאה בקישור הלקוח לשותף: ${error.message}`);
    },
  });
};

export const useUnlinkClientFromAffiliate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: string) => affiliateClientApi.unlinkClientFromAffiliate(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliateClients'] });
      queryClient.invalidateQueries({ queryKey: ['affiliateDashboard'] });
      toast.success('הקישור בין הלקוח לשותף בוטל בהצלחה');
    },
    onError: (error: Error) => {
      console.error('Failed to unlink client from affiliate:', error);
      toast.error(`שגיאה בביטול הקישור: ${error.message}`);
    },
  });
};

// Package management hooks
export const useAffiliatePackages = (affiliateId: string) => {
  return useQuery({
    queryKey: ['affiliatePackages', affiliateId],
    queryFn: () => affiliatePackageApi.getAffiliatePackages(affiliateId),
    enabled: !!affiliateId,
  });
};

export const usePurchasePackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ affiliateId, formData }: { affiliateId: string; formData: PurchasePackageForm }) => 
      affiliatePackageApi.purchasePackage(affiliateId, formData),
    onSuccess: (newPackage) => {
      queryClient.invalidateQueries({ queryKey: ['affiliatePackages', newPackage.affiliate_id] });
      queryClient.invalidateQueries({ queryKey: ['affiliateDashboard', newPackage.affiliate_id] });
      toast.success('החבילה נרכשה בהצלחה');
    },
    onError: (error: Error) => {
      console.error('Failed to purchase package:', error);
      toast.error(`שגיאה ברכישת החבילה: ${error.message}`);
    },
  });
};

export const usePackageAllocations = (packageId: string) => {
  return useQuery({
    queryKey: ['packageAllocations', packageId],
    queryFn: () => affiliatePackageApi.getPackageAllocations(packageId),
    enabled: !!packageId,
  });
};

export const useAllocatePackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: AllocatePackageForm) => affiliatePackageApi.allocatePackage(formData),
    onSuccess: (allocation) => {
      queryClient.invalidateQueries({ queryKey: ['packageAllocations', allocation.affiliate_package_id] });
      queryClient.invalidateQueries({ queryKey: ['affiliatePackages'] });
      queryClient.invalidateQueries({ queryKey: ['affiliateDashboard'] });
      toast.success('החבילה הוקצתה ללקוח בהצלחה');
    },
    onError: (error: Error) => {
      console.error('Failed to allocate package:', error);
      toast.error(`שגיאה בהקצאת החבילה: ${error.message}`);
    },
  });
};

// Commission hooks
export const useAffiliateCommissions = (affiliateId: string) => {
  return useQuery({
    queryKey: ['affiliateCommissions', affiliateId],
    queryFn: () => affiliateCommissionApi.getAffiliateCommissions(affiliateId),
    enabled: !!affiliateId,
  });
};

export const useUpdateCommissionPaymentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      commissionId, 
      status, 
      notes 
    }: { 
      commissionId: string; 
      status: 'pending' | 'paid' | 'cancelled'; 
      notes?: string; 
    }) => affiliateCommissionApi.updateCommissionPaymentStatus(commissionId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliateCommissions'] });
      queryClient.invalidateQueries({ queryKey: ['affiliateDashboard'] });
      toast.success('סטטוס התשלום עודכן בהצלחה');
    },
    onError: (error: Error) => {
      console.error('Failed to update commission payment status:', error);
      toast.error(`שגיאה בעדכון סטטוס התשלום: ${error.message}`);
    },
  });
};

// Dashboard hooks
export const useAffiliateDashboard = (affiliateId: string) => {
  return useQuery({
    queryKey: ['affiliateDashboard', affiliateId],
    queryFn: () => affiliateDashboardApi.getDashboardStats(affiliateId),
    enabled: !!affiliateId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Utility hooks
export const useAffiliateAuth = () => {
  const getAffiliateFromSession = () => {
    try {
      const affiliateSession = localStorage.getItem('affiliate_session');
      console.log('Reading affiliate session from localStorage:', affiliateSession);
      if (affiliateSession) {
        const parsed = JSON.parse(affiliateSession);
        console.log('Parsed affiliate session:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Error reading affiliate session:', error);
    }
    return null;
  };

  const affiliate = getAffiliateFromSession();
  console.log('useAffiliateAuth result:', affiliate);
  
  return {
    affiliate,
    isAffiliate: !!affiliate,
    isLoading: false,
    error: null,
    affiliateId: affiliate?.affiliate_id
  };
}; 