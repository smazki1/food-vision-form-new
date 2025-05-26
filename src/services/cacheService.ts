
import { toast } from "sonner";

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: string;
}

export interface CacheConfig {
  ttl: number;
  version: string;
  enableOptimistic?: boolean;
}

export class CacheService {
  private static instance: CacheService;
  private cachePrefix = 'food_vision_cache_';
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private cacheVersion = '1.0.0';

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private getKey(key: string): string {
    return `${this.cachePrefix}${key}`;
  }

  /**
   * Set cache item with TTL and version
   */
  set<T>(key: string, data: T, config?: Partial<CacheConfig>): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: config?.ttl || this.defaultTTL,
        version: config?.version || this.cacheVersion
      };
      
      localStorage.setItem(this.getKey(key), JSON.stringify(cacheItem));
      console.log(`[CACHE] Set cache for key: ${key}`);
    } catch (error) {
      console.warn(`[CACHE] Failed to set cache for key: ${key}`, error);
    }
  }

  /**
   * Get cache item with validation
   */
  get<T>(key: string, expectedVersion?: string): T | null {
    try {
      const cached = localStorage.getItem(this.getKey(key));
      if (!cached) {
        return null;
      }

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      
      // Check version compatibility
      const versionToCheck = expectedVersion || this.cacheVersion;
      if (cacheItem.version !== versionToCheck) {
        console.log(`[CACHE] Version mismatch for key: ${key}, clearing cache`);
        this.remove(key);
        return null;
      }

      // Check TTL
      if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
        console.log(`[CACHE] Cache expired for key: ${key}`);
        this.remove(key);
        return null;
      }

      console.log(`[CACHE] Cache hit for key: ${key}`);
      return cacheItem.data;
    } catch (error) {
      console.warn(`[CACHE] Failed to get cache for key: ${key}`, error);
      this.remove(key);
      return null;
    }
  }

  /**
   * Remove cache item
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
      console.log(`[CACHE] Removed cache for key: ${key}`);
    } catch (error) {
      console.warn(`[CACHE] Failed to remove cache for key: ${key}`, error);
    }
  }

  /**
   * Clear all cache items
   */
  clear(): void {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.cachePrefix)) {
          localStorage.removeItem(key);
        }
      });
      console.log(`[CACHE] Cleared all cache`);
    } catch (error) {
      console.warn(`[CACHE] Failed to clear cache`, error);
    }
  }

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(pattern: string): void {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.cachePrefix) && key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
      console.log(`[CACHE] Invalidated cache for pattern: ${pattern}`);
    } catch (error) {
      console.warn(`[CACHE] Failed to invalidate cache pattern: ${pattern}`, error);
    }
  }

  /**
   * Check if cache exists and is valid
   */
  isValid(key: string, expectedVersion?: string): boolean {
    return this.get(key, expectedVersion) !== null;
  }

  /**
   * Get cache statistics
   */
  getStats(): { totalItems: number; cacheSize: string } {
    let totalItems = 0;
    let totalSize = 0;

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.cachePrefix)) {
        totalItems++;
        totalSize += localStorage.getItem(key)?.length || 0;
      }
    });

    return {
      totalItems,
      cacheSize: `${(totalSize / 1024).toFixed(2)} KB`
    };
  }
}

export const cacheService = CacheService.getInstance();
