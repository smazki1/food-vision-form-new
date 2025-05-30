
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
  submitterName?: string; // Add submitter name
}

export const handlePublicSubmission = async (
  formData: FormData,
  uploadedImageUrls: string[]
) => {
  console.log('[PublicSubmission] Submitting for public user');
  
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
    p_description: formData.description?.trim() || undefined,
    p_category: category || undefined,
    p_ingredients: ingredients,
    p_reference_image_urls: uploadedImageUrls,
    // Add contact information for automatic lead creation
    p_contact_name: formData.submitterName?.trim() || undefined,
    p_contact_email: formData.contactEmail?.trim() || undefined,
    p_contact_phone: formData.contactPhone?.trim() || undefined,
  };

  console.log('[PublicSubmission] Calling RPC with params:', rpcParams);

  const { data: submissionData, error: submissionError } = await supabase.rpc(
    'public_submit_item_by_restaurant_name',
    rpcParams
  );

  if (submissionError) {
    console.error('[PublicSubmission] RPC error:', submissionError);
    throw new Error(`שגיאה בהגשה: ${submissionError.message}`);
  }

  console.log('[PublicSubmission] RPC response:', submissionData);

  if (submissionData && typeof submissionData === 'object' && submissionData.success) {
    if (submissionData.client_found) {
      toast.success('הפריט הוגש בהצלחה ושויך למסעדה!');
    } else if (submissionData.lead_created) {
      toast.success('הפריט הוגש בהצלחה! נוצר ליד חדש למסעדה במערכת.');
    } else {
      toast.success('הפריט הוגש בהצלחה! המסעדה לא נמצאה במערכת, הפריט ממתין לשיוך ידני.');
    }
  } else {
    throw new Error(submissionData?.message || 'הגשה נכשלה - אנא נסו שוב');
  }
};
