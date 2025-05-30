import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { uploadImages } from '@/components/unified-upload/utils/imageUploadUtils'; // Using alias path
// import { handleAuthenticatedSubmission } from '@/components/unified-upload/services/authenticatedSubmissionService'; // Old service
import { handleClientAuthenticatedSubmission } from '../services/clientAuthenticatedSubmissionService'; // New service
import { NewItemFormData } from '@/contexts/NewItemFormContext';

export const useClientUnifiedFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const submitClientForm = async (
    formData: NewItemFormData,
    clientId: string
  ): Promise<boolean> => {
    console.log('[ClientUnifiedFormSubmission] Starting submission process for client...');
    
    setIsSubmitting(true);
    toast.info("מעלה תמונות ושומר הגשה...");

    try {
      const uploadedImageUrls = await uploadImages(
        formData.referenceImages,
        true, // isAuthenticated is always true for this hook
        clientId,
        formData.itemType
      );

      await handleClientAuthenticatedSubmission(formData, clientId, uploadedImageUrls); // Use new service
      toast.success("הפריט הוגש בהצלחה!");
      navigate('/customer/home');
      return true;
    } catch (error: any) {
      console.error('[ClientUnifiedFormSubmission] Submission error:', error);
      toast.error(error.message || 'אירעה שגיאה בעת שליחת הטופס');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmittingClient: isSubmitting,
    submitClientForm
  };
}; 