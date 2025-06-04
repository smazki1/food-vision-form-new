import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AuthenticatedSubmissionData {
  restaurantName: string;
  itemName: string;
  itemType: string;
  description?: string;
  specialNotes?: string;
  referenceImages: File[];
}

interface FormData {
  restaurantName: string;
  contactEmail: string;
  contactPhone: string;
  itemName: string;
  itemType: string;
  description: string;
  specialNotes: string;
  referenceImages: File[];
}

export const handleAuthenticatedSubmission = async (
  formData: FormData,
  clientId: string,
  uploadedImageUrls: string[]
) => {
  console.log('[AuthenticatedSubmission] Submitting for authenticated user with clientId:', clientId);
  
  const newItemId = uuidv4();
  
  // Only create item records for known types (dish, cocktail, drink)
  // For custom types (jewelry, etc.), we'll only create submission records
  const tableNameMap: Record<string, string> = {
    dish: 'dishes',
    cocktail: 'cocktails',
    drink: 'drinks',
  };
  
  const itemTable = tableNameMap[formData.itemType];
  
  // Only insert into specific item table if it's a known type
  if (itemTable) {
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
      console.error('[AuthenticatedSubmission] Item insert error:', itemInsertError);
      throw new Error(`שגיאה ביצירת הפריט: ${itemInsertError.message}`);
    }
  }

  // Always create submission record for all item types
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
    console.error('[AuthenticatedSubmission] Submission error:', submitError);
    // Only rollback item creation if we created one
    if (itemTable) {
      const itemIdColumn = `${formData.itemType}_id`;
      await supabase.from(itemTable as any).delete().eq(itemIdColumn, newItemId);
    }
    throw new Error(`שגיאה בשמירת ההגשה: ${submitError.message}`);
  }

  console.log('[AuthenticatedSubmission] Submission successful for authenticated user');
  toast.success('הפריט הוגש בהצלחה!');
};
