
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
  const { user, loading: authLoading, initialized, isAuthenticated, clientId: unifiedClientId } = useUnifiedAuth();
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

  // Sync with UnifiedAuth client ID as fallback
  useEffect(() => {
    console.log("[CLIENT_AUTH_PROVIDER] Sync check:", {
      clientAuthClientId: clientId,
      unifiedClientId,
      clientRecordStatus,
      authenticating,
      isAuthenticated,
      initialized
    });

    // If ClientAuth doesn't have a clientId but UnifiedAuth does, sync them
    if (isAuthenticated && initialized && !authLoading && 
        unifiedClientId && !clientId && 
        clientRecordStatus !== 'loading' && !authenticating) {
      
      console.log("[CLIENT_AUTH_PROVIDER] Syncing clientId from UnifiedAuth:", unifiedClientId);
      updateClientAuthState({
        clientId: unifiedClientId,
        clientRecordStatus: 'found',
        authenticating: false,
        errorState: null
      });
    }
  }, [clientId, unifiedClientId, clientRecordStatus, authenticating, isAuthenticated, initialized, authLoading, updateClientAuthState]);

  // Handle initial loading state
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
      unifiedClientId,
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

    // The rest is handled by useClientDataFetcher or the sync effect above
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

  console.log("[CLIENT_AUTH_PROVIDER] Final clientId from state manager:", clientId);

  const contextValue: ClientAuthContextType = useMemo(() => {
    // Use the effective client ID (prefer ClientAuth, fallback to UnifiedAuth)
    const effectiveClientId = clientId || unifiedClientId;
    
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
      clientAuthClientId: clientId,
      unifiedClientId,
      effectiveClientId,
      userAuthId: user?.id,
      authenticating
    });
    
    return {
      clientId: effectiveClientId,
      userAuthId: user?.id || null,
      authenticating,
      clientRecordStatus,
      errorState,
      isAuthenticated: finalIsAuthenticated,
      hasLinkedClientRecord: clientRecordStatus === 'found' && !!effectiveClientId,
      hasNoClientRecord: clientRecordStatus === 'not-found',
      refreshClientAuth,
    };
  }, [
    clientId, unifiedClientId, user?.id, authenticating, clientRecordStatus, errorState, 
    isAuthenticated, initialized, authLoading, connectionVerified, refreshClientAuth
  ]);

  return (
    <ClientAuthContext.Provider value={contextValue}>
      {children}
    </ClientAuthContext.Provider>
  );
};
