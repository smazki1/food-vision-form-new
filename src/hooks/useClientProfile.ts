import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Client } from "@/types/client";

export function useClientProfile(userId?: string) {
  const [error, setError] = useState<string | null>(null);

  const { data: clientProfile, isLoading } = useQuery({
    queryKey: ["clientProfile", userId],
    queryFn: async () => {
      console.log("[useClientProfile] Hook called. Received userId:", userId);

      if (!userId) {
        console.warn("[useClientProfile] No userId provided, aborting fetch.");
        return null;
      }
      
      try {
        console.log("[useClientProfile] Attempting to fetch client profile for userId:", userId);
        
        const query = supabase
          .from('clients')
          .select(`
            client_id,
            user_auth_id,
            email_notifications,
            app_notifications,
            current_package_id,
            restaurant_name,
            contact_name,
            phone,
            email,
            client_status,
            remaining_servings,
            created_at,
            last_activity_at,
            internal_notes,
            original_lead_id
          `)
          .eq('user_auth_id', userId);

        console.log("[useClientProfile] Supabase query constructed:", query.toString()); // Log the query structure (approximate)

        const { data: basicClientData, error: basicClientError } = await query.maybeSingle();

        console.log("[useClientProfile] Supabase response for basicClientData:", basicClientData);
        console.log("[useClientProfile] Supabase error for basicClientError:", basicClientError);

        if (basicClientError && basicClientError.message !== 'JSON object requested, multiple (or no) rows returned') {
          console.error("[useClientProfile] Error fetching basic client data for user_auth_id " + userId + ":", basicClientError);
          setError(`שגיאה בטעינת פרטי הלקוח: ${basicClientError.message}`);
          return null;
        }

        if (!basicClientData) {
          console.warn("[useClientProfile] No client data found for user_auth_id:", userId, "(Result from Supabase was null/empty)");
          setError("לא נמצאו פרטי לקוח עבור המשתמש הנוכחי.");
          return null;
        }
        console.log("[useClientProfile] Basic client data successfully processed:", basicClientData);

        // If basic client fetch works and we have a package ID, try fetching package data
        if (basicClientData.current_package_id) {
          console.log("[useClientProfile] Fetching full profile with package data for user_auth_id:", userId, "and package_id:", basicClientData.current_package_id);
          
          const fullQuery = supabase
            .from('clients')
            .select(`
              client_id,
              user_auth_id,
              email_notifications,
              app_notifications,
              current_package_id,
              restaurant_name,
              contact_name,
              phone,
              email,
              client_status,
              remaining_servings,
              created_at,
              last_activity_at,
              internal_notes,
              original_lead_id,
              service_packages!inner (
                package_id,
                package_name,
                total_servings
              )
            `)
            .eq('user_auth_id', userId);
            // .eq('service_packages.package_id', basicClientData.current_package_id); // This kind of filtering on join needs care

          console.log("[useClientProfile] Supabase query for full profile (with package) constructed:", fullQuery.toString());

          const { data: clientData, error: clientError } = await fullQuery.maybeSingle();

          console.log("[useClientProfile] Supabase response for clientData (with package):", clientData);
          console.log("[useClientProfile] Supabase error for clientError (with package):", clientError);

          if (clientError && clientError.message !== 'JSON object requested, multiple (or no) rows returned') {
            console.error("[useClientProfile] Error fetching full client profile (with package) for user_auth_id " + userId + ":", clientError);
            setError(`שגיאה בטעינת פרטי החבילה של הלקוח: ${clientError.message}`);
            return basicClientData; 
          }
          
          if (!clientData) {
             console.warn("[useClientProfile] Full client data (with package) was null for user_auth_id:", userId, "Falling back to basicClientData.");
             return basicClientData; // Fallback if join returns nothing but basic profile exists
          }
          console.log("[useClientProfile] Full client data (with package) successfully processed:", clientData);
          return clientData;
        }
        
        console.log("[useClientProfile] No current_package_id found, returning basicClientData for user_auth_id:", userId);
        return basicClientData;
      } catch (err: any) {
        console.error("[useClientProfile] Exception in client profile fetch for user_auth_id " + userId + ":", err);
        setError(`שגיאה לא צפויה בטעינת פרופיל: ${err.message}`);
        return null;
      }
    },
    enabled: !!userId,
    refetchOnWindowFocus: false, // Consider keeping this false to avoid too many refetches during debug
    retry: false // Disable retries during debugging to see the first error clearly
  });

  const updateNotificationPreferences = async (emailEnabled: boolean, appEnabled: boolean) => {
    if (!userId || !clientProfile?.client_id) return false;
    
    try {
      const { error } = await supabase
        .from('clients')
        .update({ 
          email_notifications: emailEnabled,
          app_notifications: appEnabled,
        })
        .eq('client_id', clientProfile.client_id);

      if (error) {
        console.error("[useClientProfile] Final Error in updateNotificationPreferences for client_id " + clientProfile.client_id + ":", error);
        return false;
      }
      
      return true;
    } catch (err: any) {
      console.error("[useClientProfile] Exception in updateNotificationPreferences for client_id " + clientProfile.client_id + ":", err);
      return false;
    }
  };

  return {
    clientProfile,
    loading: isLoading,
    error,
    updateNotificationPreferences
  };
}
