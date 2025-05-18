
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/unifiedAuthTypes';

export const unifiedAuthService = {
  /**
   * Get the current session
   */
  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("[UNIFIED_AUTH] Get session error:", error);
        return { session: null, error };
      }
      return { session: data.session, error: null };
    } catch (error) {
      console.error("[UNIFIED_AUTH] Get session exception:", error);
      return { session: null, error };
    }
  },

  /**
   * Sign in with email and password
   */
  signInWithPassword: async (email: string, password: string) => {
    try {
      console.log("[UNIFIED_AUTH] Starting signIn for:", email);
      
      const startTime = Date.now();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const duration = Date.now() - startTime;
      console.log(`[UNIFIED_AUTH] signInWithPassword completed in ${duration}ms`);

      if (error) {
        console.error("[UNIFIED_AUTH] SignIn error:", error);
        return { success: false, error: error.message };
      }

      console.log("[UNIFIED_AUTH] SignIn successful for user:", data.user?.id);
      return { success: true, data };
    } catch (error) {
      console.error('[UNIFIED_AUTH] SignIn exception:', error);
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
      console.log("[UNIFIED_AUTH] Signing out user");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[UNIFIED_AUTH] Sign out error:", error);
        return { success: false, error };
      }
      console.log("[UNIFIED_AUTH] User signed out successfully");
      return { success: true, error: null };
    } catch (error) {
      console.error('[UNIFIED_AUTH] Sign out exception:', error);
      return { success: false, error };
    }
  },

  /**
   * Reset password for email
   */
  resetPasswordForEmail: async (email: string) => {
    try {
      console.log("[UNIFIED_AUTH] Requesting password reset for:", email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("[UNIFIED_AUTH] Reset password error:", error);
        return { success: false, error: error.message };
      }
      
      console.log("[UNIFIED_AUTH] Password reset email sent successfully");
      return { success: true, error: null };
    } catch (error) {
      console.error('[UNIFIED_AUTH] Reset password exception:', error);
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
      console.log("[UNIFIED_AUTH] Auth state changed:", event, session?.user?.id);
      callback(event, session);
    });
  },
  
  /**
   * Test database connection
   */
  testDatabaseConnection: async () => {
    console.log("[UNIFIED_AUTH] Testing database connection");
    try {
      const { data, error } = await supabase.from('clients').select('count').limit(1);
      console.log("[UNIFIED_AUTH] Connection test result:", { 
        success: !error, 
        error: error?.message,
        code: error?.code,
        data
      });
      
      return { success: !error, error, data };
    } catch (err) {
      console.error("[UNIFIED_AUTH] Connection test exception:", err);
      return { success: false, error: err };
    }
  },

  /**
   * Fetch client ID for a user
   */
  fetchClientIdForUser: async (userId: string): Promise<{
    clientId: string | null, 
    error: Error | null
  }> => {
    if (!userId) {
      console.log("[UNIFIED_AUTH] No userId provided");
      return { clientId: null, error: null };
    }
    
    console.log("[UNIFIED_AUTH] Looking up client ID for user:", userId);
    const startTime = Date.now();
    
    try {
      // First verify the user is authenticated
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("[UNIFIED_AUTH] Auth verification failed:", authError);
        return { clientId: null, error: new Error("Authentication verification failed") };
      }
      
      if (!authData.user) {
        console.error("[UNIFIED_AUTH] No authenticated user found");
        return { clientId: null, error: null };
      }
      
      // Query the clients table
      const { data, error } = await supabase
        .from("clients")
        .select("client_id")
        .eq("user_auth_id", userId)
        .maybeSingle();
        
      const duration = Date.now() - startTime;
      console.log(`[UNIFIED_AUTH] Query completed in ${duration}ms`);
        
      if (error) {
        if (error.code === '42P17') {
          console.error("[UNIFIED_AUTH] RLS policy recursion detected!");
          return { 
            clientId: null, 
            error: new Error("Database policy configuration error. Please contact support.") 
          };
        }
        
        console.error("[UNIFIED_AUTH] Error fetching client ID:", error);
        return { clientId: null, error: new Error(error.message) };
      }
      
      return { clientId: data?.client_id || null, error: null };
    } catch (error) {
      console.error("[UNIFIED_AUTH] Exception fetching client ID:", error);
      return { 
        clientId: null, 
        error: error instanceof Error ? error : new Error("Unknown error fetching client data") 
      };
    }
  },

  /**
   * Fetch user role
   */
  fetchUserRole: async (userId: string): Promise<{
    role: UserRole,
    error: Error | null
  }> => {
    if (!userId) {
      return { role: null, error: null };
    }
    
    console.log("[UNIFIED_AUTH] Fetching role for user:", userId);
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (error) {
        if (error.code === 'PGRST116') { // Record not found
          console.log("[UNIFIED_AUTH] No role found for user");
          return { role: 'customer', error: null }; // Default to customer if no explicit role
        }
        console.error("[UNIFIED_AUTH] Error fetching user role:", error);
        return { role: null, error: new Error(error.message) };
      }
      
      if (!data) {
        console.log("[UNIFIED_AUTH] No role record found, assuming customer");
        return { role: 'customer', error: null }; // Default to customer if no explicit role
      }
      
      // Validate role is one of our expected types
      const role = data.role as UserRole;
      if (role !== 'admin' && role !== 'editor' && role !== 'customer') {
        console.warn(`[UNIFIED_AUTH] Unknown role '${role}' found, defaulting to customer`);
        return { role: 'customer', error: null };
      }
      
      console.log(`[UNIFIED_AUTH] User role: ${role}`);
      return { role, error: null };
    } catch (error) {
      console.error("[UNIFIED_AUTH] Exception fetching user role:", error);
      return { 
        role: null, 
        error: error instanceof Error ? error : new Error("Unknown error fetching user role") 
      };
    }
  },
  
  /**
   * Create a client record for a user
   */
  createClientRecord: async (userId: string, clientData: {
    restaurant_name: string;
    contact_name: string;
    phone: string;
    email: string;
  }): Promise<{ clientId: string | null, error: Error | null }> => {
    if (!userId) {
      return { clientId: null, error: new Error("No user ID provided") };
    }

    try {
      console.log("[UNIFIED_AUTH] Creating client record for user:", userId);
      
      // Verify user doesn't already have a client record
      const existingCheck = await unifiedAuthService.fetchClientIdForUser(userId);
      
      if (existingCheck.clientId) {
        return { 
          clientId: existingCheck.clientId, 
          error: new Error("User already has a client record") 
        };
      }
      
      // Create a new client record linked to this user
      const { data, error } = await supabase
        .from("clients")
        .insert({
          ...clientData,
          user_auth_id: userId
        })
        .select("client_id")
        .single();

      if (error) {
        console.error("[UNIFIED_AUTH] Error creating client:", error);
        return { clientId: null, error: new Error(error.message) };
      }

      console.log("[UNIFIED_AUTH] Created client record:", data);
      return { clientId: data.client_id, error: null };
    } catch (error) {
      console.error("[UNIFIED_AUTH] Exception creating client:", error);
      return { 
        clientId: null, 
        error: error instanceof Error ? error : new Error("Unknown error creating client record") 
      };
    }
  }
};
