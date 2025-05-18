import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Client } from "@/types/client";

export function useClientProfile(userId?: string) {
  const [error, setError] = useState<string | null>(null);

  const { data: clientProfile, isLoading } = useQuery({
    queryKey: ["clientProfile", userId],
    queryFn: async () => {
      if (!userId) {
        console.log("[useClientProfile] No userId provided");
        return null;
      }
      
      try {
        console.log("[useClientProfile] Fetching client profile for userId:", userId);
        
        // First, verify we can fetch the basic client record with explicit column selection
        const { data: basicClientData, error: basicClientError } = await supabase
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
            internal_notes
          `)
          .eq('user_auth_id', userId)
          .single();

        if (basicClientError) {
          console.error("[useClientProfile] Error fetching basic client data:", basicClientError);
          setError("שגיאה בטעינת פרטי הלקוח");
          return null;
        }

        console.log("[useClientProfile] Basic client data fetched:", basicClientData);

        if (!basicClientData) {
          console.log("[useClientProfile] No client data found for user:", userId);
          setError("לא נמצאו פרטי לקוח");
          return null;
        }

        // If basic client fetch works and we have a package ID, try fetching package data
        if (basicClientData.current_package_id) {
          console.log("[useClientProfile] Fetching full profile with package data");
          
          const { data: clientData, error: clientError } = await supabase
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
              service_packages!inner (
                package_id,
                package_name,
                total_servings
              )
            `)
            .eq('user_auth_id', userId)
            .single();

          if (clientError) {
            console.error("[useClientProfile] Error fetching full client profile:", clientError);
            setError("שגיאה בטעינת פרטי החבילה");
            return basicClientData;
          }

          console.log("[useClientProfile] Full client profile fetched:", clientData);
          return clientData;
        }

        // If no package ID, return basic client data
        return basicClientData;
      } catch (err) {
        console.error("[useClientProfile] Exception in client profile fetch:", err);
        setError("שגיאה לא צפויה בטעינת פרטי הלקוח");
        return null;
      }
    },
    enabled: !!userId
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
        console.error("[useClientProfile] Error updating notification preferences:", error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("[useClientProfile] Exception updating notification preferences:", err);
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
