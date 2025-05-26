import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { UserRole } from '@/types/auth';
import { toast } from 'sonner';

export type CurrentUserRoleStatus = 
  | 'INITIALIZING'
  | 'CHECKING_SESSION' 
  | 'NO_SESSION'
  | 'FETCHING_ROLE'
  | 'ROLE_DETERMINED'
  | 'ERROR_SESSION'
  | 'ERROR_FETCHING_ROLE';

// Export AuthRoleStatus as alias for backward compatibility
export type AuthRoleStatus = CurrentUserRoleStatus;

export interface CurrentUserRoleState {
  status: CurrentUserRoleStatus;
  role: UserRole | null;
  isAdmin: boolean;
  isAccountManager: boolean;
  isEditor: boolean;
  userId: string | null;
  error: string | null;
  isLoading: boolean;
}

const CurrentUserRoleContext = createContext<CurrentUserRoleState | undefined>(undefined);

export const CurrentUserRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const state = useCurrentUserRoleLogic();
  return (
    <CurrentUserRoleContext.Provider value={state}>
      {children}
    </CurrentUserRoleContext.Provider>
  );
};

export function useCurrentUserRoleLogic(): CurrentUserRoleState {
  const [authSession, setAuthSession] = useState<{ user: User | null; hasAuthSession: boolean }>({
    user: null,
    hasAuthSession: false,
  });
  const [status, setStatus] = useState<CurrentUserRoleStatus>('INITIALIZING');

  const fetchUserRole = useCallback(async (userId: string) => {
    console.log('[useCurrentUserRole] Fetching role for user:', userId);
    const { data: role, error } = await supabase
      .rpc('get_my_role');

    if (error) {
      console.error('[useCurrentUserRole] Error fetching role:', error);
      throw new Error(error.message);
    }

    return role as UserRole;
  }, []);

  const {
    data: rpcRole,
    error: rpcQueryError,
    isLoading: isRpcLoading,
    refetch: refetchRole,
  } = useQuery({
    queryKey: ['user-role', authSession.user?.id],
    queryFn: () => fetchUserRole(authSession.user!.id),
    enabled: !!authSession.user?.id && status !== 'CHECKING_SESSION' && status !== 'INITIALIZING',
    retry: false,
  });

  // Handle query success/error with useEffect
  useEffect(() => {
    if (authSession.user && isRpcLoading) {
      setStatus('FETCHING_ROLE');
    }
  }, [authSession.user, isRpcLoading]);

  useEffect(() => {
    if (rpcRole !== undefined && !rpcQueryError) {
      setStatus('ROLE_DETERMINED');
      toast.dismiss('user-role-error-toast');
    }
  }, [rpcRole, rpcQueryError]);

  useEffect(() => {
    if (rpcQueryError) {
      setStatus('ERROR_FETCHING_ROLE');
      toast.error(`Error determining user role. ${rpcQueryError.message}`, { id: 'user-role-error-toast' });
    }
  }, [rpcQueryError]);

  useEffect(() => {
    setStatus('CHECKING_SESSION');
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error("[useCurrentUserRole] Session error:", error);
          setStatus('ERROR_SESSION');
          toast.error(`Session error: ${error.message}`, { id: 'user-role-error-toast' });
          setAuthSession({ user: null, hasAuthSession: false });
          return;
        }

        if (!data.session) {
          setStatus('NO_SESSION');
          setAuthSession({ user: null, hasAuthSession: false });
          return;
        }
        
        console.log("[useCurrentUserRole] getSession successful. User:", data.session.user.id);
        setAuthSession({ user: data.session.user, hasAuthSession: true });
        setStatus('FETCHING_ROLE');
      }).catch(err => {
        console.error("[useCurrentUserRole] Unhandled error in getSession promise chain:", err);
        setStatus('ERROR_SESSION');
        toast.error(`Unexpected session error: ${err.message || 'Unknown error'}`, { id: 'user-role-error-toast' });
        setAuthSession({ user: null, hasAuthSession: false });
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useCurrentUserRole] Auth state change event:', event, "Session:", session ? session.user.id : null);

        if (event === 'SIGNED_IN' && session) {
          setAuthSession({ user: session.user, hasAuthSession: true });
          setStatus('FETCHING_ROLE'); 
          refetchRole();
        } else if (event === 'SIGNED_OUT') {
          setAuthSession({ user: null, hasAuthSession: false });
          setStatus('NO_SESSION');
        } else if (event === 'INITIAL_SESSION' && session) {
          console.log("[useCurrentUserRole] Auth event INITIAL_SESSION. User:", session.user.id);
          setAuthSession({ user: session.user, hasAuthSession: true });
          setStatus('FETCHING_ROLE'); 
          refetchRole();
        } else if (event === 'USER_UPDATED' && session) {
          console.log("[useCurrentUserRole] Auth event USER_UPDATED. User:", session.user.id);
          setAuthSession({ user: session.user, hasAuthSession: true });
          setStatus('FETCHING_ROLE');
          refetchRole();
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
      toast.dismiss('user-role-error-toast');
    };
  }, []);

  const finalState: CurrentUserRoleState = {
    status,
    role: (rpcRole as UserRole) || null,
    isAdmin: rpcRole === 'admin',
    isAccountManager: rpcRole === 'account_manager', 
    isEditor: rpcRole === 'editor',
    userId: authSession.user?.id || null,
    error: rpcQueryError?.message || null,
    isLoading: status === 'INITIALIZING' || status === 'CHECKING_SESSION' || status === 'FETCHING_ROLE' || isRpcLoading,
  };

  console.log('[useCurrentUserRole_Logic] FINAL State produced by logic hook:', finalState);
  return finalState;
}

export function useCurrentUserRole(): CurrentUserRoleState {
  const context = useContext(CurrentUserRoleContext);
  if (!context) {
    throw new Error('useCurrentUserRole must be used within a CurrentUserRoleProvider');
  }
  return context;
}
