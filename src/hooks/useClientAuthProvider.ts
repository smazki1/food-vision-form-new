
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useClientDataFetcher } from '@/hooks/useClientDataFetcher';
import { useConnectionVerifier } from '@/hooks/useConnectionVerifier';
import { useClientAuthStateManager } from '@/hooks/useClientAuthStateManager';
import { ClientAuthContextType } from '@/types/clientAuthTypes';

/**
 * Custom hook that manages all the logic for the ClientAuthProvider
 */
export const useClientAuthProvider = () => {
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
    refetch
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
    
    if (refetch) {
      setTimeout(() => refetch(), 100);
    }
  }, [updateClientAuthState, refetch]);

  return {
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
    clientData, // Return client data
  };
};
