
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { optimizedAuthService } from '@/services/optimizedAuthService';
import { UnifiedAuthState } from '@/types/unifiedAuthTypes';

export const useAuthInitialization = (
  updateAuthState: (updates: Partial<UnifiedAuthState>) => void
) => {
  const hasInitialized = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (hasInitialized.current) {
        console.log("[AUTH_INIT] Already initialized, skipping");
        return;
      }

      console.log("[AUTH_INIT] Starting initialization");
      
      // Set initialization timeout
      timeoutRef.current = setTimeout(() => {
        if (!hasInitialized.current && isMounted) {
          console.warn("[AUTH_INIT] Initialization timeout - forcing completion");
          updateAuthState({
            loading: false,
            initialized: true,
            user: null,
            session: null,
            isAuthenticated: false
          });
        }
      }, 5000);

      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (error) {
          console.error("[AUTH_INIT] Session error:", error);
          updateAuthState({
            loading: false,
            initialized: true,
            hasError: true,
            errorMessage: error.message,
            user: null,
            session: null
          });
          return;
        }

        hasInitialized.current = true;
        
        if (session?.user) {
          console.log("[AUTH_INIT] User found, determining role for:", session.user.id);
          await determineUserRole(session.user, session, updateAuthState);
        } else {
          console.log("[AUTH_INIT] No session found");
          updateAuthState({
            user: null,
            session: null,
            isAuthenticated: false,
            loading: false,
            initialized: true
          });
        }
      } catch (error) {
        console.error("[AUTH_INIT] Initialization error:", error);
        if (isMounted) {
          updateAuthState({
            loading: false,
            initialized: true,
            hasError: true,
            errorMessage: error instanceof Error ? error.message : 'Failed to initialize auth'
          });
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log("[AUTH_INIT] Auth state change:", event, session?.user?.id);

        if (event === 'SIGNED_OUT') {
          updateAuthState({
            user: null,
            session: null,
            isAuthenticated: false,
            loading: false,
            initialized: true,
            role: null,
            clientId: null,
            hasLinkedClientRecord: false
          });
          return;
        }

        if (event === 'SIGNED_IN' && session?.user) {
          await determineUserRole(session.user, session, updateAuthState);
        }
      }
    );

    // Start initialization
    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [updateAuthState]);
};

const determineUserRole = async (
  user: any,
  session: any,
  updateAuthState: (updates: Partial<UnifiedAuthState>) => void
) => {
  try {
    console.log("[AUTH_INIT] determineUserRole START for user:", user.id);
    
    updateAuthState({
      user,
      session,
      isAuthenticated: true,
      loading: true // Keep loading while determining role
    });

    const authData = await optimizedAuthService.getUserAuthData(user.id);
    
    console.log("[AUTH_INIT] User auth data processed:", {
      role: authData.role,
      clientId: authData.clientId,
      hasLinkedClientRecord: authData.hasLinkedClientRecord
    });

    updateAuthState({
      user,
      session,
      isAuthenticated: true,
      role: authData.role,
      clientId: authData.clientId,
      hasLinkedClientRecord: authData.hasLinkedClientRecord,
      loading: false,
      initialized: true,
      hasError: false,
      errorMessage: null
    });

    console.log("[AUTH_INIT] determineUserRole END for user:", user.id);
  } catch (error) {
    console.error("[AUTH_INIT] Error determining user role:", error);
    updateAuthState({
      user,
      session,
      isAuthenticated: true,
      loading: false,
      initialized: true,
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'Failed to determine user role'
    });
  }
};