
import React from 'react';
import { ClientAuthContext } from '@/contexts/ClientAuthContext';
import { useClientAuthProvider } from '@/hooks/useClientAuthProvider';
import { useClientAuthSync } from '@/hooks/useClientAuthSync';
import { useClientAuthContextValue } from '@/utils/clientAuthContextValue';

interface ClientAuthProviderProps {
  children: React.ReactNode;
}

export const ClientAuthProvider: React.FC<ClientAuthProviderProps> = ({ children }) => {
  const {
    user,
    authLoading,
    initialized,
    isAuthenticated,
    unifiedClientId,
    clientId,
    authenticating,
    clientRecordStatus,
    errorState,
    connectionVerified,
    updateClientAuthState,
    refreshClientAuth,
    clientData,
  } = useClientAuthProvider();

  // Handle syncing between different auth states
  useClientAuthSync({
    clientId,
    unifiedClientId,
    clientRecordStatus,
    authenticating,
    isAuthenticated,
    initialized,
    authLoading,
    updateClientAuthState,
    user,
    connectionVerified,
  });

  console.log("[CLIENT_AUTH_PROVIDER] Final clientId from state manager:", clientId);

  // Create the context value
  const contextValue = useClientAuthContextValue({
    clientId,
    unifiedClientId,
    user,
    authenticating,
    clientRecordStatus,
    errorState,
    isAuthenticated,
    initialized,
    authLoading,
    connectionVerified,
    refreshClientAuth,
    clientData,
  });

  return (
    <ClientAuthContext.Provider value={contextValue}>
      {children}
    </ClientAuthContext.Provider>
  );
};
