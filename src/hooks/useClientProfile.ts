
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
        
        // First get the client record associated with this user
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select(`
            client_id, 
            restaurant_name, 
            contact_name,
            phone,
            email,
            remaining_servings,
            email_notifications,
            app_notifications,
            client_status,
            current_package_id,
            user_auth_id
          `)
          .eq('user_auth_id', userId)
          .maybeSingle();

        if (clientError) {
          console.error("[useClientProfile] Error fetching client data:", clientError);
          setError("שגיאה בטעינת פרטי הלקוח");
          return null;
        }

        console.log("[useClientProfile] Client data fetched:", clientData);

        if (!clientData) {
          console.log("[useClientProfile] No client data found for user:", userId);
          setError("לא נמצאו פרטי לקוח");
          return null;
        }

        // Cast to Client type with optional service_packages
        let clientResult = clientData as Client;

        // If we have a package ID, fetch the package details
        if (clientData.current_package_id) {
          console.log("[useClientProfile] Fetching package details for packageId:", clientData.current_package_id);
          
          const { data: packageData, error: packageError } = await supabase
            .from('service_packages')
            .select('package_name, total_servings')
            .eq('package_id', clientData.current_package_id)
            .single();

          if (packageError) {
            console.error("[useClientProfile] Error fetching package details:", packageError);
            // Don't fail completely, just return client data without package
          } else if (packageData) {
            console.log("[useClientProfile] Package data fetched:", packageData);
            // Add package data to client object
            clientResult.service_packages = packageData;
          }
        }

        return clientResult;
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
