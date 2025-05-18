
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/AuthContext';
import { AuthState } from '@/types/authTypes';
import { createAuthStateUpdater } from '@/utils/authUtils';

// Create a stable initial state
const initialAuthState: AuthState = {
  user: null,
  session: null,
  loading: true,
  initialized: false,
  isAuthenticated: false
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const navigate = useNavigate();
  
  // Create a stable updater function
  const updateAuthState = createAuthStateUpdater(setAuthState);

  useEffect(() => {
    console.log("[AUTH_DEBUG_FINAL_] AuthProvider initialized");
    let mounted = true;

    // Test Supabase connection
    const testConnection = async () => {
      try {
        console.log("[AUTH_DEBUG_FINAL_] Testing Supabase connection...");
        const { data, error } = await supabase.auth.getSession();
        console.log("[AUTH_DEBUG_FINAL_] Supabase connection test:", { 
          success: !error, 
          hasSession: !!data?.session,
          error: error?.message 
        });
      } catch (err) {
        console.error("[AUTH_DEBUG_FINAL_] Supabase connection test failed:", err);
      }
    };
    
    testConnection();
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("[AUTH_DEBUG_FINAL_] Auth state changed:", event, currentSession?.user?.id);
        
        if (mounted) {
          updateAuthState({
            session: currentSession,
            user: currentSession?.user ?? null,
            initialized: true,
            loading: false
          });
        }
      }
    );

    // THEN check for existing session
    const checkInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        console.log("[AUTH_DEBUG_FINAL_] Initial session check:", 
          initialSession?.user?.id, 
          error ? `Error: ${error.message}` : 'No error'
        );
        
        if (mounted) {
          updateAuthState({
            session: initialSession,
            user: initialSession?.user ?? null,
            initialized: true,
            loading: false
          });
        }
      } catch (error) {
        console.error("[AUTH_DEBUG_FINAL_] Error checking initial session:", error);
        if (mounted) {
          updateAuthState({
            initialized: true,
            loading: false
          });
        }
      }
    };

    checkInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("[AUTH_DEBUG_FINAL_] Attempting login for:", email);
      updateAuthState({ loading: true });
      
      // Test Supabase connection first
      try {
        console.log("[AUTH_DEBUG_FINAL_] Testing Supabase connection before login...");
        const { data: testData, error: testError } = await supabase.auth.getSession();
        console.log("[AUTH_DEBUG_FINAL_] Connection test result:", { 
          hasData: !!testData, 
          hasError: !!testError,
          errorMessage: testError?.message
        });
      } catch (testError) {
        console.error("[AUTH_DEBUG_FINAL_] Connection test error:", testError);
      }
      
      console.log("[AUTH_DEBUG_FINAL_] Calling auth.signInWithPassword...");
      const startTime = Date.now();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const duration = Date.now() - startTime;
      console.log(`[AUTH_DEBUG_FINAL_] auth.signInWithPassword completed in ${duration}ms`);

      if (error) {
        console.error("[AUTH_DEBUG_FINAL_] Login error:", error.message);
        updateAuthState({ loading: false });
        return { success: false, error: error.message };
      }

      console.log("[AUTH_DEBUG_FINAL_] Login successful:", data.user?.id);
      return { success: true };
    } catch (error) {
      console.error('[AUTH_DEBUG_FINAL_] Login exception:', error);
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
    updateAuthState({ loading: true });
    try {
      await supabase.auth.signOut();
      console.log("[AUTH_DEBUG_FINAL_] User signed out successfully");
      // onAuthStateChange will handle updating the state
    } catch (error) {
      console.error('[AUTH_DEBUG_FINAL_] Sign out error:', error);
      updateAuthState({ loading: false });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[AUTH_DEBUG_FINAL_] Reset password error:', error);
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
