
import { supabase } from "@/integrations/supabase/client";

export const fetchClientId = async (userId: string): Promise<string | null> => {
  if (!userId) {
    console.log("[AUTH_DEBUG] fetchClientId - No userId provided");
    return null;
  }
  
  console.log("[AUTH_DEBUG] fetchClientId - Looking up client ID for user:", userId);
  
  try {
    // With fixed RLS policies, this should work properly now
    const { data, error } = await supabase
      .from("clients")
      .select("client_id")
      .eq("user_auth_id", userId)
      .maybeSingle();
      
    if (error) {
      console.error("[AUTH_DEBUG] fetchClientId - Error fetching client ID:", error);
      return null;
    }
    
    console.log("[AUTH_DEBUG] fetchClientId - Client data found:", data);
    return data?.client_id || null;
  } catch (error) {
    console.error("[AUTH_DEBUG] fetchClientId - Exception fetching client ID:", error);
    return null;
  }
};

// Helper function to check if a user has client permissions
export const isUserClient = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    
    // Use the userId to check for client record
    const { data } = await supabase
      .from("clients")
      .select("client_id")
      .eq("user_auth_id", session.user.id)
      .maybeSingle();
    
    return !!data;
  } catch (error) {
    console.error("[AUTH_DEBUG] isUserClient - Error checking client status:", error);
    return false;
  }
};
