
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Submission } from "@/api/submissionApi";

export function useSubmission(submissionId?: string) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSubmission() {
      if (!submissionId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("customer_submissions")
          .select(`
            *,
            clients(restaurant_name)
          `)
          .eq("submission_id", submissionId)
          .single();

        if (error) throw error;
        setSubmission(data as Submission);
      } catch (err) {
        console.error("Error fetching submission:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch submission"));
      } finally {
        setLoading(false);
      }
    }

    fetchSubmission();
  }, [submissionId]);

  const updateSubmissionStatus = async (status: string) => {
    if (!submissionId) return false;
    
    try {
      const { error } = await supabase
        .from("customer_submissions")
        .update({ submission_status: status })
        .eq("submission_id", submissionId);
        
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

  const requestEdit = async (editNote: string) => {
    if (!submissionId || !submission) return false;
    
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
        .eq("submission_id", submissionId);
        
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

  const setMainProcessedImage = async (imageUrl: string) => {
    if (!submissionId) return false;
    
    try {
      const { error } = await supabase
        .from("customer_submissions")
        .update({ main_processed_image_url: imageUrl })
        .eq("submission_id", submissionId);
        
      if (error) throw error;
      
      // Update local state
      if (submission) {
        setSubmission({...submission, main_processed_image_url: imageUrl});
      }
      
      return true;
    } catch (err) {
      console.error("Error setting main image:", err);
      return false;
    }
  };

  return {
    submission,
    loading,
    error,
    updateSubmissionStatus,
    requestEdit,
    setMainProcessedImage
  };
}
