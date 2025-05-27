import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "./useClientAuth";
import { useUnifiedAuth } from "./useUnifiedAuth";
import { Submission as ProcessedItem, SubmissionStatus } from "@/api/submissionApi"; // Renaming import for clarity

// No need for SubmissionItem or CustomerSubmissionFromHook if we use ProcessedItem directly

export function useSubmissions() {
  const { clientId: clientAuthClientId, isAuthenticated: clientAuthIsAuthenticated, clientRecordStatus } = useClientAuth();
  const { clientId: unifiedClientId, isAuthenticated: unifiedIsAuthenticated, loading: unifiedLoading, initialized } = useUnifiedAuth();
  
  const effectiveClientId = unifiedClientId || clientAuthClientId;
  
  const queryClient = useQueryClient();
  
  console.log("[useSubmissions] Hook initialized with dual auth sources:", { 
    clientAuthClientId, 
    unifiedClientId, 
    effectiveClientId,
    clientAuthIsAuthenticated, 
    unifiedIsAuthenticated,
    clientRecordStatus,
    unifiedLoading,
    initialized
  });

  const queryEnabled = !!effectiveClientId && unifiedIsAuthenticated && initialized && !unifiedLoading;

  const {
    data: processedItems = [], 
    isLoading: loading,
    error,
    refetch
  } = useQuery<ProcessedItem[], Error>({
    queryKey: ["client-processed-items", effectiveClientId], 
    queryFn: async () => {
      console.log("[useSubmissions] queryFn triggered. Using clientId:", effectiveClientId); 
      if (!effectiveClientId) {
        console.warn("[useSubmissions] queryFn: No clientId, returning empty array.");
        return [];
      }
      
      console.log(`[useSubmissions] queryFn: Fetching submissions for clientId: ${effectiveClientId}`);
      
      // Assuming there's a table/view (e.g., 'processed_items_view' or similar)
      // that contains individual items (dishes, cocktails, drinks) with their submission details.
      // The type 'ProcessedItem' (aliased from 'Submission') should match this structure.
      const { data, error: queryError } = await supabase
        .from("customer_submissions") // TODO: Needs to be the correct table for individual items
        .select(`
          submission_id,
          client_id,
          original_item_id,
          item_type,
          item_name_at_submission,
          submission_status,
          uploaded_at,
          processed_image_urls,
          main_processed_image_url
        `)
        .eq("client_id", effectiveClientId)
        .order("uploaded_at", { ascending: false });
        
      if (queryError) {
        console.error("[useSubmissions] Error fetching processed items:", queryError);
        throw queryError;
      }
      
      console.log("[useSubmissions] queryFn: Successfully fetched data for clientId:", effectiveClientId, "Data count:", data?.length);
      return data as ProcessedItem[]; 
    },
    enabled: queryEnabled // Use the more robust enabled flag
  });

  // clientData for remainingServings can remain the same if still needed independently
  const { data: clientData, isLoading: clientLoading } = useQuery<
    { remaining_servings: number } | null,
    Error
  >({
    queryKey: ["client-remaining-servings", effectiveClientId],
    queryFn: async () => {
      if (!effectiveClientId) return null;
      
      const { data, error: clientQueryError } = await supabase
        .from("clients")
        .select("remaining_servings")
        .eq("client_id", effectiveClientId)
        .single();
      if (clientQueryError) {
        console.error("[useSubmissions] Error fetching client data:", clientQueryError);
        throw clientQueryError;
      }
      return data;
    },
    enabled: queryEnabled,
  });

  const refreshSubmissions = () => {
    queryClient.invalidateQueries({ queryKey: ["client-processed-items", effectiveClientId] });
    queryClient.invalidateQueries({ queryKey: ["client-remaining-servings", effectiveClientId] });
  };

  return {
    submissions: processedItems, // Keep the name 'submissions' for now for compatibility with CustomerHome
    remainingServings: clientData?.remaining_servings || 0,
    loading: loading || clientLoading || unifiedLoading,
    error,
    refreshSubmissions,
    clientId: effectiveClientId, // Expose the clientId used by the hook
  };
}
