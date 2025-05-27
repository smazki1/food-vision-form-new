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
        // Fallback: Try to get active_package_id from the clients table
        console.log("[useSubmissions] No package ID on submission, trying to fetch current_package_id from clients table for client:", effectiveClientId);
        try {
          const { data: clientPackageData, error: clientPackageError } = await supabase
            .from('clients')
            .select('current_package_id')
            .eq('client_id', effectiveClientId)
            .single();

          if (clientPackageError) {
            console.error("[useSubmissions] Error fetching current_package_id from client:", clientPackageError);
            // Do not throw, let it proceed to fetch package details with null if needed
          } else if (clientPackageData?.current_package_id) {
            packageIdToQuery = clientPackageData.current_package_id;
            console.log("[useSubmissions] Found current_package_id from client:", packageIdToQuery);
          }
        } catch (e) {
          console.error("[useSubmissions] Exception fetching current_package_id:", e);
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

      console.log("[useSubmissions] Querying client_packages with package_id:", packageIdToQuery, "for client:", effectiveClientId);
      const { data: clientPackageData, error: clientPackageError } = await supabase
        .from('client_packages')
        .select(`
          package_id,
          start_date,
          end_date,
          is_active,
          total_dishes,
          service_packages (package_name)
        `)
        .eq('client_id', effectiveClientId)
        .eq('package_id', packageIdToQuery) // Ensure we match the client and the specific package instance
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle(); // A client might have multiple instances of the same package_id, take the latest active or most recent.

      if (clientPackageError) {
        console.error('[useSubmissions] Error fetching client package details:', clientPackageError);
        return {
          packageName: 'שגיאה בטעינת חבילה',
          totalSubmissions: null,
          startDate: null,
          endDate: null,
          isActive: false,
        };
      }

      if (clientPackageData && clientPackageData.service_packages) {
        console.log("[useSubmissions] Fetched client package details:", clientPackageData);
        return {
          packageName: (clientPackageData.service_packages as any).package_name,
          totalSubmissions: clientPackageData.total_dishes,
          startDate: clientPackageData.start_date,
          endDate: clientPackageData.end_date,
          isActive: clientPackageData.is_active ?? false,
        };
      }
      return null;
    },
    enabled: queryEnabled && !!effectiveClientId,
  });
  
  const submissionsCount = processedItems?.length || 0;
  const totalAllowedSubmissions = packageDetails?.totalSubmissions;

  let remainingServings: number | undefined = undefined;
  if (packageDetails) { // Check if packageDetails object exists
    const totalAllowed = packageDetails.totalSubmissions; // Use a local const for clarity
    if (typeof totalAllowed === 'number') {
      remainingServings = totalAllowed - submissionsCount;
    } else if (totalAllowed === null) { 
      // If totalAllowed is explicitly null (e.g. package not assigned, or error loading package)
      if (packageDetails.packageName === 'לא משויך לחבילה') {
        // This case implies the client isn't linked to a specific billable package,
        // potentially a free tier or special status.
        remainingServings = Infinity; 
      } else {
        // For other cases where totalSubmissions is null (e.g., 'שגיאה בטעינת חבילה', or unexpected null)
        // It's safer to assume 0 servings as the package state is uncertain or erroneous.
        remainingServings = 0;
      }
    }
    // If totalAllowed is undefined (i.e., the property doesn't exist on packageDetails),
    // remainingServings will remain undefined, signaling data fetch incompleteness.
  } 
  // If packageDetails itself is null or undefined, remainingServings remains undefined.

  const refreshSubmissions = () => {
    console.log("[useSubmissions] Refreshing submissions for clientId:", effectiveClientId);
    queryClient.invalidateQueries({ queryKey: ["client-processed-items", effectiveClientId] });
    queryClient.invalidateQueries({ queryKey: ['clientPackageDetails', effectiveClientId] });
  };

  console.log("[useSubmissions] Hook returning:", {
    submissions: processedItems,
    submissionsLength: submissionsCount,
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
    submissions: processedItems,
    submissionsLength: submissionsCount,
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
