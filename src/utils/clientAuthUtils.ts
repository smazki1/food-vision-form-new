
import { supabase } from "@/integrations/supabase/client";

export const fetchClientId = async (userId: string): Promise<string | null> => {
  if (!userId) return null;
  
  console.log("[AUTH_DEBUG] fetchClientId - Looking up client ID for user:", userId);
  
  try {
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
