
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

      console.log("[CLIENT_DATA_FETCHER] Fetching client data for user:", user.id);
      
      const { data, error } = await supabase
        .from('clients')
        .select('client_id, restaurant_name')
        .eq('user_auth_id', user.id)
        .maybeSingle();

      if (error) {
        console.error("[CLIENT_DATA_FETCHER] Query error:", error);
        throw error;
      }

      console.log("[CLIENT_DATA_FETCHER] Query result:", data);
      return data;
    },
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      return !error.message?.includes('JWT');
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle query results and update auth state
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

    // Handle successful query completion
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

    // Handle query error
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

    // Handle loading state
    if (clientQueryLoading) {
      console.log("[CLIENT_DATA_FETCHER] Query is loading");
      updateClientAuthState({
        clientRecordStatus: 'loading',
        authenticating: true,
        errorState: null
      });
    }
  }, [shouldFetch, isSuccess, isError, clientData, clientQueryLoading, clientQueryError, updateClientAuthState, handleClientDataFetchError]);

  // Force completion if stuck too long
  useEffect(() => {
    if (!shouldFetch || !clientQueryLoading) return;

    const timeout = setTimeout(() => {
      console.warn("[CLIENT_DATA_FETCHER] Query timeout - forcing completion");
      
      // Try to get client data one more time before giving up
      if (user?.id) {
        supabase
          .from('clients')
          .select('client_id, restaurant_name')
          .eq('user_auth_id', user.id)
          .maybeSingle()
          .then(({ data, error }) => {
            if (error) {
              console.error("[CLIENT_DATA_FETCHER] Timeout retry failed:", error);
              updateClientAuthState({
                clientRecordStatus: 'error',
                authenticating: false,
                errorState: 'זמן קצוב - אנא נסו לרענן את הדף'
              });
            } else if (data && data.client_id) {
              console.log("[CLIENT_DATA_FETCHER] Timeout retry succeeded, found client:", data.client_id);
              updateClientAuthState({
                clientId: data.client_id,
                clientRecordStatus: 'found',
                authenticating: false,
                errorState: null
              });
            } else {
              console.log("[CLIENT_DATA_FETCHER] Timeout retry - no client found");
              updateClientAuthState({
                clientId: null,
                clientRecordStatus: 'not-found',
                authenticating: false,
                errorState: null
              });
            }
          });
      } else {
        updateClientAuthState({
          clientRecordStatus: 'error',
          authenticating: false,
          errorState: 'זמן קצוב - אנא נסו לרענן את הדף'
        });
      }
    }, 8000); // 8 second timeout

    return () => clearTimeout(timeout);
  }, [clientQueryLoading, shouldFetch, updateClientAuthState, user?.id]);

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
  };
};
