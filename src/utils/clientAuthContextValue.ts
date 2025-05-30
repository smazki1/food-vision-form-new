
import { useMemo } from 'react';
import { ClientAuthContextType } from '@/types/clientAuthTypes';

interface CreateContextValueProps {
  clientId: string | null;
  unifiedClientId: string | null;
  user: any;
  authenticating: boolean;
  clientRecordStatus: 'loading' | 'found' | 'not-found' | 'error';
  errorState: string | null;
  isAuthenticated: boolean;
  initialized: boolean;
  authLoading: boolean;
  connectionVerified: boolean;
  refreshClientAuth: () => void;
  clientData?: any; // Add client data parameter
}

/**
 * Creates the context value for ClientAuthContext
 */
export const useClientAuthContextValue = ({
  clientId,
  unifiedClientId,
  user,
  authenticating,
  clientRecordStatus,
  errorState,
  isAuthenticated,
  initialized,
  authLoading,
  connectionVerified,
  refreshClientAuth,
  clientData,
}: CreateContextValueProps): ClientAuthContextType => {
  
  return useMemo(() => {
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
      authenticating,
      restaurantName: clientData?.restaurant_name,
      contactName: clientData?.contact_name
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
      restaurantName: clientData?.restaurant_name || null,
      contactName: clientData?.contact_name || null,
    };
  }, [
    clientId, unifiedClientId, user?.id, authenticating, clientRecordStatus, errorState, 
    isAuthenticated, initialized, authLoading, connectionVerified, refreshClientAuth, clientData
  ]);
};
