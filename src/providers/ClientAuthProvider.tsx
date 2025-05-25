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
  useEffect(() => {
    console.log('[CLIENT_AUTH_PROVIDER_LIFECYCLE] Mounted');
    return () => {
      console.log('[CLIENT_AUTH_PROVIDER_LIFECYCLE] Unmounted');
    };
  }, []); // Empty dependency array to track mount/unmount

  const { user, loading: authLoading, initialized, isAuthenticated } = useUnifiedAuth();
  const [refreshToggle, setRefreshToggle] = useState(false);
  
  const {
    clientId,
    authenticating,
    clientRecordStatus,
    errorState,
    updateClientAuthState,
  } = useClientAuthStateManager();
  
  // Define a STABLE callback for onConnectionError
  const handleConnectionError = useCallback((errorMessage: string) => {
    updateClientAuthState({ errorState: errorMessage || null });
  }, [updateClientAuthState]); // updateClientAuthState from useClientAuthStateManager should be stable

  const connectionVerified = useConnectionVerifier(handleConnectionError); // Pass the stable callback

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
    console.log('[AUTH_PROVIDER_DEBUG] Main useEffect triggered. States:', {
      initialized, authLoading, supabaseIsAuthenticated: isAuthenticated,
      clientQueryLoading,
      currentAuthenticating: authenticating,
      currentClientRecordStatus: clientRecordStatus,
      currentErrorState: errorState,
      currentClientId: clientId,
      connectionVerified,
      user: user?.id
    });

    // Stage 1: Handle initial loading from useUnifiedAuth
    if (!initialized || authLoading) {
      // If basic auth is still loading, ensure we reflect an overall authenticating state.
      if (authenticating !== true || clientRecordStatus !== 'loading') {
        updateClientAuthState({ authenticating: true, clientRecordStatus: 'loading' });
      }
      return;
    }

    // Stage 2: Handle user not authenticated by useUnifiedAuth (Supabase)
    if (!isAuthenticated) { // isAuthenticated from useUnifiedAuth
      // If Supabase user is definitively not authenticated, reset all client-specific auth state.
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

    // At this point, user IS authenticated by useUnifiedAuth.
    // Client-specific data fetching is managed by useClientDataFetcher.
    // useClientDataFetcher uses onUpdate (which is updateClientAuthState) to set:
    // - clientRecordStatus: 'loading' when it starts its query.
    // - clientId, clientRecordStatus: 'found', authenticating: false on success.
    // - clientRecordStatus: 'error', errorState, authenticating: false on error.

    // This useEffect primarily ensures that if clientQueryLoading (from useClientDataFetcher) is false,
    // and clientRecordStatus is NOT 'loading' (meaning fetcher has completed or errored),
    // then the overall 'authenticating' flag should also be false.
    if (!clientQueryLoading && clientRecordStatus !== 'loading') {
      if (authenticating !== false) {
        updateClientAuthState({ authenticating: false });
      }
    } 
    // Conversely, if clientQueryLoading IS true (fetcher is active), 
    // useClientDataFetcher should have set authenticating: true via its onUpdate callback.
    // If it hasn't (e.g., authenticating is false), this indicates a possible state mismatch,
    // so we can enforce authenticating: true.
    else if (clientQueryLoading && authenticating !== true) {
        // Only set if not an error, as error state should keep authenticating false.
        if (clientRecordStatus !== 'error') {
             updateClientAuthState({ authenticating: true, clientRecordStatus: 'loading'});
        }
    }
    
    // The actual values of clientId, clientRecordStatus ('found', 'not-found', 'error'), and errorState
    // are expected to be set by useClientDataFetcher via the onUpdate/onError callbacks.
    // This useEffect should not need to duplicate that logic further.

  }, [
    // Key dependencies that drive the flow:
    initialized, authLoading, isAuthenticated, // from useUnifiedAuth
    clientQueryLoading, // from useClientDataFetcher, indicates if it's actively fetching
    
    // States managed by useClientAuthStateManager, which this useEffect reacts to and also influences:
    authenticating, 
    clientRecordStatus, 
    errorState, 
    clientId, // Read for conditions
    
    updateClientAuthState, // The stable callback to update state
    user // user object from useUnifiedAuth (used in useClientDataFetcher's queryKey, indirectly influences)
    // connectionVerified is used by useClientDataFetcher, which then calls onUpdate. Not directly here.
  ]);

  const contextValue: ClientAuthContextType = useMemo(() => {
    // Determine overall isAuthenticated status for the context
    // User must be authenticated via Supabase AND have a determined client record status (either found or explicitly not-found)
    // And not be in an error state for client data, and connection must be verified.
    const finalIsAuthenticated = isAuthenticated && // from useUnifiedAuth
                               (clientRecordStatus === 'found' || clientRecordStatus === 'not-found') &&
                               !errorState &&
                               connectionVerified;
    
    console.log('[AUTH_PROVIDER_CONTEXT_DEBUG] Computing contextValue. Values:', {
      supabaseIsAuthenticated: isAuthenticated,
      clientRecordStatus,
      errorState,
      connectionVerified,
      calculatedFinalIsAuthenticated: finalIsAuthenticated,
      clientId,
      userAuthId: user?.id,
      currentAuthenticating: authenticating
    });
    
    return {
      clientId,
      userAuthId: user?.id || null,
      authenticating, // This reflects the process of fetching client-specific data
      clientRecordStatus,
      errorState,
      // isAuthenticated: clientRecordStatus === 'found' || clientRecordStatus === 'not-found', // Old logic
      isAuthenticated: finalIsAuthenticated,
      hasLinkedClientRecord: clientRecordStatus === 'found' && !!clientId,
      hasNoClientRecord: clientRecordStatus === 'not-found', // Make sure this is used consistently
      refreshClientAuth,
    };
  }, [
    clientId, user?.id, authenticating, clientRecordStatus, errorState, 
    isAuthenticated, // from useUnifiedAuth, for finalIsAuthenticated
    connectionVerified, // for finalIsAuthenticated
    refreshClientAuth
  ]);

  return (
    <ClientAuthContext.Provider value={contextValue}>
      {children}
    </ClientAuthContext.Provider>
  );
};