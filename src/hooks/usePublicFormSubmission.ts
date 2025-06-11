import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { NewItemFormData, DishData } from '@/contexts/NewItemFormContext';
import { triggerMakeWebhook, MakeWebhookPayload } from '@/lib/triggerMakeWebhook';
import { uploadImages, uploadAdditionalFiles } from '@/components/unified-upload/utils/imageUploadUtils';

export const usePublicFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const submitForm = async (
    formData: NewItemFormData,
    setStepErrors?: (errors: Record<string, string>) => void
  ): Promise<boolean> => {
    console.log('[PublicFormSubmission] Starting submission process for multiple dishes...', formData);
    
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

    if (!formData.dishes || formData.dishes.length === 0) {
      console.log('[PublicFormSubmission] No dishes provided');
      toast.error("חובה להוסיף לפחות מנה אחת.");
      setStepErrors?.({ dishes: "חובה להוסיף לפחות מנה אחת." });
      return false;
    }

    // Validate each dish
    for (let i = 0; i < formData.dishes.length; i++) {
      const dish = formData.dishes[i];
      if (!dish.itemName?.trim()) {
        console.log(`[PublicFormSubmission] Missing item name for dish ${i + 1}`);
        toast.error(`שם הפריט הוא שדה חובה במנה ${i + 1}.`);
        setStepErrors?.({ [`dish_${dish.id}_itemName`]: `שם הפריט הוא שדה חובה במנה ${i + 1}.` });
        return false;
      }

      if (!dish.itemType) {
        console.log(`[PublicFormSubmission] Missing item type for dish ${i + 1}`);
        toast.error(`סוג הפריט הוא שדה חובה במנה ${i + 1}.`);
        setStepErrors?.({ [`dish_${dish.id}_itemType`]: `סוג הפריט הוא שדה חובה במנה ${i + 1}.` });
        return false;
      }

      if (!dish.referenceImages || dish.referenceImages.length === 0) {
        console.log(`[PublicFormSubmission] Missing images for dish ${i + 1}`);
        toast.error(`נדרשת לפחות תמונה אחת למנה ${i + 1}.`);
        setStepErrors?.({ [`dish_${dish.id}_referenceImages`]: `נדרשת לפחות תמונה אחת למנה ${i + 1}.` });
        return false;
      }
    }

    setIsSubmitting(true);
    let rpcSuccessful = false;
    const submissionResults = [];
    
    try {
      console.log('[PublicFormSubmission] Starting submission for', formData.dishes.length, 'dishes');
      
      // Submit each dish separately
      for (let i = 0; i < formData.dishes.length; i++) {
        const dish = formData.dishes[i];
        console.log(`[PublicFormSubmission] Processing dish ${i + 1}:`, dish.itemName);

        // Upload images for this dish
        const uploadedImageUrls = await uploadImages(
          dish.referenceImages,
          false, // isAuthenticated
          null, // clientId
          dish.itemType
        );

        // Upload additional files for this dish
        const brandingMaterialUrls = await uploadAdditionalFiles(
          dish.brandingMaterials || [],
          'branding',
          false, // isAuthenticated
          null, // clientId
          dish.itemType
        );

        const referenceExampleUrls = await uploadAdditionalFiles(
          dish.referenceExamples || [],
          'reference',
          false, // isAuthenticated
          null, // clientId
          dish.itemType
        );

        console.log(`[PublicFormSubmission] Upload completed for dish ${i + 1}:`, {
          images: uploadedImageUrls.length,
          branding: brandingMaterialUrls.length,
          reference: referenceExampleUrls.length
        });

        // Prepare category and ingredients based on item type
        let category = null;
        let ingredients = null;
        
        const itemTypeLower = dish.itemType.toLowerCase().trim();
        if (itemTypeLower.includes('קוקטייל') || itemTypeLower.includes('cocktail') || itemTypeLower.includes('משקה')) {
          ingredients = dish.description?.trim() ? 
            dish.description.split(',').map(i => i.trim()).filter(i => i.length > 0) : null;
        } else {
          category = dish.description?.trim() || null;
        }

        const rpcParams = {
          p_restaurant_name: formData.restaurantName.trim(),
          p_item_type: dish.itemType,
          p_item_name: dish.itemName.trim(),
          p_description: dish.description?.trim() || null,
          p_category: category || null,
          p_ingredients: ingredients || null,
          p_reference_image_urls: uploadedImageUrls,
          p_branding_material_urls: brandingMaterialUrls,
          p_reference_example_urls: referenceExampleUrls,
          p_contact_name: formData.submitterName?.trim() || null,
          p_contact_email: formData.contactEmail?.trim() || null,
          p_contact_phone: formData.contactPhone?.trim() || null
        };

        console.log(`[PublicFormSubmission] Calling RPC for dish ${i + 1} with params:`, rpcParams);

        const { data: submissionData, error: submissionError } = await supabase.rpc(
          'public_submit_item_by_restaurant_name',
          rpcParams
        );

        if (submissionError) {
          console.error(`[PublicFormSubmission] RPC error for dish ${i + 1}:`, submissionError);
          throw new Error(`שגיאה בהגשת מנה ${i + 1}: ${submissionError.message}`);
        }

        console.log(`[PublicFormSubmission] RPC response for dish ${i + 1}:`, submissionData);
        submissionResults.push({
          dish: dish,
          submissionData: submissionData,
          uploadedImageUrls: uploadedImageUrls,
          brandingMaterialUrls: brandingMaterialUrls,
          referenceExampleUrls: referenceExampleUrls
        });
      }

      rpcSuccessful = true;
      console.log('[PublicFormSubmission] All dishes submitted successfully:', submissionResults.length);

      // Calculate totals for success message
      const totalDishes = submissionResults.length;
      const totalImages = submissionResults.reduce((sum, result) => sum + result.uploadedImageUrls.length, 0);
      
      toast.success(
        `הגשה הושלמה בהצלחה! ${totalDishes} מנות עם ${totalImages} תמונות נשלחו למערכת.`,
        { duration: 5000 }
      );
      
      setShowSuccessModal(true);
      return true;

    } catch (error: any) {
      console.error('[PublicFormSubmission] Error during submission:', error);
      
      if (typeof error === 'string') {
        toast.error(error);
        setStepErrors?.({ submit: error });
      } else if (error?.message) {
        const errorMessage = `שגיאה בהגשה: ${error.message}`;
        toast.error(errorMessage);
        setStepErrors?.({ submit: errorMessage });
      } else {
        const defaultError = "אירעה שגיאה בעת שליחת הטופס. אנא נסו שוב.";
        toast.error(defaultError);
        setStepErrors?.({ submit: defaultError });
      }
      
      return false;
    } finally {
      setIsSubmitting(false);
      if (rpcSuccessful) {
        // Trigger webhook for each dish
        for (const result of submissionResults) {
          const dish = result.dish;
          let categoryWebhook: string | null = null;
          let ingredientsWebhook: string[] | null = null;
          
          // Use same flexible logic for webhook
          const itemTypeLower = dish.itemType.toLowerCase().trim();
          if (itemTypeLower.includes('קוקטייל') || itemTypeLower.includes('cocktail') || itemTypeLower.includes('משקה')) {
            ingredientsWebhook = dish.description?.trim()
              ? dish.description.split(',').map(i => i.trim()).filter(i => i.length > 0)
              : null;
          } else {
            categoryWebhook = dish.description?.trim() || null;
          }

          const webhookPayload: MakeWebhookPayload = {
            submissionTimestamp: new Date().toISOString(),
            isAuthenticated: false,
            clientId: null,
            restaurantName: formData.restaurantName,
            submitterName: formData.submitterName,
            contactEmail: formData.contactEmail,
            contactPhone: formData.contactPhone,
            itemName: dish.itemName,
            itemType: dish.itemType,
            description: dish.description,
            specialNotes: dish.specialNotes,
            uploadedImageUrls: result.uploadedImageUrls,
            category: categoryWebhook,
            ingredients: ingredientsWebhook,
            sourceForm: 'public-form-multiple-dishes',
            itemsQuantityRange: formData.itemsQuantityRange,
            estimatedImagesNeeded: formData.estimatedImagesNeeded,
            primaryImageUsage: formData.primaryImageUsage,
          };
          
          try {
            await triggerMakeWebhook(webhookPayload);
          } catch (webhookError) {
            console.warn('[PublicFormSubmission] Webhook failed for dish:', dish.itemName, webhookError);
          }
        }
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
