
import { supabase } from "@/integrations/supabase/client";

export const fetchClientId = async (userId: string): Promise<string | null> => {
  if (!userId) {
    console.log("[AUTH_DEBUG_FINAL_FIX] fetchClientId - No userId provided");
    return null;
  }
  
  console.log("[AUTH_DEBUG_FINAL_FIX] fetchClientId - Looking up client ID for user:", userId);
  
  try {
    // Simple direct query matching our new RLS policy: auth.uid() = user_auth_id
    const { data, error } = await supabase
      .from("clients")
      .select("client_id")
      .eq("user_auth_id", userId)
      .maybeSingle();
      
    if (error) {
      console.error("[AUTH_DEBUG_FINAL_FIX] fetchClientId - Error fetching client ID:", error);
      return null;
    }
    
    console.log("[AUTH_DEBUG_FINAL_FIX] fetchClientId - Client data found:", data);
    return data?.client_id || null;
  } catch (error) {
    console.error("[AUTH_DEBUG_FINAL_FIX] fetchClientId - Exception fetching client ID:", error);
    return null;
  }
};

// Helper function to check if a user has client permissions
export const isUserClient = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("[AUTH_DEBUG_FINAL_FIX] isUserClient - No user found");
      return false;
    }
    
    console.log("[AUTH_DEBUG_FINAL_FIX] isUserClient - Checking client status for user:", user.id);
    
    // Simple query that will work with our new RLS policy
    const { data, error } = await supabase
      .from("clients")
      .select("client_id")
      .eq("user_auth_id", user.id)
      .maybeSingle();
    
    if (error) {
      console.error("[AUTH_DEBUG_FINAL_FIX] isUserClient - Error checking client status:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("[AUTH_DEBUG_FINAL_FIX] isUserClient - Exception checking client status:", error);
    return false;
  }
};
