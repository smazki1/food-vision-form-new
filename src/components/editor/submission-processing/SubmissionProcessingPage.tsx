
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useSubmission } from "@/hooks/useSubmission";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SubmissionHeader from "@/components/editor/submission/SubmissionHeader";
import LightboxDialog from "@/components/editor/submission/LightboxDialog";
import SubmissionProcessingContent from "./SubmissionProcessingContent";
import SubmissionSidebar from "@/components/editor/submission/SubmissionSidebar";
import { useLightbox } from "./hooks/useLightbox";

const SubmissionProcessingPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  
  const { 
    submission, 
    loading, 
    error,
    setMainProcessedImage,
    addProcessedImage,
    removeProcessedImage,
    addInternalNote,
    respondToClientFeedback,
    getMaxEditsAllowed,
    updateStatus,
    isUpdating
  } = useSubmission(submissionId);

  const { lightboxImage, lightboxImages, currentImageIndex, setLightboxImage, navigateToIndex } = useLightbox();
  
  if (loading) {
    return <div className="flex justify-center p-8">טוען פרטי הגשה...</div>;
  }
  
  if (error || !submission) {
    return (
      <Alert variant="destructive" className="mx-auto my-8 max-w-2xl">
        <AlertTitle>שגיאה בטעינת פרטי ההגשה</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "לא ניתן לטעון את פרטי ההגשה"}
        </AlertDescription>
      </Alert>
    );
  }
  
  const handleStatusChange = (status: string) => {
    updateStatus.mutate({ 
      submissionId: submission?.submission_id || "",
      status: status as any
    });
  };
  
  return (
    <div className="px-4 py-6 md:px-6">
      <SubmissionHeader />
      
      <div className="grid gap-6 lg:grid-cols-6">
        {/* Main content - 4 columns */}
        <div className="lg:col-span-4 space-y-6">
          <SubmissionProcessingContent 
            submission={submission}
            isLoading={loading}
            handleSelectMainImage={setMainProcessedImage}
            handleRemoveProcessedImage={removeProcessedImage}
            addProcessedImage={addProcessedImage}
            addInternalNote={addInternalNote}
            respondToClientFeedback={respondToClientFeedback}
            setLightboxImage={setLightboxImage}
          />
        </div>
        
        {/* Sidebar - 2 columns */}
        <div className="lg:col-span-2">
          <SubmissionSidebar 
            submission={submission}
            maxEdits={0} // Will be updated by useMaxEdits hook in the component
            onStatusChange={handleStatusChange}
            isUpdating={isUpdating}
          />
        </div>
      </div>
      
      {/* Image lightbox */}
      <LightboxDialog 
        imageUrl={lightboxImage}
        images={lightboxImages}
        currentIndex={currentImageIndex}
        onNavigate={navigateToIndex}
        onClose={() => setLightboxImage(null)}
        open={!!lightboxImage}
      />
    </div>
  );
};

export default SubmissionProcessingPage;
