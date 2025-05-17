
import { useSubmissionData } from "./submission/useSubmissionData";
import { useSubmissionStatusTracking } from "./useSubmissionStatusTracking";
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
  
  const { updateStatus } = useSubmissionStatusTracking();
  const { addProcessedImage, removeProcessedImage, setMainProcessedImage } = 
    useImageManagement(submission, setSubmission);
  const { addInternalNote } = useInternalNotes(submission, setSubmission);
  const { requestEdit, respondToClientFeedback } = useEditRequest(submission, setSubmission);
  const { getMaxEditsAllowed } = usePackageDetails();
  
  // Legacy compatibility
  const updateSubmissionStatus = async (status: any) => {
    if (submission?.submission_id) {
      return await updateStatus.mutateAsync({
        submissionId: submission.submission_id,
        status: status
      });
    }
    return false;
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
    updateStatus,
    isUpdating: updateStatus.isPending,
  };
}
