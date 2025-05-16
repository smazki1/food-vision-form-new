
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSubmission } from "@/hooks/useSubmission";
import { Submission } from "@/api/submissionApi";
import ActionButtons from "./ActionButtons";
import ImagesTabContent from "./tabs/ImagesTabContent";
import ClientFeedbackTabContent from "./tabs/ClientFeedbackTabContent";
import InternalNotesTabContent from "./tabs/InternalNotesTabContent";
import { ProcessingInfoTab } from "./tabs/ProcessingInfoTab";

interface SubmissionProcessingContentProps {
  submission: Submission | null;
  isLoading: boolean;
  handleSelectMainImage?: (imageUrl: string) => Promise<boolean>;
  handleRemoveProcessedImage?: (imageUrl: string) => Promise<boolean>;
  addProcessedImage?: (url: string) => Promise<boolean>;
  addInternalNote?: (note: string) => Promise<boolean>;
  respondToClientFeedback?: (response: string, processedImages: string[]) => Promise<boolean>;
  setLightboxImage?: (imageUrl: string | null) => void;
}

const SubmissionProcessingContent: React.FC<SubmissionProcessingContentProps> = ({
  submission,
  isLoading,
  handleSelectMainImage,
  handleRemoveProcessedImage,
  addProcessedImage,
  addInternalNote,
  respondToClientFeedback,
  setLightboxImage,
}) => {
  const [activeTab, setActiveTab] = useState("images");
  const [responseToClient, setResponseToClient] = useState("");
  
  if (isLoading || !submission) {
    return <div className="p-6">טוען...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-1">{submission.item_name_at_submission}</h2>
        <p className="text-muted-foreground">
          {submission.clients?.restaurant_name} | {submission.submission_status}
        </p>
      </div>
      
      <ActionButtons 
        submission={submission}
        responseToClient={responseToClient}
        respondToClientFeedback={respondToClientFeedback || (() => Promise.resolve(false))}
        onSaveProgress={() => {}}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="images">תמונות</TabsTrigger>
          <TabsTrigger value="feedback">משוב לקוח</TabsTrigger>
          <TabsTrigger value="notes">הערות פנימיות</TabsTrigger>
          <TabsTrigger value="info">מידע למעבד</TabsTrigger>
        </TabsList>
        
        <TabsContent value="images">
          <ImagesTabContent 
            submission={submission} 
            handleSelectMainImage={handleSelectMainImage || (() => Promise.resolve(false))}
            handleRemoveProcessedImage={handleRemoveProcessedImage || (() => Promise.resolve(false))}
            addProcessedImage={addProcessedImage || (() => Promise.resolve(false))}
            setLightboxImage={setLightboxImage || (() => {})}
          />
        </TabsContent>
        
        <TabsContent value="feedback">
          <ClientFeedbackTabContent 
            submission={submission}
            maxEdits={3} // Default value
            responseToClient={responseToClient}
            setResponseToClient={setResponseToClient}
          />
        </TabsContent>
        
        <TabsContent value="notes">
          <InternalNotesTabContent
            internalTeamNotes={submission.internal_team_notes}
            onAddNote={addInternalNote || (() => Promise.resolve(false))}
          />
        </TabsContent>
        
        <TabsContent value="info">
          <ProcessingInfoTab submission={submission} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubmissionProcessingContent;
