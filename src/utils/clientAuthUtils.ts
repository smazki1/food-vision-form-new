
import { supabase } from "@/integrations/supabase/client";

export const fetchClientId = async (userId: string): Promise<string | null> => {
  if (!userId) {
    console.log("[AUTH_DEBUG_FINAL_] fetchClientId - No userId provided");
    return null;
  }
  
  console.log("[AUTH_DEBUG_FINAL_] fetchClientId - Looking up client ID for user:", userId);
  
  try {
    // First verify the user is authenticated to catch potential auth issues early
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("[AUTH_DEBUG_FINAL_] fetchClientId - Auth verification failed:", authError);
      throw new Error("Authentication verification failed");
    }
    
    if (!authData.user) {
      console.error("[AUTH_DEBUG_FINAL_] fetchClientId - No authenticated user found");
      return null;
    }
    
    // Directly query the clients table with improved error handling
    const { data, error } = await supabase
      .from("clients")
      .select("client_id, restaurant_name, email, user_auth_id, remaining_servings, current_package_id")
      .eq("user_auth_id", userId)
      .maybeSingle();
      
    if (error) {
      // Specific handling for RLS policy recursion error
      if (error.code === '42P17') {
        console.error("[AUTH_DEBUG_FINAL_] fetchClientId - RLS policy recursion detected! This should be fixed now.");
        throw new Error("Database policy configuration error. Please contact support.");
      }
      
      // Specific handling for permission denied error
      if (error.code === '42501') {
        console.error("[AUTH_DEBUG_FINAL_] fetchClientId - Permission denied error. Check RLS policies.");
        throw new Error("Permission denied. Please contact support.");
      }
      
      console.error("[AUTH_DEBUG_FINAL_] fetchClientId - Error fetching client ID:", error);
      throw error;
    }
    
    console.log("[AUTH_DEBUG_FINAL_] fetchClientId - Client data found:", data);
    
    // If no client record exists, this is a valid state that needs to be handled
    if (!data) {
      console.warn(`[AUTH_DEBUG_FINAL_] No client record found linked to user_auth_id: ${userId}`);
      return null;
    }
    
    return data?.client_id || null;
  } catch (error) {
    console.error("[AUTH_DEBUG_FINAL_] fetchClientId - Exception fetching client ID:", error);
    
    // Re-throw policy-related errors so they can be handled specifically
    if (error instanceof Error && 
       (error.message.includes('policy') || 
        error.message.includes('permission') || 
        error.message.includes('Authentication'))) {
      throw error;
    }
    
    return null;
  }
};

// Helper function to create a client record for a user
export const createClientRecordForUser = async (userId: string, clientData: {
  restaurant_name: string;
  contact_name: string;
  phone: string;
  email: string;
}): Promise<string | null> => {
  if (!userId) {
    console.error("[AUTH_DEBUG_FINAL_] createClientRecordForUser - No userId provided");
    return null;
  }

  try {
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
      console.error("[AUTH_DEBUG_FINAL_] createClientRecordForUser - Error creating client:", error);
      return null;
    }

    console.log("[AUTH_DEBUG_FINAL_] createClientRecordForUser - Created client record:", data);
    return data.client_id;
  } catch (error) {
    console.error("[AUTH_DEBUG_FINAL_] createClientRecordForUser - Exception creating client:", error);
    return null;
  }
};

// Helper function to check if a user has client permissions
export const isUserClient = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("[AUTH_DEBUG_FINAL_] isUserClient - No user found");
      return false;
    }
    
    console.log("[AUTH_DEBUG_FINAL_] isUserClient - Checking client status for user:", user.id);
    
    // Query to check if the user has a client record
    const { data, error } = await supabase
      .from("clients")
      .select("client_id")
      .eq("user_auth_id", user.id)
      .maybeSingle();
    
    if (error) {
      // Specific handling for RLS policy recursion error
      if (error.code === '42P17') {
        console.error("[AUTH_DEBUG_FINAL_] isUserClient - RLS policy recursion detected!");
        throw new Error("Database policy configuration error. Please contact support.");
      }
      
      // Specific handling for permission denied error
      if (error.code === '42501') {
        console.error("[AUTH_DEBUG_FINAL_] isUserClient - Permission denied error. Check RLS policies.");
        return false;
      }
      
      console.error("[AUTH_DEBUG_FINAL_] isUserClient - Error checking client status:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("[AUTH_DEBUG_FINAL_] isUserClient - Exception checking client status:", error);
    
    // Re-throw policy-related errors
    if (error instanceof Error && 
       (error.message.includes('policy') || 
        error.message.includes('permission'))) {
      throw error;
    }
    
    return false;
  }
};

// Helper function to check if client record exists for a user
export const checkClientRecordExists = async (userId: string): Promise<boolean> => {
  try {
    if (!userId) return false;
    
    console.log("[AUTH_DEBUG_FINAL_] checkClientRecordExists - Checking for user:", userId);
    
    const { data, error } = await supabase
      .from("clients")
      .select("client_id")
      .eq("user_auth_id", userId)
      .maybeSingle();
      
    if (error) {
      console.error("[AUTH_DEBUG_FINAL_] checkClientRecordExists - Error:", error);
      return false;
    }
    
    const exists = !!data;
    console.log("[AUTH_DEBUG_FINAL_] checkClientRecordExists - Result:", exists);
    return exists;
  } catch (error) {
    console.error("[AUTH_DEBUG_FINAL_] checkClientRecordExists - Exception:", error);
    return false;
  }
};
