
import { useState, useCallback, useRef, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { UnifiedAuthState } from '@/types/unifiedAuthTypes';

// Reduce timeout to 10 seconds for faster loading
const AUTH_LOADING_TIMEOUT = 10000;

export const useUnifiedAuthState = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [authState, setAuthState] = useState<UnifiedAuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
    isAuthenticated: false,
    role: null,
    clientId: null,
    hasLinkedClientRecord: false,
    hasError: false,
    errorMessage: null,
    authLoadingTimeout: false,
    clientAuthLoadingTimeout: false,
  });

  // Set up auth loading timeout
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      console.warn('[UNIFIED_AUTH] Auth loading timeout reached, forcing completion');
      setAuthState(prev => ({
        ...prev,
        loading: false,
        initialized: true,
        authLoadingTimeout: true
      }));
    }, AUTH_LOADING_TIMEOUT);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const updateAuthState = useCallback((updates: Partial<UnifiedAuthState>) => {
    setAuthState(currentState => {
      const newState = { ...currentState, ...updates };
      
      // Clear timeout when auth completes successfully
      if ((updates.initialized === true || updates.loading === false) && timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Derive isAuthenticated from user presence
      if ('user' in updates || 'session' in updates) {
        newState.isAuthenticated = !!(updates.user ?? newState.user);
      }
      
      console.log('[UNIFIED_AUTH] Auth state updated:', {
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
      
      return newState;
    });
  }, []);

  return {
    authState,
    updateAuthState
  };
};
