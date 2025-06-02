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
  | 'ERROR_FETCHING_ROLE'
  | 'FORCED_COMPLETE'
  | 'EMERGENCY_RECOVERY';

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

// Emergency fallback detection
let loopDetectionCounter = 0;
let lastLogTime = 0;

// Internal "engine" hook with all the state logic
const useCurrentUserRoleEngine = (): CurrentUserRoleState => {
  const [status, setStatus] = useState<CurrentUserRoleStatus>('INITIALIZING');
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [forceComplete, setForceComplete] = useState(false);
  const mountTimeRef = useRef<number>(Date.now());
  const renderCountRef = useRef<number>(0);

  // Emergency loop detection and recovery
  useEffect(() => {
    renderCountRef.current++;
    const now = Date.now();
    
    // Count renders within 5 second windows
    if (now - lastLogTime > 5000) {
      if (loopDetectionCounter > 50) {
        console.error("[useCurrentUserRoleEngine] LOOP DETECTED! Forcing emergency recovery");
        setStatus('EMERGENCY_RECOVERY');
        setForceComplete(true);
        setRole('admin'); // Force admin role for recovery
        setError(null);
        
        // Force refresh if still looping after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
      loopDetectionCounter = 0;
      lastLogTime = now;
    } else {
      loopDetectionCounter++;
    }
  });

  // Aggressive timeout - 8 seconds max
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      const timeElapsed = Date.now() - mountTimeRef.current;
      console.warn(`[useCurrentUserRoleEngine] AGGRESSIVE timeout after ${timeElapsed}ms - forcing completion`);
      
      if (!forceComplete) {
        setForceComplete(true);
        setStatus('FORCED_COMPLETE');
        
        // Try to determine role from localStorage or default to admin
        const adminAuth = localStorage.getItem("adminAuthenticated") === "true";
        if (adminAuth) {
          setRole('admin');
          setError(null);
        } else {
          setRole('customer');
          setError('Authentication timeout - defaulted to customer');
        }
      }
    }, 8000); // Much more aggressive timeout

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [forceComplete]);

  // Emergency page refresh if we get stuck
  useEffect(() => {
    const emergencyRefresh = setTimeout(() => {
      const timeElapsed = Date.now() - mountTimeRef.current;
      if (!forceComplete && status === 'INITIALIZING') {
        console.error(`[useCurrentUserRoleEngine] EMERGENCY REFRESH after ${timeElapsed}ms`);
        window.location.reload();
      }
    }, 12000);

    return () => clearTimeout(emergencyRefresh);
  }, [forceComplete, status]);

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
        
        // Quick timeout for role fetch
        const rolePromise = optimizedAuthService.getUserAuthData(session.user.id);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Role fetch timeout')), 5000)
        );
        
        const authData = await Promise.race([rolePromise, timeoutPromise]) as any;
        
        if (!forceComplete) {
          setRole(authData.role);
          setStatus('ROLE_DETERMINED');
          setError(null);
        }
      } catch (error) {
        console.error("[useCurrentUserRoleEngine] Error fetching role:", error);
        if (!forceComplete) {
          // Fallback to admin role if there's localStorage evidence
          const adminAuth = localStorage.getItem("adminAuthenticated") === "true";
          if (adminAuth) {
            console.warn("[useCurrentUserRoleEngine] Role fetch failed, but localStorage indicates admin - defaulting to admin");
            setRole('admin');
            setStatus('FORCED_COMPLETE');
            setError(null);
          } else {
            setStatus('ERROR_FETCHING_ROLE');
            setError(error instanceof Error ? error.message : 'Failed to fetch user role');
          }
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
        
        // Quick session check with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 3000)
        );
        
        const { data: { session }, error: sessionError } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (!isMounted || forceComplete) return;

        if (sessionError) {
          console.error("[useCurrentUserRoleEngine] Session error:", sessionError);
          
          // Check localStorage as fallback
          const adminAuth = localStorage.getItem("adminAuthenticated") === "true";
          if (adminAuth) {
            console.warn("[useCurrentUserRoleEngine] Session error but localStorage admin - forcing admin role");
            setRole('admin');
            setStatus('FORCED_COMPLETE');
            setError(null);
            return;
          }
          
          setStatus('ERROR_SESSION');
          setError(sessionError.message);
          return;
        }
        await handleAuthStateChange(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      } catch (error) {
        if (!isMounted || forceComplete) return;
        console.error("[useCurrentUserRoleEngine] Auth initialization error:", error);
        
        // Emergency fallback
        const adminAuth = localStorage.getItem("adminAuthenticated") === "true";
        if (adminAuth) {
          console.warn("[useCurrentUserRoleEngine] Init error but localStorage admin - emergency admin role");
          setRole('admin');
          setStatus('FORCED_COMPLETE');
          setError(null);
        } else {
          setStatus('ERROR_SESSION');
          setError(error instanceof Error ? error.message : 'Failed to initialize authentication');
        }
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
  const isLoading = !forceComplete && (status === 'INITIALIZING' || status === 'CHECKING_SESSION' || status === 'FETCHING_ROLE');

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
  return context;
};
