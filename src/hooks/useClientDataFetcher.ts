import { useEffect, useState } from 'react';
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

// Reduce timeout to 2 seconds for faster loading experience
const EMERGENCY_TIMEOUT = 2000;

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
        console.warn("[CLIENT_DATA_FETCHER] queryFn: No user ID available, cannot fetch.");
        return null;
      }
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
      }
    },
    enabled: shouldFetch,
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
  useEffect(() => {
    if (clientData !== undefined && !clientQueryLoading && attemptCounter > 0) {
      console.log("[CLIENT_DATA_FETCHER] Processing client data (attempt:", attemptCounter, "):", clientData);

      if (clientData) {
        console.log("[CLIENT_DATA_FETCHER] Client data found. Calling updateClientAuthState with clientId:", clientData.client_id);
        updateClientAuthState({
          clientId: clientData.client_id,
          clientRecordStatus: 'found',
          errorState: null,
          authenticating: false
        });
      } else {
        console.log("[CLIENT_DATA_FETCHER] No client data found for user_auth_id:", user?.id, ". Calling updateClientAuthState with clientId: null.");
        updateClientAuthState({
          clientId: null,
          clientRecordStatus: 'not-found',
          errorState: null,
          authenticating: false
        });
      }
    }
  }, [clientData, clientQueryLoading, updateClientAuthState, attemptCounter]);

  // Handle query errors
  useEffect(() => {
    if (clientQueryError && attemptCounter > 0) {
      console.error("[CLIENT_DATA_FETCHER] Query error occurred (attempt:", attemptCounter, "):", clientQueryError);

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
  }, [clientQueryError, onError, updateClientAuthState, attemptCounter]);

  // Reset attempt counter when refresh is triggered
  useEffect(() => {
    if (refreshToggle !== undefined) {
      console.log("[CLIENT_DATA_FETCHER] Resetting attempt counter due to refresh");
      setAttemptCounter(0);
    }
  }, [refreshToggle]);

  return { 
    clientData, 
    clientQueryLoading: clientQueryLoading && attemptCounter <= maxAttempts && !emergencyTimeoutTriggered
  };
};
