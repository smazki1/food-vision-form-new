
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";

export function useClientProfile() {
  const [clientProfile, setClientProfile] = useState<Client | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchClientProfile() {
      try {
        setLoading(true);
        
        // First get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }
        
        // Then fetch client profile linked to this user
        const { data, error } = await supabase
          .from("clients")
          .select(`
            *,
            service_packages(package_name, total_servings, max_edits_per_serving)
          `)
          .eq("user_auth_id", user.id)
          .single();

        if (error) throw error;
        
        setClientProfile(data as Client);
      } catch (err) {
        console.error("Error fetching client profile:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch client profile"));
      } finally {
        setLoading(false);
      }
    }

    fetchClientProfile();
  }, []);

  const updateNotificationPreferences = async (
    emailNotifications: boolean, 
    appNotifications: boolean
  ) => {
    if (!clientProfile) return false;
    
    try {
      const { error } = await supabase
        .from("clients")
        .update({ 
          email_notifications: emailNotifications,
          app_notifications: appNotifications
        })
        .eq("client_id", clientProfile.client_id);
        
      if (error) throw error;
      
      // Update local state
      setClientProfile({
        ...clientProfile, 
        email_notifications: emailNotifications,
        app_notifications: appNotifications
      } as Client);
      
      return true;
    } catch (err) {
      console.error("Error updating notification preferences:", err);
      return false;
    }
  };

  return {
    clientProfile,
    loading,
    error,
    updateNotificationPreferences
  };
}
