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
        onUpdate({
          clientRecordStatus: 'loading',
        });
        console.log("[AUTH_DEBUG_FINAL] useClientDataFetcher - Enabling client data query for user:", user.id);
      }
    } else if (initialized && !loading && !isAuthenticated) {
      // If auth is initialized and user is not authenticated, we can stop authenticating
      onUpdate({
        clientId: null,
        authenticating: false,
        clientRecordStatus: 'not-found',
        hasNoClientRecord: true,
        errorState: null
      });
      setClientQueryEnabled(false);
      setQueryStartTime(null);
      console.log("[AUTH_DEBUG_FINAL] useClientDataFetcher - User not authenticated, resetting client auth state");
    } else {
      console.log("[AUTH_DEBUG_FINAL] useClientDataFetcher - Not ready to fetch client data yet:", {
        initialized,
        loading,
        isAuthenticated,
        hasUserId: !!user?.id,
        connectionVerified,
        timestamp: Date.now()
      });
    }
    
    // Force query completion after timeout
    let timeoutId: NodeJS.Timeout | undefined;
    if (clientQueryEnabled && queryStartTime !== null) {
      timeoutId = setTimeout(() => {
        const queryDuration = Date.now() - queryStartTime;
        if (queryDuration > 7000) {
          console.warn("[AUTH_DEBUG_FINAL] useClientDataFetcher - Query taking too long (actual query phase), forcing completion");
          onUpdate({
            authenticating: false
          });
        }
      }, 7000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [initialized, loading, isAuthenticated, user?.id, connectionVerified, onUpdate, clientQueryEnabled, queryStartTime, setQueryStartTime]);

  // Use React Query with improved error handling and retry logic
  const { data: clientData, isLoading: clientQueryLoading } = useQuery({
    queryKey: ["clientId", user?.id],
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
        console.error("[AUTH_DEBUG_FINAL] useClientDataFetcher - Error fetching client data:", error);
        onUpdate({
          clientRecordStatus: 'error',
          authenticating: false // Ensure we're not stuck in loading state
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

  return { clientData, clientQueryLoading, clientQueryEnabled };
};
