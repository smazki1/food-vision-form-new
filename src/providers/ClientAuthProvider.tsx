
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

  // Use React Query with improved error handling and dependencies
  const { data: clientData, isLoading: clientQueryLoading, error: clientError } = useQuery({
    queryKey: ["clientId", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      console.log("[AUTH_VERIFY] ClientAuthProvider - Fetching client ID for user:", user.id);
      return fetchClientId(user.id);
    },
    enabled: clientQueryEnabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
    meta: {
      onError: (error: Error) => {
        console.error("[AUTH_VERIFY] ClientAuthProvider - Error fetching client data:", error);
        setClientDataLoading(false);
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
    console.log("[AUTH_VERIFY] ClientAuthProvider - Auth state:", { 
      userId: user?.id, 
      authLoading,
      clientQueryLoading,
      clientDataLoading,
      clientData,
      clientError,
      initialized,
      isAuthenticated
    });
    
    if (initialized && !authLoading) {
      // Auth is complete
      if (isAuthenticated) {
        // User is authenticated, set client data if available
        if (!clientQueryLoading && clientData !== undefined) {
          console.log("[AUTH_VERIFY] ClientAuthProvider - Setting clientId:", clientData);
          setClientId(clientData); // Could be null if no client record exists
          setAuthenticating(false);
        }
      } else {
        // Not authenticated, reset client data
        setClientId(null);
        setAuthenticating(false);
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
    hasLinkedClientRecord: !!clientId // NEW: explicit flag for linked client record
  };

  console.log("[AUTH_VERIFY] ClientAuthProvider - Final context state:", contextValue);

  return (
    <ClientAuthContext.Provider value={contextValue}>
      {children}
    </ClientAuthContext.Provider>
  );
};
