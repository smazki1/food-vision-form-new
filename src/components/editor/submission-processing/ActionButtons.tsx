
import React from "react";
import { Button } from "@/components/ui/button";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";
import { Submission } from "@/api/submissionApi";

interface ActionButtonsProps {
  submission: Submission;
  responseToClient: string;
  respondToClientFeedback: (response: string, processedImages: string[]) => Promise<boolean>;
  onSaveProgress: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  submission,
  responseToClient,
  respondToClientFeedback,
  onSaveProgress,
}) => {
  const handleMarkAsReady = async () => {
    if (!submission?.processed_image_urls?.length || !submission.main_processed_image_url) {
      toast.error("יש להעלות לפחות תמונה מעובדת אחת ולבחור תמונה ראשית");
      return;
    }
    
    try {
      // If this was a response to client feedback, update the edit history
      if (submission.submission_status === "הערות התקבלו" && responseToClient.trim()) {
        await respondToClientFeedback(responseToClient, submission.processed_image_urls);
      }
      
      toast.success("המשימה סומנה כמוכנה להצגה");
    } catch (err) {
      console.error("Error marking as ready:", err);
      toast.error("שגיאה בסימון המשימה כמוכנה");
    }
  };

  return (
    <div className="flex flex-wrap gap-2 justify-between mt-6">
      <Button 
        variant="outline"
        onClick={onSaveProgress}
        className="flex-1 md:flex-none"
      >
        <Save className="h-4 w-4 mr-1" />
        שמור התקדמות
      </Button>
      <Button 
        onClick={handleMarkAsReady}
        className="flex-1 md:flex-none"
        disabled={!submission.processed_image_urls?.length || !submission.main_processed_image_url}
      >
        <Check className="h-4 w-4 mr-1" />
        סמן כ"מוכנה להצגה"
      </Button>
    </div>
  );
};

export default ActionButtons;
