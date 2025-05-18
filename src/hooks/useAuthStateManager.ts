
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js'; 
import { AuthState } from '@/types/authTypes';
import { createAuthStateUpdater } from '@/utils/authUtils';

/**
 * Custom hook to manage authentication state
 */
export const useAuthStateManager = () => {
  // Initialize with consistent initial state
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
    isAuthenticated: false
  });
  
  // Create a stable updater function
  const updateAuthState = useCallback(
    createAuthStateUpdater(setAuthState),
    [setAuthState]
  );
  
  return {
    ...authState,
    updateAuthState
  };
};
