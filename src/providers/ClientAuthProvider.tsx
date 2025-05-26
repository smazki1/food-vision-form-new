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

  // Define a STABLE callback for client data fetch error
  const handleClientDataFetchError = useCallback((errorMessage: string) => {
    updateClientAuthState({ 
      errorState: errorMessage, 
      clientRecordStatus: 'error', 
      authenticating: false 
    });
  }, [updateClientAuthState]); // updateClientAuthState is stable

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
    updateClientAuthState, // This is already stable
    handleClientDataFetchError // Pass the new stable callback here
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
      console.log('[AUTH_PROVIDER_DEBUG] Stage 1: Basic auth loading.');
      if (authenticating !== true || clientRecordStatus !== 'loading') {
        updateClientAuthState({ authenticating: true, clientRecordStatus: 'loading' });
      }
      return;
    }

    // Stage 2: Handle user not authenticated by useUnifiedAuth (Supabase)
    if (!isAuthenticated) {
      console.log('[AUTH_PROVIDER_DEBUG] Stage 2: User not authenticated by Supabase.');
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

    // Stage 3: User IS authenticated by useUnifiedAuth. Handle client-specific data fetching.
    console.log('[AUTH_PROVIDER_DEBUG] Stage 3: User is authenticated by Supabase.');

    if (clientQueryLoading) {
      console.log('[AUTH_PROVIDER_DEBUG] Stage 3a: Client data query is loading.');
      // If client data is being fetched by useClientDataFetcher
      if (authenticating !== true || clientRecordStatus !== 'loading') {
        // Ensure clientRecordStatus reflects loading if fetcher is active and hasn't set an error
        if (clientRecordStatus !== 'error') {
            updateClientAuthState({ authenticating: true, clientRecordStatus: 'loading' });
        } else if (authenticating !== false) {
            // If it's an error, authenticating should be false.
            updateClientAuthState({ authenticating: false });
        }
      }
    } else {
      // Stage 3b: Client data query is NOT loading.
      // This means useClientDataFetcher's useQuery is not running.
      // It could have completed (success, error) or not started.
      console.log('[AUTH_PROVIDER_DEBUG] Stage 3b: Client data query is NOT loading. Current clientRecordStatus:', clientRecordStatus);
      
      // If the client query is not loading AND the clientRecordStatus is NOT 'loading',
      // it implies useClientDataFetcher has completed its work (found, not-found, or error).
      // In this case, overall 'authenticating' process for client data should be false.
      if (clientRecordStatus !== 'loading') {
        if (authenticating !== false) {
          console.log('[AUTH_PROVIDER_DEBUG] Stage 3b: Setting authenticating to false as query is not loading and record status is terminal.');
          updateClientAuthState({ authenticating: false });
        }
      } else {
        // If clientQueryLoading is false, but clientRecordStatus IS STILL 'loading',
        // this indicates a potential mismatch. It might mean useClientDataFetcher 
        // didn't transition clientRecordStatus correctly via its onUpdate/onError, 
        // or this useEffect is running before useClientDataFetcher's own effect 
        // that updates clientRecordStatus post-query.
        // For safety, if query is not loading, we should not be 'authenticating' true.
        // However, forcefully changing clientRecordStatus here could hide issues in useClientDataFetcher.
        // The primary goal here is to ensure 'authenticating' becomes false if the query is done.
        // If clientRecordStatus is 'loading' but query is not, it's an odd state.
        // We will still set authenticating to false as the query part is done.
        if (authenticating !== false) {
            console.warn('[AUTH_PROVIDER_DEBUG] Stage 3b: clientQueryLoading is false, but clientRecordStatus is still \'loading\'. Setting authenticating to false. This may indicate an issue in useClientDataFetcher state updates.');
            updateClientAuthState({ authenticating: false });
        }
      }
    }

  }, [
    initialized, 
    authLoading, 
    isAuthenticated,
    clientQueryLoading,
    authenticating,
    clientRecordStatus,
    errorState, 
    clientId,
    updateClientAuthState,
    user // Added user as it's used in logs and indirectly for fetcher
    // connectionVerified is not directly used to set state in this useEffect
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