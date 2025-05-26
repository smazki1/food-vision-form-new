
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { cacheService } from '@/services/cacheService';

export interface CachedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryFn'> {
  queryFn: () => Promise<T>;
  cacheKey?: string;
  cacheTTL?: number;
  enableLocalCache?: boolean;
  onCacheHit?: (data: T) => void;
  onCacheMiss?: () => void;
  backgroundRefresh?: boolean;
}

export function useCachedQuery<T>(options: CachedQueryOptions<T>) {
  const queryClient = useQueryClient();
  const {
    queryKey,
    queryFn,
    cacheKey,
    cacheTTL = 5 * 60 * 1000, // 5 minutes default
    enableLocalCache = true,
    onCacheHit,
    onCacheMiss,
    backgroundRefresh = true,
    ...queryOptions
  } = options;

  const cacheKeyStr = cacheKey || (Array.isArray(queryKey) ? queryKey.join('-') : String(queryKey));
  const backgroundRefreshRef = useRef<boolean>(false);

  // Enhanced query function with cache integration
  const enhancedQueryFn = async (): Promise<T> => {
    // Try to get from local cache first
    if (enableLocalCache) {
      const cachedData = cacheService.get<T>(cacheKeyStr);
      if (cachedData) {
        onCacheHit?.(cachedData);
        
        // If background refresh is enabled, trigger a background update
        if (backgroundRefresh && !backgroundRefreshRef.current) {
          backgroundRefreshRef.current = true;
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey });
            backgroundRefreshRef.current = false;
          }, 100);
        }
        
        return cachedData;
      } else {
        onCacheMiss?.();
      }
    }

    // Fetch from server
    const data = await queryFn();
    
    // Cache the result
    if (enableLocalCache && data) {
      cacheService.set(cacheKeyStr, data, { ttl: cacheTTL });
    }
    
    return data;
  };

  const query = useQuery({
    ...queryOptions,
    queryKey,
    queryFn: enhancedQueryFn,
    staleTime: cacheTTL * 0.8, // Consider data stale at 80% of cache TTL
  });

  // Cache successful data
  useEffect(() => {
    if (query.data && enableLocalCache && !query.isError) {
      cacheService.set(cacheKeyStr, query.data, { ttl: cacheTTL });
    }
  }, [query.data, query.isError, enableLocalCache, cacheKeyStr, cacheTTL]);

  // Provide cache invalidation method
  const invalidateCache = () => {
    cacheService.remove(cacheKeyStr);
    queryClient.invalidateQueries({ queryKey });
  };

  return {
    ...query,
    invalidateCache,
    isCacheHit: backgroundRefreshRef.current
  };
}
