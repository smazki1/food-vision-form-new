
import { supabase } from "@/integrations/supabase/client";
import { Submission } from "@/api/submissionApi";

/**
 * Hook for fetching package details
 */
export function usePackageDetails() {
  const getMaxEditsAllowed = async (submission?: Submission | null): Promise<number> => {
    if (!submission?.assigned_package_id_at_submission) return 1;
    
    try {
      const { data, error } = await supabase
        .from("service_packages")
        .select("max_edits_per_serving")
        .eq("package_id", submission.assigned_package_id_at_submission)
        .single();
        
      if (error) throw error;
      
      return data.max_edits_per_serving || 1;
    } catch (err) {
      console.error("Error fetching max edits:", err);
      return 1;  // Default to 1 if error
    }
  };

  return { getMaxEditsAllowed };
}
