import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type AuthRoleStatus =
  | "INITIALIZING"
  | "CHECKING_SESSION"
  | "NO_SESSION"
  | "FETCHING_ROLE"
  | "ROLE_DETERMINED"
  | "ERROR_SESSION"
  | "ERROR_FETCHING_ROLE";

export interface CurrentUserRoleState {
  status: AuthRoleStatus;
  role: UserRole | null;
  isAdmin: boolean;
  isAccountManager: boolean;
  isEditor: boolean;
  userId: string | null;
  error: string | null;
}

const initialState: CurrentUserRoleState = {
  status: "INITIALIZING",
  role: null,
  isAdmin: false,
  isAccountManager: false,
  isEditor: false,
  userId: null,
  error: null,
};

// Create the context
const CurrentUserRoleContext = createContext<CurrentUserRoleState | undefined>(
  undefined
);

const USER_ROLE_TOAST_ID = 'user-role-error-toast';

// Internal logic hook
function useCurrentUserRoleLogic(): CurrentUserRoleState {
  const [currentState, setCurrentState] = useState<CurrentUserRoleState>(initialState);
  const [hasAuthenticatedSession, setHasAuthenticatedSession] = useState<boolean>(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log("[useCurrentUserRole_Logic] Effect: Main - Initializing session check and auth listener.");
    setCurrentState(prev => ({ ...prev, status: "CHECKING_SESSION" }));

    const getInitialSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("[useCurrentUserRole_Logic] Error fetching initial session:", sessionError);
          setCurrentState(prev => ({ ...initialState, status: "ERROR_SESSION", error: sessionError.message, userId: null }));
          setHasAuthenticatedSession(false);
          toast.error("Session error: " + sessionError.message, { id: USER_ROLE_TOAST_ID });
        } else if (!session) {
          console.log("[useCurrentUserRole_Logic] No active initial session found.");
          setCurrentState(prev => ({ ...initialState, status: "NO_SESSION", userId: null }));
          setHasAuthenticatedSession(false);
          toast.dismiss(USER_ROLE_TOAST_ID);
        } else {
          console.log("[useCurrentUserRole_Logic] Initial session found. User ID:", session.user.id);
          setCurrentState(prev => ({ ...initialState, status: "FETCHING_ROLE", userId: session.user.id }));
          setHasAuthenticatedSession(true);
          toast.dismiss(USER_ROLE_TOAST_ID);
        }
      } catch (e: any) {
        console.error("[useCurrentUserRole_Logic] Exception during getInitialSession:", e);
        setCurrentState(prev => ({ ...initialState, status: "ERROR_SESSION", error: e.message, userId: null }));
        setHasAuthenticatedSession(false);
        toast.error("Session exception: " + e.message, { id: USER_ROLE_TOAST_ID });
      }
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[useCurrentUserRole_Logic] Auth state changed:", event, "User:", session?.user?.id);
        queryClient.invalidateQueries({ queryKey: ['current-user-role-rpc', session?.user?.id] });

        if (event === "SIGNED_OUT" || !session) {
          setCurrentState({ ...initialState, status: "NO_SESSION" });
          setHasAuthenticatedSession(false);
          toast.dismiss(USER_ROLE_TOAST_ID);
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          setCurrentState(prev => ({
            ...initialState,
            status: "FETCHING_ROLE",
            userId: session.user.id
          }));
          setHasAuthenticatedSession(true);
          toast.dismiss(USER_ROLE_TOAST_ID);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
      toast.dismiss(USER_ROLE_TOAST_ID);
    };
  }, [queryClient]);

  const { 
    data: rpcRole,
    error: rpcQueryError, 
    isLoading: isRpcQueryLoading, 
    isFetching: isRpcQueryFetching,
  } = useQuery<UserRole | null, Error>(
    {
      queryKey: ['current-user-role-rpc', currentState.userId],
      queryFn: async (): Promise<UserRole | null> => {
        console.log("[useCurrentUserRole_Logic] queryFn: Calling RPC 'get_my_role'. Current state userId:", currentState.userId);
        
        const { data, error } = await supabase.rpc('get_my_role', {});
        
        if (error) {
          console.error("[useCurrentUserRole_Logic] queryFn: RPC error calling 'get_my_role':", error);
          throw new Error(error.message || "RPC call failed"); 
        }
        console.log("[useCurrentUserRole_Logic] queryFn: Successfully called RPC. Role data:", data);
        return data as UserRole | null;
      },
      enabled: hasAuthenticatedSession && !!currentState.userId,
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, 
    }
  );

  useEffect(() => {
    console.log("[useCurrentUserRole_Logic] Effect: Processing RPC query results. HasAuthSession:", hasAuthenticatedSession, "isRpcQueryLoading/Fetching:", isRpcQueryLoading, isRpcQueryFetching, "rpcRole:", rpcRole, "rpcQueryError:", rpcQueryError, "Current Status:", currentState.status, "User ID from state:", currentState.userId);

    if (!hasAuthenticatedSession) {
      const nonResettableStatuses: AuthRoleStatus[] = [
        "NO_SESSION", 
        "INITIALIZING", 
        "CHECKING_SESSION", 
        "ERROR_SESSION"
      ];
      if (!nonResettableStatuses.includes(currentState.status)) {
         setCurrentState(prev => ({ ...initialState, status: "NO_SESSION" }));
         toast.dismiss(USER_ROLE_TOAST_ID);
      }
      return;
    }
    
    if (isRpcQueryLoading || isRpcQueryFetching) {
      setCurrentState(prev => ({ 
        ...prev, 
        status: "FETCHING_ROLE", 
        userId: prev.userId || currentState.userId,
        role: null, 
        isAdmin: false, 
        isAccountManager: false, 
        isEditor: false, 
        error: null 
      }));
      return;
    }

    if (rpcQueryError) {
      console.error("[useCurrentUserRole_Logic] Processing: RPC query error:", rpcQueryError);
      toast.error("Error determining user role. " + rpcQueryError.message, { id: USER_ROLE_TOAST_ID });
      setCurrentState(prev => ({
        ...initialState,
        userId: currentState.userId, 
        status: "ERROR_FETCHING_ROLE",
        error: rpcQueryError.message,
      }));
      return;
    }

    toast.dismiss(USER_ROLE_TOAST_ID);
    console.log("[useCurrentUserRole_Logic] Processing: RPC query finished. Role from RPC:", rpcRole);
    
    setCurrentState(prev => ({
      userId: currentState.userId || prev.userId, 
      status: "ROLE_DETERMINED",
      role: rpcRole,
      isAdmin: rpcRole === 'admin',
      isAccountManager: rpcRole === 'account_manager',
      isEditor: rpcRole === 'editor',
      error: null,
    }));

  }, [hasAuthenticatedSession, rpcRole, rpcQueryError, isRpcQueryLoading, isRpcQueryFetching, currentState.status, currentState.userId]);

  useEffect(() => {
    console.log("[useCurrentUserRole_Logic] FINAL State produced by logic hook:", currentState);
  }, [currentState]);
  
  return currentState;
}

// Provider component
export const CurrentUserRoleProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const currentUserRoleState = useCurrentUserRoleLogic();
  return (
    <CurrentUserRoleContext.Provider value={currentUserRoleState}>
      {children}
    </CurrentUserRoleContext.Provider>
  );
};

// Custom hook to consume the context
export const useCurrentUserRole = (): CurrentUserRoleState => {
  const context = useContext(CurrentUserRoleContext);
  if (context === undefined) {
    throw new Error("useCurrentUserRole must be used within a CurrentUserRoleProvider");
  }
  // console.log("[useCurrentUserRole_Consumer] Consuming context state:", context); // Kept for debugging if needed
  return context;
};
 