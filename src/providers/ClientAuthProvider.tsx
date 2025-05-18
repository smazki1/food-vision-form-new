import React, { useState, useEffect, ReactNode } from 'react';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { useQuery } from "@tanstack/react-query";
import { fetchClientId } from "@/utils/clientAuthUtils";
import { ClientAuthContextType } from '@/types/clientAuthTypes';
import { ClientAuthContext } from '@/contexts/ClientAuthContext';

interface ClientAuthProviderProps {
  children: ReactNode;
}

export const ClientAuthProvider: React.FC<ClientAuthProviderProps> = ({ children }) => {
  const { user, loading: authLoading, isAuthenticated, initialized } = useCustomerAuth();
  const [clientId, setClientId] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(true);
  const [clientDataLoading, setClientDataLoading] = useState(false);
  const [clientQueryEnabled, setClientQueryEnabled] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Enable the client data query only when auth is complete and user is authenticated
  useEffect(() => {
    if (initialized && !authLoading && isAuthenticated && user?.id) {
      setClientQueryEnabled(true);
      setClientDataLoading(true);
    } else if (initialized && !authLoading && !isAuthenticated) {
      // If auth is initialized and user is not authenticated, we can stop authenticating
      setClientId(null);
      setAuthenticating(false);
      setClientDataLoading(false);
      setClientQueryEnabled(false);
    }
  }, [initialized, authLoading, isAuthenticated, user?.id]);

  // Use React Query with improved error handling and retry logic
  const { data: clientData, isLoading: clientQueryLoading, error: clientError } = useQuery({
    queryKey: ["clientId", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      console.log("[AUTH_DEBUG_FINAL_] ClientAuthProvider - Fetching client ID for user:", user.id);
      try {
        return await fetchClientId(user.id);
      } catch (error) {
        // Capture specific policy errors for UI feedback
        if (error instanceof Error && error.message.includes('policy')) {
          setErrorState("Database policy error detected. Please contact support.");
          console.error("[AUTH_DEBUG_FINAL_] ClientAuthProvider - Policy error:", error.message);
        }
        throw error;
      }
    },
    enabled: clientQueryEnabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: (failureCount, error) => {
      // If it's a policy error, don't retry
      if (error instanceof Error && error.message.includes('policy')) {
        console.error("[AUTH_DEBUG_FINAL_] ClientAuthProvider - Policy error, not retrying");
        return false;
      }
      // Otherwise retry up to 2 times
      return failureCount < 2;
    },
    meta: {
      onError: (error: Error) => {
        console.error("[AUTH_DEBUG_FINAL_] ClientAuthProvider - Error fetching client data:", error);
        setClientDataLoading(false);
        
        // Set specific error states for different error types
        if (error.message.includes('policy')) {
          setErrorState("Policy configuration error. Please contact support.");
        } else {
          setErrorState("Error loading client data. Please try again later.");
        }
      }
    }
  });

  // Handle client data loading state
  useEffect(() => {
    if (clientQueryEnabled && !clientQueryLoading) {
      setClientDataLoading(false);
    }
  }, [clientQueryLoading, clientQueryEnabled]);

  // Update client state when data is available
  useEffect(() => {
    // Debug state changes
    console.log("[AUTH_DEBUG_FINAL_] ClientAuthProvider - Auth state:", { 
      userId: user?.id, 
      authLoading,
      clientQueryLoading,
      clientDataLoading,
      clientData,
      clientError,
      initialized,
      isAuthenticated,
      errorState
    });
    
    if (initialized && !authLoading) {
      // Auth is complete
      if (isAuthenticated) {
        // User is authenticated, set client data if available
        if (!clientQueryLoading && clientData !== undefined) {
          console.log("[AUTH_DEBUG_FINAL_] ClientAuthProvider - Setting clientId:", clientData);
          setClientId(clientData); // Could be null if no client record exists
          setAuthenticating(false);
        }
      } else {
        // Not authenticated, reset client data
        setClientId(null);
        setAuthenticating(false);
        setErrorState(null);
      }
    }
  }, [
    user, 
    authLoading, 
    clientData, 
    clientQueryLoading, 
    initialized, 
    isAuthenticated, 
    clientError
  ]);

  // The final context value with clearer states
  const contextValue: ClientAuthContextType = {
    clientId, 
    authenticating: authenticating || authLoading || clientDataLoading,
    isAuthenticated,
    hasLinkedClientRecord: !!clientId, // Explicit flag for linked client record
    errorState // Add error state to context for UI feedback
  };

  console.log("[AUTH_DEBUG_FINAL_] ClientAuthProvider - Final context state:", contextValue);

  return (
    <ClientAuthContext.Provider value={contextValue}>
      {children}
    </ClientAuthContext.Provider>
  );
};
