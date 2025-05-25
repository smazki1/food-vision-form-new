import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "./useClientAuth";
import { Submission as ProcessedItem, SubmissionStatus } from "@/api/submissionApi"; // Renaming import for clarity

// No need for SubmissionItem or CustomerSubmissionFromHook if we use ProcessedItem directly

export function useSubmissions() {
  const { clientId } = useClientAuth();
  const queryClient = useQueryClient();
  
  const {
    data: processedItems = [], 
    isLoading: loading,
    error,
    refetch
  } = useQuery<ProcessedItem[], Error>({
    queryKey: ["client-processed-items", clientId], // Changed queryKey
    queryFn: async () => {
      if (!clientId) {
        return [];
      }
      
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
        .eq("client_id", clientId)
        .order("uploaded_at", { ascending: false });
        
      if (queryError) {
        console.error("[useSubmissions] Error fetching processed items:", queryError);
        throw queryError;
      }
      
      return data as ProcessedItem[]; 
    },
    enabled: !!clientId
  });

  // clientData for remainingServings can remain the same if still needed independently
  const { data: clientData, isLoading: clientLoading } = useQuery<
    { remaining_servings: number } | null,
    Error
  >({
    queryKey: ["client-remaining-servings", clientId],
    queryFn: async () => {
      if (!clientId) return null;
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
    enabled: !!clientId,
  });

  const refreshSubmissions = () => {
    queryClient.invalidateQueries({ queryKey: ["client-processed-items", clientId] });
    queryClient.invalidateQueries({ queryKey: ["client-remaining-servings", clientId] });
  };

  return {
    submissions: processedItems, // Keep the name 'submissions' for now for compatibility with CustomerHome
    remainingServings: clientData?.remaining_servings || 0,
    loading: loading || clientLoading,
    error,
    refreshSubmissions,
  };
}
