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
        console.warn("[CLIENT_DATA_FETCHER] queryFn: No user ID available, though query was enabled.");
        return null; 
      }
      console.log("[CLIENT_DATA_FETCHER] Fetching client data for user:", user.id);
      
      const { data, error } = await supabase
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
        .maybeSingle();

      if (error) {
        console.error("[CLIENT_DATA_FETCHER] Query error:", error);
        throw error;
      }

      console.log("[CLIENT_DATA_FETCHER] Query result:", data);
      return data;
    },
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    retryDelay: 1000,
  });

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
        console.log("[CLIENT_DATA_FETCHER] No client record found for user_auth_id:", user?.id);
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
  }, [
    shouldFetch,
    isSuccess,
    isError,
    clientQueryLoading,
    clientData,
    clientQueryError,
    updateClientAuthState,
    handleClientDataFetchError,
    user?.id
  ]);

  return { clientData, clientQueryLoading, refetch };
};
