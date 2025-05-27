
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "./useClientAuth";
import { Submission as ProcessedItem, SubmissionStatus } from "@/api/submissionApi";

export function useSubmissions() {
  const { clientId, isAuthenticated } = useClientAuth();
  const queryClient = useQueryClient();
  
  console.log("[useSubmissions] Hook called with:", {
    clientId,
    isAuthenticated,
    timestamp: Date.now()
  });
  
  const {
    data: processedItems = [], 
    isLoading: loading,
    error,
    refetch
  } = useQuery<ProcessedItem[], Error>({
    queryKey: ["client-processed-items", clientId],
    queryFn: async () => {
      console.log("[useSubmissions] Query function called with clientId:", clientId);
      
      if (!clientId) {
        console.log("[useSubmissions] No clientId available, returning empty array");
        return [];
      }
      
      if (!isAuthenticated) {
        console.log("[useSubmissions] User not authenticated, returning empty array");
        return [];
      }
      
      try {
        // First, verify we can access the client record
        const { data: clientCheck, error: clientError } = await supabase
          .from("clients")
          .select("client_id, restaurant_name")
          .eq("client_id", clientId)
          .single();
          
        console.log("[useSubmissions] Client check result:", { clientCheck, clientError });
        
        if (clientError) {
          console.error("[useSubmissions] Client access error:", clientError);
          throw new Error(`Cannot access client record: ${clientError.message}`);
        }
        
        // Check how many submissions exist in total for debugging
        const { count: totalSubmissions, error: countError } = await supabase
          .from("customer_submissions")
          .select("*", { count: 'exact', head: true })
          .eq("client_id", clientId);
          
        console.log("[useSubmissions] Total submissions count for client:", { totalSubmissions, countError });
        
        // Now fetch submissions with ALL required fields
        const { data, error: queryError } = await supabase
          .from("customer_submissions")
          .select(`
            submission_id,
            client_id,
            original_item_id,
            item_type,
            item_name_at_submission,
            assigned_package_id_at_submission,
            submission_status,
            uploaded_at,
            processed_image_urls,
            main_processed_image_url,
            edit_history,
            edit_count,
            final_approval_timestamp,
            internal_team_notes,
            assigned_editor_id,
            target_completion_date,
            priority,
            created_at
          `)
          .eq("client_id", clientId)
          .order("uploaded_at", { ascending: false });
          
        console.log("[useSubmissions] Submissions query result:", {
          data,
          error: queryError,
          dataLength: data?.length,
          clientId,
          firstSubmission: data?.[0]
        });
        
        if (queryError) {
          console.error("[useSubmissions] Error fetching processed items:", queryError);
          throw new Error(`Failed to fetch submissions: ${queryError.message}`);
        }
        
        // Additional debugging: check if data exists but is being filtered out
        if (!data || data.length === 0) {
          console.warn("[useSubmissions] No submissions found. Checking raw data...");
          
          // Try a broader query to see what's in the table
          const { data: allSubmissions, error: allError } = await supabase
            .from("customer_submissions")
            .select("client_id, item_name_at_submission")
            .limit(5);
            
          console.log("[useSubmissions] Sample of all submissions in table:", { allSubmissions, allError });
        }
        
        const submissions = data as ProcessedItem[];
        console.log("[useSubmissions] Successfully fetched submissions:", submissions);
        return submissions;
        
      } catch (err) {
        console.error("[useSubmissions] Exception in query function:", err);
        throw err;
      }
    },
    enabled: !!clientId && isAuthenticated,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch remaining servings separately
  const { data: clientData, isLoading: clientLoading } = useQuery<
    { remaining_servings: number } | null,
    Error
  >({
    queryKey: ["client-remaining-servings", clientId],
    queryFn: async () => {
      if (!clientId || !isAuthenticated) return null;
      
      const { data, error: clientQueryError } = await supabase
        .from("clients")
        .select("remaining_servings")
        .eq("client_id", clientId)
        .single();
        
      if (clientQueryError) {
        console.error("[useSubmissions] Error fetching client data:", clientQueryError);
        throw clientQueryError;
      }
      
      return data;
    },
    enabled: !!clientId && isAuthenticated,
  });

  const refreshSubmissions = () => {
    console.log("[useSubmissions] Refreshing submissions for clientId:", clientId);
    queryClient.invalidateQueries({ queryKey: ["client-processed-items", clientId] });
    queryClient.invalidateQueries({ queryKey: ["client-remaining-servings", clientId] });
  };

  return {
    submissions: processedItems,
    remainingServings: clientData?.remaining_servings || 0,
    loading: loading || clientLoading,
    error,
    refreshSubmissions,
  };
}
