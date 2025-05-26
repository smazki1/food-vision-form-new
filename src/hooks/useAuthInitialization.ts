import { useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/unifiedAuthTypes';
import { optimizedAuthService } from '@/services/optimizedAuthService';

/**
 * Hook to handle authentication initialization and user role determination
 * Optimized version using unified database query and caching
 */
export const useAuthInitialization = (
  updateAuthState: (updates: Partial<{
    user: User | null;
    session: any | null; // Consider using Session type from @supabase/supabase-js
    isAuthenticated: boolean;
    role: string | null; // Assuming UserRole is a string enum or similar
    clientId: string | null;
    restaurantName: string | null;
    hasLinkedClientRecord: boolean;
    loading: boolean;
    initialized: boolean;
    hasError: boolean;
    errorMessage: string | null;
  }>) => void
) => {
  const isDeterminingRole = useRef(false);
  const initialCheckComplete = useRef(false);

  /**
   * Determines user role and client ID using optimized SQL function with caching
   */
  const determineUserRole = useCallback(async (currentUser: User): Promise<void> => {
    if (isDeterminingRole.current) {
      console.log('[AUTH_INIT] determineUserRole already in progress for user:', currentUser.id);
      return;
    }
    console.log('[AUTH_INIT] determineUserRole START for user:', currentUser.id);
    isDeterminingRole.current = true;

    try {
      console.log('[AUTH_INIT] Calling optimized auth service for user:', currentUser.id);
      const authResult = await optimizedAuthService.getUserAuthData(currentUser.id);

      if (authResult.error) {
        console.error('[AUTH_INIT] Auth data error:', authResult.error);
        updateAuthState({
          role: null,
          clientId: null,
          restaurantName: null,
          hasLinkedClientRecord: false,
          hasError: true,
          errorMessage: `Failed to determine user role: ${authResult.error}`,
          loading: false, // Ensure loading is set to false on error
        });
        return;
      }

      console.log('[AUTH_INIT] User auth data processed:', authResult);
      updateAuthState({
        role: authResult.role,
        clientId: authResult.clientId,
        restaurantName: authResult.restaurantName,
        hasLinkedClientRecord: authResult.hasLinkedClientRecord,
        hasError: false,
        errorMessage: null,
        loading: false, // Ensure loading is set to false on success
      });

    } catch (error: any) {
      console.error('[AUTH_INIT] Error in determineUserRole:', error);
      updateAuthState({
        role: null,
        clientId: null,
        restaurantName: null,
        hasLinkedClientRecord: false,
        hasError: true,
        errorMessage: `Failed to determine user role: ${error.message}`,
        loading: false,
      });
    } finally {
      console.log('[AUTH_INIT] determineUserRole END for user:', currentUser.id);
      isDeterminingRole.current = false;
      initialCheckComplete.current = true; // Mark as complete after first attempt
    }
  }, [updateAuthState]);

  /**
   * Handles auth state changes from Supabase
   */
  useEffect(() => {
    console.log('[AUTH_INIT] Setting up auth state listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AUTH_INIT] onAuthStateChange: Event - ${event}, User - ${session?.user?.id}, InitialCheck - ${initialCheckComplete.current}`);
      
      if (event === 'SIGNED_OUT') {
        console.log('[AUTH_INIT] SIGNED_OUT detected.');
        if (session?.user?.id) {
          optimizedAuthService.clearAuthCache(session.user.id);
        } else {
          // If user ID is not available on session, might need a broader cache clear or rely on TTL
          console.warn('[AUTH_INIT] User ID not available on SIGNED_OUT session to clear specific cache.');
        }
        updateAuthState({
          user: null,
          session: null,
          isAuthenticated: false,
          role: null,
          clientId: null,
          restaurantName: null,
          hasLinkedClientRecord: false,
          loading: false,
          initialized: true, // Signed out, so considered initialized
          hasError: false,
          errorMessage: null,
        });
        isDeterminingRole.current = false; // Reset flag on sign out
        return;
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[AUTH_INIT] SIGNED_IN detected for user:', session.user.id);
        updateAuthState({ 
          user: session.user,
          session: session,
          isAuthenticated: true,
          loading: true, // Set loading true before determining role
          hasError: false, 
          errorMessage: null
        });
        
        // Determine role in next tick to allow state update
        // And prevent potential race if onAuthStateChange fires rapidly
        setTimeout(() => {
          determineUserRole(session.user!);
        }, 0);
      } else if (event === 'INITIAL_SESSION' && session?.user) {
        console.log('[AUTH_INIT] INITIAL_SESSION with user:', session.user.id);
        updateAuthState({
          user: session.user,
          session: session,
          isAuthenticated: true,
          loading: true, // Set loading true before determining role
          initialized: false, // Not fully initialized until role is determined
        });
        setTimeout(() => {
            determineUserRole(session.user!);
        }, 0);
      } else if (event === 'INITIAL_SESSION' && !session) {
        console.log('[AUTH_INIT] INITIAL_SESSION with no user session.');
        updateAuthState({
          user: null,
          session: null,
          isAuthenticated: false,
          role: null,
          clientId: null,
          restaurantName: null,
          hasLinkedClientRecord: false,
          loading: false,
          initialized: true, // No session, so considered initialized
        });
        initialCheckComplete.current = true;
      } else if (event === 'USER_UPDATED' && session?.user) {
        console.log('[AUTH_INIT] USER_UPDATED detected for user:', session.user.id);
        updateAuthState({
            user: session.user, // Update user object
            session: session, // Update session object
            loading: true, // May need to re-verify role if email/phone changes affect it
        });
        setTimeout(() => {
            determineUserRole(session.user!); // Re-determine role
        }, 0);
      } else if (event === 'PASSWORD_RECOVERY') {
        console.log('[AUTH_INIT] PASSWORD_RECOVERY event detected.');
        // Typically, no immediate state change needed here until user signs in with new password
        updateAuthState({ loading: false });
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('[AUTH_INIT] TOKEN_REFRESHED for user:', session.user.id);
        // Session object is updated, ensure our state reflects this.
        // Role typically doesn't change on token refresh alone.
        updateAuthState({
            user: session.user,
            session: session,
            isAuthenticated: true,
            loading: false, // Role is likely still valid
        });
      }
    });

    // Check for existing session on mount if not already handled by INITIAL_SESSION
    const checkInitialSession = async () => {
      if (initialCheckComplete.current) return; // Already checked or in progress

      console.log('[AUTH_INIT] checkInitialSession explicit call START');
      updateAuthState({ loading: true, initialized: false });
      
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AUTH_INIT] Session error during initial check:', error);
          updateAuthState({ 
            hasError: true,
            errorMessage: error.message,
            loading: false,
            initialized: true
          });
          return;
        }
        
        const { session: initialSession } = data;
        console.log('[AUTH_INIT] Initial session from getSession():', initialSession ? initialSession.user?.id : 'No session');
        
        if (initialSession?.user) {
          if (!isDeterminingRole.current) { // Prevent race if onAuthStateChange already fired
            updateAuthState({
              user: initialSession.user,
              session: initialSession,
              isAuthenticated: true,
              loading: true,
              initialized: false,
            });
            // Call determineUserRole without setTimeout if it's the very first check
            await determineUserRole(initialSession.user);
          } else {
             console.log('[AUTH_INIT] Role determination already triggered by onAuthStateChange for initial session.');
          }
        } else {
          updateAuthState({
            user: null,
            session: null,
            isAuthenticated: false,
            role: null,
            clientId: null,
            restaurantName: null,
            hasLinkedClientRecord: false,
            loading: false,
            initialized: true
          });
        }
      } catch (err: any) {
        console.error('[AUTH_INIT] Error in checkInitialSession:', err);
        updateAuthState({ 
          hasError: true, 
          errorMessage: err.message, 
          loading: false, 
          initialized: true 
        });
      } finally {
        initialCheckComplete.current = true;
        // Loading state should be managed by determineUserRole or the error blocks
        console.log('[AUTH_INIT] checkInitialSession explicit call END');
      }
    };

    // Supabase typically triggers INITIAL_SESSION itself.
    // Calling getSession() might be redundant if onAuthStateChange handles INITIAL_SESSION correctly and promptly.
    // However, keeping it as a fallback or for certainty.
    // Let's ensure initialCheckComplete guards it.
    if (!initialCheckComplete.current) {
        checkInitialSession();
    }

    return () => {
      console.log('[AUTH_INIT] Unsubscribing from auth state changes.');
      subscription?.unsubscribe();
      isDeterminingRole.current = false; // Reset on cleanup
    };
  }, [determineUserRole, updateAuthState]);
};