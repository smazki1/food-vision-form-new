
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { uploadImages } from '../utils/imageUploadUtils';
import { handleAuthenticatedSubmission } from '../services/authenticatedSubmissionService';
import { handlePublicSubmission } from '../services/publicSubmissionService';

interface FormData {
  restaurantName: string;
  contactEmail: string;
  contactPhone: string;
  itemName: string;
  itemType: 'dish' | 'cocktail' | 'drink';
  description: string;
  specialNotes: string;
  referenceImages: File[];
}

export const useUnifiedFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const submitForm = async (
    formData: FormData,
    isAuthenticated: boolean,
    clientId: string | null
  ): Promise<boolean> => {
    console.log('[UnifiedFormSubmission] Starting submission process...');
    
    setIsSubmitting(true);
    toast.info("מעלה תמונות ושומר הגשה...");

    try {
      // Upload images first
      const uploadedImageUrls = await uploadImages(
        formData.referenceImages,
        isAuthenticated,
        clientId,
        formData.itemType
      );

      // Handle submission based on authentication status
      if (isAuthenticated && clientId) {
        await handleAuthenticatedSubmission(formData, clientId, uploadedImageUrls);
        navigate('/customer/home');
      } else {
        await handlePublicSubmission(formData, uploadedImageUrls);
        navigate('/');
      }

      return true;
    } catch (error: any) {
      console.error('[UnifiedFormSubmission] Submission error:', error);
      toast.error(error.message || 'אירעה שגיאה בעת שליחת הטופס');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitForm
  };
};
