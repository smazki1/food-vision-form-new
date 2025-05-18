import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/AuthContext';
import { useAuthStateManager } from '@/hooks/useAuthStateManager';
import { useAuthInitializer } from '@/hooks/useAuthInitializer';
import { authService } from '@/services/authService';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { updateAuthState, ...authState } = useAuthStateManager();
  const navigate = useNavigate();
  
  // Initialize authentication state
  useAuthInitializer(updateAuthState);

  const signIn = async (email: string, password: string) => {
    console.log("[AUTH_DEBUG] Attempting login for:", email);
    
    try {
      // Set loading state at the start
      updateAuthState({ loading: true });
      const { success, error, data } = await authService.signInWithPassword(email, password);

      if (!success) {
        console.error("[AUTH_DEBUG] Login error:", error);
        updateAuthState({ loading: false });
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('[AUTH_DEBUG] Login exception:', error);
      updateAuthState({ loading: false });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'התרחשה שגיאה בתהליך ההתחברות. אנא נסה שוב מאוחר יותר.' 
      };
    }
  };

  // customerLogin is an alias for signIn
  const customerLogin = async (email: string, password: string) => {
    return signIn(email, password);
  };

  const signOut = async () => {
    try {
      updateAuthState({ loading: true });
      await authService.signOut();
      console.log("[AUTH_DEBUG] User signed out successfully");
      // onAuthStateChange will handle updating the state
    } catch (error) {
      console.error('[AUTH_DEBUG] Sign out error:', error);
      updateAuthState({ loading: false });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      return await authService.resetPasswordForEmail(email);
    } catch (error) {
      console.error('[AUTH_PROVIDER] Reset password error:', error);
      return { 
        success: false, 
        error: 'התרחשה שגיאה בתהליך איפוס הסיסמה. אנא נסה שוב מאוחר יותר.' 
      };
    }
  };

  // forgotPassword is an alias for resetPassword
  const forgotPassword = async (email: string) => {
    return resetPassword(email);
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signOut,
        resetPassword,
        customerLogin,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};