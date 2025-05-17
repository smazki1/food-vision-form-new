
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
        // First get the client record associated with this user
        // Limit the fields we select from the service_packages to avoid deep nesting
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*, service_packages!current_package_id(package_name, total_servings)')
          .eq('user_id', userId)
          .maybeSingle();

        if (clientError) {
          console.error("Error fetching client profile:", clientError);
          setError("שגיאה בטעינת פרטי הלקוח");
          return null;
        }

        if (!clientData) {
          setError("לא נמצאו פרטי לקוח");
          return null;
        }

        return clientData;
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
