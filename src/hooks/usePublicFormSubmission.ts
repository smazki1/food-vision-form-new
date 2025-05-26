
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { NewItemFormData } from '@/contexts/NewItemFormContext';

export const usePublicFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitForm = async (formData: NewItemFormData): Promise<boolean> => {
    console.log('[PublicSubmit] Starting submission process...');
    console.log('[PublicSubmit] Form data:', formData);
    
    if (!formData.restaurantName?.trim()) {
        console.log('[PublicSubmit] Missing restaurant name');
        toast.error("שם המסעדה הוא שדה חובה.");
        return false;
    }

    if (!formData.itemName?.trim()) {
        console.log('[PublicSubmit] Missing item name');
        toast.error("שם הפריט הוא שדה חובה.");
        return false;
    }

    if (!formData.itemType) {
        console.log('[PublicSubmit] Missing item type');
        toast.error("סוג הפריט הוא שדה חובה.");
        return false;
    }

    if (formData.referenceImages.length === 0) {
        console.log('[PublicSubmit] No images uploaded');
        toast.error("יש להעלות לפחות תמונה אחת.");
        return false;
    }

    setIsSubmitting(true);
    toast.info("מעלה פרטי פריט ותמונות...");

    try {
      console.log('[PublicSubmit] Starting image upload process...');
      const uploadedImageUrls: string[] = [];

      for (let i = 0; i < formData.referenceImages.length; i++) {
        const file = formData.referenceImages[i];
        if (file instanceof File) {
            const fileExt = file.name.split('.').pop() || 'jpg';
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `public-submissions/${fileName}`;
            
            console.log(`[PublicSubmit] Uploading file ${i + 1}/${formData.referenceImages.length} to: ${filePath}`);

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('food-vision-images')
                .upload(filePath, file);

            if (uploadError) {
                console.error(`[PublicSubmit] Upload error for file ${i + 1}:`, uploadError);
                throw new Error(`שגיאה בהעלאת תמונה ${i + 1}: ${uploadError.message}`);
            }
            
            console.log(`[PublicSubmit] Upload successful for file ${i + 1}:`, uploadData);

            const { data: publicUrlData } = supabase.storage
                .from('food-vision-images')
                .getPublicUrl(filePath);
            
            uploadedImageUrls.push(publicUrlData.publicUrl);
            console.log(`[PublicSubmit] Generated public URL ${i + 1}:`, publicUrlData.publicUrl);
        }
      }
      
      console.log('[PublicSubmit] All images uploaded successfully. URLs:', uploadedImageUrls);
      
      let category = null;
      let ingredients = null;
      
      if (formData.itemType === 'cocktail') {
        ingredients = formData.description?.trim() ? 
          formData.description.split(',').map(i => i.trim()).filter(i => i.length > 0) : null;
      } else {
        category = formData.description?.trim() || null;
      }

      const rpcParams = {
        p_restaurant_name: formData.restaurantName.trim(),
        p_item_type: formData.itemType.toLowerCase() as 'dish' | 'cocktail' | 'drink',
        p_item_name: formData.itemName.trim(),
        p_description: formData.description?.trim() || null,
        p_category: category,
        p_ingredients: ingredients,
        p_reference_image_urls: uploadedImageUrls,
      };

      console.log('[PublicSubmit] Calling RPC with params:', rpcParams);

      const { data: submissionData, error: submissionError } = await supabase.rpc(
        'public_submit_item_by_restaurant_name',
        rpcParams
      );

      if (submissionError) {
        console.error('[PublicSubmit] RPC error:', submissionError);
        throw new Error(`שגיאה בהגשה: ${submissionError.message}`);
      }

      console.log('[PublicSubmit] RPC response:', submissionData);
      
      if (submissionData && typeof submissionData === 'object' && submissionData.success) {
        toast.success(submissionData.message || 'הפריט הוגש בהצלחה!');
        console.log('[PublicSubmit] Submission completed successfully');
        return true;
      } else {
        console.error('[PublicSubmit] RPC returned success=false:', submissionData);
        throw new Error(submissionData?.message || 'הגשה נכשלה - אנא נסו שוב');
      }

    } catch (error: any) {
      console.error("[PublicSubmit] Error in submission process:", error);
      toast.error(`שגיאה בהגשה: ${error.message || 'אירעה שגיאה לא צפויה.'}`);
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
