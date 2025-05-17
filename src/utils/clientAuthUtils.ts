
import { supabase } from "@/integrations/supabase/client";

export const fetchClientId = async (userId: string): Promise<string | null> => {
  if (!userId) {
    console.log("[AUTH_DEBUG_LOOP_FIX] fetchClientId - No userId provided");
    return null;
  }
  
  console.log("[AUTH_DEBUG_LOOP_FIX] fetchClientId - Looking up client ID for user:", userId);
  
  try {
    // Use the most direct query possible with no joins or complex conditions
    const { data, error } = await supabase
      .from("clients")
      .select("client_id")
      .eq("user_auth_id", userId)
      .maybeSingle();
      
    if (error) {
      console.error("[AUTH_DEBUG_LOOP_FIX] fetchClientId - Error fetching client ID:", error);
      return null;
    }
    
    console.log("[AUTH_DEBUG_LOOP_FIX] fetchClientId - Client data found:", data);
    return data?.client_id || null;
  } catch (error) {
    console.error("[AUTH_DEBUG_LOOP_FIX] fetchClientId - Exception fetching client ID:", error);
    return null;
  }
};

// Helper function to check if a user has client permissions
export const isUserClient = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("[AUTH_DEBUG_LOOP_FIX] isUserClient - No session found");
      return false;
    }
    
    console.log("[AUTH_DEBUG_LOOP_FIX] isUserClient - Checking client status for user:", session.user.id);
    
    // Direct simple query to avoid recursion
    const { data, error } = await supabase
      .from("clients")
      .select("client_id")
      .eq("user_auth_id", session.user.id)
      .maybeSingle();
    
    if (error) {
      console.error("[AUTH_DEBUG_LOOP_FIX] isUserClient - Error checking client status:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("[AUTH_DEBUG_LOOP_FIX] isUserClient - Exception checking client status:", error);
    return false;
  }
};
