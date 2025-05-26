import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

/**
 * Core client authentication service for handling client-specific auth operations
 */
export const clientAuthService = {
  /**
   * Test database connection
   */
  testDatabaseConnection: async () => {
    console.log("[AUTH_DEBUG_FINAL] ClientAuthService - Testing database connection");
    try {
      const { data, error } = await supabase.from('clients').select('count').limit(1);
      console.log("[AUTH_DEBUG_FINAL] ClientAuthService - Connection test result:", { 
        success: !error, 
        error: error?.message,
        code: error?.code,
        data
      });
      
      return { success: !error, error, data };
    } catch (err) {
      console.error("[AUTH_DEBUG_FINAL] ClientAuthService - Connection test exception:", err);
      return { success: false, error: err };
    }
  },

  /**
   * Fetch client ID for a user
   */
  fetchClientIdForUser: async (userId: string): Promise<string | null> => {
    if (!userId) {
      console.log("[AUTH_DEBUG_FINAL] ClientAuthService - No userId provided");
      return null;
    }
    
    console.log("[AUTH_DEBUG_FINAL] ClientAuthService - Looking up client ID for user:", userId);
    const startTime = Date.now();
    
    try {
      // First verify the user is authenticated to catch potential auth issues early
      console.log("[AUTH_DEBUG_FINAL] ClientAuthService - Attempting supabase.auth.getUser()");
      const { data: authData, error: authError } = await supabase.auth.getUser();
      console.log("[AUTH_DEBUG_FINAL] ClientAuthService - supabase.auth.getUser() completed");

      if (authError) {
        console.error("[AUTH_DEBUG_FINAL] ClientAuthService - Auth verification failed:", authError);
        throw new Error("Authentication verification failed");
      }
      
      if (!authData.user) {
        console.error("[AUTH_DEBUG_FINAL] ClientAuthService - No authenticated user found");
        return null;
      }
      
      // Log authentication confirmation
      console.log("[AUTH_DEBUG_FINAL] ClientAuthService - User authenticated:", authData.user.id);
      
      // Directly query the clients table with improved error handling
      console.log("[AUTH_DEBUG_FINAL] ClientAuthService - Querying clients table...");
      const { data, error } = await supabase
        .from("clients")
        .select("client_id, restaurant_name, email, user_auth_id, remaining_servings, current_package_id")
        .eq("user_auth_id", userId)
        .maybeSingle();
        
      const duration = Date.now() - startTime;
      console.log(`[AUTH_DEBUG_FINAL] ClientAuthService - Query completed in ${duration}ms`);
        
      if (error) {
        // Specific handling for RLS policy recursion error
        if (error.code === '42P17') {
          console.error("[AUTH_DEBUG_FINAL] ClientAuthService - RLS policy recursion detected!");
          throw new Error("Database policy configuration error. Please contact support.");
        }
        
        // Specific handling for permission denied error
        if (error.code === '42501') {
          console.error("[AUTH_DEBUG_FINAL] ClientAuthService - Permission denied error. Check RLS policies.");
          throw new Error("Permission denied. Please contact support.");
        }
        
        console.error("[AUTH_DEBUG_FINAL] ClientAuthService - Error fetching client ID:", error);
        throw error;
      }
      
      console.log("[AUTH_DEBUG_FINAL] ClientAuthService - Client data found:", data);
      
      // If no client record exists, this is a valid state that needs to be handled
      if (!data) {
        console.warn(`[AUTH_DEBUG_FINAL] ClientAuthService - No client record found linked to user_auth_id: ${userId}`);
        return null;
      }
      
      // START <<<< TEMPORARY DELAY FOR TESTING >>>> START
      // console.log("[TEMP_TEST_DELAY] Starting 6-second delay for testing long load message...");
      // await new Promise(resolve => setTimeout(resolve, 6000)); // 6-second delay
      // console.log("[TEMP_TEST_DELAY] Finished 6-second delay.");
      // END <<<< TEMPORARY DELAY FOR TESTING >>>> END
      
      return data?.client_id || null;
    } catch (error) {
      // Include stack trace for better debugging
      console.error("[AUTH_DEBUG_FINAL] ClientAuthService - Exception fetching client ID:", error);
      if (error instanceof Error) {
        console.error("[AUTH_DEBUG_FINAL] ClientAuthService - Stack trace:", error.stack);
      }
      
      // Re-throw policy-related errors so they can be handled specifically
      if (error instanceof Error && 
         (error.message.includes('policy') || 
          error.message.includes('permission') || 
          error.message.includes('Authentication'))) {
        throw error;
      }
      
      return null;
    }
  },

  /**
   * Check if a client record exists for a user
   */
  checkClientRecordExists: async (userId: string): Promise<boolean> => {
    try {
      if (!userId) return false;
      
      console.log("[AUTH_DEBUG_FINAL] ClientAuthService - Checking if client record exists for user:", userId);
      
      const { data, error } = await supabase
        .from("clients")
        .select("client_id")
        .eq("user_auth_id", userId)
        .maybeSingle();
        
      if (error) {
        console.error("[AUTH_DEBUG_FINAL] ClientAuthService - Error checking client record:", error);
        return false;
      }
      
      const exists = !!data;
      console.log("[AUTH_DEBUG_FINAL] ClientAuthService - Client record exists:", exists);
      return exists;
    } catch (error) {
      console.error("[AUTH_DEBUG_FINAL] ClientAuthService - Exception checking client record:", error);
      return false;
    }
  },

  /**
   * Create a client record for a user
   */
  createClientRecordForUser: async (userId: string, clientData: {
    restaurant_name: string;
    contact_name: string;
    phone: string;
    email: string;
  }): Promise<string | null> => {
    if (!userId) {
      console.error("[AUTH_DEBUG_FINAL] ClientAuthService - No userId provided for creating client record");
      return null;
    }

    try {
      console.log("[AUTH_DEBUG_FINAL] ClientAuthService - Creating client record for user:", userId);
      
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
        console.error("[AUTH_DEBUG_FINAL] ClientAuthService - Error creating client:", error);
        return null;
      }

      console.log("[AUTH_DEBUG_FINAL] ClientAuthService - Created client record:", data);
      return data.client_id;
    } catch (error) {
      console.error("[AUTH_DEBUG_FINAL] ClientAuthService - Exception creating client:", error);
      return null;
    }
  }
};
