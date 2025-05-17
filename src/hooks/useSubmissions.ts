
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Submission } from "@/api/submissionApi";
import { useClientAuth } from "./useClientAuth";

export function useSubmissions() {
  const { clientId } = useClientAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [remainingServings, setRemainingServings] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!clientId) {
        console.log("[useSubmissions] No clientId available yet");
        setLoading(false);
        return;
      }

      try {
        console.log("[useSubmissions] Fetching data for clientId:", clientId);
        setLoading(true);
        
        // Fetch client data to get remaining servings
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("remaining_servings")
          .eq("client_id", clientId)
          .single();
          
        if (clientError) {
          console.error("[useSubmissions] Error fetching client data:", clientError);
          throw clientError;
        }
        
        setRemainingServings(clientData?.remaining_servings || 0);
        
        // Fetch submissions
        const { data: submissionsData, error: submissionsError } = await supabase
          .from("customer_submissions")
          .select(`
            *,
            clients(restaurant_name)
          `)
          .eq("client_id", clientId)
          .order("uploaded_at", { ascending: false });
          
        if (submissionsError) {
          console.error("[useSubmissions] Error fetching submissions:", submissionsError);
          throw submissionsError;
        }
        
        console.log("[useSubmissions] Fetched submissions:", submissionsData?.length || 0);
        setSubmissions(submissionsData as Submission[]);
        setError(null);
      } catch (err) {
        console.error("[useSubmissions] Error fetching submissions data:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch submissions data"));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [clientId]);

  const refreshSubmissions = async () => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("customer_submissions")
        .select(`
          *,
          clients(restaurant_name)
        `)
        .eq("client_id", clientId)
        .order("uploaded_at", { ascending: false });
        
      if (submissionsError) throw submissionsError;
      
      setSubmissions(submissionsData as Submission[]);
      
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("remaining_servings")
        .eq("client_id", clientId)
        .single();
        
      if (clientError) throw clientError;
      
      setRemainingServings(clientData?.remaining_servings || 0);
    } catch (err) {
      console.error("[useSubmissions] Error refreshing submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    submissions,
    remainingServings,
    loading,
    error,
    refreshSubmissions
  };
}
