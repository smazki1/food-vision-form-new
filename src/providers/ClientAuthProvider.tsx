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
  const { 
    data: clientData, 
    isLoading: clientDataLoading, 
    isError, 
    error: clientDataError // Destructure isError and error
  } = useQuery({
    queryKey: ["clientId", user?.id],
    queryFn: async () => {
      if (!user) return null;
      return fetchClientId(user.id);
    },
    enabled: !!user && isAuthenticated && initialized, // Only run query when these conditions are met
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  useEffect(() => {
    // Debug state changes
    console.log("[AUTH_DEBUG] ClientAuthProvider - State change (EFFECT START):", { 
      userId: user?.id, 
      authLoading,
      clientDataLoading, // Log this at the start of the effect
      clientData,
      isError,
      clientDataError,
      initialized,
      isAuthenticated
    });

    if (isError) {
      console.error("[AUTH_DEBUG] ClientAuthProvider - Error fetching client data:", clientDataError);
    }
    
    // Log the condition for setAuthenticating(false)
    const conditionForUpdatingAuth = initialized && !authLoading && (!user || !clientDataLoading);
    console.log("[AUTH_DEBUG] ClientAuthProvider - Condition for setAuthenticating(false):", conditionForUpdatingAuth, {
      initialized,
      authLoading,
      userExists: !!user,
      clientDataLoading
    });

    // Only update client ID when we have finished loading AND have data (or confirmed no data/error)
    if (conditionForUpdatingAuth) {
      // If we have client data and no error, update the state
      if (clientData !== undefined && !isError) {
        setClientId(clientData);
      }
      
      // Mark authentication process as complete
      setAuthenticating(false);
    }
  }, [user, authLoading, clientData, clientDataLoading, initialized, isAuthenticated, isError, clientDataError]);

  // Provide clear debug info about our current state
  console.log("[AUTH_DEBUG] ClientAuthProvider - Rendering with:", {
    clientId,
    authenticating,
    isAuthenticated,
    userId: user?.id
  });

  return (
    <ClientAuthContext.Provider value={{ 
      clientId, 
      authenticating, 
      isAuthenticated 
    }}>
      {children}
    </ClientAuthContext.Provider>
  );
};
