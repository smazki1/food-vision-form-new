
import { useEffect } from 'react';

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
      if (clientId !== null || authenticating !== false || clientRecordStatus !== 'not-found') {
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
