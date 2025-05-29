
import { useEffect, useRef } from 'react';
import { authService } from '@/services/authService';

/**
 * Hook to initialize authentication state and listen for auth changes
 */
export const useAuthInitializer = (updateAuthState: (updates: any) => void) => {
  const initializationRef = useRef(false);
  
  useEffect(() => {
    console.log("[AUTH_INIT] Authentication initializer started");
    
    // Prevent multiple initializations
    if (initializationRef.current) {
      console.log("[AUTH_INIT] Already initialized, skipping");
      return;
    }
    
    initializationRef.current = true;
    let mounted = true;

    // Test Supabase connection with timeout
    const testConnectionWithTimeout = async () => {
      try {
        const connectionTest = Promise.race([
          authService.testConnection(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 5000)
          )
        ]);
        await connectionTest;
      } catch (error) {
        console.error("[AUTH_INIT] Connection test failed:", error);
        // Continue anyway - might be a temporary issue
      }
    };

    testConnectionWithTimeout();
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = authService.onAuthStateChange(
      (event, currentSession) => {
        console.log("[AUTH_INIT] Auth state change:", event, currentSession?.user?.id);
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

    // THEN check for existing session with timeout
    const checkInitialSession = async () => {
      try {
        const sessionPromise = authService.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 8000)
        );
        
        const { session: initialSession, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
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
          // Force complete initialization even if session check fails
          updateAuthState({
            session: null,
            user: null,
            initialized: true,
            loading: false
          });
        }
      }
    };

    // Add a small delay to ensure proper initialization order
    setTimeout(checkInitialSession, 100);

    return () => {
      mounted = false;
      initializationRef.current = false;
      subscription.unsubscribe();
    };
  }, [updateAuthState]);
};
