import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FormData {
  restaurantName: string;
  contactEmail: string;
  contactPhone: string;
  itemName: string;
  itemType: string;
  description: string;
  specialNotes: string;
  referenceImages: File[];
  brandingMaterials?: File[];
  referenceExamples?: File[];
  submitterName?: string;
}

export const handlePublicSubmission = async (
  formData: FormData,
  uploadedImageUrls: string[],
  brandingMaterialUrls: string[] = [],
  referenceExampleUrls: string[] = []
) => {
  console.log('[PublicSubmission] Submitting for public user');
  console.log('[PublicSubmission] Additional files:', { 
    brandingMaterials: brandingMaterialUrls.length, 
    referenceExamples: referenceExampleUrls.length 
  });
  
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
    p_item_type: formData.itemType,
    p_item_name: formData.itemName.trim(),
    p_description: formData.description?.trim() || null,
    p_category: category || null,
    p_ingredients: ingredients || null,
    p_reference_image_urls: uploadedImageUrls,
    p_branding_material_urls: brandingMaterialUrls,
    p_reference_example_urls: referenceExampleUrls,
    p_contact_name: formData.submitterName?.trim() || null,
    p_contact_email: formData.contactEmail?.trim() || null,
    p_contact_phone: formData.contactPhone?.trim() || null,
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
