
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SubmissionStatus } from "@/api/submissionApi";
import { toast } from "sonner";

interface StatusUpdateParams {
  submissionId: string;
  status: SubmissionStatus;
  note?: string;
}

/**
 * Hook for updating and tracking submission status changes
 * This supports performance reporting by logging status changes with timestamps
 */
export function useSubmissionStatusTracking() {
  const queryClient = useQueryClient();
  
  const statusUpdate = useMutation({
    mutationFn: async ({ submissionId, status, note }: StatusUpdateParams) => {
      // Get the current timestamp
      const now = new Date().toISOString();
      
      // Create a status change log entry in the status history
      let statusHistory;
      
      // First fetch the current submission to get existing history
      const { data: currentSubmission } = await supabase
        .from("customer_submissions")
        .select("submission_status, edit_history")
        .eq("submission_id", submissionId)
        .single();
      
      // If we have existing history, append to it, otherwise create new
      if (currentSubmission?.edit_history) {
        statusHistory = {
          ...currentSubmission.edit_history,
          status_changes: [
            ...(currentSubmission.edit_history.status_changes || []),
            {
              from_status: currentSubmission.submission_status,
              to_status: status,
              changed_at: now,
              note: note || ""
            }
          ]
        };
      } else {
        statusHistory = {
          status_changes: [
            {
              from_status: currentSubmission?.submission_status || "unknown",
              to_status: status,
              changed_at: now,
              note: note || ""
            }
          ]
        };
      }
      
      // Update the submission status and history
      const { data, error } = await supabase
        .from("customer_submissions")
        .update({ 
          submission_status: status,
          edit_history: statusHistory,
          [`status_${status.replace(/\s+/g, "_")}_at`]: now // Store timestamp of specific status
        })
        .eq("submission_id", submissionId)
        .select()
        .single();
        
      if (error) throw error;
      
      // Create a notification for the assigned editor if status requires attention
      if (data.assigned_editor_id && 
         (status === "הערות התקבלו" || 
          status === "ממתינה לעיבוד")) {
        await createEditorNotification(data);
      }
      
      return data;
    },
    onSuccess: (data) => {
      toast.success(`סטטוס העבודה עודכן ל: ${data.submission_status}`);
      queryClient.invalidateQueries({ queryKey: ["submission", data.submission_id] });
      queryClient.invalidateQueries({ queryKey: ["editor-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["all-submissions"] });
    },
    onError: (error) => {
      toast.error(`שגיאה בעדכון סטטוס: ${error instanceof Error ? error.message : "שגיאה לא ידועה"}`);
    }
  });
  
  // Helper function to create editor notifications
  async function createEditorNotification(submission: any) {
    const message = submission.submission_status === "הערות התקבלו" 
      ? `התקבלו הערות לקוח על ${submission.item_name_at_submission}`
      : `משימה חדשה הוקצתה אליך: ${submission.item_name_at_submission}`;
      
    const link = `/editor/submissions/${submission.submission_id}`;
    
    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id: submission.assigned_editor_id,
        message,
        link,
        related_entity_id: submission.submission_id,
        related_entity_type: "submission",
        read_status: false
      });
      
    if (error) {
      console.error("Error creating notification:", error);
    }
  }
  
  return {
    updateStatus: statusUpdate,
    isUpdating: statusUpdate.isPending
  };
}
