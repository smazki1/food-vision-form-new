
import { useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/unifiedAuthTypes';

/**
 * Hook to handle authentication initialization and user role determination
 */
export const useAuthInitialization = (
  updateAuthState: (updates: any) => void
) => {
  /**
   * Determines user role and client ID
   */
  const determineUserRole = useCallback(async (currentUser: User): Promise<void> => {
    if (!currentUser) {
      updateAuthState({ role: null, clientId: null });
      return;
    }

    console.log('[UNIFIED_AUTH] Determining role for user:', currentUser.id);

    try {
      // FIRST: Verify we can access the database at all
      console.log('[UNIFIED_AUTH] Testing database connection...');
      const { data: testData, error: testError } = await supabase.from('clients').select('count').limit(1);
      console.log('[UNIFIED_AUTH] Database test result:', { success: !testError, error: testError?.message });
      
      // Check for client record FIRST (most users are clients)
      console.log('[UNIFIED_AUTH] Checking for client record...');
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('client_id, restaurant_name')
        .eq('user_auth_id', currentUser.id)
        .maybeSingle();

      console.log('[UNIFIED_AUTH] Client query result:', { 
        success: !clientError, 
        hasData: !!clientData,
        clientId: clientData?.client_id || null,
        error: clientError?.message || null,
        errorCode: clientError?.code || null 
      });

      if (clientError) {
        console.error('[UNIFIED_AUTH] Client query error:', clientError);
        
        // If it's an RLS error, we might be an admin/editor
        if (clientError.code === 'PGRST116' || clientError.message?.includes('permission')) {
          console.log('[UNIFIED_AUTH] Client access denied, checking for staff roles...');
        } else {
          throw clientError;
        }
      } else if (clientData) {
        // User is a customer
        updateAuthState({
          role: 'customer' as UserRole,
          clientId: clientData.client_id,
          hasLinkedClientRecord: true
        });
        console.log('[UNIFIED_AUTH] User identified as customer:', clientData.client_id);
        return;
      }

      // Check for user roles (admin/editor)
      console.log('[UNIFIED_AUTH] Checking for user roles...');
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id);

      console.log('[UNIFIED_AUTH] Roles query result:', { 
        success: !rolesError, 
        roles: userRoles,
        error: rolesError?.message || null 
      });

      if (rolesError) {
        console.error('[UNIFIED_AUTH] Roles query error:', rolesError);
        throw rolesError;
      } else if (userRoles && userRoles.length > 0) {
        // User has an explicit role
        const userRole = userRoles[0].role as UserRole;
        updateAuthState({
          role: userRole,
          clientId: null, // Admins/editors don't have client records
          hasLinkedClientRecord: false
        });
        console.log('[UNIFIED_AUTH] User role determined:', userRole);
        return;
      }

      // If we get here, user has no role and no client record
      console.warn('[UNIFIED_AUTH] User has no defined role or client record');
      updateAuthState({
        role: null,
        clientId: null,
        hasLinkedClientRecord: false,
        hasError: true,
        errorMessage: 'User has no defined role or client record'
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
    console.log('[UNIFIED_AUTH] Setting up auth state listener...');
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[UNIFIED_AUTH] Auth state changed:', event, session?.user?.id);
      
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
      else if (event === 'SIGNED_OUT') {
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
          
          // Determine role
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
