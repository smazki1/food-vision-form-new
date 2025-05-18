
import { useState, useCallback } from 'react';
import { ClientAuthState } from '@/types/clientAuthTypes';

/**
 * Custom hook to manage client authentication state
 */
export const useClientAuthStateManager = () => {
  // Initialize with consistent initial state
  const [clientAuthState, setClientAuthState] = useState<ClientAuthState>({
    clientId: null,
    authenticating: true,
    isAuthenticated: false,
    hasLinkedClientRecord: false,
    hasNoClientRecord: false,
    clientRecordStatus: 'loading',
    errorState: null
  });
  
  // Create a stable updater function
  const updateClientAuthState = useCallback((updates: Partial<ClientAuthState>) => {
    setClientAuthState(currentState => {
      const newState = { ...currentState, ...updates };
      
      // Derive hasLinkedClientRecord from clientId
      if ('clientId' in updates) {
        newState.hasLinkedClientRecord = !!updates.clientId;
      }
      
      console.log("[AUTH_DEBUG_FINAL] ClientAuth state updated:", {
        clientId: newState.clientId,
        authenticating: newState.authenticating,
        isAuthenticated: newState.isAuthenticated,
        hasLinkedClientRecord: newState.hasLinkedClientRecord,
        hasNoClientRecord: newState.hasNoClientRecord,
        clientRecordStatus: newState.clientRecordStatus,
        errorState: newState.errorState
      });
      
      return newState;
    });
  }, []);
  
  return {
    ...clientAuthState,
    updateClientAuthState
  };
};
