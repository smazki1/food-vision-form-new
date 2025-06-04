import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { uploadImages, uploadAdditionalFiles } from '@/components/unified-upload/utils/imageUploadUtils';
import { handleClientAuthenticatedSubmission } from '../services/clientAuthenticatedSubmissionService';
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
      // Upload main reference images
      const uploadedImageUrls = await uploadImages(
        formData.referenceImages,
        true, // isAuthenticated is always true for this hook
        clientId,
        formData.itemType
      );

      // Upload additional files if they exist
      let brandingMaterialUrls: string[] = [];
      let referenceExampleUrls: string[] = [];

      if (formData.brandingMaterials && formData.brandingMaterials.length > 0) {
        console.log('[ClientUnifiedFormSubmission] Uploading branding materials...');
        brandingMaterialUrls = await uploadAdditionalFiles(
          formData.brandingMaterials,
          'branding',
          true, // isAuthenticated
          clientId,
          formData.itemType
        );
        console.log('[ClientUnifiedFormSubmission] Branding materials uploaded successfully');
      }

      if (formData.referenceExamples && formData.referenceExamples.length > 0) {
        console.log('[ClientUnifiedFormSubmission] Uploading reference examples...');
        referenceExampleUrls = await uploadAdditionalFiles(
          formData.referenceExamples,
          'reference',
          true, // isAuthenticated
          clientId,
          formData.itemType
        );
        console.log('[ClientUnifiedFormSubmission] Reference examples uploaded successfully');
      }

      await handleClientAuthenticatedSubmission(
        formData, 
        clientId, 
        uploadedImageUrls,
        brandingMaterialUrls,
        referenceExampleUrls
      );
      
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