
import { useState, useEffect } from "react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const useClientAuth = () => {
  const { user, loading: authLoading } = useCustomerAuth();
  const [clientId, setClientId] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(true);

  const { data: clientData, isLoading: clientDataLoading } = useQuery({
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
    // Only update authenticating state when both auth and client data loading are complete
    if (!authLoading && (!user || !clientDataLoading)) {
      console.log("[useClientAuth] Authentication check complete:", { 
        user: !!user, 
        clientId: clientData || null,
        authLoading,
        clientDataLoading 
      });
      
      if (clientData) {
        console.log("[useClientAuth] Setting client ID:", clientData);
        setClientId(clientData);
      }
      
      setAuthenticating(false);
    }
  }, [user, authLoading, clientData, clientDataLoading]);

  return { clientId, authenticating };
};
