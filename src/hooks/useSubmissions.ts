import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "./useClientAuth";
import { useUnifiedAuth } from "./useUnifiedAuth";
import { Submission as ProcessedItem, SubmissionStatus } from "@/api/submissionApi"; // Renaming import for clarity

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
        
        // The comprehensive select statement from the remote version
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

  // Logic for totalAllowedSubmissions and remainingServings from remote version
  const { data: packageDetails, isLoading: packageDetailsLoading } = useQuery<ClientPackageInfo | null, Error>({
    queryKey: ['clientPackageDetails', effectiveClientId],
    queryFn: async () => {
      if (!effectiveClientId) return null;

      console.log("[useSubmissions] Fetching package details for client:", effectiveClientId);

      // Attempt to get package_id from the most recent submission
      let packageIdToQuery: string | null = null;
      if (processedItems && processedItems.length > 0 && processedItems[0].assigned_package_id_at_submission) {
        packageIdToQuery = processedItems[0].assigned_package_id_at_submission;
        console.log("[useSubmissions] Using package ID from most recent submission:", packageIdToQuery);
      } else {
        // Fallback: Get active_package_id from the clients table
        console.log("[useSubmissions] No package ID on submission, trying to fetch active_package_id from clients table for client:", effectiveClientId);
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('active_package_id')
          .eq('id', effectiveClientId)
          .single();

        if (clientError) {
          console.error('[useSubmissions] Error fetching active_package_id from client:', clientError);
          // Not throwing error here, as it's a fallback, client might not have an active package
        } else if (clientData && clientData.active_package_id) {
          packageIdToQuery = clientData.active_package_id;
          console.log("[useSubmissions] Using active_package_id from client record:", packageIdToQuery);
        } else {
          console.log("[useSubmissions] No active_package_id found for client:", effectiveClientId);
        }
      }

      if (!packageIdToQuery) {
        console.warn("[useSubmissions] No package ID found to query package details for client:", effectiveClientId);
        return {
          packageName: 'לא משויך לחבילה',
          totalSubmissions: null, // Or some other default like Infinity or a very large number
          startDate: null,
          endDate: null,
          isActive: false,
        };
      }

      console.log("[useSubmissions] Querying client_packages with package_id:", packageIdToQuery, "for client:", effectiveClientId);
      const { data: clientPackageData, error: clientPackageError } = await supabase
        .from('client_packages')
        .select(`
          package_id,
          start_date,
          end_date,
          is_active,
          total_submissions_allocated,
          packages (name)
        `)
        .eq('client_id', effectiveClientId)
        .eq('package_id', packageIdToQuery) 
        .single();

      if (clientPackageError) {
        console.error('[useSubmissions] Error fetching client package details:', clientPackageError);
        // If specific client_package link not found, it could be an old package_id or a general one
        // Try fetching from the 'packages' table directly if it's a general package ID
        console.log("[useSubmissions] Trying to fetch general package details for package_id:", packageIdToQuery);
        const { data: generalPackageData, error: generalPackageError } = await supabase
            .from('packages')
            .select('name, number_of_dishes')
            .eq('id', packageIdToQuery)
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
                packageName: generalPackageData.name,
                totalSubmissions: generalPackageData.number_of_dishes,
                startDate: null, // General packages don't have client-specific dates
                endDate: null,
                isActive: true, // Assume active if fetched this way, or add more logic
            };
        }
        return null; // Should not happen if generalPackageData is null and no error
      }

      if (clientPackageData) {
        console.log("[useSubmissions] Fetched client-specific package details:", clientPackageData);
        // Correctly access package name if 'packages' is an array
        let packageNameFromData: string | null = 'שם חבילה לא ידוע';
        if (Array.isArray(clientPackageData.packages) && clientPackageData.packages.length > 0 && clientPackageData.packages[0].name) {
          packageNameFromData = clientPackageData.packages[0].name;
        } else if (clientPackageData.packages && typeof clientPackageData.packages === 'object' && 'name' in clientPackageData.packages && clientPackageData.packages.name) {
          // Fallback if it's a single object (though Supabase usually returns array for relations)
          packageNameFromData = (clientPackageData.packages as { name: string }).name;
        }

        return {
          packageName: packageNameFromData,
          totalSubmissions: clientPackageData.total_submissions_allocated,
          startDate: clientPackageData.start_date,
          endDate: clientPackageData.end_date,
          isActive: clientPackageData.is_active,
        };
      }
      console.warn("[useSubmissions] No client-specific package data found for package_id:", packageIdToQuery, " client:", effectiveClientId);
      return null;
    },
    enabled: queryEnabled && !!effectiveClientId, // Depends on submissions query being enabled and having a client ID
  });
  
  const totalAllowedSubmissions = packageDetails?.totalSubmissions;
  const submissionsLength = processedItems.length;
  const remainingServings = totalAllowedSubmissions !== null && totalAllowedSubmissions !== undefined 
    ? totalAllowedSubmissions - submissionsLength 
    : undefined; // Can be null or undefined if package not found or has no limit

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
    loading: loading || (queryEnabled && packageDetailsLoading), // Consider both loading states if queryEnabled
    clientLoading: unifiedLoading, // Expose the auth loading state
    error,
    refreshSubmissions,
    clientId: effectiveClientId, // Expose effectiveClientId
    isAuthenticated: unifiedIsAuthenticated, // Expose final auth state
    isClientAuthAuthenticated: clientAuthIsAuthenticated, // Expose specific client auth state for debugging or specific use cases
    clientRecordStatus,
    timestamp: Date.now()
  });

  return {
    submissions: processedItems,
    submissionsLength,
    remainingServings,
    totalAllowedSubmissions,
    packageDetails,
    loading: loading || (queryEnabled && packageDetailsLoading), // consider packageDetailsLoading only if the main query is enabled
    clientLoading: unifiedLoading, // for consumers to know if auth is still settling
    error,
    refreshSubmissions,
    refreshPackageDetails: () => queryClient.invalidateQueries({ queryKey: ['clientPackageDetails', effectiveClientId] }),
    clientId: effectiveClientId,
    isAuthenticated: unifiedIsAuthenticated,
  };
}
