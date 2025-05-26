
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { NewItemFormData, ItemType } from '@/contexts/NewItemFormContext';

type SupportedItemType = 'dish' | 'cocktail' | 'drink';

export const useFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (
    formData: NewItemFormData,
    clientId: string | null,
    remainingDishes: number | undefined,
    setStepErrors: (errors: Record<string, string>) => void
  ) => {
    if (!clientId) {
      toast.error("שגיאה: לא זוהה מזהה לקוח. אנא התחברו או השלימו את פרטי המסעדה.");
      setStepErrors({ submit: "יש להשלים את פרטי המסעדה או להתחבר לפני ההגשה." });
      return false;
    }

    if (remainingDishes !== undefined && remainingDishes <= 0) {
      const noDishesError = "אין לכם/ן מספיק מנות נותרות בחבילה כדי לבצע הגשה זו.";
      setStepErrors({ submit: noDishesError }); 
      toast.error(noDishesError);
      return false;
    }

    setIsSubmitting(true);
    toast.info("מעלים תמונות ושומרים הגשה...");
    let newItemId = uuidv4();

    try {
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

      const tableNameMap: Record<SupportedItemType, string> = {
        dish: 'dishes',
        cocktail: 'cocktails',
        drink: 'drinks',
      };
      
      if (!formData.itemType || !Object.keys(tableNameMap).includes(formData.itemType)) {
        throw new Error(`סוג פריט לא נתמך או חסר: ${formData.itemType}`);
      }

      const itemTable = tableNameMap[formData.itemType as SupportedItemType];
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
        console.error(`Error inserting item (${formData.itemType}). Error object:`, JSON.stringify(genericInsertError, null, 2));
        let detailedMessage = `שגיאה ביצירת הפריט (${formData.itemType})`;
        if (genericInsertError.message) {
          detailedMessage += `: ${genericInsertError.message}`;
        } else if (genericInsertError.details) {
          detailedMessage += `: ${genericInsertError.details}`;
        } else if (genericInsertError.hint) {
          detailedMessage += ` (רמז: ${genericInsertError.hint})`;
        }
        if (Object.keys(genericInsertError).length === 0) {
          detailedMessage += ". נראה שהייתה בעיה כללית בגישה לטבלה או בהרשאות. יש לבדוק את הגדרות ה-RLS ב-Supabase.";
        }
        throw new Error(detailedMessage);
      }
      
      const submissionToInsert = {
        client_id: clientId,
        original_item_id: newItemId,
        item_type: formData.itemType as ItemType,
        item_name_at_submission: formData.itemName,
        submission_status: 'ממתינה לעיבוד' as const,
      };
      const { error: submissionInsertError } = await supabase.from('customer_submissions').insert(submissionToInsert);

      if (submissionInsertError) {
        console.error("Error inserting submission, attempting to rollback item:", submissionInsertError);
        await supabase.from(itemTable as any).delete().eq(itemIdColumn, newItemId);
        console.warn("Item rollback attempted for item ID:", newItemId, "from table:", itemTable);
        throw new Error(`שגיאה בשמירת ההגשה: ${submissionInsertError.message}. פרטי הפריט לא נשמרו.`);
      }

      toast.success("הפריט הוגש בהצלחה!");
      navigate('/customer/home');
      return true;

    } catch (error: any) {
      console.error("Submission process error:", error);
      const submissionErrorMessage = error.message || "אירעה שגיאה במהלך ההגשה. נסו שוב.";
      setStepErrors({ submit: submissionErrorMessage });
      toast.error(submissionErrorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting
  };
};
