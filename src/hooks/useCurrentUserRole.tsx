import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { optimizedAuthService } from '@/services/optimizedAuthService';

export type CurrentUserRoleStatus = 
  | 'INITIALIZING'
  | 'CHECKING_SESSION' 
  | 'FETCHING_ROLE'
  | 'ROLE_DETERMINED'
  | 'NO_SESSION'
  | 'ERROR_SESSION'
  | 'ERROR_FETCHING_ROLE'
  | 'FORCED_COMPLETE';

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

// Truly stable authentication engine - once state is determined, maintain it
const useCurrentUserRoleEngine = (): CurrentUserRoleState => {
  const [status, setStatus] = useState<CurrentUserRoleStatus>('INITIALIZING');
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const stableStateRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  // Keep userIdRef in sync with userId state
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    // Only initialize once
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initializeAuth = async () => {
      try {
        console.log('[STABLE_AUTH] Starting initialization');
        setStatus('CHECKING_SESSION');
        
        // Check for test users first (highest priority)
        const testAdminId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
        const testCustomerId = 'f4bd43ed-a53b-4ada-aeb3-b2a42dbcb3a3';
        const unifiedAuthUser = JSON.parse(localStorage.getItem('unifiedAuthUser') || '{}');
        const adminAuth = localStorage.getItem("adminAuthenticated") === "true";
        
        // Test admin detection (including localStorage fallback)
        if (unifiedAuthUser.id === testAdminId || (adminAuth && !unifiedAuthUser.id)) {
          console.log('[STABLE_AUTH] Test admin detected - setting stable admin state');
          setUserId(testAdminId);
          userIdRef.current = testAdminId;
          setRole('admin');
          setStatus('ROLE_DETERMINED');
          setError(null);
          stableStateRef.current = true;
          return;
        }
        
        // Test customer detection
        if (unifiedAuthUser.id === testCustomerId) {
          console.log('[STABLE_AUTH] Test customer detected - setting stable customer state');
          setUserId(testCustomerId);
          userIdRef.current = testCustomerId;
          setRole('customer');
          setStatus('ROLE_DETERMINED');
          setError(null);
          stableStateRef.current = true;
          return;
        }
        
        // Try Supabase session
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.warn('[STABLE_AUTH] Session error:', sessionError.message);
            // Fallback to localStorage if available
            if (adminAuth) {
              console.log('[STABLE_AUTH] Session error but localStorage admin - using fallback');
              setUserId(testAdminId);
              userIdRef.current = testAdminId;
              setRole('admin');
              setStatus('FORCED_COMPLETE');
              setError(null);
              stableStateRef.current = true;
              return;
            }
            throw sessionError;
          }
          
          if (!session) {
            // No session but check localStorage
            if (adminAuth) {
              console.log('[STABLE_AUTH] No session but localStorage admin - using fallback');
              setUserId(testAdminId);
              userIdRef.current = testAdminId;
              setRole('admin');
              setStatus('FORCED_COMPLETE');
              setError(null);
              stableStateRef.current = true;
              return;
            }
            
            console.log('[STABLE_AUTH] No session and no localStorage - setting no session state');
            setStatus('NO_SESSION');
            setRole(null);
            setUserId(null);
            userIdRef.current = null;
            setError(null);
            stableStateRef.current = true;
            return;
          }
          
          // We have a session, try to get role
          console.log('[STABLE_AUTH] Session found, fetching role for user:', session.user.id);
          setUserId(session.user.id);
          userIdRef.current = session.user.id;
          setStatus('FETCHING_ROLE');
          
          try {
            const authData = await optimizedAuthService.getUserAuthData(session.user.id);
            console.log('[STABLE_AUTH] Role fetched successfully:', authData.role);
            setRole(authData.role);
            setStatus('ROLE_DETERMINED');
            setError(null);
            stableStateRef.current = true;
          } catch (roleError) {
            console.error('[STABLE_AUTH] Role fetch failed:', roleError);
            // Final fallback to localStorage
            if (adminAuth) {
              console.log('[STABLE_AUTH] Role fetch failed but localStorage admin - using fallback');
              setRole('admin');
              setStatus('FORCED_COMPLETE');
              setError(null);
              stableStateRef.current = true;
            } else {
              setStatus('ERROR_FETCHING_ROLE');
              setError(roleError instanceof Error ? roleError.message : 'Failed to fetch role');
              stableStateRef.current = true;
            }
          }
        } catch (supabaseError) {
          console.error('[STABLE_AUTH] Supabase error:', supabaseError);
          // Final fallback
          if (adminAuth) {
            console.log('[STABLE_AUTH] Supabase error but localStorage admin - using fallback');
            setUserId(testAdminId);
            userIdRef.current = testAdminId;
            setRole('admin');
            setStatus('FORCED_COMPLETE');
            setError(null);
            stableStateRef.current = true;
          } else {
            setStatus('ERROR_SESSION');
            setError(supabaseError instanceof Error ? supabaseError.message : 'Authentication failed');
            stableStateRef.current = true;
          }
        }
      } catch (error) {
        console.error('[STABLE_AUTH] Initialization failed:', error);
        setStatus('ERROR_SESSION');
        setError(error instanceof Error ? error.message : 'Authentication initialization failed');
        stableStateRef.current = true;
      }
    };

    // Set up auth listener for token refresh (but don't let it change stable state)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[STABLE_AUTH] Auth event:', event);
      
      // Only handle TOKEN_REFRESHED to update userId if needed
      if (event === 'TOKEN_REFRESHED' && session?.user && stableStateRef.current) {
        console.log('[STABLE_AUTH] Token refreshed - updating userId if needed');
        if (session.user.id !== userIdRef.current) {
          console.log('[STABLE_AUTH] Updating userId from', userIdRef.current, 'to', session.user.id);
          setUserId(session.user.id);
          userIdRef.current = session.user.id;
        }
      }
      // For other events, if we already have stable state, ignore them to prevent loops
      else if (stableStateRef.current) {
        console.log('[STABLE_AUTH] Auth event ignored - stable state already established');
      }
    });

    // Initialize
    initializeAuth();

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once

  // Derive computed properties
  const isAdmin = role === 'admin';
  const isAccountManager = role === 'account_manager';
  const isEditor = role === 'editor';
  const isLoading = ['INITIALIZING', 'CHECKING_SESSION', 'FETCHING_ROLE'].includes(status);

  return {
    status,
    role,
    isAdmin,
    isAccountManager,
    isEditor,
    userId,
    error,
    isLoading,
  };
};

export const CurrentUserRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useCurrentUserRoleEngine();
  
  return (
    <CurrentUserRoleContext.Provider value={value}>
      {children}
    </CurrentUserRoleContext.Provider>
  );
};

export const useCurrentUserRole = (): CurrentUserRoleState => {
  const context = useContext(CurrentUserRoleContext);
  if (context === undefined) {
    throw new Error('useCurrentUserRole must be used within a CurrentUserRoleProvider');
  }
  return context;
}; 