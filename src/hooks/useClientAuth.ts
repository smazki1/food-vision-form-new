
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useClientAuth = () => {
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [authenticating, setAuthenticating] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // In a real app, we would fetch the client_id associated with this user
          // For demo purposes, we could hard-code a client_id for testing
          console.log("User authenticated:", user);
        } else {
          console.log("No authenticated user found");
        }
        setAuthenticating(false);
      } catch (error) {
        console.error("Auth error:", error);
        setAuthenticating(false);
      }
    }
    
    checkAuth();
  }, []);

  return { clientId, authenticating };
};
