
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "./useClientAuth";
import { useUnifiedAuth } from "./useUnifiedAuth";
import { Submission as ProcessedItem, SubmissionStatus } from "@/api/submissionApi";

export function useSubmissions() {
  const { clientId: clientAuthId, isAuthenticated: clientAuthAuthenticated } = useClientAuth();
  const { clientId: unifiedClientId, isAuthenticated: unifiedAuthenticated } = useUnifiedAuth();
  const queryClient = useQueryClient();
  
  // Use clientId from either source - prefer clientAuth but fallback to unified
  const clientId = clientAuthId || unifiedClientId;
  const isAuthenticated = clientAuthAuthenticated || unifiedAuthenticated;
  
  console.log("[useSubmissions] Hook called with:", {
    clientAuthId,
    unifiedClientId,
    finalClientId: clientId,
    clientAuthAuthenticated,
    unifiedAuthenticated,
    finalAuthenticated: isAuthenticated,
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
        console.log("[useSubmissions] Starting database queries...");
        
        // Simple test query first
        console.log("[useSubmissions] Testing basic database connection...");
        const { data: testData, error: testError } = await supabase
          .from("customer_submissions")
          .select("submission_id")
          .limit(1);
          
        console.log("[useSubmissions] Basic connection test result:", { testData, testError });
        
        // Check if any submissions exist at all in the database
        const { count: totalCount, error: countError } = await supabase
          .from("customer_submissions")
          .select("*", { count: 'exact', head: true });
          
        console.log("[useSubmissions] Total submissions in database:", { totalCount, countError });
        
        // Check submissions for this specific client
        const { count: clientCount, error: clientCountError } = await supabase
          .from("customer_submissions")
          .select("*", { count: 'exact', head: true })
          .eq("client_id", clientId);
          
        console.log("[useSubmissions] Submissions for client:", { clientId, clientCount, clientCountError });
        
        // Try to fetch with minimal fields first
        console.log("[useSubmissions] Fetching minimal submission data...");
        const { data: minimalData, error: minimalError } = await supabase
          .from("customer_submissions")
          .select("submission_id, client_id, item_name_at_submission")
          .eq("client_id", clientId)
          .limit(5);
          
        console.log("[useSubmissions] Minimal data result:", { minimalData, minimalError });
        
        // Now try the full query
        console.log("[useSubmissions] Fetching full submission data...");
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
          
        console.log("[useSubmissions] Full query result:", {
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
        
        const submissions = data as ProcessedItem[];
        console.log("[useSubmissions] Successfully fetched submissions:", submissions);
        return submissions;
        
      } catch (err) {
        console.error("[useSubmissions] Exception in query function:", err);
        throw err;
      }
    },
    enabled: !!clientId && isAuthenticated,
    retry: 1, // Reduce retries to see errors faster
    retryDelay: 1000, // Shorter delay
    staleTime: 0, // Force fresh data
    gcTime: 0, // Don't cache for debugging
  });

  // Fetch remaining servings separately
  const { data: clientData, isLoading: clientLoading } = useQuery<
    { remaining_servings: number } | null,
    Error
  >({
    queryKey: ["client-remaining-servings", clientId],
    queryFn: async () => {
      if (!clientId || !isAuthenticated) return null;
      
      console.log("[useSubmissions] Fetching client remaining servings for:", clientId);
      
      const { data, error: clientQueryError } = await supabase
        .from("clients")
        .select("remaining_servings")
        .eq("client_id", clientId)
        .single();
        
      console.log("[useSubmissions] Client servings result:", { data, error: clientQueryError });
        
      if (clientQueryError) {
        console.error("[useSubmissions] Error fetching client data:", clientQueryError);
        throw clientQueryError;
      }
      
      return data;
    },
    enabled: !!clientId && isAuthenticated,
    retry: 1,
    staleTime: 0,
    gcTime: 0,
  });

  const refreshSubmissions = () => {
    console.log("[useSubmissions] Refreshing submissions for clientId:", clientId);
    queryClient.invalidateQueries({ queryKey: ["client-processed-items", clientId] });
    queryClient.invalidateQueries({ queryKey: ["client-remaining-servings", clientId] });
  };

  console.log("[useSubmissions] Hook returning:", {
    submissions: processedItems,
    submissionsLength: processedItems?.length,
    remainingServings: clientData?.remaining_servings || 0,
    loading,
    clientLoading,
    error: error?.message,
    clientId
  });

  return {
    submissions: processedItems,
    remainingServings: clientData?.remaining_servings || 0,
    loading: loading || clientLoading,
    error,
    refreshSubmissions,
  };
}
