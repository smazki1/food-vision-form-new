import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { affiliatePackageManagementApi } from '@/api/affiliateApi';
import { toast } from '@/hooks/use-toast';

// Assign package to affiliate with images (main function)
export const useAssignPackageToAffiliateWithImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ packageId, affiliateId, servings }: {
      packageId: string;
      affiliateId: string;
      servings: number;
    }) => {
      const result = await affiliatePackageManagementApi.assignPackageToAffiliateWithImages(
        packageId,
        affiliateId,
        servings
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to assign package');
      }
      
      return result.affiliate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-assigned-packages'] });
      toast({
        title: "הצלחה",
        description: "החבילה הוקצתה בהצלחה לשותף",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה בהקצאת חבילה לשותף",
        variant: "destructive",
      });
    },
  });
};

// Update affiliate servings
export const useUpdateAffiliateServings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ affiliateId, newServings }: {
      affiliateId: string;
      newServings: number;
    }) => {
      const result = await affiliatePackageManagementApi.updateAffiliateServings(
        affiliateId,
        newServings
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update servings');
      }
      
      return result.affiliate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
      toast({
        title: "עודכן",
        description: "מספר מנות עודכן בהצלחה",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה בעדכון מספר מנות",
        variant: "destructive",
      });
    },
  });
};

// Update affiliate images
export const useUpdateAffiliateImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ affiliateId, newImages }: {
      affiliateId: string;
      newImages: number;
    }) => {
      const result = await affiliatePackageManagementApi.updateAffiliateImages(
        affiliateId,
        newImages
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update images');
      }
      
      return result.affiliate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
      toast({
        title: "עודכן",
        description: "מספר תמונות עודכן בהצלחה",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה בעדכון מספר תמונות",
        variant: "destructive",
      });
    },
  });
};

// Get affiliate assigned packages
export const useAffiliateAssignedPackages = (affiliateId: string) => {
  return useQuery({
    queryKey: ['affiliate-assigned-packages', affiliateId],
    queryFn: async () => {
      const result = await affiliatePackageManagementApi.getAffiliateAssignedPackages(affiliateId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch assigned packages');
      }
      
      return result.packages;
    },
    enabled: !!affiliateId,
  });
}; 