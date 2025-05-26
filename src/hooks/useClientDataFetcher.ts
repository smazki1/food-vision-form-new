import { useEffect, useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { clientAuthService } from "@/services/clientAuthService";
import { User } from "@supabase/supabase-js";

/**
 * Hook for fetching client data based on user authentication
 */
export const useClientDataFetcher = (
  user: User | null, 
  isAuthenticated: boolean, 
  initialized: boolean, 
  loading: boolean,
  connectionVerified: boolean,
  refreshToggle: boolean,
  onUpdate: (updates: any) => void,
  onError: (error: string) => void
) => {
  const [clientQueryEnabled, setClientQueryEnabled] = useState(false);
  // Track time when client query was enabled
  const [queryStartTime, setQueryStartTime] = useState<number | null>(null);

  // Enable the client data query only when auth is complete and user is authenticated
  useEffect(() => {
    if (initialized && !loading && isAuthenticated && user?.id && connectionVerified) {
      if (!clientQueryEnabled) {
        setQueryStartTime(Date.now());
      setClientQueryEnabled(true);
      // Ensure authenticating is true when we start the process
      onUpdate({
        clientRecordStatus: 'loading',
        authenticating: true, // Explicitly set authenticating true
        errorState: null // Clear previous errors
      });
      console.log("[AUTH_DEBUG_FINAL] useClientDataFetcher - Enabling client data query for user:", user.id);
      }
    } else if (initialized && !loading && !isAuthenticated) {
      // If auth is initialized and user is not authenticated, 
      // disable querying but let ClientAuthProvider handle the broader state reset.
      if (clientQueryEnabled) { // Only act if it was previously enabled
        setClientQueryEnabled(false);
        setQueryStartTime(null);
        console.log("[AUTH_DEBUG_FINAL] useClientDataFetcher - User not authenticated by useUnifiedAuth, disabling client data query. ClientAuthProvider will reset state.");
      }
    } else {
      // This log can be noisy if conditions frequently change, consider conditional logging
      // console.log("[AUTH_DEBUG_FINAL] useClientDataFetcher - Not ready to fetch client data yet:", {
      //   initialized, loading, isAuthenticated, hasUserId: !!user?.id, connectionVerified, timestamp: Date.now()
      // });
    }
    
    // Force query completion after timeout
    let timeoutId: NodeJS.Timeout | undefined;
    if (clientQueryEnabled && queryStartTime !== null) {
      timeoutId = setTimeout(() => {
        if (queryStartTime !== null) { 
          const queryDuration = Date.now() - queryStartTime;
          console.warn(`[AUTH_DEBUG_FINAL] useClientDataFetcher - Query seems STUCK after ${queryDuration}ms (timeout was 7000ms). Forcing error state.`);
          onError("Client data query timed out. Please try again."); // Inform through onError prop
          onUpdate({ 
              authenticating: false,
              clientRecordStatus: 'error',
              errorState: "Client data query timed out."
          });
          setQueryStartTime(null); 
          setClientQueryEnabled(false); 
        }
      }, 7000); 
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [initialized, loading, isAuthenticated, user?.id, connectionVerified, onUpdate, onError, clientQueryEnabled, queryStartTime, setQueryStartTime]); // Added onError to deps

  // Use React Query with improved error handling and retry logic
  const { data: clientData, isLoading: clientQueryLoading } = useQuery({
    queryKey: ["clientId", user?.id, refreshToggle],
    queryFn: async () => {
      if (!user?.id) {
        console.log("[AUTH_DEBUG_FINAL] useClientDataFetcher - No user ID for query");
        return null;
      }
      
      console.log("[AUTH_DEBUG_FINAL] useClientDataFetcher - Fetching client ID for user:", user.id);
      const startTime = Date.now();
      
      try {
        const result = await clientAuthService.fetchClientIdForUser(user.id);
        const duration = Date.now() - startTime;
        console.log(`[AUTH_DEBUG_FINAL] useClientDataFetcher - fetchClientId completed in ${duration}ms with result:`, result);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[AUTH_DEBUG_FINAL] useClientDataFetcher - fetchClientId failed after ${duration}ms:`, error);
        
        // Capture specific policy errors for UI feedback
        if (error instanceof Error) {
          if (error.message.includes('policy')) {
            onError("Database policy error detected. Please contact support.");
          }
          else if (error.message.includes('permission')) {
            onError("Permission denied. Please check your account permissions.");
          }
          else if (error.message.includes('Authentication')) {
            onError("Authentication verification failed. Please try logging in again.");
          }
        }
        throw error;
      }
    },
    enabled: clientQueryEnabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: (failureCount, error) => {
      // If it's a policy error, don't retry
      if (error instanceof Error && 
         (error.message.includes('policy') || 
          error.message.includes('permission') ||
          error.message.includes('Authentication') ||
          error.message.includes('recursion'))) {
        console.error("[AUTH_DEBUG_FINAL] useClientDataFetcher - Auth/permission error, not retrying");
        return false;
      }
      // Otherwise retry only once to avoid excessive retries
      return failureCount < 1;
    },
    meta: {
      onError: (error: Error) => {
        console.error("[AUTH_DEBUG_FINAL] useClientDataFetcher - Error fetching client data (from useQuery meta.onError):", error);
        // This onError is from react-query if the queryFn throws or retry fails
        onUpdate({
          clientRecordStatus: 'error',
          authenticating: false // Ensure we're not stuck in loading state
          // errorState will be set by the onError prop call below
        });
        
        // Set specific error states for different error types
        if (error.message.includes('policy') || error.message.includes('recursion')) {
          onError("Policy configuration error. Please contact support.");
        } else if (error.message.includes('permission')) {
          onError("Permission denied. Please check your account permissions.");
        } else if (error.message.includes('Authentication')) {
          onError("Authentication verification failed. Please try logging in again.");
        } else {
          onError("Error loading client data. Please try again later.");
        }
      }
    }
  });

  // NEW useEffect to handle successful query completion and update state
  useEffect(() => {
    // Only act if a query was genuinely started (queryStartTime was set)
    if (queryStartTime === null && !clientQueryLoading) {
      // If queryStartTime is null and we are not loading, it means either:
      // 1. Query completed successfully and queryStartTime was cleared.
      // 2. Query was never started or was reset.
      // In this case, this effect doesn't need to do anything related to success handling.
      return;
    }

    // Condition for successful completion acknowledged by React Query:
    // - It's no longer loading (clientQueryLoading is false).
    // - clientData is defined (it will be string or null, not undefined if successful query execution).
    // - A query attempt was made (queryStartTime was not null before this render cycle or clientQueryEnabled is true).
    if (!clientQueryLoading && clientData !== undefined && (clientQueryEnabled || queryStartTime !== null)) {
      console.log("[AUTH_DEBUG_FINAL] useClientDataFetcher - Query successful (clientQueryLoading is false, clientData is defined). Clearing queryStartTime.", { clientDataValue: clientData });
      
      // Store queryStartTime before clearing, to confirm it was active
      const wasQueryAttempted = queryStartTime !== null;
      setQueryStartTime(null); // Crucial: Clear the start time to prevent timeout

      if (wasQueryAttempted) { // Only call onUpdate if this effect is reacting to a completed query
        if (typeof clientData === 'string' && clientData.length > 0) { // Client ID found
            onUpdate({
                clientId: clientData,
                clientRecordStatus: 'found',
                authenticating: false,
                errorState: null,
                hasLinkedClientRecord: true,
                hasNoClientRecord: false,
            });
        } else if (clientData === null) { // Successfully determined no client record
            onUpdate({
                clientId: null,
                clientRecordStatus: 'not-found',
                authenticating: false,
                errorState: null,
                hasLinkedClientRecord: false,
                hasNoClientRecord: true,
            });
        }
        // If clientData is undefined here, it's an edge case not typically expected for a "successful" (non-loading) query state.
        // The primary timeout or meta.onError should catch issues.
      }
    }
  }, [clientQueryEnabled, clientQueryLoading, clientData, queryStartTime, onUpdate, setQueryStartTime]); // Dependencies remain critical

  return { clientData, clientQueryLoading, clientQueryEnabled };
};
