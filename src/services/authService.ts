
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Core authentication service for handling Supabase auth operations
 */
export const authService = {
  /**
   * Get the current session
   */
  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("[AUTH_SERVICE] Get session error:", error);
        return { session: null, error };
      }
      return { session: data.session, error: null };
    } catch (error) {
      console.error("[AUTH_SERVICE] Get session exception:", error);
      return { session: null, error };
    }
  },

  /**
   * Sign in with email and password
   */
  signInWithPassword: async (email: string, password: string) => {
    try {
      console.log("[AUTH_SERVICE] Starting signIn for:", email);
      
      // Test Supabase connection first
      console.log("[AUTH_SERVICE] Testing Supabase connection...");
      const { data: testData, error: testError } = await supabase.auth.getSession();
      console.log("[AUTH_SERVICE] Connection test result:", { 
        hasSession: !!testData?.session,
        error: testError?.message 
      });
      
      console.log("[AUTH_SERVICE] Attempting signInWithPassword...");
      const startTime = Date.now();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const duration = Date.now() - startTime;
      console.log(`[AUTH_SERVICE] signInWithPassword completed in ${duration}ms`);

      console.log("[AUTH_SERVICE] SignIn response:", { 
        success: !error, 
        hasUser: !!data?.user, 
        userId: data?.user?.id,
        error: error?.message 
      });

      if (error) {
        console.error("[AUTH_SERVICE] SignIn error:", error);
        return { success: false, error: error.message };
      }

      console.log("[AUTH_SERVICE] SignIn successful for user:", data.user?.id);
      return { success: true, data };
    } catch (error) {
      console.error('[AUTH_SERVICE] SignIn exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'התרחשה שגיאה בתהליך ההתחברות. אנא נסה שוב מאוחר יותר.' 
      };
    }
  },

  /**
   * Sign out the current user
   */
  signOut: async () => {
    try {
      console.log("[AUTH_SERVICE] Signing out user");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[AUTH_SERVICE] Sign out error:", error);
        return { success: false, error };
      }
      console.log("[AUTH_SERVICE] User signed out successfully");
      return { success: true, error: null };
    } catch (error) {
      console.error('[AUTH_SERVICE] Sign out exception:', error);
      return { success: false, error };
    }
  },

  /**
   * Reset password for email
   */
  resetPasswordForEmail: async (email: string) => {
    try {
      console.log("[AUTH_SERVICE] Requesting password reset for:", email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("[AUTH_SERVICE] Reset password error:", error);
        return { success: false, error: error.message };
      }
      
      console.log("[AUTH_SERVICE] Password reset email sent successfully");
      return { success: true, error: null };
    } catch (error) {
      console.error('[AUTH_SERVICE] Reset password exception:', error);
      return { 
        success: false, 
        error: 'התרחשה שגיאה בתהליך איפוס הסיסמה. אנא נסה שוב מאוחר יותר.' 
      };
    }
  },

  /**
   * Set up auth state change listener
   */
  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log("[AUTH_SERVICE] Auth state changed:", event, session?.user?.id);
      callback(event, session);
    });
  },
  
  /**
   * Test Supabase connection
   */
  testConnection: async () => {
    try {
      console.log("[AUTH_SERVICE] Testing Supabase connection...");
      const { data, error } = await supabase.auth.getSession();
      console.log("[AUTH_SERVICE] Supabase connection test:", { 
        success: !error, 
        hasSession: !!data?.session,
        error: error?.message 
      });
      return { success: !error, data, error };
    } catch (err) {
      console.error("[AUTH_SERVICE] Supabase connection test failed:", err);
      return { success: false, error: err };
    }
  }
};
