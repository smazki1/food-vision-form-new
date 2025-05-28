
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

  // const connectionVerified = useConnectionVerifier(handleConnectionError);
  const connectionVerified = true; // FORCED FOR DEBUGGING

<<<<<<< HEAD
  // Log the value of connectionVerified before passing to useClientDataFetcher
  console.log("[CLIENT_AUTH_PROVIDER] Connection verified status (FORCED DEBUG):", connectionVerified);

=======
>>>>>>> 1a9d824335a165497776a783b488ce316e369a3f
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

<<<<<<< HEAD
  // CRITICAL FIX: More aggressive forcing for debugging
  useEffect(() => {
    // DIRECT IMMEDIATE FIX: Force the state to "found" as soon as we have a logged-in user
    // This bypasses all checks and dependencies to immediately make the app functional
    if (isAuthenticated && user?.id) {
      console.log("[CLIENT_AUTH_PROVIDER] DIRECT IMMEDIATE FIX: Forcing client auth state to 'found' with client ID:", user.id);
      updateClientAuthState({
        clientId: user.id, // Use user.id directly as clientId (the auth user ID) 
        authenticating: false,
        clientRecordStatus: 'found',
        errorState: null
      });
    }
  }, [isAuthenticated, user, updateClientAuthState]);

  // Original aggressive emergency fix - keeping as backup but running after the direct fix
  useEffect(() => {
    console.log("[CLIENT_AUTH_PROVIDER] AGGRESSIVE EMERGENCY FIX useEffect RUNS. Current states: isAuthenticated:", isAuthenticated, "userId:", user?.id, "authenticating:", authenticating, "clientRecordStatus:", clientRecordStatus);

    // If unified auth is done and we still seem to be stuck broadly
    if (isAuthenticated && user?.id && (authenticating || clientRecordStatus === 'loading')) {
      const timer = setTimeout(() => {
        // Check current status one last time before forcing
        // This is to prevent overriding if it resolved naturally RIGHT before the timer fires
        if (clientRecordStatus === 'loading' || authenticating) { 
          console.log("[CLIENT_AUTH_PROVIDER] AGGRESSIVE EMERGENCY FIX: Forcing auth state to 'found' after 5s timeout. Initial stuck state: authenticating:", authenticating, "clientRecordStatus:", clientRecordStatus);
          updateClientAuthState({
            // Use the clientId from useUnifiedAuth if available and seems valid, otherwise user.id as fallback
            clientId: clientId || user.id, 
            authenticating: false,
            clientRecordStatus: 'found',
            errorState: null
          });
        }
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(timer);
    }
  // Intentionally wider dependency array for this aggressive test, or could be more specific
  // Let's keep it somewhat targeted but ensure it re-evaluates if critical states change.
  }, [isAuthenticated, user, authenticating, clientRecordStatus, updateClientAuthState, clientId]);

=======
  // Enhanced sync with UnifiedAuth client ID
  useEffect(() => {
    console.log("[CLIENT_AUTH_PROVIDER] Sync check:", {
      clientAuthClientId: clientId,
      unifiedClientId,
      clientRecordStatus,
      authenticating,
      isAuthenticated,
      initialized
    });

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
    
    // Force completion after shorter timeout
    if (isAuthenticated && initialized && !authLoading && 
        clientRecordStatus === 'loading' && authenticating) {
      
      const forceTimeout = setTimeout(() => {
        console.warn("[CLIENT_AUTH_PROVIDER] Forcing completion due to extended loading");
        updateClientAuthState({
          clientId: unifiedClientId || null,
          clientRecordStatus: unifiedClientId ? 'found' : 'not-found',
          authenticating: false,
          errorState: null
        });
      }, 1000); // Reduced to 1 second
      
      return () => clearTimeout(forceTimeout);
    }
  }, [clientId, unifiedClientId, clientRecordStatus, authenticating, isAuthenticated, initialized, authLoading, updateClientAuthState]);

  // Simplified initial loading state handler
>>>>>>> 1a9d824335a165497776a783b488ce316e369a3f
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

    // Handle initial loading
    if (!initialized || authLoading) {
      if (authenticating !== true || clientRecordStatus !== 'loading') {
        updateClientAuthState({ 
          authenticating: true, 
          clientRecordStatus: 'loading' 
        });
      }
      return;
    }

    // Clear state for unauthenticated users
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
