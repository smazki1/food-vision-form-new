
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/unifiedAuthTypes';

interface UserAuthData {
  user_role: string | null;
  client_id: string | null;
  restaurant_name: string | null;
  has_client_record: boolean;
}

/**
 * Optimized authentication service using unified database queries
 */
export const optimizedAuthService = {
  /**
   * Get user authentication data in a single optimized query
   */
  getUserAuthData: async (userId: string): Promise<{
    role: UserRole;
    clientId: string | null;
    restaurantName: string | null;
    hasLinkedClientRecord: boolean;
    error?: string;
  }> => {
    try {
      console.log('[OPTIMIZED_AUTH] Fetching auth data for user:', userId);
      
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

      const authData: UserAuthData = data[0];
      
      console.log('[OPTIMIZED_AUTH] Auth data retrieved:', {
        role: authData.user_role,
        clientId: authData.client_id,
        hasClientRecord: authData.has_client_record
      });

      return {
        role: authData.user_role as UserRole,
        clientId: authData.client_id,
        restaurantName: authData.restaurant_name,
        hasLinkedClientRecord: authData.has_client_record
      };

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
   * Cache user auth data to localStorage for faster subsequent loads
   */
  cacheUserAuthData: (userId: string, authData: any) => {
    try {
      const cacheKey = `auth_data_${userId}`;
      const cacheData = {
        ...authData,
        timestamp: Date.now(),
        expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('[OPTIMIZED_AUTH] Auth data cached for user:', userId);
    } catch (error) {
      console.warn('[OPTIMIZED_AUTH] Failed to cache auth data:', error);
    }
  },

  /**
   * Get cached user auth data if still valid
   */
  getCachedUserAuthData: (userId: string) => {
    try {
      const cacheKey = `auth_data_${userId}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        return null;
      }

      const cacheData = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() > cacheData.expiresAt) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      console.log('[OPTIMIZED_AUTH] Using cached auth data for user:', userId);
      return {
        role: cacheData.role,
        clientId: cacheData.clientId,
        restaurantName: cacheData.restaurantName,
        hasLinkedClientRecord: cacheData.hasLinkedClientRecord
      };

    } catch (error) {
      console.warn('[OPTIMIZED_AUTH] Failed to read cached auth data:', error);
      return null;
    }
  },

  /**
   * Clear cached auth data for user
   */
  clearCachedAuthData: (userId: string) => {
    try {
      const cacheKey = `auth_data_${userId}`;
      localStorage.removeItem(cacheKey);
      console.log('[OPTIMIZED_AUTH] Cleared cached auth data for user:', userId);
    } catch (error) {
      console.warn('[OPTIMIZED_AUTH] Failed to clear cached auth data:', error);
    }
  }
};
