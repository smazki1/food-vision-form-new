
import { useState, useEffect } from "react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const useClientAuth = () => {
  const { user, loading } = useCustomerAuth();
  const [clientId, setClientId] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(true);

  const { data: clientData } = useQuery({
    queryKey: ["clientId", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      console.log("[useClientAuth] Looking up client ID for user:", user.id);
      
      const { data, error } = await supabase
        .from("clients")
        .select("client_id")
        .eq("user_auth_id", user.id)
        .maybeSingle();
        
      if (error) {
        console.error("[useClientAuth] Error fetching client ID:", error);
        return null;
      }
      
      console.log("[useClientAuth] Client data found:", data);
      return data?.client_id || null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (user) {
      console.log("[useClientAuth] User authenticated:", user.id);
    } else if (!loading) {
      console.log("[useClientAuth] No authenticated user found");
    }
    
    if (!loading) {
      if (clientData) {
        console.log("[useClientAuth] Setting client ID:", clientData);
        setClientId(clientData);
      }
      setAuthenticating(false);
    }
  }, [user, loading, clientData]);

  return { clientId, authenticating };
};
