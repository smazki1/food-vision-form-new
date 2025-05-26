
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { PublicUploadFormData } from './usePublicUploadForm';
import { usePublicImageUpload } from './usePublicImageUpload';

export const usePublicFormSubmit = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { uploadImages } = usePublicImageUpload();

  const handleSubmit = async (formData: PublicUploadFormData, validateForm: () => boolean, resetForm: () => void) => {
    if (!validateForm()) {
      toast.error('אנא תקן את השגיאות בטופס');
      return;
    }

    setIsSubmitting(true);
    toast.info('מעלה פרטי פריט ותמונות...');

    try {
      console.log('[Submit] Starting image upload...');
      const uploadedImageUrls = await uploadImages(formData.images);
      console.log('[Submit] Images uploaded:', uploadedImageUrls);
      
      let category = null;
      let ingredients = null;
      
      if (formData.itemType === 'cocktail') {
        ingredients = formData.ingredients.trim() ? 
          formData.ingredients.split(',').map(i => i.trim()).filter(i => i.length > 0) : null;
      } else {
        category = formData.category.trim() || null;
      }

      const rpcParams = {
        p_restaurant_name: formData.restaurantName.trim(),
        p_item_type: formData.itemType,
        p_item_name: formData.itemName.trim(),
        p_description: formData.description.trim() || null,
        p_category: category,
        p_ingredients: ingredients,
        p_reference_image_urls: uploadedImageUrls
      };

      console.log('[Submit] Calling RPC with params:', rpcParams);

      const { data: submissionData, error: submissionError } = await supabase.rpc(
        'public_submit_item_by_restaurant_name',
        rpcParams
      );

      if (submissionError) {
        console.error('Error submitting item via RPC:', submissionError);
        throw new Error(`שגיאה בהגשה: ${submissionError.message}`);
      }

      console.log('[Submit] RPC response:', submissionData);
      
      if (submissionData && typeof submissionData === 'object' && submissionData.success) {
        toast.success(submissionData.message || 'הפריט הוגש בהצלחה!');
        resetForm();
        const fileInput = document.getElementById('images') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(submissionData?.message || 'שגיאה לא ידועה בהגשה');
      }

    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(`שגיאה בהגשה: ${error.message || 'אירעה שגיאה לא צפויה'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleSubmit
  };
};
