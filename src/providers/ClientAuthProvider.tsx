
import React, { createContext, useState, useEffect, ReactNode } from 'react';
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

  const { data: clientData, isLoading: clientDataLoading } = useQuery({
    queryKey: ["clientId", user?.id],
    queryFn: async () => {
      if (!user) return null;
      return fetchClientId(user.id);
    },
    enabled: !!user && isAuthenticated && initialized,
  });

  useEffect(() => {
    // Update authenticating state when both auth and client data loading are complete
    if (initialized && !authLoading && (!user || !clientDataLoading)) {
      console.log("[AUTH_DEBUG] ClientAuthProvider - Authentication check complete:", { 
        user: !!user, 
        isAuthenticated,
        clientId: clientData || null,
        authLoading,
        clientDataLoading,
        initialized
      });
      
      if (clientData) {
        console.log("[AUTH_DEBUG] ClientAuthProvider - Setting client ID:", clientData);
        setClientId(clientData);
      }
      
      // Add a small delay to ensure state is stable
      setTimeout(() => {
        setAuthenticating(false);
      }, 100);
    }
  }, [user, authLoading, clientData, clientDataLoading, initialized, isAuthenticated]);

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
