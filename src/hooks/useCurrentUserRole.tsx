
import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { optimizedAuthService } from '@/services/optimizedAuthService';
import { User } from '@supabase/supabase-js';

export type CurrentUserRoleStatus = 
  | 'INITIALIZING'
  | 'CHECKING_SESSION' 
  | 'FETCHING_ROLE'
  | 'ROLE_DETERMINED'
  | 'NO_SESSION'
  | 'ERROR_SESSION'
  | 'ERROR_FETCHING_ROLE';

export interface CurrentUserRoleState {
  status: CurrentUserRoleStatus;
  role: string | null;
  isAdmin: boolean;
  isAccountManager: boolean;
  isEditor: boolean;
  userId: string | null;
  error: string | null;
  isLoading: boolean;
}

// Create context for the provider
const CurrentUserRoleContext = createContext<CurrentUserRoleState | undefined>(undefined);

// Provider component
export const CurrentUserRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentUserRoleState = useCurrentUserRole();
  
  return (
    <CurrentUserRoleContext.Provider value={currentUserRoleState}>
      {children}
    </CurrentUserRoleContext.Provider>
  );
};

// Hook to use the context (optional, for consistency)
export const useCurrentUserRoleContext = (): CurrentUserRoleState => {
  const context = useContext(CurrentUserRoleContext);
  if (context === undefined) {
    throw new Error('useCurrentUserRoleContext must be used within a CurrentUserRoleProvider');
  }
  return context;
};

export const useCurrentUserRole = (): CurrentUserRoleState => {
  const [status, setStatus] = useState<CurrentUserRoleStatus>('INITIALIZING');
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [forceComplete, setForceComplete] = useState(false);

  // Set a safety timeout to prevent infinite loading
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      console.warn("[useCurrentUserRole] Safety timeout reached - forcing completion to prevent infinite loading");
      setForceComplete(true);
      setStatus('ERROR_FETCHING_ROLE');
      setError('Authentication timeout - please refresh the page');
    }, 15000); // 15 second safety timeout

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleAuthStateChange = async (event: string, session: any) => {
    if (forceComplete) return; // Don't process if we've forced completion

    console.log("[useCurrentUserRole] Auth state change event:", event, "Session:", session?.user?.id);
    
    // Clear any existing timeout when we get a valid auth state change
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (event === 'SIGNED_OUT' || !session) {
      setStatus('NO_SESSION');
      setRole(null);
      setUserId(null);
      setError(null);
      return;
    }

    if (session?.user) {
      setUserId(session.user.id);
      setStatus('FETCHING_ROLE');
      
      try {
        console.log("[useCurrentUserRole] Fetching role for user:", session.user.id);
        const authData = await optimizedAuthService.getUserAuthData(session.user.id);
        
        if (!forceComplete) { // Only update if we haven't forced completion
          setRole(authData.role);
          setStatus('ROLE_DETERMINED');
          setError(null);
        }
      } catch (error) {
        console.error("[useCurrentUserRole] Error fetching role:", error);
        if (!forceComplete) {
          setStatus('ERROR_FETCHING_ROLE');
          setError(error instanceof Error ? error.message : 'Failed to fetch user role');
        }
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (forceComplete) return;

      try {
        setStatus('CHECKING_SESSION');
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!isMounted || forceComplete) return;

        if (sessionError) {
          console.error("[useCurrentUserRole] Session error:", sessionError);
          setStatus('ERROR_SESSION');
          setError(sessionError.message);
          return;
        }

        await handleAuthStateChange(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      } catch (error) {
        if (!isMounted || forceComplete) return;
        console.error("[useCurrentUserRole] Auth initialization error:", error);
        setStatus('ERROR_SESSION');
        setError(error instanceof Error ? error.message : 'Failed to initialize authentication');
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Initialize
    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [forceComplete]);

  // Derive computed values
  const isAdmin = role === 'admin';
  const isAccountManager = role === 'account_manager';
  const isEditor = role === 'editor';
  const isLoading = status === 'INITIALIZING' || status === 'CHECKING_SESSION' || status === 'FETCHING_ROLE';

  const finalState: CurrentUserRoleState = {
    status,
    role,
    isAdmin,
    isAccountManager,
    isEditor,
    userId,
    error,
    isLoading
  };

  console.log("[useCurrentUserRole_Logic] FINAL State produced by logic hook:", finalState);

  return finalState;
};
