
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
  const [forcedTimeout, setForcedTimeout] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const shouldEnableQuery = 
    user && 
    isAuthenticated && 
    initialized && 
    !authLoading && 
    connectionVerified && 
    !forcedTimeout;

  console.log("[CLIENT_DATA_FETCHER] Query enabled:", shouldEnableQuery);

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
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: shouldEnableQuery,
    retry: 1,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    // Reduced timeout to 3 seconds for faster failure
    timeout: 3000
  });

  // Set up timeout protection - reduced to 3 seconds
  useEffect(() => {
    if (clientQueryLoading && shouldEnableQuery) {
      console.log("[CLIENT_DATA_FETCHER] Starting timeout protection");
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        console.warn("[CLIENT_DATA_FETCHER] Query timeout reached, forcing fallback");
        setForcedTimeout(true);
        onError("Client data query timed out.");
      }, 3000); // Reduced from 7 seconds to 3 seconds

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [clientQueryLoading, shouldEnableQuery, onError]);

  // Handle successful data fetch
  useEffect(() => {
    if (clientData !== undefined && !clientQueryLoading && !forcedTimeout) {
      console.log("[CLIENT_DATA_FETCHER] Processing client data:", clientData);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

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
  }, [clientData, clientQueryLoading, updateClientAuthState, forcedTimeout]);

  // Handle query errors
  useEffect(() => {
    if (clientQueryError && !forcedTimeout) {
      console.error("[CLIENT_DATA_FETCHER] Query error occurred:", clientQueryError);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const errorMessage = clientQueryError instanceof Error 
        ? clientQueryError.message 
        : 'Failed to fetch client data';
      
      onError(errorMessage);
    }
  }, [clientQueryError, onError, forcedTimeout]);

  // Reset forced timeout when query conditions change
  useEffect(() => {
    if (!shouldEnableQuery && forcedTimeout) {
      console.log("[CLIENT_DATA_FETCHER] Resetting forced timeout");
      setForcedTimeout(false);
    }
  }, [shouldEnableQuery, forcedTimeout]);

  return { 
    clientData, 
    clientQueryLoading: clientQueryLoading && !forcedTimeout
  };
};
