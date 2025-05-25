import React, { useState, useEffect } from 'react';
import RestaurantDetailsStep from './steps/RestaurantDetailsStep';
import ItemDetailsStep from './steps/ItemDetailsStep';
import ImageUploadStep from './steps/ImageUploadStep';
import { Button } from '@/components/ui/button';
import { NewItemFormData, useNewItemForm, ItemType } from '@/contexts/NewItemFormContext';
import { supabase } from '@/integrations/supabase/client';
import { useClientAuth } from '@/hooks/useClientAuth';
import { useSubmissions } from '@/hooks/useSubmissions';
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from 'lucide-react';
import { useClientPackage } from '@/hooks/useClientPackage';
import ReviewSubmitStep from './steps/ReviewSubmitStep';
import { getOrCreateClient } from '@/utils/client-utils';
import { ClientDetails as FoodVisionClientDetails } from '@/types/food-vision';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import FormProgress from './FormProgress';
import { cn } from '@/lib/utils';

export interface StepProps {
  setExternalErrors?: (errors: Record<string, string>) => void;
  clearExternalErrors?: () => void;
  errors?: Record<string, string>;
  onFinalSubmit?: () => void;
}

const allSteps = [
  {
    id: 1,
    name: 'פרטי מסעדה',
    component: RestaurantDetailsStep,
    validate: (data: NewItemFormData) => {
      const newErrors: Record<string, string> = {};
      if (!data.restaurantName?.trim()) newErrors.restaurantName = 'שם המסעדה הוא שדה חובה.';
      if (!data.contactName?.trim()) newErrors.contactName = 'שם איש קשר הוא שדה חובה.';
      if (!data.phone?.trim()) {
        newErrors.phone = 'מספר טלפון הוא שדה חובה.';
      } else if (!/^\d{9,10}$/.test(data.phone.replace(/-/g, ''))) {
        newErrors.phone = 'מספר טלפון לא תקין.';
      }
      if (!data.email?.trim()) {
        newErrors.email = 'כתובת אימייל היא שדה חובה.';
      } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.email)) {
        newErrors.email = 'כתובת אימייל לא תקינה.';
      }
      return newErrors;
    }
  },
  { 
    id: 2, 
    name: 'פרטי פריט', 
    component: ItemDetailsStep, 
    validate: (data: NewItemFormData) => {
      const newErrors: Record<string, string> = {};
      if (!data.itemName.trim()) newErrors.itemName = 'שם הפריט הוא שדה חובה.';
      if (!data.itemType) newErrors.itemType = 'סוג הפריט הוא שדה חובה.';
      return newErrors;
    }
  },
  { 
    id: 3, 
    name: 'העלאת תמונות', 
    component: ImageUploadStep, 
    validate: (data: NewItemFormData) => {
      const newErrors: Record<string, string> = {};
      if (data.referenceImages.length < 1) newErrors.referenceImages = 'יש להעלות לפחות תמונה אחת.';
      if (data.referenceImages.length > 10) newErrors.referenceImages = 'ניתן להעלות עד 10 תמונות.';
      return newErrors;
    }
  },
  {
    id: 4,
    name: 'סקירה ואישור',
    component: ReviewSubmitStep,
    validate: (data: NewItemFormData) => {
        const newErrors: Record<string, string> = {};
        if (data.referenceImages.length === 0) newErrors.finalCheck = "יש להעלות לפחות תמונה אחת לפני ההגשה.";
        return newErrors;
    }
  }
];

const FoodVisionUploadForm: React.FC = () => {
  const { clientId, authenticating, refreshClientAuth } = useClientAuth();
  const { user: unifiedUser } = useUnifiedAuth();
  const [formSteps, setFormSteps] = useState(allSteps);
  const [currentStepId, setCurrentStepId] = useState(allSteps[0].id);
  
  const { formData, resetFormData, updateFormData } = useNewItemForm();
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  
  const { refreshSubmissions } = useSubmissions();
  const { remainingDishes } = useClientPackage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authenticating) {
      if (clientId) {
        const stepsForLoggedInUser = allSteps.filter(step => step.id !== 1);
        setFormSteps(stepsForLoggedInUser);
        setCurrentStepId(stepsForLoggedInUser[0]?.id || allSteps[1].id);
      } else {
        setFormSteps(allSteps);
        setCurrentStepId(allSteps[0].id);
      }
    }
  }, [clientId, authenticating]);

  const typedFormSteps = formSteps.map(step => ({ id: step.id, name: step.name }));

  const CurrentStepComponent = formSteps.find(step => step.id === currentStepId)?.component || (() => <div>שלב לא תקין</div>);
  const currentStepConfig = formSteps.find(step => step.id === currentStepId);

  const handleClearStepErrors = () => {
    setStepErrors({});
  };

  const handleRestaurantDetailsSubmit = async () => {
    if (currentStepConfig?.validate) {
      const newErrors = currentStepConfig.validate(formData);
      setStepErrors(newErrors);
      if (Object.keys(newErrors).length === 0) {
        setIsCreatingClient(true);
        toast.info("יוצר או מאמת את פרטי המסעדה...");
        try {
          const clientDetailsPayload: FoodVisionClientDetails = {
            restaurantName: formData.restaurantName || '',
            contactName: formData.contactName || '',
            phoneNumber: formData.phone || '',
            email: formData.email || '',
          };

          const authUserId = unifiedUser?.id;
          
          console.log("[FoodVisionUploadForm] Calling getOrCreateClient with payload:", clientDetailsPayload, "and authUserId:", authUserId);
          const newClientId = await getOrCreateClient(clientDetailsPayload, authUserId);
          console.log("[FoodVisionUploadForm] getOrCreateClient returned newClientId:", newClientId);

          if (refreshClientAuth) {
            console.log("[FoodVisionUploadForm] Calling refreshClientAuth().");
            refreshClientAuth();
          }

          toast.success("פרטי מסעדה אומתו בהצלחה! מזהה לקוח חדש/מאומת: " + newClientId.substring(0, 8) + "...");

          const nextStepInAllSteps = allSteps.find(step => step.id === 2);
          if (nextStepInAllSteps) {
            const stepsForLoggedInUser = allSteps.filter(step => step.id !== 1);
            setFormSteps(stepsForLoggedInUser);
            setCurrentStepId(nextStepInAllSteps.id);
            window.scrollTo(0, 0);
          } else {
            toast.error("שגיאה במעבר לשלב הבא לאחר אימות מסעדה.");
          }

        } catch (error: any) {
          console.error("[FoodVisionUploadForm] Error in handleRestaurantDetailsSubmit:", error);
          let errorMessage = "שגיאה באימות פרטי המסעדה.";
          if (error.message) {
            errorMessage = error.message.includes("duplicate key value violates unique constraint") 
              ? "כתובת אימייל זו כבר משויכת למסעדה קיימת. אנא השתמש בכתובת אחרת או התחבר אם זו המסעדה שלך."
              : error.message;
          }
          setStepErrors({ submit: errorMessage });
          toast.error(errorMessage);
        } finally {
          setIsCreatingClient(false);
        }
      }
    }
  };

  const handleNext = async () => {
    if (currentStepId === 1 && !clientId) {
      await handleRestaurantDetailsSubmit();
      return;
    }

    if (currentStepConfig?.validate) {
      const newErrors = currentStepConfig.validate(formData);
      setStepErrors(newErrors);
      if (Object.keys(newErrors).length === 0) {
        const currentIndexInCurrentSteps = formSteps.findIndex(step => step.id === currentStepId);
        if (currentIndexInCurrentSteps < formSteps.length - 1) {
          setCurrentStepId(formSteps[currentIndexInCurrentSteps + 1].id);
          window.scrollTo(0, 0);
        } else {
          console.warn("[FoodVisionUploadForm] Reached end of steps via footer button. This should ideally be handled by ReviewSubmitStep's button.")
          await handleSubmit(); 
        }
      }
    }
  };

  const handlePrevious = () => {
    setStepErrors({});
    const currentIndexInCurrentSteps = formSteps.findIndex(step => step.id === currentStepId);

    if (currentIndexInCurrentSteps > 0) {
      setCurrentStepId(formSteps[currentIndexInCurrentSteps - 1].id);
      window.scrollTo(0, 0);
    } else if (clientId && !formSteps.find(s => s.id === 1)) {
      console.warn("[FoodVisionUploadForm] Attempted to go back from the first visible step for a logged-in user.");
    }
  };
  
  const handleSubmit = async () => {
    const finalClientId = clientId;

    if (!finalClientId) {
      toast.error("שגיאה: לא זוהה מזהה לקוח. אנא התחבר או השלם את פרטי המסעדה.");
      if (!formSteps.find(s => s.id === 1)) {
         setFormSteps(allSteps);
         setCurrentStepId(allSteps[0].id);
      } else if (currentStepId !== 1) {
         setCurrentStepId(allSteps[0].id);
      }
      setStepErrors({ submit: "יש להשלים את פרטי המסעדה או להתחבר לפני ההגשה." });
      return;
    }

    const reviewStepConfig = allSteps.find(step => step.id === 4);
    if (reviewStepConfig?.validate) {
      const newErrors = reviewStepConfig.validate(formData);
      setStepErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        toast.error("אנא תקן את השגיאות בטופס הסקירה.");
        if (currentStepId !== 4) setCurrentStepId(4);
        return;
      }
    }

    if (remainingDishes !== undefined && remainingDishes <= 0) {
        const noDishesError = "אין לך מספיק מנות נותרות בחבילה כדי לבצע הגשה זו.";
        setStepErrors({ submit: noDishesError }); 
        toast.error(noDishesError);
        if (currentStepId !== 4) setCurrentStepId(4);
        return;
    }

    setIsSubmitting(true);
    toast.info("מעלה תמונות ושומר הגשה...");
    let newItemId = uuidv4();

    try {
      const uploadPromises = formData.referenceImages.map(async (file) => {
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${newItemId}/${uuidv4()}.${fileExtension}`;
        const filePath = `${finalClientId}/${formData.itemType}/${uniqueFileName}`;
        
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

      let itemInsertError: any = null;

      // Define a type for item types that are supported for table mapping
      type SupportedItemType = 'dish' | 'cocktail' | 'drink';

      const tableNameMap: Record<SupportedItemType, string> = {
        dish: 'dishes',
        cocktail: 'cocktails',
        drink: 'drinks',
      };
      
      // Validate that itemType is a supported one before trying to map
      if (!formData.itemType || !Object.keys(tableNameMap).includes(formData.itemType)) {
        throw new Error(`סוג פריט לא נתמך או חסר: ${formData.itemType}`);
      }

      const itemTable = tableNameMap[formData.itemType as SupportedItemType];
      const itemIdColumn = `${formData.itemType}_id`;

      const itemData = {
        client_id: finalClientId,
        name: formData.itemName,
        description: formData.description,
        notes: formData.specialNotes,
        reference_image_urls: resolvedUploadedImageUrls,
        [itemIdColumn]: newItemId,
      };

      const { error: genericInsertError } = await supabase.from(itemTable as any).insert(itemData);
      itemInsertError = genericInsertError;

      if (itemInsertError) {
        console.error(`Error inserting item (${formData.itemType}). Error object:`, JSON.stringify(itemInsertError, null, 2));
        let detailedMessage = `שגיאה ביצירת הפריט (${formData.itemType})`;
        if (itemInsertError.message) {
          detailedMessage += `: ${itemInsertError.message}`;
        } else if (itemInsertError.details) {
          detailedMessage += `: ${itemInsertError.details}`;
        } else if (itemInsertError.hint) {
          detailedMessage += ` (רמז: ${itemInsertError.hint})`;
        }
        if (Object.keys(itemInsertError).length === 0) {
            detailedMessage += ". נראה שהייתה בעיה כללית בגישה לטבלה או בהרשאות. בדוק את הגדרות ה-RLS ב-Supabase.";
        }
        throw new Error(detailedMessage);
      }
      
      const submissionToInsert = {
        client_id: finalClientId,
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
      resetFormData();
      if (clientId) {
        const stepsForLoggedInUser = allSteps.filter(step => step.id !== 1);
        setFormSteps(stepsForLoggedInUser);
        setCurrentStepId(stepsForLoggedInUser[0]?.id || allSteps[1].id);
      } else {
        setFormSteps(allSteps);
        setCurrentStepId(allSteps[0].id);
      }
      setStepErrors({});
      refreshSubmissions();
      navigate('/customer/home');

    } catch (error: any) {
      console.error("Submission process error:", error);
      setStepErrors({ submit: error.message || "אירעה שגיאה במהלך ההגשה. נסה שוב." });
      toast.error(error.message || "אירעה שגיאה במהלך ההגשה. נסה שוב.");
      if (currentStepId !== 4) setCurrentStepId(4);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFirstStepInCurrentFlow = currentStepId === formSteps[0]?.id;
  const isLastStepInCurrentFlow = currentStepId === formSteps[formSteps.length - 1]?.id;

  if (authenticating) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-4 text-lg">טוען פרטי משתמש...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="p-4 bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
            <FormProgress currentStepId={currentStepId} formSteps={typedFormSteps} />
        </div>
      </div>

      <main className="flex-grow overflow-y-auto p-4 md:p-6">
        <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg p-6 md:p-8">
          <div className="mt-0">
            <CurrentStepComponent 
              setExternalErrors={setStepErrors}
              clearExternalErrors={handleClearStepErrors}
              errors={stepErrors}
              {...(currentStepConfig?.id === 4 && { onFinalSubmit: handleSubmit })}
            />
          </div>

          {Object.keys(stepErrors).length > 0 && 
           !stepErrors.restaurantName && !stepErrors.contactName && !stepErrors.phone && !stepErrors.email && 
           !stepErrors.itemName && !stepErrors.itemType && !stepErrors.referenceImages && !stepErrors.finalCheck && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-sm text-red-700 font-semibold mb-1">אנא תקן את השגיאות הבאות:</p>
              <ul className="list-disc list-inside text-sm text-red-600">
                {Object.entries(stepErrors)
                  .filter(([key]) => key === 'submit')
                  .map(([key, error], index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>

      <footer className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-top-md z-10 md:py-5">
        <div className={cn(
          "mx-auto flex items-center max-w-5xl",
          (!isFirstStepInCurrentFlow && isLastStepInCurrentFlow) || (isFirstStepInCurrentFlow && !isLastStepInCurrentFlow) ? "justify-center" : "justify-between",
          "md:gap-x-3"
        )}>
          
          {!isLastStepInCurrentFlow && (
            <Button 
              onClick={handleNext} 
              className={cn(
                "py-4 px-6 text-base font-medium rounded-xl transition-all duration-150 ease-in-out hover:-translate-y-px hover:shadow-md focus-visible:ring-ring",
                isFirstStepInCurrentFlow ? "w-full md:w-auto md:max-w-sm" : "flex-1 md:flex-none md:w-auto",
                "bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-500"
              )}
              disabled={isSubmitting || isCreatingClient}
            >
              הבא
            </Button>
          )}
          
          {!isFirstStepInCurrentFlow && (
            <Button 
              variant="outline" 
              onClick={handlePrevious} 
              className={cn(
                "py-4 px-6 text-base font-medium rounded-xl transition-all duration-150 ease-in-out hover:-translate-y-px hover:shadow-md focus-visible:ring-ring",
                isLastStepInCurrentFlow ? "w-full md:w-auto md:max-w-sm" : "flex-1 md:flex-none md:w-auto",
                "border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50"
              )}
              disabled={isSubmitting || isCreatingClient}
            >
              חזור
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default FoodVisionUploadForm; 