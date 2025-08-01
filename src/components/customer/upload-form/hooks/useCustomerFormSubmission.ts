import { useState } from 'react';
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { triggerMakeWebhook, MakeWebhookPayload } from '@/lib/triggerMakeWebhook';
import { NewItemFormData } from '@/contexts/NewItemFormContext';
import { sanitizePathComponent } from '@/utils/pathSanitization';

interface UseCustomerFormSubmissionProps {
  clientId: string | null;
  formData: NewItemFormData;
  remainingDishes: number | undefined;
  setStepErrors: (errors: Record<string, string>) => void;
  resetFormData: () => void;
}

export const useCustomerFormSubmission = ({
  clientId,
  formData,
  remainingDishes,
  setStepErrors,
  resetFormData
}: UseCustomerFormSubmissionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (): Promise<boolean> => {
    console.log('[CustomerFormSubmission] Starting submission for customer with clientId:', clientId);
    console.log('[CustomerFormSubmission] Total dishes to submit:', formData.dishes.length);
    
    // Validation
    if (!formData.restaurantName?.trim()) {
      console.log('[CustomerFormSubmission] Missing restaurant name');
      toast.error("שם המסעדה הוא שדה חובה.");
      setStepErrors({ restaurantName: "שם המסעדה הוא שדה חובה." });
      return false;
    }

    if (!formData.submitterName?.trim()) {
      console.log('[CustomerFormSubmission] Missing submitter name');
      toast.error("שם איש הקשר הוא שדה חובה.");
      setStepErrors({ submitterName: "שם איש הקשר הוא שדה חובה." });
      return false;
    }

    // Validate each dish
    for (const dish of formData.dishes) {
      if (!dish.itemName?.trim()) {
        console.log('[CustomerFormSubmission] Missing item name for dish:', dish.id);
        toast.error(`שם הפריט הוא שדה חובה למנה ${dish.id}.`);
        setStepErrors({ itemName: `שם הפריט הוא שדה חובה למנה ${dish.id}.` });
        return false;
      }

      if (!dish.itemType) {
        console.log('[CustomerFormSubmission] Missing item type for dish:', dish.id);
        toast.error(`סוג הפריט הוא שדה חובה למנה ${dish.id}.`);
        setStepErrors({ itemType: `סוג הפריט הוא שדה חובה למנה ${dish.id}.` });
        return false;
      }

      if (dish.referenceImages.length < 4) {
        toast.error(`יש להעלות לפחות 4 תמונות למנה ${dish.id}.`);
        setStepErrors({ referenceImages: `יש להעלות לפחות 4 תמונות למנה ${dish.id}.` });
        return false;
      }
    }

    // For non-authenticated users, we'll create submissions without clientId
    // For authenticated users, we check remaining dishes
    if (clientId && remainingDishes !== undefined && remainingDishes < formData.dishes.length) {
      const noDishesError = `אין לכם/ן מספיק מנות נותרות בחבילה. נדרשות ${formData.dishes.length} מנות, נותרות ${remainingDishes}.`;
      setStepErrors({ submit: noDishesError });
      toast.error(noDishesError);
      return false;
    }

    setIsSubmitting(true);
    toast.info(`מעלה תמונות ושומר ${formData.dishes.length} הגשות...`);

    let submissionSuccessful = false;
    const createdSubmissions: any[] = [];

    try {
      console.log('[CustomerFormSubmission] Processing each dish separately...');
      
      // Process each dish as a separate submission
      for (const dish of formData.dishes) {
        console.log(`[CustomerFormSubmission] Processing dish ${dish.id}: ${dish.itemName}`);
        
        let newItemId = uuidv4();

        // Upload images for this dish
        const uploadPromises = dish.referenceImages.map(async (file: File) => {
          const fileExtension = file.name.split('.').pop();
          const uniqueFileName = `${newItemId}/${uuidv4()}.${fileExtension}`;
          // For non-authenticated users, use 'guest' as folder name
          const folderName = clientId || 'guest';
          // Sanitize itemType to prevent Hebrew character issues in storage paths
          const sanitizedItemType = sanitizePathComponent(dish.itemType);
          const filePath = `${folderName}/${sanitizedItemType}/${uniqueFileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('food-vision-images')
            .upload(filePath, file);
          if (uploadError) {
            console.error(`[CustomerFormSubmission] Upload error for ${file.name}:`, uploadError);
            throw new Error(`שגיאה בהעלאת קובץ ${file.name}: ${uploadError.message}`);
          }
          
          const { data: publicUrlData } = supabase.storage.from('food-vision-images').getPublicUrl(filePath);
          if (!publicUrlData || !publicUrlData.publicUrl) {
            console.error(`[CustomerFormSubmission] Public URL error for ${file.name}`);
            throw new Error(`שגיאה בקבלת URL ציבורי עבור ${file.name}`);
          }
          return publicUrlData.publicUrl;
        });
        
        const resolvedUploadedImageUrls = await Promise.all(uploadPromises);
        console.log(`[CustomerFormSubmission] Images uploaded for dish ${dish.id}`);

        // Upload custom style files if they exist
        let inspirationImageUrls: string[] = [];
        let brandingMaterialUrls: string[] = [];

        if (formData.customStyle) {
          console.log(`[CustomerFormSubmission] Processing custom style files for dish ${dish.id}`);
          
          // Upload inspiration images
          if (formData.customStyle.inspirationImages && formData.customStyle.inspirationImages.length > 0) {
            const inspirationUploadPromises = formData.customStyle.inspirationImages.map(async (file: File) => {
              const fileExtension = file.name.split('.').pop();
              const uniqueFileName = `inspiration/${uuidv4()}.${fileExtension}`;
              const folderName = clientId || 'guest';
              const filePath = `${folderName}/custom-style/${uniqueFileName}`;
              
              const { error: uploadError } = await supabase.storage
                .from('food-vision-images')
                .upload(filePath, file);
              
              if (uploadError) {
                throw new Error(`שגיאה בהעלאת תמונת השראה ${file.name}: ${uploadError.message}`);
              }
              
              const { data: publicUrlData } = supabase.storage
                .from('food-vision-images')
                .getPublicUrl(filePath);
              
              if (!publicUrlData?.publicUrl) {
                throw new Error(`שגיאה בקבלת URL עבור תמונת השראה ${file.name}`);
              }

              return publicUrlData.publicUrl;
            });

            inspirationImageUrls = await Promise.all(inspirationUploadPromises);
            console.log(`[CustomerFormSubmission] Uploaded ${inspirationImageUrls.length} inspiration images`);
          }

          // Upload branding materials
          if (formData.customStyle.brandingMaterials && formData.customStyle.brandingMaterials.length > 0) {
            const brandingUploadPromises = formData.customStyle.brandingMaterials.map(async (file: File) => {
              const fileExtension = file.name.split('.').pop();
              const uniqueFileName = `branding/${uuidv4()}.${fileExtension}`;
              const folderName = clientId || 'guest';
              const filePath = `${folderName}/custom-style/${uniqueFileName}`;
              
              const { error: uploadError } = await supabase.storage
                .from('food-vision-images')
                .upload(filePath, file);
              
              if (uploadError) {
                throw new Error(`שגיאה בהעלאת חומר מיתוג ${file.name}: ${uploadError.message}`);
              }
              
              const { data: publicUrlData } = supabase.storage
                .from('food-vision-images')
                .getPublicUrl(filePath);
              
              if (!publicUrlData?.publicUrl) {
                throw new Error(`שגיאה בקבלת URL עבור חומר מיתוג ${file.name}`);
              }

              return publicUrlData.publicUrl;
            });

            brandingMaterialUrls = await Promise.all(brandingUploadPromises);
            console.log(`[CustomerFormSubmission] Uploaded ${brandingMaterialUrls.length} branding materials`);
          }
        }

        // Insert item into appropriate table
        const tableNameMap: Record<string, string> = {
          dish: 'dishes',
          cocktail: 'cocktails',
          drink: 'drinks',
        };
        
        const tableName = tableNameMap[dish.itemType] || 'dishes';
        console.log(`[CustomerFormSubmission] Inserting dish ${dish.id} into ${tableName} table`);

        const itemData = {
          client_id: clientId || null, // Include client_id for RLS policies
          name: dish.itemName,
          description: dish.description || null,
          notes: dish.specialNotes || null,
          reference_image_urls: resolvedUploadedImageUrls,
        };

        const { data: insertedItemData, error: itemInsertError } = await (supabase as any)
          .from(tableName)
          .insert(itemData)
          .select()
          .single();

        if (itemInsertError) {
          console.error(`[CustomerFormSubmission] Error inserting dish ${dish.id} into ${tableName}:`, itemInsertError);
          throw new Error(`שגיאה בשמירת מנה ${dish.id}: ${itemInsertError.message}`);
        }

        console.log(`[CustomerFormSubmission] Dish ${dish.id} inserted successfully:`, insertedItemData);

        // Create submission record for this dish with custom style data
        const submissionData = {
          client_id: clientId || null, // Allow null for non-authenticated users
          original_item_id: insertedItemData.id, // All item tables use 'id' as primary key
          item_type: dish.itemType,
          item_name_at_submission: dish.itemName,
          submission_status: 'ממתינה לעיבוד',
          original_image_urls: resolvedUploadedImageUrls,
          // Store restaurant and submitter info for non-authenticated users
          restaurant_name: formData.restaurantName || null,
          contact_name: formData.submitterName || null, // Column is called 'contact_name' not 'submitter_name'
          // Include custom style data
          branding_material_urls: brandingMaterialUrls.length > 0 ? brandingMaterialUrls : null,
          reference_example_urls: inspirationImageUrls.length > 0 ? inspirationImageUrls : null,
          description: formData.customStyle?.instructions ? 
            `${dish.description || ''}${dish.description && formData.customStyle.instructions ? '\n\nהוראות סגנון מותאם אישית:\n' : ''}${formData.customStyle.instructions || ''}` : 
            dish.description || null,
        };

        const { data: submissionRecord, error: submissionError } = await (supabase as any)
          .from('customer_submissions')
          .insert(submissionData)
          .select()
          .single();

        if (submissionError) {
          console.error(`[CustomerFormSubmission] Error creating submission for dish ${dish.id}:`, submissionError);
          throw new Error(`שגיאה ביצירת הגשה למנה ${dish.id}: ${submissionError.message}`);
        }

        console.log(`[CustomerFormSubmission] Submission created successfully for dish ${dish.id}:`, submissionRecord);
        createdSubmissions.push(submissionRecord);
        
        // Deduct serving for authenticated clients
        if (clientId) {
          try {
            const { updateClientServings } = await import('@/api/clientApi');
            const { data: client } = await supabase
              .from('clients')
              .select('remaining_servings, restaurant_name')
              .eq('client_id', clientId)
              .single();
            
            if (client && client.remaining_servings > 0) {
              const newServingsCount = client.remaining_servings - 1;
              const notes = `ניכוי עבור הגשה חדשה: ${dish.itemName}`;
              await updateClientServings(clientId, newServingsCount, notes);
              console.log(`[CustomerFormSubmission] Deducted 1 serving for dish ${dish.id}. Remaining: ${newServingsCount}`);
            }
          } catch (deductionError) {
            console.warn(`[CustomerFormSubmission] Failed to deduct serving for dish ${dish.id}:`, deductionError);
            // Don't fail the submission if deduction fails
          }
        }
      }
      
      submissionSuccessful = true;
      
      toast.success(`${formData.dishes.length} הגשות הושלמו בהצלחה!`);
      setShowSuccessModal(true);
      return true;

    } catch (error: any) {
      console.error('[CustomerFormSubmission] Error during submission:', error);
      
      const errorMessage = error.message || "אירעה שגיאה בעת שליחת הטופס. אנא נסו שוב.";
      toast.error(errorMessage);
      setStepErrors({ submit: errorMessage });
      
      return false;
    } finally {
      setIsSubmitting(false);
      if (submissionSuccessful && createdSubmissions.length > 0) {
        // Trigger webhook for each successful submission
        try {
          for (const submission of createdSubmissions) {
            const dish = formData.dishes.find(d => d.itemName === submission.item_name_at_submission);
            
            let categoryWebhook: string | null = null;
            let ingredientsWebhook: string[] | null = null;
            
            if (submission.item_type === 'cocktail' || submission.item_type === 'drink') {
              ingredientsWebhook = dish?.description?.trim()
                ? dish.description.split(',').map(i => i.trim()).filter(i => i.length > 0)
                : null;
            } else {
              categoryWebhook = dish?.description?.trim() || null;
            }

            const webhookPayload: MakeWebhookPayload = {
              submissionTimestamp: new Date().toISOString(),
              isAuthenticated: !!clientId,
              clientId: clientId,
              restaurantName: formData.restaurantName,
              submitterName: formData.submitterName,
              contactEmail: undefined,
              contactPhone: undefined,
              itemName: submission.item_name_at_submission,
              itemType: submission.item_type,
              description: dish?.description,
              specialNotes: dish?.specialNotes,
              uploadedImageUrls: submission.original_image_urls,
              category: categoryWebhook,
              ingredients: ingredientsWebhook,
              sourceForm: 'customer-upload-form',
            };
            
            await triggerMakeWebhook(webhookPayload);
            console.log(`[CustomerFormSubmission] Webhook triggered for submission ${submission.submission_id}`);
          }
        } catch (webhookError) {
          console.warn('[CustomerFormSubmission] Webhook failed:', webhookError);
        }
      }
    }
  };

  const handleCloseSuccessModal = () => {
    console.log('[CustomerFormSubmission] Closing success modal');
    setShowSuccessModal(false);
  };

  return {
    handleSubmit,
    isSubmitting,
    showSuccessModal,
    handleCloseSuccessModal
  };
}; 