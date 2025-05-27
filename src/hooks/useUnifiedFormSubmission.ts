
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { NewItemFormData } from '@/contexts/NewItemFormContext';

export const useUnifiedFormSubmission = (isPublicForm: boolean = false) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const submitForm = async (
    formData: NewItemFormData,
    clientId?: string | null,
    remainingDishes?: number | undefined,
    setStepErrors?: (errors: Record<string, string>) => void
  ): Promise<boolean> => {
    console.log('[UnifiedSubmission] Starting submission process...', { isPublicForm, formData });
    
    // Validation
    if (!formData.restaurantName?.trim()) {
      console.log('[UnifiedSubmission] Missing restaurant name');
      toast.error("שם המסעדה הוא שדה חובה.");
      setStepErrors?.({ restaurantName: "שם המסעדה הוא שדה חובה." });
      return false;
    }

    if (!formData.itemName?.trim()) {
      console.log('[UnifiedSubmission] Missing item name');
      toast.error("שם הפריט הוא שדה חובה.");
      setStepErrors?.({ itemName: "שם הפריט הוא שדה חובה." });
      return false;
    }

    if (!formData.itemType) {
      console.log('[UnifiedSubmission] Missing item type');
      toast.error("סוג הפריט הוא שדה חובה.");
      setStepErrors?.({ itemType: "סוג הפריט הוא שדה חובה." });
      return false;
    }

    if (formData.referenceImages.length === 0) {
      console.log('[UnifiedSubmission] No images uploaded');
      toast.error("יש להעלות לפחות תמונה אחת.");
      setStepErrors?.({ referenceImages: "יש להעלות לפחות תמונה אחת." });
      return false;
    }

    // For customer forms, check remaining dishes
    if (!isPublicForm && clientId) {
      if (remainingDishes !== undefined && remainingDishes <= 0) {
        const noDishesError = "אין לכם/ן מספיק מנות נותרות בחבילה כדי לבצע הגשה זו.";
        setStepErrors?.({ submit: noDishesError });
        toast.error(noDishesError);
        return false;
      }
    }

    setIsSubmitting(true);
    toast.info("מעלה תמונות ושומר הגשה...");

    try {
      if (isPublicForm) {
        return await handlePublicSubmission(formData, setStepErrors);
      } else {
        return await handleCustomerSubmission(formData, clientId, setStepErrors);
      }
    } catch (error: any) {
      console.error("[UnifiedSubmission] Error in submission process:", error);
      const errorMessage = error.message || "אירעה שגיאה במהלך ההגשה. נסו שוב.";
      setStepErrors?.({ submit: errorMessage });
      toast.error(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublicSubmission = async (
    formData: NewItemFormData,
    setStepErrors?: (errors: Record<string, string>) => void
  ): Promise<boolean> => {
    console.log('[UnifiedSubmission] Handling public submission...');
    
    // Upload images
    const uploadedImageUrls: string[] = [];
    for (let i = 0; i < formData.referenceImages.length; i++) {
      const file = formData.referenceImages[i];
      if (file instanceof File) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `public-submissions/${fileName}`;
        
        console.log(`[UnifiedSubmission] Uploading file ${i + 1}/${formData.referenceImages.length} to: ${filePath}`);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('food-vision-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error(`[UnifiedSubmission] Upload error for file ${i + 1}:`, uploadError);
          throw new Error(`שגיאה בהעלאת תמונה ${i + 1}: ${uploadError.message}`);
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('food-vision-images')
          .getPublicUrl(filePath);
        
        uploadedImageUrls.push(publicUrlData.publicUrl);
      }
    }
    
    // Prepare parameters for RPC
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

    console.log('[UnifiedSubmission] Calling RPC with params:', rpcParams);

    const { data: submissionData, error: submissionError } = await supabase.rpc(
      'public_submit_item_by_restaurant_name',
      rpcParams
    );

    if (submissionError) {
      console.error('[UnifiedSubmission] RPC error:', submissionError);
      throw new Error(`שגיאה בהגשה: ${submissionError.message}`);
    }

    if (submissionData && typeof submissionData === 'object' && submissionData.success) {
      if (submissionData.client_found) {
        toast.success('הפריט הוגש בהצלחה ושויך למסעדה!');
      } else {
        toast.success('הפריט הוגש בהצלחה! המסעדה לא נמצאה במערכת, הפריט ממתין לשיוך ידני.');
      }
      return true;
    } else {
      throw new Error(submissionData?.message || 'הגשה נכשלה - אנא נסו שוב');
    }
  };

  const handleCustomerSubmission = async (
    formData: NewItemFormData,
    clientId: string | null,
    setStepErrors?: (errors: Record<string, string>) => void
  ): Promise<boolean> => {
    console.log('[UnifiedSubmission] Handling customer submission...');
    
    if (!clientId) {
      toast.error("שגיאה: לא זוהה מזהה לקוח. אנא התחברו או השלימו את פרטי המסעדה.");
      setStepErrors?.({ submit: "יש להשלים את פרטי המסעדה או להתחבר לפני ההגשה." });
      return false;
    }

    let newItemId = uuidv4();

    // Upload images
    const uploadPromises = formData.referenceImages.map(async (file) => {
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `${newItemId}/${uuidv4()}.${fileExtension}`;
      const filePath = `${clientId}/${formData.itemType}/${uniqueFileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('food-vision-images')
        .upload(filePath, file);
      if (uploadError) {
        console.error(`Upload error for ${file.name}:`, uploadError);
        throw new Error(`שגיאה בהעלאת קובץ ${file.name}: ${uploadError.message}`);
      }
      
      const { data: publicUrlData } = supabase.storage.from('food-vision-images').getPublicUrl(filePath);
      if (!publicUrlData || !publicUrlData.publicUrl) {
        console.error(`Public URL error for ${file.name}`);
        throw new Error(`שגיאה בקבלת URL ציבורי עבור ${file.name}`);
      }
      return publicUrlData.publicUrl;
    });
    
    const resolvedUploadedImageUrls = await Promise.all(uploadPromises);

    // Insert item into appropriate table
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
      reference_image_urls: resolvedUploadedImageUrls,
      [itemIdColumn]: newItemId,
    };

    const { error: genericInsertError } = await supabase.from(itemTable as any).insert(itemData);

    if (genericInsertError) {
      console.error(`Error inserting item (${formData.itemType}):`, genericInsertError);
      throw new Error(`שגיאה ביצירת הפריט: ${genericInsertError.message}`);
    }
    
    // Create submission record
    const submissionToInsert = {
      client_id: clientId,
      original_item_id: newItemId,
      item_type: formData.itemType,
      item_name_at_submission: formData.itemName,
      submission_status: 'ממתינה לעיבוד' as const,
    };
    
    const { error: submissionInsertError } = await supabase.from('customer_submissions').insert(submissionToInsert);

    if (submissionInsertError) {
      console.error("Error inserting submission:", submissionInsertError);
      await supabase.from(itemTable as any).delete().eq(itemIdColumn, newItemId);
      throw new Error(`שגיאה בשמירת ההגשה: ${submissionInsertError.message}`);
    }

    toast.success("הפריט הוגש בהצלחה!");
    navigate('/customer/home');
    return true;
  };

  return {
    isSubmitting,
    submitForm
  };
};
