
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AssignSubmissionParams {
  submissionId: string;
  editorId: string;
  isTransfer?: boolean;
}

export function useAssignSubmission() {
  const queryClient = useQueryClient();
  
  const { mutateAsync: assignEditor, isPending: isAssigning } = useMutation({
    mutationFn: async ({ submissionId, editorId, isTransfer = false }: AssignSubmissionParams) => {
      const now = new Date().toISOString();
      
      // Set submission status based on whether this is a new assignment or transfer
      const newStatus = isTransfer 
        ? "הועברה לעורך אחר" // Status for transferred tasks
        : "הוקצתה לעורך"; // Status for newly assigned tasks
      
      const { data, error } = await supabase
        .from("customer_submissions")
        .update({
          assigned_editor_id: editorId,
          submission_status: newStatus,
          internal_team_notes: isTransfer 
            ? `הועבר לעורך בתאריך ${now}` 
            : `הוקצה לעורך בתאריך ${now}`
        })
        .eq("submission_id", submissionId)
        .select();
        
      if (error) {
        console.error("Error assigning editor:", error);
        toast.error("שגיאה בהקצאת עורך");
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      toast.success("המשימה הוקצתה בהצלחה");
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["unassigned-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["all-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["editor-submissions"] });
    },
    onError: (error) => {
      console.error("Assignment error:", error);
      toast.error("שגיאה בהקצאת משימה");
    }
  });
  
  return {
    assignEditor,
    isAssigning,
  };
}
