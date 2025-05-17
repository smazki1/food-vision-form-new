
import { supabase } from "@/integrations/supabase/client";
import { Submission } from "@/api/submissionApi";
import { toast } from "sonner";

/**
 * Hook for managing submission images
 */
export function useImageManagement(
  submission: Submission | null,
  setSubmission: React.Dispatch<React.SetStateAction<Submission | null>>
) {
  const setMainProcessedImage = async (imageUrl: string) => {
    if (!submission?.submission_id) return false;
    
    try {
      const { error } = await supabase
        .from("customer_submissions")
        .update({ main_processed_image_url: imageUrl })
        .eq("submission_id", submission.submission_id);
        
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
    if (!submission?.submission_id) return false;
    
    try {
      const currentImages = submission.processed_image_urls || [];
      const updatedImages = [...currentImages, imageUrl];
      
      const { error } = await supabase
        .from("customer_submissions")
        .update({ processed_image_urls: updatedImages })
        .eq("submission_id", submission.submission_id);
        
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
    if (!submission?.submission_id) return false;
    
    try {
      const currentImages = submission.processed_image_urls || [];
      const updatedImages = currentImages.filter(url => url !== imageUrl);
      
      const { error } = await supabase
        .from("customer_submissions")
        .update({ processed_image_urls: updatedImages })
        .eq("submission_id", submission.submission_id);
        
      if (error) throw error;
      
      // If we're removing the main image, clear that field
      let updatedSubmission = { ...submission, processed_image_urls: updatedImages };
      if (submission.main_processed_image_url === imageUrl) {
        await supabase
          .from("customer_submissions")
          .update({ main_processed_image_url: null })
          .eq("submission_id", submission.submission_id);
          
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

  return { setMainProcessedImage, addProcessedImage, removeProcessedImage };
}
