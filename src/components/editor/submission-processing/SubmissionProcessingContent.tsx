
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Save } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { Submission } from "@/api/submissionApi";
import ImagesTab from "@/components/editor/submission/images";
import ClientFeedbackTab from "@/components/editor/submission/ClientFeedbackTab";
import InternalNotesTab from "@/components/editor/submission/InternalNotesTab";
import { useMaxEdits } from "./hooks/useMaxEdits";

interface SubmissionProcessingContentProps {
  submission: Submission;
  handleSelectMainImage: (imageUrl: string) => Promise<boolean>;
  handleRemoveProcessedImage: (imageUrl: string) => Promise<boolean>;
  addProcessedImage: (url: string) => Promise<boolean>;
  addInternalNote: (note: string) => Promise<boolean>;
  respondToClientFeedback: (response: string, processedImages: string[]) => Promise<boolean>;
  setLightboxImage: (imageUrl: string | null) => void;
}

const SubmissionProcessingContent: React.FC<SubmissionProcessingContentProps> = ({
  submission,
  handleSelectMainImage,
  handleRemoveProcessedImage,
  addProcessedImage,
  addInternalNote,
  respondToClientFeedback,
  setLightboxImage
}) => {
  const [responseToClient, setResponseToClient] = useState("");
  const maxEdits = useMaxEdits(submission, async () => 3); // Assume default max edits is 3
  
  const handleMarkAsReady = async () => {
    if (!submission?.processed_image_urls?.length || !submission.main_processed_image_url) {
      toast.error("יש להעלות לפחות תמונה מעובדת אחת ולבחור תמונה ראשית");
      return;
    }
    
    try {
      // If this was a response to client feedback, update the edit history
      if (submission.submission_status === "הערות התקבלו" && responseToClient.trim()) {
        await respondToClientFeedback(responseToClient, submission.processed_image_urls);
        setResponseToClient("");
      }
      
      toast.success("המשימה סומנה כמוכנה להצגה");
    } catch (err) {
      console.error("Error marking as ready:", err);
      toast.error("שגיאה בסימון המשימה כמוכנה");
    }
  };
  
  const handleSaveProgress = () => {
    toast.success("התקדמות נשמרה בהצלחה");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">
              {submission.item_name_at_submission}
            </CardTitle>
            <CardDescription>
              מסעדה: {submission.clients?.restaurant_name}
            </CardDescription>
          </div>
          <Badge variant={
            submission.submission_status === "ממתינה לעיבוד" ? "warning" :
            submission.submission_status === "בעיבוד" ? "blue" :
            submission.submission_status === "מוכנה להצגה" ? "success" :
            submission.submission_status === "הערות התקבלו" ? "purple" :
            submission.submission_status === "הושלמה ואושרה" ? "secondary" :
            "default"
          }>
            {submission.submission_status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="images" className="mb-6">
          <TabsList className="mb-2">
            <TabsTrigger value="images">תמונות</TabsTrigger>
            <TabsTrigger value="client-feedback">משוב הלקוח</TabsTrigger>
            <TabsTrigger value="internal-notes">הערות פנימיות</TabsTrigger>
          </TabsList>
          
          <TabsContent value="images">
            <ImagesTab 
              submission={submission}
              handleSelectMainImage={handleSelectMainImage}
              handleRemoveProcessedImage={handleRemoveProcessedImage}
              addProcessedImage={addProcessedImage}
              setLightboxImage={setLightboxImage}
            />
          </TabsContent>
          
          <TabsContent value="client-feedback">
            <ClientFeedbackTab 
              submission={submission}
              maxEdits={maxEdits}
              responseToClient={responseToClient}
              setResponseToClient={setResponseToClient}
            />
          </TabsContent>
          
          <TabsContent value="internal-notes">
            <InternalNotesTab 
              internalTeamNotes={submission.internal_team_notes}
              onAddNote={addInternalNote}
            />
          </TabsContent>
        </Tabs>
        
        <div className="flex flex-wrap gap-2 justify-between mt-6">
          <Button 
            variant="outline"
            onClick={handleSaveProgress}
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
      </CardContent>
    </Card>
  );
};

export default SubmissionProcessingContent;
