
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

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
      const uploadedImageUrls: string[] = [];
      
      for (const file of formData.referenceImages) {
        console.log('[UnifiedFormSubmission] Uploading file:', file.name);
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        let filePath: string;
        if (isAuthenticated && clientId) {
          filePath = `${clientId}/${formData.itemType}/${fileName}`;
        } else {
          filePath = `public-submissions/${fileName}`;
        }

        const { error: uploadError } = await supabase.storage
          .from('food-vision-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('[UnifiedFormSubmission] Upload error:', uploadError);
          throw new Error(`שגיאה בהעלאת תמונה: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('food-vision-images')
          .getPublicUrl(filePath);

        uploadedImageUrls.push(publicUrl);
        console.log('[UnifiedFormSubmission] Uploaded image URL:', publicUrl);
      }

      console.log('[UnifiedFormSubmission] All images uploaded successfully');

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

  const handleAuthenticatedSubmission = async (
    formData: FormData,
    clientId: string,
    uploadedImageUrls: string[]
  ) => {
    console.log('[UnifiedFormSubmission] Submitting for authenticated user with clientId:', clientId);
    
    const newItemId = uuidv4();
    
    const tableNameMap: Record<string, string> = {
      dish: 'dishes',
      cocktail: 'cocktails',
      drink: 'drinks',
    };
    
    const itemTable = tableNameMap[formData.itemType];
    const itemIdColumn = `${formData.itemType}_id`;

    const itemData = {
      client_id: clientId,
      name: formData.itemName,
      description: formData.description,
      notes: formData.specialNotes,
      reference_image_urls: uploadedImageUrls,
      [itemIdColumn]: newItemId,
    };

    const { error: itemInsertError } = await supabase.from(itemTable as any).insert(itemData);

    if (itemInsertError) {
      console.error('[UnifiedFormSubmission] Item insert error:', itemInsertError);
      throw new Error(`שגיאה ביצירת הפריט: ${itemInsertError.message}`);
    }

    const submissionData = {
      client_id: clientId,
      original_item_id: newItemId,
      item_type: formData.itemType,
      item_name_at_submission: formData.itemName,
      submission_status: 'ממתינה לעיבוד' as const,
      original_image_urls: uploadedImageUrls
    };

    const { error: submitError } = await supabase
      .from('customer_submissions')
      .insert(submissionData);

    if (submitError) {
      console.error('[UnifiedFormSubmission] Submission error:', submitError);
      await supabase.from(itemTable as any).delete().eq(itemIdColumn, newItemId);
      throw new Error(`שגיאה בשמירת ההגשה: ${submitError.message}`);
    }

    console.log('[UnifiedFormSubmission] Submission successful for authenticated user');
    toast.success('הפריט הוגש בהצלחה!');
  };

  const handlePublicSubmission = async (
    formData: FormData,
    uploadedImageUrls: string[]
  ) => {
    console.log('[UnifiedFormSubmission] Submitting for public user');
    
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

    console.log('[UnifiedFormSubmission] Calling RPC with params:', rpcParams);

    const { data: submissionData, error: submissionError } = await supabase.rpc(
      'public_submit_item_by_restaurant_name',
      rpcParams
    );

    if (submissionError) {
      console.error('[UnifiedFormSubmission] RPC error:', submissionError);
      throw new Error(`שגיאה בהגשה: ${submissionError.message}`);
    }

    console.log('[UnifiedFormSubmission] RPC response:', submissionData);

    if (submissionData && typeof submissionData === 'object' && submissionData.success) {
      if (submissionData.client_found) {
        toast.success('הפריט הוגש בהצלחה ושויך למסעדה!');
      } else {
        toast.success('הפריט הוגש בהצלחה! המסעדה לא נמצאה במערכת, הפריט ממתין לשיוך ידני.');
      }
    } else {
      throw new Error(submissionData?.message || 'הגשה נכשלה - אנא נסו שוב');
    }
  };

  return {
    isSubmitting,
    submitForm
  };
};
