
import { AuthState } from '@/types/authTypes';

// Helper to update auth state in a consistent way
export const createAuthStateUpdater = (setAuthState: React.Dispatch<React.SetStateAction<AuthState>>) => {
  return (updates: Partial<AuthState>) => {
    setAuthState(currentState => {
      const newState = { ...currentState, ...updates };
      
      // Derive isAuthenticated from user presence
      if ('user' in updates) {
        newState.isAuthenticated = !!updates.user;
      }
      
      console.log("[AUTH_DEBUG] Auth state updated:", {
        user: newState.user?.id,
        loading: newState.loading,
        initialized: newState.initialized,
        isAuthenticated: newState.isAuthenticated
      });
      
      return newState;
    });
  };
};
