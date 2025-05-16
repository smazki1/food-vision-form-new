
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Submission, SubmissionStatus } from "@/api/submissionApi";
import { toast } from "sonner";

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

  const updateSubmissionStatus = async (status: SubmissionStatus) => {
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
      
      toast.success("התמונה הראשית עודכנה בהצלחה");
      return true;
    } catch (err) {
      console.error("Error setting main image:", err);
      toast.error("שגיאה בעדכון התמונה הראשית");
      return false;
    }
  };

  const addProcessedImage = async (imageUrl: string) => {
    if (!submissionId || !submission) return false;
    
    try {
      const currentImages = submission.processed_image_urls || [];
      const updatedImages = [...currentImages, imageUrl];
      
      const { error } = await supabase
        .from("customer_submissions")
        .update({ processed_image_urls: updatedImages })
        .eq("submission_id", submissionId);
        
      if (error) throw error;
      
      // Update local state
      setSubmission({
        ...submission,
        processed_image_urls: updatedImages
      });
      
      toast.success("התמונה המעובדת נוספה בהצלחה");
      return true;
    } catch (err) {
      console.error("Error adding processed image:", err);
      toast.error("שגיאה בהוספת תמונה מעובדת");
      return false;
    }
  };

  const removeProcessedImage = async (imageUrl: string) => {
    if (!submissionId || !submission) return false;
    
    try {
      const currentImages = submission.processed_image_urls || [];
      const updatedImages = currentImages.filter(url => url !== imageUrl);
      
      const { error } = await supabase
        .from("customer_submissions")
        .update({ processed_image_urls: updatedImages })
        .eq("submission_id", submissionId);
        
      if (error) throw error;
      
      // If we're removing the main image, clear that field
      let updatedSubmission = { ...submission, processed_image_urls: updatedImages };
      if (submission.main_processed_image_url === imageUrl) {
        await supabase
          .from("customer_submissions")
          .update({ main_processed_image_url: null })
          .eq("submission_id", submissionId);
          
        updatedSubmission.main_processed_image_url = null;
      }
      
      // Update local state
      setSubmission(updatedSubmission);
      
      toast.success("התמונה המעובדת הוסרה בהצלחה");
      return true;
    } catch (err) {
      console.error("Error removing processed image:", err);
      toast.error("שגיאה בהסרת תמונה מעובדת");
      return false;
    }
  };

  const addInternalNote = async (note: string) => {
    if (!submissionId || !submission) return false;
    
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
        .eq("submission_id", submissionId);
        
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

  const respondToClientFeedback = async (response: string, newImageUrls: string[]) => {
    if (!submissionId || !submission) return false;
    
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
        .eq("submission_id", submissionId);
        
      if (error) throw error;
      
      // Update local state
      setSubmission({
        ...submission,
        edit_history: newEditHistory,
        submission_status: "מוכנה להצגה"
      });
      
      toast.success("התגובה ללקוח נשלחה בהצלחה");
      return true;
    } catch (err) {
      console.error("Error responding to client feedback:", err);
      toast.error("שגיאה בשליחת תגובה ללקוח");
      return false;
    }
  };

  const getMaxEditsAllowed = async (): Promise<number> => {
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

  return {
    submission,
    loading,
    error,
    updateSubmissionStatus,
    requestEdit,
    setMainProcessedImage,
    addProcessedImage,
    removeProcessedImage,
    addInternalNote,
    respondToClientFeedback,
    getMaxEditsAllowed
  };
}
