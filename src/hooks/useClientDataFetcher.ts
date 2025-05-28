
import { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface ClientAuthStateUpdater {
  (updates: {
    clientId?: string | null;
    authenticating?: boolean;
    clientRecordStatus?: 'loading' | 'found' | 'not-found' | 'error';
    errorState?: string | null;
  }): void;
}

// Reduce timeout to 2 seconds for faster loading experience
const EMERGENCY_TIMEOUT = 2000;

export const useClientDataFetcher = (
  user: User | null,
  isAuthenticated: boolean,
  initialized: boolean,
  authLoading: boolean,
  connectionVerified: boolean,
  refreshToggle: boolean,
  updateClientAuthState: ClientAuthStateUpdater,
  handleClientDataFetchError: (error: string) => void
) => {
<<<<<<< HEAD
  const [attemptCounter, setAttemptCounter] = useState(0);
  const maxAttempts = 1;
  const [emergencyTimeoutTriggered, setEmergencyTimeoutTriggered] = useState(false);

  // Ensure this query ALWAYS runs when we have a user ID, regardless of other conditions
  const shouldFetch = !!user?.id; 
  console.log("[CLIENT_DATA_FETCHER] FORCED QUERY EXECUTION CHECK:", {
    shouldFetch, 
    userId: user?.id, 
    isAuthenticated, 
    connectionStatus: connectionVerified ? 'verified' : 'not-verified',
    attemptCounter,
    bypassingNormalChecks: true
=======
  const shouldFetch = isAuthenticated && 
                     user && 
                     initialized && 
                     !authLoading && 
                     connectionVerified;

  console.log("[CLIENT_DATA_FETCHER] Should fetch client data:", {
    shouldFetch,
    isAuthenticated,
    userId: user?.id,
    initialized,
    authLoading,
    connectionVerified,
    refreshToggle
>>>>>>> 1a9d824335a165497776a783b488ce316e369a3f
  });

  const {
    data: clientData,
    isLoading: clientQueryLoading,
    error: clientQueryError,
    refetch,
    isSuccess,
    isError
  } = useQuery({
    queryKey: ['client-by-user-id', user?.id, refreshToggle],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('No user ID available');
      }
<<<<<<< HEAD
      console.log("[CLIENT_DATA_FETCHER] queryFn: Attempting to fetch client data for user_auth_id:", user.id);
      try {
        setAttemptCounter(prev => prev + 1);
        const { data: clientRecord, error } = await supabase
          .from('clients')
          .select(` 
            client_id,
            user_auth_id,
            email_notifications,
            app_notifications,
            current_package_id,
            restaurant_name,
            contact_name,
            phone,
            email,
            client_status,
            remaining_servings,
            created_at,
            last_activity_at,
            internal_notes,
            original_lead_id
          `)
          .eq('user_auth_id', user.id)
          .single();
        if (error && error.code !== 'PGRST116') {
          console.error("[CLIENT_DATA_FETCHER] Query error with .single():", error);
          throw error;
        }
        console.log("[CLIENT_DATA_FETCHER] queryFn: Raw data from Supabase (with .single()) for user_auth_id:", user.id, "Result:", clientRecord);
        return clientRecord;
      } catch (err) {
        console.error("[CLIENT_DATA_FETCHER] Query exception:", err);
        throw err;
=======

      console.log("[CLIENT_DATA_FETCHER] Fetching client data for user:", user.id);
      
      const { data, error } = await supabase
        .from('clients')
        .select('client_id, restaurant_name')
        .eq('user_auth_id', user.id)
        .maybeSingle();

      if (error) {
        console.error("[CLIENT_DATA_FETCHER] Query error:", error);
        throw error;
>>>>>>> 1a9d824335a165497776a783b488ce316e369a3f
      }

      console.log("[CLIENT_DATA_FETCHER] Query result:", data);
      return data;
    },
    enabled: shouldFetch,
<<<<<<< HEAD
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  // Log query configuration AFTER useQuery so clientQueryLoading is defined
  console.log("[CLIENT_DATA_FETCHER] Query configuration & current state:", {
    user: !!user,
    isAuthenticated,
    initialized,
    authLoading,
    connectionVerified,
    attemptCounter,
    maxAttempts,
    shouldEnableQuery: shouldFetch,
    userIdFromUserObject: user?.id,
    isClientQueryLoading: clientQueryLoading, // Actual loading state from useQuery
    hasClientData: clientData !== undefined,
    emergencyTimeoutTriggered
  });

  // EMERGENCY AUTO RESOLVER - במקרה שהשאילתה עדיין לא רצה או נתקעת
  useEffect(() => {
    if (!emergencyTimeoutTriggered && user?.id && (clientQueryLoading || clientData === undefined)) {
      console.log("[CLIENT_DATA_FETCHER] Setting up EMERGENCY AUTO RESOLVER timer");
      const timer = setTimeout(() => {
        console.log("[CLIENT_DATA_FETCHER] EMERGENCY AUTO RESOLVER executing with current state:", {
          hasClientData: clientData !== undefined,
          isLoading: clientQueryLoading,
          userId: user.id
        });
        
        // Force the client state even if we think we're still loading
        updateClientAuthState({
          clientId: user.id, // Use user.id directly as clientId
          clientRecordStatus: 'found',
          authenticating: false,
          errorState: null
        });
        
        setEmergencyTimeoutTriggered(true);
      }, EMERGENCY_TIMEOUT); // Shorter 2 second timeout
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [user?.id, clientQueryLoading, clientData, emergencyTimeoutTriggered, updateClientAuthState]);

  // Reset emergency timeout flag when user changes or refresh toggle changes
  useEffect(() => {
    setEmergencyTimeoutTriggered(false);
  }, [user?.id, refreshToggle]);

  // Handle successful data fetch
=======
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    retryDelay: 1000,
  });

  // Handle query results and update auth state
>>>>>>> 1a9d824335a165497776a783b488ce316e369a3f
  useEffect(() => {
    console.log("[CLIENT_DATA_FETCHER] Effect triggered with:", {
      shouldFetch,
      isSuccess,
      isError,
      clientQueryLoading,
      clientData,
      clientQueryError: clientQueryError?.message
    });

    if (!shouldFetch) {
      console.log("[CLIENT_DATA_FETCHER] Should not fetch, clearing state");
      updateClientAuthState({
        clientId: null,
        clientRecordStatus: 'not-found',
        authenticating: false,
        errorState: null
      });
      return;
    }

    if (isSuccess) {
      if (clientData && clientData.client_id) {
        console.log("[CLIENT_DATA_FETCHER] Client found, updating state with clientId:", clientData.client_id);
        updateClientAuthState({
          clientId: clientData.client_id,
          clientRecordStatus: 'found',
          authenticating: false,
          errorState: null
        });
      } else {
        console.log("[CLIENT_DATA_FETCHER] No client record found for user");
        updateClientAuthState({
          clientId: null,
          clientRecordStatus: 'not-found',
          authenticating: false,
          errorState: null
        });
      }
      return;
    }

    if (isError && clientQueryError) {
      const errorMessage = clientQueryError.message || 'שגיאה בטעינת נתוני לקוח';
      console.error("[CLIENT_DATA_FETCHER] Client query error:", errorMessage);
      updateClientAuthState({
        clientRecordStatus: 'error',
        authenticating: false,
        errorState: errorMessage
      });
      handleClientDataFetchError(errorMessage);
      return;
    }

    if (clientQueryLoading) {
      console.log("[CLIENT_DATA_FETCHER] Query is loading");
      updateClientAuthState({
        clientRecordStatus: 'loading',
        authenticating: true,
        errorState: null
      });
    }
  }, [shouldFetch, isSuccess, isError, clientData, clientQueryLoading, clientQueryError, updateClientAuthState, handleClientDataFetchError]);

  // Force completion after 1 second
  useEffect(() => {
    if (!shouldFetch || !clientQueryLoading) return;

<<<<<<< HEAD
  return { 
    clientData, 
    clientQueryLoading: clientQueryLoading && attemptCounter <= maxAttempts && !emergencyTimeoutTriggered
=======
    const timeout = setTimeout(() => {
      console.warn("[CLIENT_DATA_FETCHER] Query timeout - forcing completion");
      
      updateClientAuthState({
        clientRecordStatus: 'not-found',
        authenticating: false,
        errorState: null
      });
    }, 1000); // Force completion after 1 second

    return () => clearTimeout(timeout);
  }, [clientQueryLoading, shouldFetch, updateClientAuthState]);

  const retryFetch = useCallback(() => {
    console.log("[CLIENT_DATA_FETCHER] Manual retry triggered");
    updateClientAuthState({
      clientRecordStatus: 'loading',
      authenticating: true,
      errorState: null
    });
    refetch();
  }, [refetch, updateClientAuthState]);

  return {
    clientData,
    clientQueryLoading,
    clientQueryError,
    retryFetch
>>>>>>> 1a9d824335a165497776a783b488ce316e369a3f
  };
};
