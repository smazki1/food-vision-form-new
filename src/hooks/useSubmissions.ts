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
      if (!effectiveClientId || !unifiedIsAuthenticated) {
        console.warn("[useSubmissions] queryFn: Conditions not met, returning empty array.");
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
        try {
          const { data: clientPackageData, error: clientPackageError } = await supabase
            .from('clients')
            .select('current_package_id')
            .eq('client_id', effectiveClientId)
            .single();

          if (clientPackageError) {
            console.error("[useSubmissions] Error fetching current_package_id from client:", clientPackageError);
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
        .eq('package_id', packageIdToQuery)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (clientPackageError) {
        console.error('[useSubmissions] Error fetching client_packages details:', clientPackageError);
        // Fallback: Try fetching from the 'service_packages' table directly
        console.log("[useSubmissions] Fallback: Trying to fetch general package details for package_id:", packageIdToQuery);
        const { data: generalPackageData, error: generalPackageError } = await supabase
            .from('service_packages')
            .select('package_name, total_servings')
            .eq('package_id', packageIdToQuery)
            .single();
        
        if (generalPackageError) {
            console.error('[useSubmissions] Error fetching general package details after fallback:', generalPackageError);
            return {
                packageName: 'שגיאה בטעינת חבילה',
                totalSubmissions: null,
                startDate: null,
                endDate: null,
                isActive: false,
            };
        }
        if (generalPackageData) {
            console.log("[useSubmissions] Fallback: Fetched general package details:", generalPackageData);
            return {
                packageName: generalPackageData.package_name,
                totalSubmissions: generalPackageData.total_servings,
                startDate: null, 
                endDate: null,
                isActive: true, 
            };
        }
        console.warn("[useSubmissions] Fallback: No general package found, returning error state.");
        return {
            packageName: 'פרטי חבילה לא זמינים', // More specific error
            totalSubmissions: null,
            startDate: null,
            endDate: null,
            isActive: false,
        }; 
      }

      if (clientPackageData) {
        console.log("[useSubmissions] Fetched client-specific package details:", clientPackageData);
        let packageNameFromData: string | null = 'שם חבילה לא ידוע';
        const sp = clientPackageData.service_packages;

        if (Array.isArray(sp) && sp.length > 0 && sp[0].package_name) {
          packageNameFromData = sp[0].package_name;
        } else if (sp && typeof sp === 'object' && 'package_name' in sp && (sp as { package_name: string }).package_name) {
          packageNameFromData = (sp as { package_name: string }).package_name;
        } else if (typeof sp === 'string') { // If service_packages is just a string (name)
            packageNameFromData = sp;
        }

        return {
          packageName: packageNameFromData,
          totalSubmissions: clientPackageData.total_dishes,
          startDate: clientPackageData.start_date,
          endDate: clientPackageData.end_date,
          isActive: clientPackageData.is_active ?? false, // Ensure isActive has a boolean default
        };
      }
      console.warn("[useSubmissions] No clientPackageData found after query, returning null for package details.");
      return null;
    },
    enabled: queryEnabled && !!effectiveClientId,
  });
  
  const submissionsCount = processedItems?.length || 0;
  const totalAllowedSubmissions = packageDetails?.totalSubmissions;

  let remainingServings: number | undefined = undefined;
  if (packageDetails) {
    const totalAllowed = packageDetails.totalSubmissions;
    if (typeof totalAllowed === 'number') {
      remainingServings = totalAllowed - submissionsCount;
    } else if (totalAllowed === null) { 
      if (packageDetails.packageName === 'לא משויך לחבילה' || packageDetails.packageName === 'שגיאה בטעינת חבילה' || packageDetails.packageName === 'פרטי חבילה לא זמינים') {
        remainingServings = undefined; 
      } else {
        remainingServings = Infinity; 
      }
    }
  } else {
    remainingServings = undefined;
  }

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
    isReady: queryEnabled && !loading && !packageDetailsLoading
  };
}
