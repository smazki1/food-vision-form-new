
import { useSubmissionData } from "./submission/useSubmissionData";
import { useSubmissionStatusUpdate } from "./submission/useSubmissionStatus";
import { useImageManagement } from "./submission/useImageManagement";
import { useInternalNotes } from "./submission/useInternalNotes";
import { useEditRequest } from "./submission/useEditRequest";
import { usePackageDetails } from "./submission/usePackageDetails";
import { Submission } from "@/api/submissionApi";

/**
 * Hook that combines all submission-related functionality
 */
export function useSubmission(submissionId?: string) {
  const {
    submission,
    setSubmission,
    loading,
    error
  } = useSubmissionData(submissionId);
  
  const { updateSubmissionStatus } = useSubmissionStatusUpdate(submission, setSubmission);
  const { addProcessedImage, removeProcessedImage, setMainProcessedImage } = 
    useImageManagement(submission, setSubmission);
  const { addInternalNote } = useInternalNotes(submission, setSubmission);
  const { requestEdit, respondToClientFeedback } = useEditRequest(submission, setSubmission);
  const { getMaxEditsAllowed } = usePackageDetails();
  
  const updateStatus = {
    mutate: async ({ submissionId, status }: { submissionId: string, status: any }) => {
      if (submission?.submission_id === submissionId) {
        return await updateSubmissionStatus(status);
      }
      return false;
    },
    isLoading: false, // For API compatibility
  };

  return {
    submission,
    loading,
    error,
    setSubmission,
    addProcessedImage,
    removeProcessedImage,
    setMainProcessedImage,
    updateSubmissionStatus,
    addInternalNote,
    requestEdit,
    respondToClientFeedback,
    getMaxEditsAllowed,
    updateStatus, // For API compatibility
    isUpdating: false, // For API compatibility
  };
}
