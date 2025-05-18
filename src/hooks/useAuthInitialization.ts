
import { useEffect } from 'react';
import { unifiedAuthService } from '@/services/unifiedAuthService';

/**
 * Hook to initialize authentication state and listen for auth changes
 */
export const useAuthInitialization = (updateAuthState: (updates: any) => void) => {
  useEffect(() => {
    console.log("[UNIFIED_AUTH] Authentication initializer started");
    let isMounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = unifiedAuthService.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;
        
        const user = currentSession?.user ?? null;
        
        console.log(`[UNIFIED_AUTH] Auth event '${event}' for user:`, user?.id);
        updateAuthState({
          session: currentSession,
          user: user,
          initialized: true,
          // Only set loading to false when it's a sign-in event or session event
          // For sign-out we still need to wait for role/client checks to complete
          ...(event === 'SIGNED_IN' && { loading: false }),
          ...(event === 'SIGNED_OUT' && { 
            role: null, 
            clientId: null, 
            loading: false, 
            hasLinkedClientRecord: false 
          }),
        });
        
        // When user signs in, initiate role and client record checks
        if (event === 'SIGNED_IN' && user) {
          initUserData(user.id);
        }
      }
    );

    // THEN check for existing session
    const checkInitialSession = async () => {
      try {
        const { session, error } = await unifiedAuthService.getSession();
        
        if (!isMounted) return;
        
        console.log("[UNIFIED_AUTH] Initial session check:", 
          session?.user?.id, 
          error ? `Error: ${error.message}` : 'No error'
        );
        
        // Update basic auth state
        updateAuthState({
          session: session,
          user: session?.user ?? null,
          initialized: true,
        });
        
        // If we have a session, initiate role and client record checks
        if (session?.user) {
          initUserData(session.user.id);
        } else {
          // No session, complete loading
          updateAuthState({ loading: false });
        }
      } catch (error) {
        if (!isMounted) return;
        
        console.error("[UNIFIED_AUTH] Error checking initial session:", error);
        updateAuthState({
          initialized: true,
          loading: false,
          hasError: true,
          errorMessage: "Failed to check authentication status."
        });
      }
    };
    
    // Fetch role and client data for authenticated user
    const initUserData = async (userId: string) => {
      try {
        // Run role and client ID checks in parallel
        const [roleResult, clientResult] = await Promise.all([
          unifiedAuthService.fetchUserRole(userId),
          unifiedAuthService.fetchClientIdForUser(userId)
        ]);
        
        if (!isMounted) return;
        
        // Handle role result
        if (roleResult.error) {
          console.error("[UNIFIED_AUTH] Error fetching role:", roleResult.error);
          updateAuthState({
            role: 'customer', // Default to customer on error
            hasError: true,
            errorMessage: roleResult.error.message
          });
        } else {
          updateAuthState({ 
            role: roleResult.role 
          });
        }
        
        // Handle client ID result
        if (clientResult.error) {
          console.error("[UNIFIED_AUTH] Error fetching client ID:", clientResult.error);
          updateAuthState({
            clientId: null,
            hasLinkedClientRecord: false,
            hasError: true,
            errorMessage: clientResult.error.message
          });
        } else {
          updateAuthState({
            clientId: clientResult.clientId,
            hasLinkedClientRecord: !!clientResult.clientId
          });
        }
        
        // Complete loading
        updateAuthState({ loading: false });
      } catch (err) {
        if (!isMounted) return;
        
        console.error("[UNIFIED_AUTH] Exception in initUserData:", err);
        updateAuthState({
          loading: false,
          hasError: true,
          errorMessage: "Error initializing user data"
        });
      }
    };

    // Start the initialization process
    checkInitialSession();

    // Clean up on unmount
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [updateAuthState]);
};
