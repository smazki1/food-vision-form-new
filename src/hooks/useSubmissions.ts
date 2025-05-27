
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "./useClientAuth";
import { useUnifiedAuth } from "./useUnifiedAuth";
import { Submission as ProcessedItem, SubmissionStatus } from "@/api/submissionApi";

export interface ClientPackageInfo {
  packageName: string | null;
  totalSubmissions: number | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
}

export function useSubmissions() {
  const { clientId: clientAuthClientId, isAuthenticated: clientAuthIsAuthenticated, clientRecordStatus } = useClientAuth();
  const { user, clientId: unifiedClientId, isAuthenticated: unifiedIsAuthenticated, loading: unifiedLoading, initialized } = useUnifiedAuth();
  
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
    initialized,
    userEmail: user?.email,
    timestamp: Date.now()
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
      console.log("[useSubmissions] queryFn triggered. Using effectiveClientId:", effectiveClientId, "Is authenticated:", unifiedIsAuthenticated);
      if (!effectiveClientId) {
        console.warn("[useSubmissions] queryFn: No effectiveClientId, returning empty array.");
        return [];
      }
      if (!unifiedIsAuthenticated) {
        console.warn("[useSubmissions] queryFn: User not unifiedAuthenticated, returning empty array.");
        return [];
      }
      
      try {
        console.log(`[useSubmissions] queryFn: Fetching submissions for effectiveClientId: ${effectiveClientId}`);
        
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
          .eq("client_id", effectiveClientId)
          .order("uploaded_at", { ascending: false });
          
        if (queryError) {
          console.error("[useSubmissions] Error fetching processed items:", queryError);
          throw new Error(`Failed to fetch submissions: ${queryError.message}`);
        }
        
        const submissions = data as ProcessedItem[];
        console.log("[useSubmissions] queryFn: Successfully fetched data for effectiveClientId:", effectiveClientId, "Data count:", submissions?.length);
        return submissions;
        
      } catch (err) {
        console.error("[useSubmissions] Exception in query function:", err);
        throw err;
      }
    },
    enabled: queryEnabled
  });

  const { data: packageDetails, isLoading: packageDetailsLoading } = useQuery<ClientPackageInfo | null, Error>({
    queryKey: ['clientPackageDetails', effectiveClientId],
    queryFn: async () => {
      if (!effectiveClientId) return null;

      console.log("[useSubmissions] Fetching package details for client:", effectiveClientId);

      let packageIdToQuery: string | null = null;
      if (processedItems && processedItems.length > 0 && processedItems[0].assigned_package_id_at_submission) {
        packageIdToQuery = processedItems[0].assigned_package_id_at_submission;
        console.log("[useSubmissions] Using package ID from most recent submission:", packageIdToQuery);
      } else {
        console.log("[useSubmissions] No package ID on submission, trying to fetch current_package_id from clients table for client:", effectiveClientId);
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('current_package_id')
          .eq('client_id', effectiveClientId)
          .single();

        if (clientError) {
          console.error('[useSubmissions] Error fetching current_package_id from client:', clientError);
        } else if (clientData && clientData.current_package_id) {
          packageIdToQuery = clientData.current_package_id;
          console.log("[useSubmissions] Using current_package_id from client record:", packageIdToQuery);
        } else {
          console.log("[useSubmissions] No current_package_id found for client:", effectiveClientId);
        }
      }

      if (!packageIdToQuery) {
        console.warn("[useSubmissions] No package ID found to query package details for client:", effectiveClientId);
        return {
          packageName: 'לא משויך לחבילה',
          totalSubmissions: null,
          startDate: null,
          endDate: null,
          isActive: false,
        };
      }

      console.log("[useSubmissions] Querying service_packages with package_id:", packageIdToQuery);
      const { data: generalPackageData, error: generalPackageError } = await supabase
          .from('service_packages')
          .select('package_name, total_servings')
          .eq('package_id', packageIdToQuery)
          .single();
      
      if (generalPackageError) {
          console.error('[useSubmissions] Error fetching general package details:', generalPackageError);
          return {
              packageName: 'שגיאה בטעינת חבילה',
              totalSubmissions: null,
              startDate: null,
              endDate: null,
              isActive: false,
          };
      }
      if (generalPackageData) {
          console.log("[useSubmissions] Fetched general package details:", generalPackageData);
          return {
              packageName: generalPackageData.package_name,
              totalSubmissions: generalPackageData.total_servings,
              startDate: null,
              endDate: null,
              isActive: true,
          };
      }
      return null;
    },
    enabled: queryEnabled && !!effectiveClientId,
  });
  
  // Calculate remaining servings safely
  const totalAllowedSubmissions = packageDetails?.totalSubmissions;
  const submissionsLength = processedItems?.length || 0;
  const remainingServings = (totalAllowedSubmissions !== null && totalAllowedSubmissions !== undefined) 
    ? Math.max(0, totalAllowedSubmissions - submissionsLength)
    : undefined;

  const refreshSubmissions = () => {
    console.log("[useSubmissions] Refreshing submissions for clientId:", effectiveClientId);
    queryClient.invalidateQueries({ queryKey: ["client-processed-items", effectiveClientId] });
    queryClient.invalidateQueries({ queryKey: ['clientPackageDetails', effectiveClientId] });
  };

  console.log("[useSubmissions] Hook returning:", {
    submissions: processedItems,
    submissionsLength,
    remainingServings,
    totalAllowedSubmissions,
    packageDetails,
    loading: loading || (queryEnabled && packageDetailsLoading),
    clientLoading: unifiedLoading,
    error,
    refreshSubmissions,
    clientId: effectiveClientId,
    isAuthenticated: unifiedIsAuthenticated,
    timestamp: Date.now()
  });

  return {
    submissions: processedItems || [],
    submissionsLength,
    remainingServings,
    totalAllowedSubmissions,
    packageDetails,
    loading: loading || (queryEnabled && packageDetailsLoading),
    clientLoading: unifiedLoading,
    error,
    refreshSubmissions,
    refreshPackageDetails: () => queryClient.invalidateQueries({ queryKey: ['clientPackageDetails', effectiveClientId] }),
    clientId: effectiveClientId,
    isAuthenticated: unifiedIsAuthenticated,
  };
}
