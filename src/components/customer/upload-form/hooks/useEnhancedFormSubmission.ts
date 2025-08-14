import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { triggerMakeWebhook, MakeWebhookPayload } from '@/lib/triggerMakeWebhook';
import { sanitizePathComponent } from '@/utils/pathSanitization';
import { compressImagesBatch, formatFileSize } from '@/utils/imageCompression';
import { NewItemFormData } from '@/contexts/NewItemFormContext';
import { UploadProgressData, UploadStep } from '../components/UploadProgressModal';
import { PublicSubmissionData } from '@/hooks/usePublicSubmissions';

interface UseEnhancedFormSubmissionProps {
  clientId: string | null;
  formData: NewItemFormData;
  remainingDishes: number | undefined;
  setStepErrors: (errors: Record<string, string>) => void;
  resetFormData: () => void;
}

export const useEnhancedFormSubmission = ({
  clientId,
  formData,
  remainingDishes,
  setStepErrors,
  resetFormData
}: UseEnhancedFormSubmissionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressData, setProgressData] = useState<UploadProgressData>({
    currentStep: 0,
    totalSteps: 4,
    overallProgress: 0,
    steps: [
      {
        id: 'compress',
        name: 'דחיסת תמונות',
        status: 'pending',
        progress: 0,
        details: ''
      },
      {
        id: 'upload',
        name: 'העלאת תמונות',
        status: 'pending',
        progress: 0,
        details: ''
      },
      {
        id: 'database',
        name: 'שמירה במערכת',
        status: 'pending',
        progress: 0,
        details: ''
      },
      {
        id: 'webhook',
        name: 'התראות',
        status: 'pending',
        progress: 0,
        details: ''
      }
    ],
    currentDish: 0,
    totalDishes: 0,
    canCancel: true,
    isComplete: false
  });
  
  const cancelRef = useRef(false);

  const updateProgress = useCallback((updates: Partial<UploadProgressData>) => {
    setProgressData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateStepProgress = useCallback((stepId: string, progress: number, details?: string, error?: string) => {
    setProgressData(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId 
          ? { 
              ...step, 
              progress, 
              details,
              error,
              status: error ? 'error' : progress === 100 ? 'completed' : 'in-progress'
            }
          : step
      )
    }));
  }, []);

  const calculateOverallProgress = useCallback((steps: UploadStep[]) => {
    const totalProgress = steps.reduce((sum, step) => sum + step.progress, 0);
    return totalProgress / steps.length;
  }, []);

  const initializeProgress = useCallback((totalDishes: number) => {
    const steps: UploadStep[] = [
      {
        id: 'compress',
        name: 'דחיסת תמונות',
        status: 'pending',
        progress: 0,
        details: 'מכין תמונות להעלאה...'
      },
      {
        id: 'upload',
        name: 'העלאת תמונות',
        status: 'pending',
        progress: 0,
        details: 'מעלה תמונות לשרת...'
      },
      {
        id: 'database',
        name: 'שמירה במערכת',
        status: 'pending',
        progress: 0,
        details: 'יוצר רכומות במסד הנתונים...'
      },
      {
        id: 'webhook',
        name: 'התראות',
        status: 'pending',
        progress: 0,
        details: 'שולח התראות...'
      }
    ];

    setProgressData({
      currentStep: 0,
      totalSteps: 4,
      overallProgress: 0,
      steps,
      currentDish: 0,
      totalDishes,
      canCancel: true,
      isComplete: false
    });
  }, []);

  const handleCancel = useCallback(() => {
    cancelRef.current = true;
    setProgressData(prev => ({ ...prev, canCancel: false }));
    toast.info('מבטל העלאה...');
  }, []);

  const processImageCompression = async (dishes: typeof formData.dishes) => {
    updateStepProgress('compress', 0, 'מתחיל דחיסת תמונות...');
    
    const compressedDishes = await Promise.all(
      dishes.map(async (dish, dishIndex) => {
        if (cancelRef.current) throw new Error('Upload cancelled');
        
        updateStepProgress('compress', 
          (dishIndex / dishes.length) * 50, 
          `דוחס תמונות של ${dish.itemName}...`
        );

        const compressedImages = await compressImagesBatch(
          dish.referenceImages,
          { maxWidth: 1920, maxHeight: 1080, quality: 0.85 },
          3, // concurrency
          (completed, total) => {
            const dishProgress = (completed / total) * 100;
            const overallProgress = ((dishIndex / dishes.length) * 50) + (dishProgress / dishes.length / 2);
            updateStepProgress('compress', overallProgress, 
              `דוחס תמונות של ${dish.itemName}: ${completed}/${total}`
            );
          }
        );

        return { ...dish, referenceImages: compressedImages };
      })
    );

    updateStepProgress('compress', 100, 'דחיסת תמונות הושלמה');
    return compressedDishes;
  };

  const processImageUploads = async (dishes: any[]) => {
    updateStepProgress('upload', 0, 'מתחיל העלאת תמונות...');
    
    const dishesWithUrls = await Promise.all(
      dishes.map(async (dish, dishIndex) => {
        if (cancelRef.current) throw new Error('Upload cancelled');
        
        updateProgress({ currentDish: dishIndex + 1, dishName: dish.itemName });
        updateStepProgress('upload', 
          (dishIndex / dishes.length) * 100, 
          `מעלה תמונות של ${dish.itemName}...`
        );

        const newItemId = uuidv4();
        const folderName = clientId || 'guest';
        const sanitizedItemType = sanitizePathComponent(dish.itemType);

        const uploadPromises = dish.referenceImages.map(async (file: File, fileIndex: number) => {
          if (cancelRef.current) throw new Error('Upload cancelled');
          
          const fileExtension = file.name.split('.').pop();
          const uniqueFileName = `${newItemId}/${uuidv4()}.${fileExtension}`;
          const filePath = `${folderName}/${sanitizedItemType}/${uniqueFileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('food-vision-images')
            .upload(filePath, file);
          
          if (uploadError) {
            throw new Error(`שגיאה בהעלאת ${file.name}: ${uploadError.message}`);
          }
          
          const { data: publicUrlData } = supabase.storage
            .from('food-vision-images')
            .getPublicUrl(filePath);
          
          if (!publicUrlData?.publicUrl) {
            throw new Error(`שגיאה בקבלת URL עבור ${file.name}`);
          }

          // Update progress for individual file upload
          const fileProgress = ((fileIndex + 1) / dish.referenceImages.length) * 100;
          const dishProgress = ((dishIndex + (fileProgress / 100)) / dishes.length) * 100;
          updateStepProgress('upload', dishProgress, 
            `העלה ${fileIndex + 1}/${dish.referenceImages.length} תמונות של ${dish.itemName}`
          );
          
          return publicUrlData.publicUrl;
        });

        const uploadedImageUrls = await Promise.all(uploadPromises);
        return { ...dish, uploadedImageUrls, newItemId };
      })
    );

    updateStepProgress('upload', 100, 'העלאת תמונות הושלמה');
    return dishesWithUrls;
  };

  const processDatabaseOperations = async (dishesWithUrls: any[]) => {
    updateStepProgress('database', 0, 'שומר נתונים במסד הנתונים...');
    
    // Require clientId to proceed; otherwise enforce login
    if (!clientId) {
      throw new Error('אנא התחבר/י כדי להגיש.');
    }

    // Original logic for authenticated users ONLY
    if (!clientId) {
      throw new Error('No clientId available for authenticated user flow');
    }

    const createdSubmissions = await Promise.all(
      dishesWithUrls.map(async (dish, dishIndex) => {
        if (cancelRef.current) throw new Error('Upload cancelled');
        
        updateStepProgress('database', 
          (dishIndex / dishesWithUrls.length) * 50, 
          `שומר ${dish.itemName}...`
        );

        // Upload custom style files if they exist
        let inspirationImageUrls: string[] = [];
        let brandingMaterialUrls: string[] = [];

        if (formData.customStyle) {
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
          }
        }

        // Insert item into appropriate table (for authenticated users only)
        const tableNameMap = {
          dish: 'dishes',
          cocktail: 'cocktails',
          drink: 'drinks',
        } as const;
        
        const itemType = dish.itemType as keyof typeof tableNameMap;
        const tableName = tableNameMap[itemType] || 'dishes';
        const itemData = {
          client_id: clientId,
          name: dish.itemName,
          description: dish.description || null,
          notes: dish.specialNotes || null,
          reference_image_urls: dish.uploadedImageUrls,
        };

        let insertedItemData: any;

        // Handle different table types with proper typing
        if (itemType === 'cocktail') {
          const { data, error: itemInsertError } = await (supabase as any)
            .from('cocktails')
            .insert(itemData)
            .select()
            .single();
          
          if (itemInsertError) {
            throw new Error(`שגיאה בשמירת ${dish.itemName}: ${itemInsertError.message}`);
          }
          insertedItemData = data;
        } else if (itemType === 'drink') {
          const { data, error: itemInsertError } = await (supabase as any)
            .from('drinks')
            .insert(itemData)
            .select()
            .single();
          
          if (itemInsertError) {
            throw new Error(`שגיאה בשמירת ${dish.itemName}: ${itemInsertError.message}`);
          }
          insertedItemData = data;
        } else {
          // Default to dishes table
          const { data, error: itemInsertError } = await (supabase as any)
            .from('dishes')
            .insert(itemData)
            .select()
            .single();
          
          if (itemInsertError) {
            throw new Error(`שגיאה בשמירת ${dish.itemName}: ${itemInsertError.message}`);
          }
          insertedItemData = data;
        }

        // Create submission record with custom style data
        const submissionData = {
          client_id: clientId || null,
          original_item_id: insertedItemData.id,
          item_type: dish.itemType,
          item_name_at_submission: dish.itemName,
          submission_status: 'ממתינה לעיבוד',
          original_image_urls: dish.uploadedImageUrls,
          restaurant_name: formData.restaurantName || null,
          contact_name: formData.submitterName || null,
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
          throw new Error(`שגיאה ביצירת הגשה עבור ${dish.itemName}: ${submissionError.message}`);
        }

        // Deduct serving for authenticated clients
        if (clientId) {
          try {
            const { updateClientServings } = await import('@/api/clientApi');
            const { data: client } = await supabase
              .from('clients')
              .select('remaining_servings')
              .eq('client_id', clientId)
              .single();
            
            if (client && client.remaining_servings > 0) {
              const newServingsCount = client.remaining_servings - 1;
              const notes = `ניכוי עבור הגשה חדשה: ${dish.itemName}`;
              await updateClientServings(clientId, newServingsCount, notes);
            }
          } catch (deductionError) {
            console.warn(`Failed to deduct serving for ${dish.itemName}:`, deductionError);
          }
        }

        updateStepProgress('database', 
          ((dishIndex + 1) / dishesWithUrls.length) * 100, 
          `נשמר ${dish.itemName} בהצלחה`
        );

        return { ...submissionRecord, dish };
      })
    );

    updateStepProgress('database', 100, 'שמירה במסד הנתונים הושלמה');
    return createdSubmissions;
  };

  const processWebhooks = async (createdSubmissions: any[]) => {
    updateStepProgress('webhook', 0, 'שולח התראות...');
    
    try {
      await Promise.all(
        createdSubmissions.map(async (submission, index) => {
          if (cancelRef.current) return;
          
          const dish = submission.dish;
          let categoryWebhook: string | null = null;
          let ingredientsWebhook: string[] | null = null;
          
          if (submission.item_type === 'cocktail' || submission.item_type === 'drink') {
            ingredientsWebhook = dish?.description?.trim()
              ? dish.description.split(',').map((i: string) => i.trim()).filter((i: string) => i.length > 0)
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
            sourceForm: 'enhanced-customer-upload-form',
          };
          
          await triggerMakeWebhook(webhookPayload);
          
          updateStepProgress('webhook', 
            ((index + 1) / createdSubmissions.length) * 100, 
            `נשלחה התראה עבור ${submission.item_name_at_submission}`
          );
        })
      );
      
      updateStepProgress('webhook', 100, 'התראות נשלחו בהצלחה');
    } catch (webhookError) {
      console.warn('Webhook failed:', webhookError);
      updateStepProgress('webhook', 100, 'התראות הושלמו (עם שגיאות)');
    }
  };

  const handleSubmit = async (): Promise<boolean> => {
    console.log('[EnhancedFormSubmission] Starting enhanced submission process...');
    
    // Validation
    if (!formData.restaurantName?.trim()) {
      toast.error("שם המסעדה הוא שדה חובה.");
      setStepErrors({ restaurantName: "שם המסעדה הוא שדה חובה." });
      return false;
    }

    if (!formData.submitterName?.trim()) {
      toast.error("שם איש הקשר הוא שדה חובה.");
      setStepErrors({ submitterName: "שם איש הקשר הוא שדה חובה." });
      return false;
    }

    for (const dish of formData.dishes) {
      if (!dish.itemName?.trim()) {
        toast.error(`שם הפריט הוא שדה חובה למנה ${dish.id}.`);
        setStepErrors({ itemName: `שם הפריט הוא שדה חובה למנה ${dish.id}.` });
        return false;
      }

      if (!dish.itemType) {
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

    if (clientId && remainingDishes !== undefined && remainingDishes < formData.dishes.length) {
      const noDishesError = `אין לכם/ן מספיק מנות נותרות בחבילה. נדרשות ${formData.dishes.length} מנות, נותרות ${remainingDishes}.`;
      setStepErrors({ submit: noDishesError });
      toast.error(noDishesError);
      return false;
    }

    setIsSubmitting(true);
    setShowProgressModal(true);
    cancelRef.current = false;
    
    initializeProgress(formData.dishes.length);

    try {
      // Step 1: Compress images
      const compressedDishes = await processImageCompression(formData.dishes);
      if (cancelRef.current) throw new Error('Upload cancelled');

      // Step 2: Upload images
      const dishesWithUrls = await processImageUploads(compressedDishes);
      if (cancelRef.current) throw new Error('Upload cancelled');

      // Step 3: Database operations
      const createdSubmissions = await processDatabaseOperations(dishesWithUrls);
      if (cancelRef.current) throw new Error('Upload cancelled');

      // Step 4: Webhooks
      await processWebhooks(createdSubmissions);
      if (cancelRef.current) throw new Error('Upload cancelled');

      // Complete
      updateProgress({ 
        isComplete: true, 
        canCancel: false,
        overallProgress: 100
      });

      toast.success(`${formData.dishes.length} הגשות הושלמו בהצלחה!`);
      
      // Show success modal after a brief delay
      setTimeout(() => {
        setShowProgressModal(false);
        setShowSuccessModal(true);
      }, 2000);

      return true;

    } catch (error: any) {
      console.error('[EnhancedFormSubmission] Error during submission:', error);
      
      const errorMessage = error.message || "אירעה שגיאה בעת שליחת הטופס. אנא נסו שוב.";
      toast.error(errorMessage);
      setStepErrors({ submit: errorMessage });
      
      // Update progress to show error
      setProgressData(prev => ({
        ...prev,
        canCancel: false,
        steps: prev.steps.map(step => 
          step.status === 'in-progress' 
            ? { ...step, status: 'error', error: errorMessage }
            : step
        )
      }));

      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleCloseProgressModal = () => {
    if (!isSubmitting || progressData.isComplete) {
      setShowProgressModal(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
    showSuccessModal,
    showProgressModal,
    progressData,
    handleCloseSuccessModal,
    handleCloseProgressModal,
    handleCancel
  };
}; 