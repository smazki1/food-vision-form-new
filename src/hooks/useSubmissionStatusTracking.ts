import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SubmissionStatus } from "@/api/submissionApi";
import { toast } from "sonner";
import { updateClientServings } from "@/api/clientApi";

interface StatusUpdateParams {
  submissionId: string;
  status: SubmissionStatus;
  note?: string;
}

interface StatusChange {
  from_status: string;
  to_status: string;
  changed_at: string;
  note: string;
}

interface EditHistory {
  status_changes?: StatusChange[];
}

/**
 * Helper function to check if status requires serving deduction
 */
function isServingDeductionStatus(status: string): boolean {
  return status === 'מוכנה להצגה' || status === 'הושלמה ואושרה';
}

/**
 * Helper function to automatically deduct servings when submission reaches completion stages
 */
async function handleAutomaticServingDeduction(submissionId: string, submissionData: any) {
  try {
    // Get client_id from the submission data
    const clientId = submissionData.client_id;
    if (!clientId) {
      console.warn("Cannot deduct servings: submission has no client_id");
      return;
    }

    // Get current client servings
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("remaining_servings, restaurant_name")
      .eq("client_id", clientId)
      .single();

    if (clientError) {
      console.error("Error fetching client for serving deduction:", clientError);
      return;
    }

    const currentServings = client.remaining_servings || 0;
    if (currentServings <= 0) {
      console.warn("Cannot deduct servings: client has no remaining servings");
      return;
    }

    // Deduct one serving
    const newServingsCount = currentServings - 1;
    const notes = `ניכוי אוטומטי בעקבות התקדמות עבודה: ${submissionData.item_name_at_submission}`;

    // Update client servings with audit trail
    await updateClientServings(clientId, newServingsCount, notes);

    console.log(`Successfully deducted 1 serving from client ${client.restaurant_name}. Remaining: ${newServingsCount}`);
    
    // Show Hebrew success message
    toast.success(`נוכה סרבינג אחד מ${client.restaurant_name}. נותרו: ${newServingsCount} מנות`);

  } catch (error) {
    console.error("Error in automatic serving deduction:", error);
    toast.error("שגיאה בניכוי אוטומטי של מנה");
  }
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
      let statusHistory: EditHistory = { status_changes: [] };
      
      // First fetch the current submission to get existing history and client_id
      const { data: currentSubmission } = await supabase
        .from("customer_submissions")
        .select("submission_status, edit_history, client_id, item_name_at_submission")
        .eq("submission_id", submissionId)
        .single();
      
      // If we have existing history, append to it, otherwise create new
      if (currentSubmission?.edit_history) {
        const existingHistory = currentSubmission.edit_history as EditHistory;
        
        statusHistory = {
          status_changes: [
            ...(existingHistory.status_changes || []),
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
      
      // Create an update object
      const updateData: Record<string, any> = {
        submission_status: status,
        edit_history: statusHistory
      };
      
      // Update the submission status and history
      const { data, error } = await supabase
        .from("customer_submissions")
        .update(updateData)
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

      // Automatic serving deduction when submission reaches completion stages
      if (isServingDeductionStatus(status)) {
        await handleAutomaticServingDeduction(submissionId, data);
      }
      
      return data;
    },
    onSuccess: (data) => {
      toast.success(`סטטוס העבודה עודכן ל: ${data.submission_status}`);
      queryClient.invalidateQueries({ queryKey: ["submission", data.submission_id] });
      queryClient.invalidateQueries({ queryKey: ["editor-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["all-submissions"] });
      // Also invalidate client queries to refresh servings data in UI
      if (data.client_id) {
        queryClient.invalidateQueries({ queryKey: ["client", data.client_id] });
        queryClient.invalidateQueries({ queryKey: ["clients"] });
      }
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
    
    // Temporarily cast to any to avoid TypeScript errors until Supabase types are updated
    const { error } = await (supabase
      .from("notifications") as any)
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
