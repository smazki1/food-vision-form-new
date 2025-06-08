
import React, { useState } from "react";
import { Submission } from "@/api/submissionApi";
import ActionButtons from "./ActionButtons";
import { SubmissionHeader, ContentTabs, LoadingState } from "./components";
import { useMaxEdits } from "./hooks/useMaxEdits";

interface SubmissionProcessingContentProps {
  submission: Submission | null;
  isLoading: boolean;
  handleSelectMainImage?: (imageUrl: string) => Promise<boolean>;
  handleRemoveProcessedImage?: (imageUrl: string) => Promise<boolean>;
  addProcessedImage?: (url: string) => Promise<boolean>;
  addInternalNote?: (note: string) => Promise<boolean>;
  respondToClientFeedback?: (response: string, processedImages: string[]) => Promise<boolean>;
  setLightboxImage?: (imageUrl: string | null, images?: string[]) => void;
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
    return <LoadingState />;
  }

  // Get max edits allowed based on package
  const { maxEdits } = useMaxEdits(submission);

  return (
    <div className="p-6">
      <SubmissionHeader submission={submission} />
      
      <ActionButtons 
        submission={submission}
        responseToClient={responseToClient}
        respondToClientFeedback={respondToClientFeedback || (() => Promise.resolve(false))}
        onSaveProgress={() => {}}
      />

      <ContentTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        submission={submission}
        responseToClient={responseToClient}
        setResponseToClient={setResponseToClient}
        handleSelectMainImage={handleSelectMainImage}
        handleRemoveProcessedImage={handleRemoveProcessedImage}
        addProcessedImage={addProcessedImage}
        addInternalNote={addInternalNote}
        setLightboxImage={setLightboxImage}
        maxEdits={maxEdits}
      />
    </div>
  );
};

export default SubmissionProcessingContent;
