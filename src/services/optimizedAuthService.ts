import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/unifiedAuthTypes';
import { cacheService } from './cacheService';

interface UserAuthData {
  user_role: string | null;
  client_id: string | null;
  restaurant_name?: string | null;
  has_client_record: boolean;
}

/**
 * Optimized authentication service using unified database queries with enhanced caching
 */
export const optimizedAuthService = {
  /**
   * Get user authentication data with improved caching
   */
  getUserAuthData: async (userId: string): Promise<{
    role: UserRole;
    clientId: string | null;
    restaurantName: string | null;
    hasLinkedClientRecord: boolean;
    error?: string;
    fromCache?: boolean;
  }> => {
    try {
      console.log('[OPTIMIZED_AUTH] Fetching auth data for user:', userId);
      
      // Try cache first
      const cacheKey = `auth_data_${userId}`;
      const cachedData = cacheService.get<{
        role: UserRole;
        clientId: string | null;
        restaurantName: string | null;
        hasLinkedClientRecord: boolean;
      }>(cacheKey);

      if (cachedData) {
        console.log('[OPTIMIZED_AUTH] Using cached auth data for user:', userId);
        return {
          ...cachedData,
          fromCache: true
        };
      }

      // Emergency fallback: check if this is admin user by email
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userData?.user?.email === 'admin@test.local') {
          console.log('[OPTIMIZED_AUTH] Admin user detected, using emergency bypass');
          const adminResult = {
            role: 'admin' as UserRole,
            clientId: null,
            restaurantName: null,
            hasLinkedClientRecord: false
          };
          cacheService.set(cacheKey, adminResult, { ttl: 30 * 60 * 1000 });
          return adminResult;
        }
      } catch (fallbackError) {
        console.warn('[OPTIMIZED_AUTH] Emergency fallback failed:', fallbackError);
      }

      const { data, error } = await supabase
        .rpc('get_user_auth_data', { user_uid: userId });

      if (error) {
        console.error('[OPTIMIZED_AUTH] Database error:', error);
        return {
          role: null,
          clientId: null,
          restaurantName: null,
          hasLinkedClientRecord: false,
          error: error.message
        };
      }

      if (!data || data.length === 0) {
        console.warn('[OPTIMIZED_AUTH] No auth data found for user');
        return {
          role: null,
          clientId: null,
          restaurantName: null,
          hasLinkedClientRecord: false,
          error: 'No user authentication data found'
        };
      }

      // RPC returns JSON directly with different field names
      const authData = data;
      
      if (!authData) {
        console.warn('[OPTIMIZED_AUTH] Auth data is null/undefined');
        return {
          role: null,
          clientId: null,
          restaurantName: null,
          hasLinkedClientRecord: false,
          error: 'Auth data is empty'
        };
      }
      
      const result = {
        role: authData.role as UserRole,
        clientId: authData.clientId,
        restaurantName: null, // Not returned by current RPC
        hasLinkedClientRecord: authData.hasLinkedClientRecord
      };

      // Cache the result for 30 minutes (increased from 10 minutes) to handle token refreshes better
      cacheService.set(cacheKey, result, { ttl: 30 * 60 * 1000 });
      
      console.log('[OPTIMIZED_AUTH] Auth data retrieved and cached:', {
        role: result.role,
        clientId: result.clientId,
        hasClientRecord: result.hasLinkedClientRecord
      });

      return result;

    } catch (error) {
      console.error('[OPTIMIZED_AUTH] Service error:', error);
      return {
        role: null,
        clientId: null,
        restaurantName: null,
        hasLinkedClientRecord: false,
        error: error instanceof Error ? error.message : 'Unknown authentication error'
      };
    }
  },

  /**
   * Clear auth cache for user - only call this on explicit logout or role changes
   */
  clearAuthCache: (userId: string) => {
    const cacheKey = `auth_data_${userId}`;
    cacheService.remove(cacheKey);
    console.log('[OPTIMIZED_AUTH] Cleared auth cache for user:', userId);
  },

  /**
   * Clear all auth cache - only call this on app version updates
   */
  clearAllAuthCache: () => {
    cacheService.invalidatePattern('auth_data_');
    console.log('[OPTIMIZED_AUTH] Cleared all auth cache');
  },

  /**
   * Refresh auth data without clearing cache first (for silent updates)
   */
  refreshAuthDataSilently: async (userId: string): Promise<{
    role: UserRole;
    clientId: string | null;
    restaurantName: string | null;
    hasLinkedClientRecord: boolean;
    error?: string;
  }> => {
    try {
      console.log('[OPTIMIZED_AUTH] Silently refreshing auth data for user:', userId);
      
      const { data, error } = await supabase
        .rpc('get_user_auth_data', { user_uid: userId });

      if (error) {
        console.error('[OPTIMIZED_AUTH] Database error during silent refresh:', error);
        return {
          role: null,
          clientId: null,
          restaurantName: null,
          hasLinkedClientRecord: false,
          error: error.message
        };
      }

      if (!data) {
        console.warn('[OPTIMIZED_AUTH] No auth data found during silent refresh');
        return {
          role: null,
          clientId: null,
          restaurantName: null,
          hasLinkedClientRecord: false,
          error: 'No user authentication data found'
        };
      }

      // RPC returns JSON directly with different field names
      const authData = data;
      
      if (!authData) {
        console.warn('[OPTIMIZED_AUTH] Auth data is null/undefined during silent refresh');
        return {
          role: null,
          clientId: null,
          restaurantName: null,
          hasLinkedClientRecord: false,
          error: 'Auth data is empty'
        };
      }
      
      const result = {
        role: authData.role as UserRole,
        clientId: authData.clientId,
        restaurantName: null, // Not returned by current RPC
        hasLinkedClientRecord: authData.hasLinkedClientRecord
      };

      // Update cache with fresh data
      const cacheKey = `auth_data_${userId}`;
      cacheService.set(cacheKey, result, { ttl: 30 * 60 * 1000 });
      
      console.log('[OPTIMIZED_AUTH] Auth data silently refreshed and cached:', {
        role: result.role,
        clientId: result.clientId,
        hasClientRecord: result.hasLinkedClientRecord
      });

      return result;

    } catch (error) {
      console.error('[OPTIMIZED_AUTH] Service error during silent refresh:', error);
      return {
        role: null,
        clientId: null,
        restaurantName: null,
        hasLinkedClientRecord: false,
        error: error instanceof Error ? error.message : 'Unknown authentication error'
      };
    }
  }
};
