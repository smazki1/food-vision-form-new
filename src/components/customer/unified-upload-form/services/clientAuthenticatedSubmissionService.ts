import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NewItemFormData } from '@/contexts/NewItemFormContext';

export const handleClientAuthenticatedSubmission = async (
  formData: NewItemFormData,
  clientId: string,
  uploadedImageUrls: string[]
) => {
  console.log('[ClientAuthenticatedSubmission] Submitting for authenticated user with clientId:', clientId);
  
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
    console.error('[ClientAuthenticatedSubmission] Item insert error:', itemInsertError);
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
    console.error('[ClientAuthenticatedSubmission] Submission error:', submitError);
    await supabase.from(itemTable as any).delete().eq(itemIdColumn, newItemId);
    throw new Error(`שגיאה בשמירת ההגשה: ${submitError.message}`);
  }

  console.log('[ClientAuthenticatedSubmission] Submission successful for authenticated user');
  toast.success('הפריט הוגש בהצלחה!');
}; 