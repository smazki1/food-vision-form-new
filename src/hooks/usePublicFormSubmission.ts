import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { NewItemFormData } from '@/contexts/NewItemFormContext';
import { triggerMakeWebhook, MakeWebhookPayload } from '@/lib/triggerMakeWebhook';

export const usePublicFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const submitForm = async (
    formData: NewItemFormData,
    setStepErrors?: (errors: Record<string, string>) => void
  ): Promise<boolean> => {
    console.log('[PublicFormSubmission] Starting submission process...', formData);
    
    // Validation
    if (!formData.restaurantName?.trim()) {
      console.log('[PublicFormSubmission] Missing restaurant name');
      toast.error("שם המסעדה הוא שדה חובה.");
      setStepErrors?.({ restaurantName: "שם המסעדה הוא שדה חובה." });
      return false;
    }

    if (!formData.submitterName?.trim()) {
      console.log('[PublicFormSubmission] Missing submitter name');
      toast.error("שם המגיש הוא שדה חובה.");
      setStepErrors?.({ submitterName: "שם המגיש הוא שדה חובה." });
      return false;
    }

    if (!formData.itemName?.trim()) {
      console.log('[PublicFormSubmission] Missing item name');
      toast.error("שם הפריט הוא שדה חובה.");
      setStepErrors?.({ itemName: "שם הפריט הוא שדה חובה." });
      return false;
    }

    if (!formData.itemType) {
      console.log('[PublicFormSubmission] Missing item type');
      toast.error("סוג הפריט הוא שדה חובה.");
      setStepErrors?.({ itemType: "סוג הפריט הוא שדה חובה." });
      return false;
    }

    if (formData.referenceImages.length < 4) {
      console.log('[PublicFormSubmission] Not enough images uploaded');
      toast.error("יש להעלות לפחות 4 תמונות.");
      setStepErrors?.({ referenceImages: "יש להעלות לפחות 4 תמונות." });
      return false;
    }

    setIsSubmitting(true);
    toast.info("מעלה תמונות ושומר הגשה...");

    let rpcSuccessful = false;
    let uploadedImageUrls: string[] = [];

    try {
      console.log('[PublicFormSubmission] Uploading images...');
      
      // Upload images
      for (let i = 0; i < formData.referenceImages.length; i++) {
        const file = formData.referenceImages[i];
        if (file instanceof File) {
          const fileExt = file.name.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `public-submissions/${fileName}`;
          
          console.log(`[PublicFormSubmission] Uploading file ${i + 1}/${formData.referenceImages.length} to: ${filePath}`);

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('food-vision-images')
            .upload(filePath, file);

          if (uploadError) {
            console.error(`[PublicFormSubmission] Upload error for file ${i + 1}:`, uploadError);
            throw new Error(`שגיאה בהעלאת תמונה ${i + 1}: ${uploadError.message}`);
          }
          
          const { data: publicUrlData } = supabase.storage
            .from('food-vision-images')
            .getPublicUrl(filePath);
          
          uploadedImageUrls.push(publicUrlData.publicUrl);
        }
      }
      
      console.log('[PublicFormSubmission] All images uploaded successfully');
      
      // Prepare parameters for RPC including contact information
      let category = null;
      let ingredients = null;
      
      // More flexible cocktail detection for ingredients vs category
      const itemTypeLower = formData.itemType.toLowerCase().trim();
      if (itemTypeLower.includes('קוקטייל') || itemTypeLower.includes('cocktail') || itemTypeLower.includes('משקה')) {
        ingredients = formData.description?.trim() ? 
          formData.description.split(',').map(i => i.trim()).filter(i => i.length > 0) : null;
      } else {
        category = formData.description?.trim() || null;
      }

      const rpcParams = {
        p_restaurant_name: formData.restaurantName.trim(),
        p_item_type: formData.itemType.toLowerCase(),
        p_item_name: formData.itemName.trim(),
        p_description: formData.description?.trim() || null,
        p_category: category || null,
        p_ingredients: ingredients || null,
        p_reference_image_urls: uploadedImageUrls,
        p_contact_name: formData.submitterName?.trim() || null,
        p_contact_email: formData.contactEmail?.trim() || null,
        p_contact_phone: formData.contactPhone?.trim() || null,
      };

      console.log('[PublicFormSubmission] Calling RPC with params:', rpcParams);

      const { data: submissionData, error: submissionError } = await supabase.rpc(
        'public_submit_item_by_restaurant_name',
        rpcParams
      );

      if (submissionError) {
        console.error('[PublicFormSubmission] RPC error:', submissionError);
        throw new Error(`שגיאה בהגשה: ${submissionError.message}`);
      }

      console.log('[PublicFormSubmission] RPC response:', submissionData);
      console.log('[PublicFormSubmission] RPC response type:', typeof submissionData);
      console.log('[PublicFormSubmission] RPC response keys:', submissionData ? Object.keys(submissionData) : 'null/undefined');
      console.log('[PublicFormSubmission] RPC response.success:', submissionData?.success);
      console.log('[PublicFormSubmission] RPC response.message:', submissionData?.message);
      console.log('[PublicFormSubmission] RPC response.error:', submissionData?.error);
      console.log('[PublicFormSubmission] Full RPC response details:', JSON.stringify(submissionData, null, 2));

      if (submissionData && typeof submissionData === 'object') {
        if (submissionData.success) {
          // Success case
          if (submissionData.client_found) {
            toast.success('הפריט הוגש בהצלחה ושויך למסעדה!');
          } else if (submissionData.lead_created) {
            toast.success('הפריט הוגש בהצלחה! נוצר ליד חדש למסעדה במערכת.');
          } else {
            toast.success('הפריט הוגש בהצלחה! המסעדה לא נמצאה במערכת, הפריט ממתין לשיוך ידני.');
          }
          
          console.log('[PublicFormSubmission] Setting showSuccessModal to true');
          setShowSuccessModal(true);
          rpcSuccessful = true;
          return true;
        } else {
          // Failed case - extract the actual error message
          const errorMessage = submissionData.message || submissionData.error || 'הגשה נכשלה מסיבה לא ידועה';
          console.error('[PublicFormSubmission] RPC operation failed:', errorMessage);
          throw new Error(errorMessage);
        }
      } else {
        console.error('[PublicFormSubmission] Invalid RPC response structure:', submissionData);
        throw new Error('הגשה נכשלה - תגובה לא תקינה מהשרת');
      }
    } catch (error: any) {
      console.error("[PublicFormSubmission] Error in submission process:", error);
      const errorMessage = error.message || "אירעה שגיאה במהלך ההגשה. נסו שוב.";
      setStepErrors?.({ submit: errorMessage });
      toast.error(errorMessage);
      rpcSuccessful = false;
      return false;
    } finally {
      setIsSubmitting(false);
      if (rpcSuccessful) {
        let categoryWebhook: string | null = null;
        let ingredientsWebhook: string[] | null = null;
        
        // Use same flexible logic for webhook
        const itemTypeLower = formData.itemType.toLowerCase().trim();
        if (itemTypeLower.includes('קוקטייל') || itemTypeLower.includes('cocktail') || itemTypeLower.includes('משקה')) {
          ingredientsWebhook = formData.description?.trim()
            ? formData.description.split(',').map(i => i.trim()).filter(i => i.length > 0)
            : null;
        } else {
          categoryWebhook = formData.description?.trim() || null;
        }

        const webhookPayload: MakeWebhookPayload = {
          submissionTimestamp: new Date().toISOString(),
          isAuthenticated: false,
          clientId: null,
          restaurantName: formData.restaurantName,
          submitterName: formData.submitterName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          itemName: formData.itemName,
          itemType: formData.itemType,
          description: formData.description,
          specialNotes: formData.specialNotes,
          uploadedImageUrls: uploadedImageUrls,
          category: categoryWebhook,
          ingredients: ingredientsWebhook,
          sourceForm: 'public-form-context',
        };
        triggerMakeWebhook(webhookPayload);
      }
    }
  };

  const handleCloseSuccessModal = () => {
    console.log('[PublicFormSubmission] Closing success modal');
    setShowSuccessModal(false);
  };

  return {
    isSubmitting,
    submitForm,
    showSuccessModal,
    handleCloseSuccessModal
  };
};
