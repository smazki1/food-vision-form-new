
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

  // Use React Query for data fetching with proper dependencies
  const { data: clientData, isLoading: clientDataLoading, error: clientError } = useQuery({
    queryKey: ["clientId", user?.id],
    queryFn: async () => {
      if (!user) return null;
      return fetchClientId(user.id);
    },
    enabled: !!user && isAuthenticated && initialized, // Only run query when these conditions are met
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1, // Only retry once to avoid excessive attempts if there's an RLS issue
  });

  useEffect(() => {
    // Debug state changes
    console.log("[AUTH_DEBUG_LOOP_FIX] ClientAuthProvider - State change:", { 
      userId: user?.id, 
      authLoading,
      clientDataLoading,
      clientDataError: clientError ? 'Error occurred' : undefined,
      clientId: clientData,
      initialized,
      isAuthenticated
    });
    
    // Only update client ID when we have finished loading AND have data (or confirmed no data)
    if (initialized && !authLoading && (!user || !clientDataLoading)) {
      // If we have client data, update the state
      if (clientData !== undefined) {
        setClientId(clientData);
      }
      
      // Mark authentication process as complete
      setAuthenticating(false);
    }
  }, [user, authLoading, clientData, clientDataLoading, clientError, initialized, isAuthenticated]);

  const contextValue: ClientAuthContextType = {
    clientId, 
    authenticating, 
    isAuthenticated 
  };

  // Provide clear debug info about our current state
  console.log("[AUTH_DEBUG_LOOP_FIX] ClientAuthProvider - Rendering with:", {
    clientId,
    authenticating,
    isAuthenticated,
    userId: user?.id
  });

  return (
    <ClientAuthContext.Provider value={contextValue}>
      {children}
    </ClientAuthContext.Provider>
  );
};
