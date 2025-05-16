
import { supabase } from "@/integrations/supabase/client";
import { Submission } from "@/api/submissionApi";

/**
 * Hook for handling edit requests
 */
export function useEditRequest(
  submission: Submission | null,
  setSubmission: React.Dispatch<React.SetStateAction<Submission | null>>
) {
  const requestEdit = async (editNote: string) => {
    if (!submission?.submission_id) return false;
    
    try {
      // Create edit history entry
      const newEditHistory = submission.edit_history || [];
      newEditHistory.push({
        timestamp: new Date().toISOString(),
        client_request: editNote
      });
      
      const { error } = await supabase
        .from("customer_submissions")
        .update({ 
          submission_status: "הערות התקבלו",
          edit_history: newEditHistory,
          edit_count: (submission.edit_count || 0) + 1
        })
        .eq("submission_id", submission.submission_id);
        
      if (error) throw error;
      
      // Update local state
      setSubmission({
        ...submission, 
        submission_status: "הערות התקבלו",
        edit_history: newEditHistory,
        edit_count: (submission.edit_count || 0) + 1
      });
      
      return true;
    } catch (err) {
      console.error("Error requesting edit:", err);
      return false;
    }
  };

  const respondToClientFeedback = async (response: string, newImageUrls: string[]) => {
    if (!submission?.submission_id) return false;
    
    try {
      const newEditHistory = submission.edit_history || [];
      const { data: { user } } = await supabase.auth.getUser();
      
      newEditHistory.push({
        timestamp: new Date().toISOString(),
        editor_id: user?.id,
        editor_response: response,
        new_version_urls: newImageUrls
      });
      
      const { error } = await supabase
        .from("customer_submissions")
        .update({ 
          edit_history: newEditHistory,
          submission_status: "מוכנה להצגה" 
        })
        .eq("submission_id", submission.submission_id);
        
      if (error) throw error;
      
      // Update local state
      setSubmission({
        ...submission,
        edit_history: newEditHistory,
        submission_status: "מוכנה להצגה"
      });
      
      return true;
    } catch (err) {
      console.error("Error responding to client feedback:", err);
      return false;
    }
  };

  return { requestEdit, respondToClientFeedback };
}
