import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { updateClientServings } from "@/api/clientApi";

/**
 * Helper function to automatically deduct servings when submission is approved
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

/**
 * Helper function to automatically restore servings when submission status changes from approved to other status
 */
async function handleAutomaticServingRestoration(submissionId: string, submissionData: any) {
  try {
    // Get client_id from the submission data
    const clientId = submissionData.client_id;
    if (!clientId) {
      console.warn("Cannot restore servings: submission has no client_id");
      return;
    }

    // Get current client servings
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("remaining_servings, restaurant_name")
      .eq("client_id", clientId)
      .single();

    if (clientError) {
      console.error("Error fetching client for serving restoration:", clientError);
      return;
    }

    const currentServings = client.remaining_servings || 0;
    
    // Add one serving back
    const newServingsCount = currentServings + 1;
    const notes = `החזרת מנה אוטומטית בעקבות ביטול אישור עבודה: ${submissionData.item_name_at_submission}`;

    // Update client servings with audit trail
    await updateClientServings(clientId, newServingsCount, notes);

    console.log(`Successfully restored 1 serving to client ${client.restaurant_name}. New total: ${newServingsCount}`);
    
    // Show Hebrew success message
    toast.success(`הוחזרה מנה אחת ל${client.restaurant_name}. סה"כ: ${newServingsCount} מנות`);

  } catch (error) {
    console.error("Error in automatic serving restoration:", error);
    toast.error("שגיאה בהחזרת מנה אוטומטית");
  }
}

export const SUBMISSION_STATUSES = [
  'ממתינה לעיבוד',
  'בעיבוד', 
  'מוכנה להצגה',
  'הערות התקבלו',
  'הושלמה ואושרה'
] as const;

export type SubmissionStatus = typeof SUBMISSION_STATUSES[number];

export const useSubmissionStatus = () => {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateSubmissionStatus = async (submissionId: string, newStatus: SubmissionStatus) => {
    if (!submissionId) {
      toast.error('מזהה הגשה חסר');
      return false;
    }

    setIsUpdating(true);
    try {
      console.log('Updating submission status:', { submissionId, newStatus });
      
      // First, get the current status to check if we're changing from approved
      const { data: currentSubmission, error: fetchError } = await supabase
        .from('customer_submissions')
        .select('submission_status, client_id, item_name_at_submission')
        .eq('submission_id', submissionId)
        .single();

      if (fetchError) {
        console.error('Error fetching current submission:', fetchError);
        toast.error(`שגיאה בטעינת נתוני ההגשה: ${fetchError.message}`);
        return false;
      }

      const previousStatus = currentSubmission.submission_status;
      
      // Update the status
      const { data, error } = await supabase
        .from('customer_submissions')
        .update({ 
          submission_status: newStatus
        })
        .eq('submission_id', submissionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating submission status:', error);
        toast.error(`שגיאה בעדכון סטטוס: ${error.message}`);
        return false;
      }

      console.log('Status update successful:', data);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['client-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
      
      // Handle serving changes based on status transitions
      if (newStatus === 'הושלמה ואושרה' && previousStatus !== 'הושלמה ואושרה') {
        // Changing TO approved status - deduct serving
        await handleAutomaticServingDeduction(submissionId, data);
      } else if (previousStatus === 'הושלמה ואושרה' && newStatus !== 'הושלמה ואושרה') {
        // Changing FROM approved status to something else - restore serving
        await handleAutomaticServingRestoration(submissionId, data);
      }

      toast.success(`סטטוס ההגשה עודכן ל: ${newStatus}`);
      return true;
    } catch (error) {
      console.error('Error updating submission status:', error);
      toast.error('שגיאה בעדכון סטטוס ההגשה');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateSubmissionStatus,
    isUpdating,
    availableStatuses: SUBMISSION_STATUSES
  };
};
