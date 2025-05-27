
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
  
  const handleConnectionError = useCallback((errorMessage: string) => {
    updateClientAuthState({ errorState: errorMessage || null });
  }, [updateClientAuthState]);

  const connectionVerified = useConnectionVerifier(handleConnectionError);

  console.log("[CLIENT_AUTH_PROVIDER] Connection verified status:", connectionVerified);

  const handleClientDataFetchError = useCallback((errorMessage: string) => {
    updateClientAuthState({ 
      errorState: errorMessage, 
      clientRecordStatus: 'error', 
      authenticating: false 
    });
  }, [updateClientAuthState]);

  const { 
    clientData,
    clientQueryLoading,
    retryFetch
  } = useClientDataFetcher(
    user,
    isAuthenticated,
    initialized,
    authLoading,
    connectionVerified,
    refreshToggle,
    updateClientAuthState,
    handleClientDataFetchError
  );

  const refreshClientAuth = useCallback(() => {
    console.log("[CLIENT_AUTH_PROVIDER] Refreshing client auth state");
    setRefreshToggle(prev => !prev);
    updateClientAuthState({ 
      errorState: null, 
      clientRecordStatus: 'loading',
      authenticating: true 
    });
    
    if (retryFetch) {
      setTimeout(() => retryFetch(), 100);
    }
  }, [updateClientAuthState, retryFetch]);

  // Simplified effect that only handles the initial loading state
  useEffect(() => {
    console.log('[CLIENT_AUTH_PROVIDER] Auth state update:', {
      initialized, 
      authLoading, 
      isAuthenticated,
      clientQueryLoading,
      authenticating,
      clientRecordStatus,
      errorState,
      clientId,
      connectionVerified,
      userId: user?.id
    });

    // Only handle cases where we need to set loading state
    if (!initialized || authLoading) {
      if (authenticating !== true || clientRecordStatus !== 'loading') {
        updateClientAuthState({ 
          authenticating: true, 
          clientRecordStatus: 'loading' 
        });
      }
      return;
    }

    // If not authenticated, clear client state
    if (!isAuthenticated) {
      if (clientId !== null || authenticating !== false || clientRecordStatus !== 'not-found' || errorState !== null) {
        updateClientAuthState({
          clientId: null,
          authenticating: false,
          clientRecordStatus: 'not-found',
          errorState: null,
        });
      }
      return;
    }

    // The rest is handled by useClientDataFetcher
  }, [
    initialized, 
    authLoading, 
    isAuthenticated,
    authenticating,
    clientRecordStatus,
    errorState, 
    clientId,
    updateClientAuthState,
    user,
    connectionVerified
  ]);

  console.log("[CLIENT_AUTH_PROVIDER] ClientId from useClientAuthStateManager (before context memo):", clientId);

  const contextValue: ClientAuthContextType = useMemo(() => {
    const finalIsAuthenticated = isAuthenticated && 
                               initialized &&
                               !authLoading &&
                               (clientRecordStatus === 'found' || clientRecordStatus === 'not-found') &&
                               !errorState &&
                               connectionVerified;
    
    console.log('[CLIENT_AUTH_PROVIDER] Context value:', {
      supabaseIsAuthenticated: isAuthenticated,
      initialized,
      authLoading,
      clientRecordStatus,
      errorState,
      connectionVerified,
      finalIsAuthenticated,
      clientId,
      userAuthId: user?.id,
      authenticating,
      contextClientId: clientId 
    });
    
    return {
      clientId,
      userAuthId: user?.id || null,
      authenticating,
      clientRecordStatus,
      errorState,
      isAuthenticated: finalIsAuthenticated,
      hasLinkedClientRecord: clientRecordStatus === 'found' && !!clientId,
      hasNoClientRecord: clientRecordStatus === 'not-found',
      refreshClientAuth,
    };
  }, [
    clientId, user?.id, authenticating, clientRecordStatus, errorState, 
    isAuthenticated, initialized, authLoading, connectionVerified, refreshClientAuth
  ]);

  return (
    <ClientAuthContext.Provider value={contextValue}>
      {children}
    </ClientAuthContext.Provider>
  );
};
