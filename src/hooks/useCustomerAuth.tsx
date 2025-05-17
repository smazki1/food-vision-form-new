
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Define a more robust authentication state interface
export type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean; 
  isAuthenticated: boolean;
};

type AuthContextType = AuthState & {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  customerLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  // Helper to update auth state in a consistent way
  const updateAuthState = (updates: Partial<AuthState>) => {
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

  useEffect(() => {
    console.log("[AUTH_DEBUG] AuthProvider initialized");
    let mounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("[AUTH_DEBUG] Auth state changed:", event, currentSession?.user?.id);
        
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
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log("[AUTH_DEBUG] Initial session check:", initialSession?.user?.id);
        
        if (mounted) {
          updateAuthState({
            session: initialSession,
            user: initialSession?.user ?? null,
            initialized: true,
            loading: false
          });
        }
      } catch (error) {
        console.error("[AUTH_DEBUG] Error checking initial session:", error);
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
      console.log("[AUTH_DEBUG] Attempting login for:", email);
      updateAuthState({ loading: true });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[AUTH_DEBUG] Login error:", error.message);
        updateAuthState({ loading: false });
        return { success: false, error: error.message };
      }

      console.log("[AUTH_DEBUG] Login successful:", data.user?.id);
      return { success: true };
    } catch (error) {
      console.error('[AUTH_DEBUG] Login exception:', error);
      updateAuthState({ loading: false });
      return { 
        success: false, 
        error: 'התרחשה שגיאה בתהליך ההתחברות. אנא נסה שוב מאוחר יותר.' 
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
      console.log("[AUTH_DEBUG] User signed out successfully");
      // onAuthStateChange will handle updating the state
    } catch (error) {
      console.error('[AUTH_DEBUG] Sign out error:', error);
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
      console.error('[AUTH_DEBUG] Reset password error:', error);
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

export const useCustomerAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('[AUTH_DEBUG] useCustomerAuth must be used within an AuthProvider');
  }
  
  return context;
};
