import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { uploadImages } from '../utils/imageUploadUtils';
import { handleAuthenticatedSubmission } from '../services/authenticatedSubmissionService';
import { handlePublicSubmission } from '../services/publicSubmissionService';
import { triggerMakeWebhook, MakeWebhookPayload } from '@/lib/triggerMakeWebhook';

interface FormData {
  restaurantName: string;
  contactEmail: string;
  contactPhone: string;
  itemName: string;
  itemType: 'dish' | 'cocktail' | 'drink';
  description: string;
  specialNotes: string;
  referenceImages: File[];
  submitterName?: string;
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

    let uploadedImageUrls: string[] = [];
    let success = false;

    try {
      // Upload images first
      uploadedImageUrls = await uploadImages(
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
      success = true;
      return true;
    } catch (error: any) {
      console.error('[UnifiedFormSubmission] Submission error:', error);
      toast.error(error.message || 'אירעה שגיאה בעת שליחת הטופס');
      success = false;
      return false;
    } finally {
      setIsSubmitting(false);
      if (success) {
        // Prepare and send webhook payload
        let category: string | null = null;
        let ingredients: string[] | null = null;

        if (formData.itemType === 'cocktail') {
          ingredients = formData.description?.trim()
            ? formData.description.split(',').map(i => i.trim()).filter(i => i.length > 0)
            : null;
        } else {
          category = formData.description?.trim() || null; // Using description as category for non-cocktails
        }

        const webhookPayload: MakeWebhookPayload = {
          submissionTimestamp: new Date().toISOString(),
          isAuthenticated,
          clientId,
          restaurantName: formData.restaurantName,
          submitterName: formData.submitterName, // Will be undefined if not provided
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          itemName: formData.itemName,
          itemType: formData.itemType,
          description: formData.description, // Raw description
          specialNotes: formData.specialNotes,
          uploadedImageUrls,
          category,
          ingredients,
          sourceForm: isAuthenticated ? 'unified-client' : 'unified-public',
        };
        triggerMakeWebhook(webhookPayload); // Fire and forget
      }
    }
  };

  return {
    isSubmitting,
    submitForm
  };
};
