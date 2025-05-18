import { supabase } from "@/integrations/supabase/client";

export const fetchClientId = async (userId: string): Promise<string | null> => {
  if (!userId) {
    console.log("[AUTH_DEBUG] fetchClientId - No userId provided");
    return null;
  }
  
  console.log("[AUTH_DEBUG] fetchClientId - Looking up client ID for user:", userId);
  
  try {
    // Simple direct query using the RLS policy
    const { data, error } = await supabase
      .from('clients')
      .select('client_id')
      .eq('user_auth_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log("[AUTH_DEBUG] fetchClientId - No client record found");
        return null;
      }
      console.error("[AUTH_DEBUG] fetchClientId - Error fetching client ID:", error);
      throw error;
    }
    
    console.log("[AUTH_DEBUG] fetchClientId - Client data found:", data);
    return data?.client_id || null;
  } catch (error) {
    console.error("[AUTH_DEBUG] fetchClientId - Exception fetching client ID:", error);
    throw error; // Re-throw to handle in the auth context
  }
};

// Helper function to check if a user has client permissions
export const isUserClient = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("[AUTH_DEBUG] isUserClient - No active session");
      return false;
    }
    
    // Simple direct query using the RLS policy
    const { data, error } = await supabase
      .from('clients')
      .select('client_id')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log("[AUTH_DEBUG] isUserClient - No client record found");
        return false;
      }
      console.error("[AUTH_DEBUG] isUserClient - Error checking client status:", error);
      throw error;
    }
    
    return !!data;
  } catch (error) {
    console.error("[AUTH_DEBUG] isUserClient - Exception checking client status:", error);
    return false;
  }
};
