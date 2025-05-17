
import { supabase } from "@/integrations/supabase/client";
import { SubmissionStatus } from "@/api/submissionApi";
import { Submission } from "@/api/submissionApi";

/**
 * Hook for updating submission status
 */
export function useSubmissionStatusUpdate(
  submission: Submission | null,
  setSubmission: React.Dispatch<React.SetStateAction<Submission | null>>
) {
  const updateSubmissionStatus = async (status: SubmissionStatus) => {
    if (!submission?.submission_id) return false;
    
    try {
      const { error } = await supabase
        .from("customer_submissions")
        .update({ submission_status: status })
        .eq("submission_id", submission.submission_id);
        
      if (error) throw error;
      
      // Update local state
      if (submission) {
        setSubmission({...submission, submission_status: status});
      }
      
      return true;
    } catch (err) {
      console.error("Error updating submission status:", err);
      return false;
    }
  };

  return { updateSubmissionStatus };
}
