import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ClientAuthContext } from '@/contexts/ClientAuthContext';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useClientDataFetcher } from '@/hooks/useClientDataFetcher';
import { useConnectionVerifier } from '@/hooks/useConnectionVerifier';
import { useClientAuthStateManager } from '@/hooks/useClientAuthStateManager';
import { ClientAuthState, ClientAuthContextType } from '@/types/clientAuthTypes';

interface ClientAuthProviderProps {
  children: React.ReactNode;
}

export const ClientAuthProvider: React.FC<ClientAuthProviderProps> = ({ children }) => {
  const { user, loading: authLoading, initialized, isAuthenticated } = useUnifiedAuth();
  const [refreshToggle, setRefreshToggle] = useState(false);
  
  const {
    clientId,
    authenticating,
    clientRecordStatus,
    errorState,
    updateClientAuthState,
  } = useClientAuthStateManager();
  
  const connectionVerified = useConnectionVerifier((errorMessage) => {
    updateClientAuthState({ errorState: errorMessage || null });
  });

  const { 
    clientData,
    clientQueryLoading, 
  } = useClientDataFetcher(
    user,
    isAuthenticated,
    initialized,
    authLoading,
    connectionVerified,
    refreshToggle,
    updateClientAuthState,
    (errorMessage) => updateClientAuthState({ errorState: errorMessage, clientRecordStatus: 'error', authenticating: false })
  );

  const refreshClientAuth = useCallback(() => {
    console.log("[AUTH_DEBUG_FINAL] refreshClientAuth called. Toggling refresh state.");
    setRefreshToggle(prev => !prev);
  }, []);

  useEffect(() => {
    const currentTimestamp = Date.now();
    console.log(`[AUTH_DEBUG ${currentTimestamp}] ClientAuthProvider - Main useEffect. States:`, {
      auth: {loading: authLoading, initialized, authenticated: isAuthenticated, userId: user?.id},
      clientAuth: { clientId, authenticating, clientRecordStatus, errorState },
      fetcher: {clientData, clientQueryLoading},
      connectionVerified
    });
    
    if (!initialized || authLoading) {
      console.log(`[AUTH_DEBUG ${currentTimestamp}] ClientAuthProvider - Basic auth loading. Ensuring authenticating: true.`);
      if (!authenticating) {
        updateClientAuthState({ authenticating: true });
      }
      return;
    }

    if (!isAuthenticated) {
      console.log(`[AUTH_DEBUG ${currentTimestamp}] ClientAuthProvider - User NOT authenticated. Resetting. authenticating: false.`);
            updateClientAuthState({
        clientId: null,
        authenticating: false,
              clientRecordStatus: 'not-found',
        errorState: null,
      });
      return;
    }

    if (clientQueryLoading) {
      console.log(`[AUTH_DEBUG ${currentTimestamp}] ClientAuthProvider - Client query IS loading. Ensuring authenticating: true.`);
      if (!authenticating) {
        updateClientAuthState({ authenticating: true, clientRecordStatus: 'loading' });
      }
      return;
    }

    console.log(`[AUTH_DEBUG ${currentTimestamp}] ClientAuthProvider - Client query NOT loading. Status: ${clientRecordStatus}, Data: ${clientData}`);

    if (clientRecordStatus === 'error') {
      console.log(`[AUTH_DEBUG ${currentTimestamp}] ClientAuthProvider - Status is 'error'. Expecting authenticating:false.`);
      if (authenticating) {
        console.warn(`[AUTH_DEBUG ${currentTimestamp}] ClientAuthProvider - Status 'error', but authenticating still true. Forcing false.`);
        updateClientAuthState({ authenticating: false });
      }
      return; 
    }

    if (clientData) {
      console.log(`[AUTH_DEBUG ${currentTimestamp}] ClientAuthProvider - Client ID FOUND: ${clientData}.`);
            updateClientAuthState({
        clientId: clientData,
        authenticating: false,
              clientRecordStatus: 'found',
        errorState: null, 
            });
      } else {
      console.log(`[AUTH_DEBUG ${currentTimestamp}] ClientAuthProvider - Client ID NOT found (null).`);
        updateClientAuthState({
          clientId: null,
          authenticating: false,
        clientRecordStatus: 'not-found',
          errorState: null,
        });
    }
  }, [
    user, authLoading, initialized, isAuthenticated,
    clientData, clientQueryLoading, 
    authenticating,
    clientRecordStatus,
    errorState,
    connectionVerified,
    updateClientAuthState, 
  ]);

  const contextValue: ClientAuthContextType = useMemo(() => ({
    clientId,
    userAuthId: user?.id || null,
    authenticating,
    clientRecordStatus,
    errorState,
    isAuthenticated: clientRecordStatus === 'found' || clientRecordStatus === 'not-found',
    hasLinkedClientRecord: clientRecordStatus === 'found' && !!clientId,
    verifyConnection: () => { /* Placeholder */ }, 
    refreshClientAuth,
  }), [clientId, user?.id, authenticating, clientRecordStatus, errorState, refreshClientAuth]);

  return (
    <ClientAuthContext.Provider value={contextValue}>
      {children}
    </ClientAuthContext.Provider>
  );
};