import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export const handlePublicSubmission = async (
  formData: FormData,
  uploadedImageUrls: string[]
) => {
  console.log('[PublicSubmission] Submitting for public user. Raw formData:', formData);
  
  let p_category: string | null = null;
  let p_ingredients: string[] | null = null;
  let p_description: string | null = formData.specialNotes?.trim() || null;

  if (formData.itemType === 'cocktail') {
    p_ingredients = formData.description?.trim() 
      ? formData.description.split(',').map(i => i.trim()).filter(i => i.length > 0) 
      : null;
  } else if (formData.itemType === 'dish' || formData.itemType === 'drink') {
    p_category = formData.description?.trim() || null;
  }

  const rpcParams = {
    p_restaurant_name: formData.restaurantName.trim(),
    p_item_type: formData.itemType.toLowerCase() as 'dish' | 'cocktail' | 'drink',
    p_item_name: formData.itemName.trim(),
    p_description: p_description,
    p_category: p_category,
    p_ingredients: p_ingredients,
    p_reference_image_urls: uploadedImageUrls,
  };

  console.log('[PublicSubmission] Calling RPC public_submit_item_by_restaurant_name with detailed params:', 
    JSON.stringify(rpcParams, null, 2)
  );

  const { data: submissionData, error: submissionError } = await supabase.rpc(
    'public_submit_item_by_restaurant_name',
    rpcParams
  );

  if (submissionError) {
    console.error('[PublicSubmission] RPC error:', submissionError);
    toast.error(`שגיאה בהגשה: ${submissionError.message}`);
    throw new Error(`שגיאה בהגשה: ${submissionError.message}`);
  }

  console.log('[PublicSubmission] RPC success. Response:', submissionData);

  if (submissionData && (typeof submissionData === 'boolean' || (typeof submissionData === 'object' && submissionData.success))) {
    const resultMessage = typeof submissionData === 'object' && submissionData.message ? submissionData.message :
                          (typeof submissionData === 'object' && submissionData.client_found ? 'הפריט הוגש בהצלחה ושויך למסעדה!' : 'הפריט הוגש בהצלחה! המסעדה לא נמצאה במערכת, הפריט ממתין לשיוך ידני.');
    toast.success(resultMessage);
  } else if (submissionData && typeof submissionData === 'object' && !submissionData.success && submissionData.message) {
    console.error('[PublicSubmission] RPC returned success:false with message:', submissionData.message);
    toast.error(submissionData.message); 
    throw new Error(submissionData.message);
  } else {
    console.error('[PublicSubmission] RPC returned unexpected data structure:', submissionData);
    toast.error('הגשה נכשלה - תגובה לא צפויה מהשרת');
    throw new Error('הגשה נכשלה - תגובה לא צפויה מהשרת');
  }
};
