
import { useQuery } from "@tanstack/react-query";
import { getPackages } from "@/api/packageApi";
import { useCachedQuery } from "./useCachedQuery";

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
