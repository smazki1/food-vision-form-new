
import React, { useState, useEffect } from 'react';
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

  // Use React Query with improved error handling and dependencies
  const { data: clientData, isLoading: clientDataLoading } = useQuery({
    queryKey: ["clientId", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      console.log("[AUTH_DEBUG_FINAL_FIX] ClientAuthProvider - Fetching client ID for user:", user.id);
      return fetchClientId(user.id);
    },
    enabled: !!user?.id && isAuthenticated && initialized,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
    meta: {
      onError: (error: Error) => {
        console.error("[AUTH_DEBUG_FINAL_FIX] ClientAuthProvider - Error fetching client data:", error);
        setClientId(null);
        setAuthenticating(false);
      }
    }
  });

  useEffect(() => {
    // Debug state changes
    console.log("[AUTH_DEBUG_FINAL_FIX] ClientAuthProvider - Auth state:", { 
      userId: user?.id, 
      authLoading,
      clientDataLoading,
      clientData,
      initialized,
      isAuthenticated
    });
    
    // Update state only when conditions are right
    if (initialized) {
      // If not authenticated or auth is still loading
      if (!isAuthenticated || authLoading) {
        console.log("[AUTH_DEBUG_FINAL_FIX] ClientAuthProvider - Not authenticated or still loading");
        setClientId(null);
        // Only finish authenticating if we're sure auth is not still loading
        if (!authLoading) {
          setAuthenticating(false);
        }
      } 
      // If authenticated and client data fetch is complete (either success or failure)
      else if (isAuthenticated && !clientDataLoading) {
        console.log("[AUTH_DEBUG_FINAL_FIX] ClientAuthProvider - Auth complete, client data:", clientData);
        setClientId(clientData as string | null);
        setAuthenticating(false);
      }
    }
  }, [user, authLoading, clientData, clientDataLoading, initialized, isAuthenticated]);

  const contextValue: ClientAuthContextType = {
    clientId, 
    authenticating, 
    isAuthenticated 
  };

  console.log("[AUTH_DEBUG_FINAL_FIX] ClientAuthProvider - Final state:", contextValue);

  return (
    <ClientAuthContext.Provider value={contextValue}>
      {children}
    </ClientAuthContext.Provider>
  );
};
