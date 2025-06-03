import { useState } from 'react';
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { triggerMakeWebhook, MakeWebhookPayload } from '@/lib/triggerMakeWebhook';

export const useFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (
    formData: any,
    clientId: string | null,
    remainingDishes: number | undefined,
    setStepErrors: (errors: Record<string, string>) => void,
    restaurantName?: string,
    submitterName?: string
  ) => {
    console.log('[FormSubmission] Starting submission for customer with clientId:', clientId);
    
    // Validation
    if (!formData.itemName?.trim()) {
      console.log('[FormSubmission] Missing item name');
      toast.error("שם הפריט הוא שדה חובה.");
      setStepErrors({ itemName: "שם הפריט הוא שדה חובה." });
      return false;
    }

    if (!formData.itemType) {
      console.log('[FormSubmission] Missing item type');
      toast.error("סוג הפריט הוא שדה חובה.");
      setStepErrors({ itemType: "סוג הפריט הוא שדה חובה." });
      return false;
    }

    if (formData.referenceImages.length < 4) {
      toast.error("יש להעלות לפחות 4 תמונות.");
      setStepErrors({ referenceImages: "יש להעלות לפחות 4 תמונות." });
      return false;
    }

    if (!clientId) {
      toast.error("שגיאה: לא זוהה מזהה לקוח. אנא התחברו מחדש.");
      setStepErrors({ submit: "יש להתחבר מחדש לפני ההגשה." });
      return false;
    }

    // Check remaining dishes
    if (remainingDishes !== undefined && remainingDishes <= 0) {
      const noDishesError = "אין לכם/ן מספיק מנות נותרות בחבילה כדי לבצע הגשה זו.";
      setStepErrors({ submit: noDishesError });
      toast.error(noDishesError);
      return false;
    }

    setIsSubmitting(true);
    toast.info("מעלה תמונות ושומר הגשה...");

    let submissionSuccessful = false;
    let resolvedUploadedImageUrls: string[] = [];

    try {
      console.log('[FormSubmission] Uploading images...');
      
      let newItemId = uuidv4();

      // Upload images
      const uploadPromises = formData.referenceImages.map(async (file: File) => {
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${newItemId}/${uuidv4()}.${fileExtension}`;
        const filePath = `${clientId}/${formData.itemType}/${uniqueFileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('food-vision-images')
          .upload(filePath, file);
        if (uploadError) {
          console.error(`[FormSubmission] Upload error for ${file.name}:`, uploadError);
          throw new Error(`שגיאה בהעלאת קובץ ${file.name}: ${uploadError.message}`);
        }
        
        const { data: publicUrlData } = supabase.storage.from('food-vision-images').getPublicUrl(filePath);
        if (!publicUrlData || !publicUrlData.publicUrl) {
          console.error(`[FormSubmission] Public URL error for ${file.name}`);
          throw new Error(`שגיאה בקבלת URL ציבורי עבור ${file.name}`);
        }
        return publicUrlData.publicUrl;
      });
      
      resolvedUploadedImageUrls = await Promise.all(uploadPromises);
      console.log('[FormSubmission] All images uploaded successfully');

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
        console.error(`[FormSubmission] Error inserting item (${formData.itemType}):`, genericInsertError);
        throw new Error(`שגיאה ביצירת הפריט: ${genericInsertError.message}`);
      }
      
      // Create submission record
      const submissionToInsert = {
        client_id: clientId,
        original_item_id: newItemId,
        item_type: formData.itemType,
        item_name_at_submission: formData.itemName,
        submission_status: 'ממתינה לעיבוד' as const,
        original_image_urls: resolvedUploadedImageUrls
      };
      
      const { error: submissionInsertError } = await supabase.from('customer_submissions').insert(submissionToInsert);

      if (submissionInsertError) {
        console.error("[FormSubmission] Error inserting submission:", submissionInsertError);
        await supabase.from(itemTable as any).delete().eq(itemIdColumn, newItemId);
        throw new Error(`שגיאה בשמירת ההגשה: ${submissionInsertError.message}`);
      }

      console.log('[FormSubmission] Submission successful');
      toast.success("הפריט הוגש בהצלחה!");
      
      // Show success modal instead of navigating
      console.log('[FormSubmission] Setting showSuccessModal to true');
      setShowSuccessModal(true);
      submissionSuccessful = true;
      return true;
    } catch (error: any) {
      console.error("[FormSubmission] Error in submission process:", error);
      const errorMessage = error.message || "אירעה שגיאה במהלך ההגשה. נסו שוב.";
      setStepErrors({ submit: errorMessage });
      toast.error(errorMessage);
      submissionSuccessful = false;
      return false;
    } finally {
      setIsSubmitting(false);
      if (submissionSuccessful && clientId) {
        let categoryWebhook: string | null = null;
        let ingredientsWebhook: string[] | null = null;
        if (formData.itemType === 'cocktail') {
          ingredientsWebhook = formData.description?.trim()
            ? formData.description.split(',').map((i: string) => i.trim()).filter((i: string) => i.length > 0)
            : null;
        } else {
          categoryWebhook = formData.description?.trim() || null;
        }

        const webhookPayload: MakeWebhookPayload = {
          submissionTimestamp: new Date().toISOString(),
          isAuthenticated: true,
          clientId: clientId,
          restaurantName: restaurantName || 'N/A (Legacy Customer Form)',
          submitterName: submitterName,
          itemName: formData.itemName,
          itemType: formData.itemType,
          description: formData.description,
          specialNotes: formData.specialNotes,
          uploadedImageUrls: resolvedUploadedImageUrls,
          category: categoryWebhook,
          ingredients: ingredientsWebhook,
          sourceForm: 'legacy-customer-form',
        };
        triggerMakeWebhook(webhookPayload);
      }
    }
  };

  const handleCloseSuccessModal = () => {
    console.log('[FormSubmission] Closing success modal');
    setShowSuccessModal(false);
  };

  return {
    handleSubmit,
    isSubmitting,
    showSuccessModal,
    handleCloseSuccessModal
  };
};
