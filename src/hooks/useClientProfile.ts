import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export function useClientProfile(userId?: string) {
  const [error, setError] = useState<string | null>(null);

  const { data: clientProfile, isLoading } = useQuery({
    queryKey: ["clientProfile", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      try {
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
          console.error("Error fetching basic client data:", basicClientError);
          setError("שגיאה בטעינת פרטי הלקוח");
          return null;
        }

        if (!basicClientData) {
          console.error("No client record found for user:", userId);
          setError("לא נמצאו פרטי לקוח");
          return null;
        }

        // If basic client fetch works and we have a package ID, try fetching package data
        if (basicClientData.current_package_id) {
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
            console.error("Error fetching full client profile:", clientError);
            setError("שגיאה בטעינת פרטי החבילה");
            return basicClientData;
          }

          return clientData;
        }

        // If no package ID, return basic client data
        return basicClientData;
      } catch (err) {
        console.error("Exception in client profile fetch:", err);
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
        console.error("Error updating notification preferences:", error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Exception updating notification preferences:", err);
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
