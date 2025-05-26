
import { useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/unifiedAuthTypes';
import { optimizedAuthService } from '@/services/optimizedAuthService';

/**
 * Hook to handle authentication initialization and user role determination
 * Optimized version using unified database query and caching
 */
export const useAuthInitialization = (
  updateAuthState: (updates: any) => void
) => {
  /**
   * Determines user role and client ID using optimized SQL function with caching
   */
  const determineUserRole = useCallback(async (currentUser: User): Promise<void> => {
    if (!currentUser) {
      updateAuthState({ role: null, clientId: null });
      return;
    }

    console.log('[UNIFIED_AUTH] Determining role for user:', currentUser.id);

    try {
      // Use the optimized service to get auth data (which handles caching internally)
      console.log('[UNIFIED_AUTH] Calling optimized auth service...');
      const authResult = await optimizedAuthService.getUserAuthData(currentUser.id);

      if (authResult.error) {
        console.error('[UNIFIED_AUTH] Auth data error:', authResult.error);
        updateAuthState({ 
          hasError: true,
          errorMessage: `Failed to determine user role: ${authResult.error}`,
          loading: false
        });
        return;
      }

      console.log('[UNIFIED_AUTH] User auth data processed:', {
        role: authResult.role,
        clientId: authResult.clientId,
        hasLinkedClientRecord: authResult.hasLinkedClientRecord,
        restaurantName: authResult.restaurantName,
        fromCache: authResult.fromCache
      });

      updateAuthState({
        role: authResult.role,
        clientId: authResult.clientId,
        hasLinkedClientRecord: authResult.hasLinkedClientRecord,
        hasError: false,
        errorMessage: null
      });

    } catch (error) {
      console.error('[UNIFIED_AUTH] Error determining user role:', error);
      updateAuthState({ 
        hasError: true,
        errorMessage: `Failed to determine user role: ${error.message}`,
        loading: false
      });
    }
  }, [updateAuthState]);

  /**
   * Handles auth state changes from Supabase
   */
  useEffect(() => {
    console.log('[UNIFIED_AUTH] Setting up optimized auth state listener...');
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[UNIFIED_AUTH] Auth state changed:', event, session?.user?.id);
      
      // Clear cache on sign out
      if (event === 'SIGNED_OUT') {
        if (session?.user?.id) {
          optimizedAuthService.clearAuthCache(session.user.id);
        }
        updateAuthState({
          user: null,
          session: null,
          isAuthenticated: false,
          role: null,
          clientId: null,
          hasLinkedClientRecord: false,
          loading: false,
          initialized: true
        });
        return;
      }
      
      // Update state based on auth event
      if (event === 'SIGNED_IN' && session?.user) {
        updateAuthState({ 
          user: session.user,
          session: session,
          isAuthenticated: true,
          loading: true // Still need to fetch role
        });
        
        // Determine role in next tick to avoid Supabase SDK deadlock
        setTimeout(() => {
          determineUserRole(session.user);
        }, 0);
      }
    });

    // Check for existing session on mount
    const checkInitialSession = async () => {
      console.log('[UNIFIED_AUTH] Checking for existing session...');
      
      try {
        updateAuthState({ loading: true });
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[UNIFIED_AUTH] Session error:', error);
          updateAuthState({ 
            hasError: true,
            errorMessage: error.message,
            loading: false,
            initialized: true
          });
          return;
        }
        
        const { session } = data;
        console.log('[UNIFIED_AUTH] Initial session check:', { hasSession: !!session });
        
        if (session?.user) {
          updateAuthState({
            user: session.user,
            session: session,
            isAuthenticated: true,
          });
          
          // Determine role using optimized function
          await determineUserRole(session.user);
        }
        
        // Mark initialization as complete
        updateAuthState({ 
          loading: false,
          initialized: true
        });
      } catch (error) {
        console.error('[UNIFIED_AUTH] Initial session check error:', error);
        updateAuthState({
          hasError: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error during initialization',
          loading: false,
          initialized: true
        });
      }
    };
    
    checkInitialSession();
    
    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [updateAuthState, determineUserRole]);
};
