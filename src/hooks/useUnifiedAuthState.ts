import { useState, useCallback, useEffect } from 'react';
import { UnifiedAuthState, UserRole } from '@/types/unifiedAuthTypes';
import { User, Session } from '@supabase/supabase-js';

// Initial state for authentication
const initialAuthState: UnifiedAuthState = {
  // Basic auth
  user: null,
  session: null,
  loading: true,
  initialized: false,
  isAuthenticated: false,
  
  // Role & permissions
  role: null,
  clientId: null,
  hasLinkedClientRecord: false,
  
  // Status indicators
  hasError: false,
  errorMessage: null,
  
  // Additional states
  authLoadingTimeout: false,
  clientAuthLoadingTimeout: false,
};

/**
 * Hook to manage unified authentication state
 */
export const useUnifiedAuthState = () => {
  const [authState, setAuthState] = useState<UnifiedAuthState>(initialAuthState);
  
  // Create a stable updater function that properly merges state
  const updateAuthState = useCallback((updates: Partial<UnifiedAuthState>) => {
    setAuthState(currentState => {
      const newState = { ...currentState, ...updates };
      
      // Derive isAuthenticated from user presence
      if ('user' in updates) {
        newState.isAuthenticated = !!updates.user;
      }
      
      // Derive hasLinkedClientRecord from clientId
      if ('clientId' in updates) {
        newState.hasLinkedClientRecord = !!updates.clientId;
      }
      
      // Log major state changes for debugging
      if ('user' in updates || 'role' in updates || 'clientId' in updates || 
          'loading' in updates || 'initialized' in updates || 'hasError' in updates) {
        console.log("[UNIFIED_AUTH] Auth state updated:", {
          userId: newState.user?.id,
          role: newState.role,
          clientId: newState.clientId,
          loading: newState.loading,
          initialized: newState.initialized,
          isAuthenticated: newState.isAuthenticated,
          hasLinkedClientRecord: newState.hasLinkedClientRecord,
          hasError: newState.hasError,
          timestamp: Date.now()
        });
      }
      
      return newState;
    });
  }, []);
  
  // Set up loading timeouts - force completion after specified duration
  useEffect(() => {
    if (authState.loading && !authState.authLoadingTimeout) {
      const timeoutId = setTimeout(() => {
        console.warn("[UNIFIED_AUTH] Auth loading timeout reached, forcing completion");
        updateAuthState({ 
          authLoadingTimeout: true,
          loading: false,
          initialized: true,
        });
      }, 20000); // 20 second timeout
      
      return () => clearTimeout(timeoutId);
    }
    
    if (authState.isAuthenticated && !authState.clientId && 
        !authState.clientAuthLoadingTimeout && authState.role === 'customer') {
      const timeoutId = setTimeout(() => {
        console.warn("[UNIFIED_AUTH] Client auth loading timeout reached, forcing completion");
        updateAuthState({ 
          clientAuthLoadingTimeout: true,
          loading: false 
        });
      }, 20000); // 20 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [
    authState.loading, 
    authState.authLoadingTimeout, 
    authState.clientAuthLoadingTimeout,
    authState.isAuthenticated,
    authState.clientId,
    authState.role,
    updateAuthState
  ]);
  
  return {
    ...authState,
    updateAuthState,
  };
};
