
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SubmissionStatus } from "@/api/submissionApi";
import { toast } from "sonner";
import { updateClientServings } from "@/api/clientApi";

/**
 * Helper function to automatically deduct servings when submission is approved (general version)
 */
async function handleGeneralAutomaticServingDeduction(submissionId: string, submissionData: any) {
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
    const notes = `ניכוי אוטומטי בעקבות אישור עבודה: ${submissionData.item_name_at_submission}`;

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

export function useSubmissionStatus() {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = useMutation({
    mutationFn: async ({ submissionId, status }: { submissionId: string; status: SubmissionStatus }) => {
      setIsUpdating(true);
      try {
        const { data, error } = await supabase
          .from("customer_submissions")
          .update({ submission_status: status })
          .eq("submission_id", submissionId)
          .select()
          .single();

        if (error) throw error;

        // Automatic serving deduction when submission is approved
        if (status === "הושלמה ואושרה") {
          await handleGeneralAutomaticServingDeduction(submissionId, data);
        }

        return data;
      } finally {
        setIsUpdating(false);
      }
    },
    onSuccess: (data) => {
      toast.success(`סטטוס משימה עודכן ל: ${data.submission_status}`);
      queryClient.invalidateQueries({ queryKey: ["editor-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["submission", data.submission_id] });
      
      // Invalidate client queries to refresh package counts in UI
      if (data.client_id) {
        queryClient.invalidateQueries({ queryKey: ['client', data.client_id] });
        queryClient.invalidateQueries({ queryKey: ['client-detail', data.client_id] });
        queryClient.invalidateQueries({ queryKey: ['clients'] });
      }
    },
    onError: (error) => {
      toast.error(`שגיאה בעדכון סטטוס: ${error instanceof Error ? error.message : "שגיאה לא ידועה"}`);
    },
  });

  return {
    updateStatus,
    isUpdating
  };
}
