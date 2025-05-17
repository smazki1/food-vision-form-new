
import { supabase } from "@/integrations/supabase/client";
import { Submission } from "@/api/submissionApi";
import { toast } from "sonner";

/**
 * Hook for managing internal notes
 */
export function useInternalNotes(
  submission: Submission | null,
  setSubmission: React.Dispatch<React.SetStateAction<Submission | null>>
) {
  const addInternalNote = async (note: string) => {
    if (!submission?.submission_id || !note.trim()) return false;
    
    try {
      const currentNotes = submission.internal_team_notes || '';
      const timestamp = new Date().toISOString();
      // Get current user's name
      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.email || 'Unknown User';
      
      const newNote = `[${timestamp}] ${userName}: ${note}\n\n`;
      const updatedNotes = newNote + currentNotes;
      
      const { error } = await supabase
        .from("customer_submissions")
        .update({ internal_team_notes: updatedNotes })
        .eq("submission_id", submission.submission_id);
        
      if (error) throw error;
      
      // Update local state
      setSubmission({
        ...submission,
        internal_team_notes: updatedNotes
      });
      
      toast.success("ההערה הפנימית נשמרה בהצלחה");
      return true;
    } catch (err) {
      console.error("Error adding internal note:", err);
      toast.error("שגיאה בהוספת הערה פנימית");
      return false;
    }
  };

  return { addInternalNote };
}
