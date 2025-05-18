import { supabase } from "@/integrations/supabase/client";
import { clientAuthService } from "@/services/clientAuthService";

export const fetchClientId = clientAuthService.fetchClientIdForUser;
export const createClientRecordForUser = clientAuthService.createClientRecordForUser;
export const checkClientRecordExists = clientAuthService.checkClientRecordExists;

// Keep the isUserClient function for backward compatibility
export const isUserClient = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("[AUTH_DEBUG] isUserClient - No user found");
      return false;
    }
    
    return await clientAuthService.checkClientRecordExists(user.id);
  } catch (error) {
    console.error("[AUTH_DEBUG] isUserClient - Exception checking client status:", error);
    
    // Re-throw policy-related errors
    if (error instanceof Error && 
       (error.message.includes('policy') || 
        error.message.includes('permission'))) {
      throw error;
    }
    
    return false;
  }
};