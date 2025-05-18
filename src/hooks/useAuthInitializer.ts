
import { useEffect } from 'react';
import { authService } from '@/services/authService';

/**
 * Hook to initialize authentication state and listen for auth changes
 */
export const useAuthInitializer = (updateAuthState: (updates: any) => void) => {
  useEffect(() => {
    console.log("[AUTH_INIT] Authentication initializer started");
    let mounted = true;

    // Test Supabase connection
    authService.testConnection();
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = authService.onAuthStateChange(
      (event, currentSession) => {
        if (mounted) {
          updateAuthState({
            session: currentSession,
            user: currentSession?.user ?? null,
            initialized: true,
            loading: false
          });
        }
      }
    );

    // THEN check for existing session
    const checkInitialSession = async () => {
      try {
        const { session: initialSession, error } = await authService.getSession();
        console.log("[AUTH_INIT] Initial session check:", 
          initialSession?.user?.id, 
          error ? `Error: ${error.message}` : 'No error'
        );
        
        if (mounted) {
          updateAuthState({
            session: initialSession,
            user: initialSession?.user ?? null,
            initialized: true,
            loading: false
          });
        }
      } catch (error) {
        console.error("[AUTH_INIT] Error checking initial session:", error);
        if (mounted) {
          updateAuthState({
            initialized: true,
            loading: false
          });
        }
      }
    };

    checkInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [updateAuthState]);
};
