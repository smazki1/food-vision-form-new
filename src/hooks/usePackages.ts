import { useQuery } from "@tanstack/react-query";
import { getPackages } from "@/api/packageApi";
import { useCachedQuery } from "./useCachedQuery";
import { useCurrentUserRole } from "./useCurrentUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Package } from "@/types/package";

export const usePackages = () => {
  const { 
    data: packages = [], 
    isLoading,
    isError,
    error,
    invalidateCache
  } = useCachedQuery({
    queryKey: ["packages"],
    queryFn: getPackages,
    cacheKey: "service_packages",
    cacheTTL: 10 * 60 * 1000, // 10 minutes for packages (they don't change often)
    backgroundRefresh: true,
    onCacheHit: (data) => console.log(`[CACHE] Packages cache hit: ${data.length} packages`),
    onCacheMiss: () => console.log(`[CACHE] Packages cache miss, fetching from server`)
  });

  return {
    packages,
    isLoading,
    isError,
    error,
    invalidateCache
  };
};

// Enhanced packages hook with better authentication handling
interface UsePackagesSimplifiedOptions {
  enabled?: boolean;
}

export const usePackages_Simplified = ({ enabled = true }: UsePackagesSimplifiedOptions = {}) => {
  const currentUserRoleData = useCurrentUserRole();
  
  // Enhanced logic to handle authentication fallback scenarios
  const adminAuth = localStorage.getItem("adminAuthenticated") === "true";
  const testAdminId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  
  // Determine if we have admin access - be more permissive to avoid flickering
  const hasAdminAccess = (
    currentUserRoleData.status === "ROLE_DETERMINED" && 
    (currentUserRoleData.isAdmin || currentUserRoleData.isAccountManager)
  ) || (
    // Enhanced fallback - if we have localStorage admin, allow access even if role isn't fully determined
    adminAuth && (
      currentUserRoleData.status === "FORCED_COMPLETE" || 
      currentUserRoleData.status === "ERROR_FETCHING_ROLE" ||
      currentUserRoleData.status === "ERROR_SESSION" ||
      currentUserRoleData.status === "FETCHING_ROLE" ||
      currentUserRoleData.status === "CHECKING_SESSION"
    )
  );

  // For the userId, use a stable approach that doesn't flicker
  const effectiveUserId = currentUserRoleData.userId || (adminAuth ? testAdminId : null);
  
  // Make the query enabled as long as we have admin access and enabled flag is true
  const isQueryEnabled = enabled && hasAdminAccess && (effectiveUserId !== null);

  console.log('[usePackages_Simplified] Auth state:', {
    status: currentUserRoleData.status,
    isAdmin: currentUserRoleData.isAdmin,
    userId: currentUserRoleData.userId,
    adminAuth,
    hasAdminAccess,
    effectiveUserId,
    isQueryEnabled,
    enabled
  });

  const queryKey = ["packages_simplified", effectiveUserId];

  const {
    data: packages = [],
    isLoading,
    error,
    refetch,
    isFetching,
    status: queryStatus
  } = useQuery<Package[], Error, Package[], readonly unknown[]>({
    queryKey: queryKey,
    queryFn: async () => {
      console.log('[usePackages_Simplified] queryFn START.');

      // Add additional check in queryFn for safety
      if (!effectiveUserId) {
        console.warn('[usePackages_Simplified] queryFn: No userId provided, returning empty array');
        return [];
      }

      const { data, error } = await supabase
        .from("service_packages")
        .select("package_id, name, description, total_servings, price, is_active, created_at, updated_at, features_tags, max_processing_time_days, max_edits_per_serving")
        .order("price", { ascending: true });

      console.log('[usePackages_Simplified] queryFn: Supabase query FINISHED.');

      if (error) {
        console.error('[usePackages_Simplified] queryFn: Error during Supabase query:', error);
        throw new Error(error.message || 'Unknown database error');
      }

      console.log('[usePackages_Simplified] queryFn: Raw data from DB:', data);
      
      // Transform the data to match the Package interface
      const transformedData = data?.map(transformDbRowToPackage) || [];
      
      console.log('[usePackages_Simplified] queryFn: Supabase query successful. Returning transformed data count:', transformedData?.length);
      console.log('[usePackages_Simplified] queryFn: First package after transformation:', transformedData[0]);
      
      return transformedData;
    },
    enabled: isQueryEnabled,
    // Add some stability options
    staleTime: 1000 * 60 * 10, // Consider data fresh for 10 minutes
    retry: 3, // Retry failed queries
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  const refreshPackages = () => {
    console.log('[usePackages_Simplified] refreshPackages called. Invalidating queries for:', queryKey);
    refetch();
  };

  return {
    packages,
    isLoading,
    error,
    refetch,
    refreshPackages,
    queryStatus,
    isFetching,
    hasAdminAccess,
    isQueryEnabled
  };
};

// Helper function to transform database rows to Package interface - match the API
const transformDbRowToPackage = (row: any): Package => ({
  package_id: row.package_id,
  package_name: row.name, // Map 'name' from DB to 'package_name' for interface
  description: row.description,
  total_servings: row.total_servings,
  price: row.price,
  is_active: row.is_active,
  features_tags: row.features_tags,
  max_processing_time_days: row.max_processing_time_days,
  max_edits_per_serving: row.max_edits_per_serving,
  created_at: row.created_at,
  updated_at: row.updated_at,
});
