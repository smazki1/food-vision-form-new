import { useEffect, useRef } from 'react';

interface UseClientAuthSyncProps {
  clientId: string | null;
  unifiedClientId: string | null;
  clientRecordStatus: 'loading' | 'found' | 'not-found' | 'error';
  authenticating: boolean;
  isAuthenticated: boolean;
  initialized: boolean;
  authLoading: boolean;
  updateClientAuthState: (updates: any) => void;
  user: any;
  connectionVerified: boolean;
}

/**
 * Custom hook that handles syncing between UnifiedAuth and ClientAuth states
 */
export const useClientAuthSync = ({
  clientId,
  unifiedClientId,
  clientRecordStatus,
  authenticating,
  isAuthenticated,
  initialized,
  authLoading,
  updateClientAuthState,
  user,
  connectionVerified
}: UseClientAuthSyncProps) => {
  const forcedCompletionRef = useRef(false);
  
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

    // Don't sync if we already forced completion
    if (forcedCompletionRef.current) {
      return;
    }

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
    
    // Only force completion if we're truly stuck and auth is fully initialized
    if (isAuthenticated && initialized && !authLoading && 
        clientRecordStatus === 'loading' && authenticating && 
        !forcedCompletionRef.current) {
      
      const forceTimeout = setTimeout(() => {
        if (!forcedCompletionRef.current) {
          console.warn("[CLIENT_AUTH_PROVIDER] Forcing completion due to extended loading");
          forcedCompletionRef.current = true;
          updateClientAuthState({
            clientId: unifiedClientId || null,
            clientRecordStatus: unifiedClientId ? 'found' : 'not-found',
            authenticating: false,
            errorState: null
          });
        }
      }, 5000); // Increased to 5 seconds to avoid rapid cycling
      
      return () => clearTimeout(forceTimeout);
    }
  }, [clientId, unifiedClientId, clientRecordStatus, authenticating, isAuthenticated, initialized, authLoading, updateClientAuthState]);

  // Simplified initial loading state handler
  useEffect(() => {
    console.log('[CLIENT_AUTH_PROVIDER] Auth state update:', {
      initialized, 
      authLoading, 
      isAuthenticated,
      authenticating,
      clientRecordStatus,
      clientId,
      unifiedClientId,
      connectionVerified,
      userId: user?.id,
      forcedCompletion: forcedCompletionRef.current
    });

    // Reset forced completion flag when auth state changes significantly
    if (!isAuthenticated || !initialized || authLoading) {
      forcedCompletionRef.current = false;
    }

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
      if (clientId !== null || authenticating !== false || clientRecordStatus !== 'not-found') {
        forcedCompletionRef.current = false; // Reset on logout
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
    clientId,
    updateClientAuthState,
    user,
    connectionVerified
  ]);
};
