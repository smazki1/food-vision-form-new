
import { supabase } from "@/integrations/supabase/client";

export const fetchClientId = async (userId: string): Promise<string | null> => {
  if (!userId) {
    console.log("[AUTH_VERIFY] fetchClientId - No userId provided");
    return null;
  }
  
  console.log("[AUTH_VERIFY] fetchClientId - Looking up client ID for user:", userId);
  
  try {
    // Directly query the clients table with improved error handling
    const { data, error } = await supabase
      .from("clients")
      .select("client_id, restaurant_name, email, user_auth_id, remaining_servings, current_package_id")
      .eq("user_auth_id", userId)
      .maybeSingle();
      
    if (error) {
      console.error("[AUTH_VERIFY] fetchClientId - Error fetching client ID:", error);
      return null;
    }
    
    console.log("[AUTH_VERIFY] fetchClientId - Client data found:", data);
    
    // If no client record exists, this is a valid state that needs to be handled
    if (!data) {
      console.warn(`[AUTH_VERIFY] No client record found linked to user_auth_id: ${userId}`);
      return null;
    }
    
    return data?.client_id || null;
  } catch (error) {
    console.error("[AUTH_VERIFY] fetchClientId - Exception fetching client ID:", error);
    return null;
  }
};

// Helper function to check if a user has client permissions
export const isUserClient = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("[AUTH_VERIFY] isUserClient - No user found");
      return false;
    }
    
    console.log("[AUTH_VERIFY] isUserClient - Checking client status for user:", user.id);
    
    // Query to check if the user has a client record
    const { data, error } = await supabase
      .from("clients")
      .select("client_id")
      .eq("user_auth_id", user.id)
      .maybeSingle();
    
    if (error) {
      console.error("[AUTH_VERIFY] isUserClient - Error checking client status:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("[AUTH_VERIFY] isUserClient - Exception checking client status:", error);
    return false;
  }
};
