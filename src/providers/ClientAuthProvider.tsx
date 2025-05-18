
import React, { useEffect, ReactNode, useCallback } from 'react';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { ClientAuthContextType } from '@/types/clientAuthTypes';
import { ClientAuthContext } from '@/contexts/ClientAuthContext';
import { useClientAuthStateManager } from '@/hooks/useClientAuthStateManager';
import { useConnectionVerifier } from '@/hooks/useConnectionVerifier';
import { useClientDataFetcher } from '@/hooks/useClientDataFetcher';

interface ClientAuthProviderProps {
  children: ReactNode;
}

export const ClientAuthProvider: React.FC<ClientAuthProviderProps> = ({ children }) => {
  const { user, loading: authLoading, isAuthenticated, initialized } = useCustomerAuth();
  const { updateClientAuthState, ...clientAuthState } = useClientAuthStateManager();
  
  // Force completion of authentication process after a timeout
  const forceCompleteAuth = useCallback(() => {
    console.log("[AUTH_DEBUG_FINAL] ClientAuthProvider - Force completing authentication process");
    updateClientAuthState({ 
      authenticating: false,
      clientRecordStatus: clientAuthState.clientRecordStatus === 'loading' ? 'not-found' : clientAuthState.clientRecordStatus
    });
  }, [updateClientAuthState, clientAuthState.clientRecordStatus]);
  
  // Set a timeout to force completion if taking too long
  useEffect(() => {
    if (clientAuthState.authenticating) {
      const timeoutId = setTimeout(() => {
        if (clientAuthState.authenticating) {
          console.warn("[AUTH_DEBUG_FINAL] ClientAuthProvider - Authentication taking too long, forcing completion");
          forceCompleteAuth();
        }
      }, 8000); // 8 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [clientAuthState.authenticating, forceCompleteAuth]);
  
  // Verify database connection
  const connectionVerified = useConnectionVerifier((errorMessage) => {
    if (errorMessage) {
      updateClientAuthState({ errorState: errorMessage });
    } else {
      updateClientAuthState({ errorState: null });
    }
  });

  // Fetch client data when authentication is ready
  const { clientData, clientQueryLoading } = useClientDataFetcher(
    user,
    isAuthenticated,
    initialized,
    authLoading,
    connectionVerified,
    updateClientAuthState,
    (errorMessage) => updateClientAuthState({ errorState: errorMessage })
  );

  // Handle client data loading state
  useEffect(() => {
    if (!clientQueryLoading) {
      updateClientAuthState({ authenticating: false });
      console.log("[AUTH_DEBUG_FINAL] ClientAuthProvider - Client query completed, setting authenticating to false");
    }
  }, [clientQueryLoading, updateClientAuthState]);

  // Explicit check to ensure authentication process completes
  useEffect(() => {
    if (initialized && !authLoading) {
      if (!isAuthenticated) {
        // Not authenticated, ensure we're not stuck in loading state
        updateClientAuthState({
          authenticating: false,
          clientRecordStatus: 'not-found'
        });
        console.log("[AUTH_DEBUG_FINAL] ClientAuthProvider - Not authenticated, explicitly ending authentication process");
      } else if (!clientQueryLoading && clientData !== undefined) {
        // Authentication and client query complete, ensure we're not stuck
        updateClientAuthState({ authenticating: false });
        console.log("[AUTH_DEBUG_FINAL] ClientAuthProvider - Auth and client query complete, explicitly ending authentication");
      }
    }
  }, [initialized, authLoading, isAuthenticated, clientQueryLoading, clientData, updateClientAuthState]);

  // Update client state when data is available
  useEffect(() => {
    // Debug state changes
    console.log("[AUTH_DEBUG_FINAL] ClientAuthProvider - Auth state:", { 
      userId: user?.id, 
      authLoading,
      clientQueryLoading,
      clientData,
      initialized,
      isAuthenticated,
      errorState: clientAuthState.errorState,
      clientRecordStatus: clientAuthState.clientRecordStatus,
      connectionVerified,
      authenticating: clientAuthState.authenticating,
      timestamp: Date.now()
    });
    
    if (initialized && !authLoading) {
      // Auth is complete
      if (isAuthenticated) {
        // User is authenticated, set client data if available
        if (!clientQueryLoading && clientData !== undefined) {
          console.log("[AUTH_DEBUG_FINAL] ClientAuthProvider - Setting clientId:", clientData);
          
          // Handle client record status based on clientData
          if (clientData === null) {
            updateClientAuthState({
              clientRecordStatus: 'not-found',
              hasNoClientRecord: true,
              clientId: null,
              authenticating: false
            });
            console.log("[AUTH_DEBUG_FINAL] ClientAuthProvider - No client record linked to user");
          } else {
            updateClientAuthState({
              clientRecordStatus: 'found',
              hasNoClientRecord: false,
              clientId: clientData,
              authenticating: false
            });
            console.log("[AUTH_DEBUG_FINAL] ClientAuthProvider - Client record found");
          }
        }
      } else {
        // Not authenticated, reset client data
        updateClientAuthState({
          clientId: null,
          authenticating: false,
          errorState: null,
          clientRecordStatus: 'not-found',
          hasNoClientRecord: true
        });
      }
    }
  }, [
    user, 
    authLoading, 
    clientData, 
    clientQueryLoading, 
    initialized, 
    isAuthenticated,
    connectionVerified,
    updateClientAuthState
  ]);

  // The final context value with clearer states
  const contextValue: ClientAuthContextType = {
    ...clientAuthState
  };

  console.log("[AUTH_DEBUG_FINAL] ClientAuthProvider - Final context state:", contextValue);

  return (
    <ClientAuthContext.Provider value={contextValue}>
      {children}
    </ClientAuthContext.Provider>
  );
};
