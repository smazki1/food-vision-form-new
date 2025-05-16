
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { ImagesTabContent, ClientFeedbackTabContent, InternalNotesTabContent } from "./tabs";
import ActionButtons from "./ActionButtons";
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
            <ImagesTabContent 
              submission={submission}
              handleSelectMainImage={handleSelectMainImage}
              handleRemoveProcessedImage={handleRemoveProcessedImage}
              addProcessedImage={addProcessedImage}
              setLightboxImage={setLightboxImage}
            />
          </TabsContent>
          
          <TabsContent value="client-feedback">
            <ClientFeedbackTabContent 
              submission={submission}
              maxEdits={maxEdits}
              responseToClient={responseToClient}
              setResponseToClient={setResponseToClient}
            />
          </TabsContent>
          
          <TabsContent value="internal-notes">
            <InternalNotesTabContent 
              internalTeamNotes={submission.internal_team_notes}
              onAddNote={addInternalNote}
            />
          </TabsContent>
        </Tabs>
        
        <ActionButtons 
          submission={submission}
          responseToClient={responseToClient}
          respondToClientFeedback={respondToClientFeedback}
          onSaveProgress={handleSaveProgress}
        />
      </CardContent>
    </Card>
  );
};

export default SubmissionProcessingContent;
