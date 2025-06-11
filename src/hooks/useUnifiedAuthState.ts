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
  
  // Add emergency recovery function for page refresh scenarios
  const emergencyRecovery = useCallback(() => {
    console.warn("[UNIFIED_AUTH] Emergency recovery triggered - resetting to safe state");
    updateAuthState({
      loading: false,
      initialized: true,
      authLoadingTimeout: true,
      hasError: false,
      errorMessage: null
    });
    
    // Force page refresh after brief delay if we're still stuck
    setTimeout(() => {
      if (authState.loading || !authState.initialized) {
        console.warn("[UNIFIED_AUTH] Force refresh - recovery failed");
        window.location.reload();
      }
    }, 2000);
  }, [updateAuthState, authState.loading, authState.initialized]);
  
  // Set up loading timeouts - force completion after specified duration
  // Disabled timeouts to prevent unwanted session termination
  useEffect(() => {
    // Only use timeouts for initial loading, not for authenticated users
    if (authState.loading && !authState.authLoadingTimeout && !authState.isAuthenticated) {
      const timeoutId = setTimeout(() => {
        console.warn("[UNIFIED_AUTH] Auth loading timeout reached, forcing completion");
        emergencyRecovery();
      }, 30000); // Increased to 30 seconds for slower connections
      
      return () => clearTimeout(timeoutId);
    }
    
    // Disable client auth timeout to prevent logout of authenticated users
    // if (authState.isAuthenticated && !authState.clientId && 
    //     !authState.clientAuthLoadingTimeout && authState.role === 'customer') {
    //   const timeoutId = setTimeout(() => {
    //     console.warn("[UNIFIED_AUTH] Client auth loading timeout reached, forcing completion");
    //     updateAuthState({ 
    //       clientAuthLoadingTimeout: true,
    //       loading: false 
    //     });
    //   }, 15000);
    //   
    //   return () => clearTimeout(timeoutId);
    // }
  }, [
    authState.loading, 
    authState.authLoadingTimeout, 
    authState.isAuthenticated,
    emergencyRecovery
  ]);
  
  // Recovery mechanism for page refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (authState.loading || !authState.initialized)) {
        console.log("[UNIFIED_AUTH] Page became visible while loading - triggering recovery");
        setTimeout(() => {
          if (authState.loading || !authState.initialized) {
            emergencyRecovery();
          }
        }, 3000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [authState.loading, authState.initialized, emergencyRecovery]);
  
  return {
    ...authState,
    updateAuthState,
    emergencyRecovery,
  };
};
