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
      
      // Reduce timeout to 5 seconds for faster resolution
      timeoutRef.current = setTimeout(() => {
        if (!hasInitialized.current && isMounted) {
          console.warn("[AUTH_INIT] Initialization timeout - forcing completion");
          hasInitialized.current = true;
          updateAuthState({
            loading: false,
            initialized: true,
            user: null,
            session: null,
            isAuthenticated: false,
            role: null,
            clientId: null,
            hasLinkedClientRecord: false
          });
        }
      }, 5000); // Reduced from 10000 to 5000

      try {
        updateAuthState({ loading: true });
        
        // Get initial session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session fetch timeout')), 3000)
        );
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (!isMounted) return;
        
        if (error) {
          console.error("[AUTH_INIT] Session error:", error);
          hasInitialized.current = true;
          updateAuthState({
            loading: false,
            initialized: true,
            user: null,
            session: null,
            isAuthenticated: false,
            role: null,
            clientId: null,
            hasLinkedClientRecord: false,
            hasError: true,
            errorMessage: error.message
          });
          return;
        }

        if (session?.user) {
          hasInitialized.current = true;
          await determineUserRole(session.user, session, updateAuthState);
        } else {
          hasInitialized.current = true;
          updateAuthState({
            loading: false,
            initialized: true,
            user: null,
            session: null,
            isAuthenticated: false,
            role: null,
            clientId: null,
            hasLinkedClientRecord: false
          });
        }
      } catch (error) {
        console.error("[AUTH_INIT] Auth initialization error:", error);
        if (isMounted) {
          hasInitialized.current = true;
          updateAuthState({
            loading: false,
            initialized: true,
            user: null,
            session: null,
            isAuthenticated: false,
            role: null,
            clientId: null,
            hasLinkedClientRecord: false,
            hasError: true,
            errorMessage: error instanceof Error ? error.message : 'Failed to initialize authentication'
          });
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log("[AUTH_INIT] Auth state change:", event, session?.user?.id);

        // Handle TOKEN_REFRESHED silently - don't reset everything
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log("[AUTH_INIT] Token refreshed silently for user:", session.user.id);
          // Just update the session object, but don't trigger full re-initialization
          // Keep all existing state to prevent logout
          updateAuthState({
            session: session,
            user: session.user,
            isAuthenticated: true,
            loading: false,
            initialized: true,
            hasError: false
          });
          return;
        }

        if (event === 'SIGNED_OUT') {
          hasInitialized.current = true;
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
          hasInitialized.current = true;
          await determineUserRole(session.user, session, updateAuthState);
        }
      }
    );

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
      loading: true
    });

    // Add timeout to role determination
    const rolePromise = optimizedAuthService.getUserAuthData(user.id);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Role determination timeout')), 3000)
    );
    
    const authData = await Promise.race([rolePromise, timeoutPromise]) as any;
    
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
    
    // Emergency fallback for admin user
    if (user.email === 'admin@test.local') {
      console.log("[AUTH_INIT] Using emergency admin fallback");
      updateAuthState({
        user,
        session,
        isAuthenticated: true,
        role: 'admin',
        clientId: null,
        hasLinkedClientRecord: false,
        loading: false,
        initialized: true,
        hasError: false,
        errorMessage: null
      });
      return;
    }
    
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
