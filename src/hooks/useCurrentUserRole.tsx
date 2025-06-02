import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
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

const CurrentUserRoleContext = createContext<CurrentUserRoleState | undefined>(undefined);

// Internal "engine" hook with all the state logic
const useCurrentUserRoleEngine = (): CurrentUserRoleState => {
  const [status, setStatus] = useState<CurrentUserRoleStatus>('INITIALIZING');
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [forceComplete, setForceComplete] = useState(false);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      console.warn("[useCurrentUserRoleEngine] Safety timeout reached - forcing completion");
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
    if (forceComplete) return;

    console.log("[useCurrentUserRoleEngine] Auth state change event:", event, "Session:", session?.user?.id);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Handle TOKEN_REFRESHED events silently - don't reset state
    if (event === 'TOKEN_REFRESHED' && session?.user) {
      console.log("[useCurrentUserRoleEngine] Token refreshed silently for user:", session.user.id);
      // Just update userId if needed, but don't trigger full re-auth
      if (session.user.id !== userId) {
        setUserId(session.user.id);
      }
      return;
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
        console.log("[useCurrentUserRoleEngine] Fetching role for user:", session.user.id);
        const authData = await optimizedAuthService.getUserAuthData(session.user.id);
        
        if (!forceComplete) {
          setRole(authData.role);
          setStatus('ROLE_DETERMINED');
          setError(null);
        }
      } catch (error) {
        console.error("[useCurrentUserRoleEngine] Error fetching role:", error);
        if (!forceComplete) {
          setStatus('ERROR_FETCHING_ROLE');
          setError(error instanceof Error ? error.message : 'Failed to fetch user role');
        }
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (forceComplete) return;

    const initializeAuth = async () => {
      if (forceComplete || !isMounted) return;

      try {
        setStatus('CHECKING_SESSION');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!isMounted || forceComplete) return;

        if (sessionError) {
          console.error("[useCurrentUserRoleEngine] Session error:", sessionError);
          setStatus('ERROR_SESSION');
          setError(sessionError.message);
          return;
        }
        await handleAuthStateChange(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      } catch (error) {
        if (!isMounted || forceComplete) return;
        console.error("[useCurrentUserRoleEngine] Auth initialization error:", error);
        setStatus('ERROR_SESSION');
        setError(error instanceof Error ? error.message : 'Failed to initialize authentication');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [forceComplete, userId]);

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
  
  // console.log("[useCurrentUserRoleEngine] FINAL State produced by logic hook:", finalState);
  return finalState;
};

// Provider component that uses the engine
export const CurrentUserRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentUserRoleState = useCurrentUserRoleEngine();
  
  return (
    <CurrentUserRoleContext.Provider value={currentUserRoleState}>
      {children}
    </CurrentUserRoleContext.Provider>
  );
};

// Exported hook that components will consume from context
export const useCurrentUserRole = (): CurrentUserRoleState => {
  const context = useContext(CurrentUserRoleContext);
  if (context === undefined) {
    throw new Error('useCurrentUserRole must be used within a CurrentUserRoleProvider');
  }
  // console.log("[useCurrentUserRole_Context] Consuming state from context:", context);
  return context;
};
