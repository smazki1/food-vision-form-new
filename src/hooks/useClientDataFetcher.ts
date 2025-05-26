
import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientAuthState } from '@/types/clientAuthTypes';

interface ClientData {
  client_id: string;
  user_auth_id: string;
  email_notifications: boolean;
  app_notifications: boolean;
  current_package_id: string | null;
  restaurant_name: string;
  contact_name: string;
  phone: string;
  email: string;
  client_status: string;
  remaining_servings: number;
  created_at: string;
  last_activity_at: string | null;
  internal_notes: string | null;
  original_lead_id: string | null;
}

export const useClientDataFetcher = (
  user: any,
  isAuthenticated: boolean,
  initialized: boolean,
  authLoading: boolean,
  connectionVerified: boolean,
  refreshToggle: boolean,
  updateClientAuthState: (updates: Partial<ClientAuthState>) => void,
  onError: (errorMessage: string) => void
) => {
  const [hasAttempted, setHasAttempted] = useState(false);

  const shouldEnableQuery = 
    user && 
    isAuthenticated && 
    initialized && 
    !authLoading && 
    connectionVerified &&
    !hasAttempted; // Only attempt once

  console.log("[CLIENT_DATA_FETCHER] Query enabled:", shouldEnableQuery, {
    user: !!user,
    isAuthenticated,
    initialized,
    authLoading,
    connectionVerified,
    hasAttempted
  });

  const { 
    data: clientData, 
    isLoading: clientQueryLoading, 
    error: clientQueryError,
    refetch
  } = useQuery<ClientData | null>({
    queryKey: ['client-data', user?.id, refreshToggle],
    queryFn: async () => {
      if (!user?.id) {
        console.log("[CLIENT_DATA_FETCHER] No user ID available");
        return null;
      }

      console.log("[CLIENT_DATA_FETCHER] Fetching client data for user:", user.id);
      
      try {
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
          .eq('user_auth_id', user.id);

        if (error) {
          console.error("[CLIENT_DATA_FETCHER] Query error:", error);
          throw error;
        }

        console.log("[CLIENT_DATA_FETCHER] Query result:", data);
        setHasAttempted(true);
        return data && data.length > 0 ? data[0] : null;
      } catch (err) {
        console.error("[CLIENT_DATA_FETCHER] Query exception:", err);
        setHasAttempted(true);
        throw err;
      }
    },
    enabled: shouldEnableQuery,
    retry: 1,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  // Handle successful data fetch
  useEffect(() => {
    if (clientData !== undefined && !clientQueryLoading && hasAttempted) {
      console.log("[CLIENT_DATA_FETCHER] Processing client data:", clientData);

      if (clientData) {
        updateClientAuthState({
          clientId: clientData.client_id,
          clientRecordStatus: 'found',
          errorState: null,
          authenticating: false
        });
      } else {
        updateClientAuthState({
          clientId: null,
          clientRecordStatus: 'not-found',
          errorState: null,
          authenticating: false
        });
      }
    }
  }, [clientData, clientQueryLoading, updateClientAuthState, hasAttempted]);

  // Handle query errors
  useEffect(() => {
    if (clientQueryError && hasAttempted) {
      console.error("[CLIENT_DATA_FETCHER] Query error occurred:", clientQueryError);

      const errorMessage = clientQueryError instanceof Error 
        ? clientQueryError.message 
        : 'Failed to fetch client data';
      
      onError(errorMessage);
      updateClientAuthState({
        clientId: null,
        clientRecordStatus: 'error',
        errorState: errorMessage,
        authenticating: false
      });
    }
  }, [clientQueryError, onError, updateClientAuthState, hasAttempted]);

  // Reset attempt flag when refresh is triggered
  useEffect(() => {
    if (refreshToggle !== undefined) {
      console.log("[CLIENT_DATA_FETCHER] Resetting attempt flag due to refresh");
      setHasAttempted(false);
    }
  }, [refreshToggle]);

  return { 
    clientData, 
    clientQueryLoading: clientQueryLoading && !hasAttempted
  };
};
