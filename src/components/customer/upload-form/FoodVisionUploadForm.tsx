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
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  
  const { formData, resetFormData, updateFormData } = useNewItemForm();
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        toast.info("יוצרים או מאמתים את פרטי המסעדה...");
        try {
          const clientDetailsPayload: FoodVisionClientDetails = {
            restaurantName: formData.restaurantName || '',
            contactName: 'לא סופק', // Default value for missing contact name
            phoneNumber: 'לא סופק', // Default value for missing phone
            email: 'לא סופק', // Default value for missing email
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
              ? "כתובת אימייל זו כבר משויכת למסעדה קיימת. אנא השתמשו בכתובת אחרת או התחברו אם זו המסעדה שלכם/ן."
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
      toast.error("שגיאה: לא זוהה מזהה לקוח. אנא התחברו או השלימו את פרטי המסעדה.");
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
        toast.error("אנא תקנו את השגיאות בטופס הסקירה.");
        if (currentStepId !== 4) setCurrentStepId(4);
        return;
      }
    }

    if (remainingDishes !== undefined && remainingDishes <= 0) {
        const noDishesError = "אין לכם/ן מספיק מנות נותרות בחבילה כדי לבצע הגשה זו.";
        setStepErrors({ submit: noDishesError }); 
        toast.error(noDishesError);
        if (currentStepId !== 4) setCurrentStepId(4);
        return;
    }

    setIsSubmitting(true);
    toast.info("מעלים תמונות ושומרים הגשה...");
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
            detailedMessage += ". נראה שהייתה בעיה כללית בגישה לטבלה או בהרשאות. יש לבדוק את הגדרות ה-RLS ב-Supabase.";
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
      navigate('/customer/home');

    } catch (error: any) {
      console.error("Submission process error:", error);
      const submissionErrorMessage = error.message || "אירעה שגיאה במהלך ההגשה. נסו שוב.";
      setStepErrors({ submit: submissionErrorMessage });
      toast.error(submissionErrorMessage);
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
      <div className="relative p-4 bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
            <FormProgress currentStepId={currentStepId} formSteps={typedFormSteps} />
        </div>
      </div>

      <main className="flex-grow overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-lg">
          {currentStepId !== 1 && !clientId && (
             <Alert className="mb-6">
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  נראה שלא השלמת את פרטי המסעדה. 
                  <Button variant="link" className="p-0 h-auto text-amber-700 hover:underline" onClick={() => {
                      setFormSteps(allSteps);
                      setCurrentStepId(allSteps[0].id);
                  }}>
                    לחץ כאן
                  </Button>
                  {' '}להשלמת הפרטים או התחבר למערכת.
                </AlertDescription>
              </Alert>
          )}
          <CurrentStepComponent 
            setExternalErrors={setStepErrors} 
            clearExternalErrors={handleClearStepErrors} 
            errors={stepErrors}
            onFinalSubmit={handleSubmit} 
          />
          
          {Object.keys(stepErrors).length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-sm font-semibold text-red-700 mb-1">שגיאות:</h3>
              <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5">
                {Object.entries(stepErrors).map(([key, value]) => (
                  <li key={key}>{value}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={cn(
            "mt-8 flex",
            formSteps.length === 1 || (currentStepId === formSteps[0].id && clientId) ? "justify-end" : "justify-between"
          )}>
            {(formSteps.length > 1 && !(currentStepId === formSteps[0].id && clientId) )&& (
              <Button 
                variant="outline"
                onClick={handlePrevious} 
                disabled={isSubmitting || isCreatingClient}
              >
                <ChevronRight className="ml-2 h-4 w-4" />
                הקודם
              </Button>
            )}
            <Button 
              onClick={currentStepId === formSteps[formSteps.length -1].id ? handleSubmit : handleNext} 
              disabled={isSubmitting || isCreatingClient}
              className={cn(currentStepId === formSteps[formSteps.length -1].id && "bg-green-600 hover:bg-green-700")}
            >
              {isSubmitting ? 
                'שולח...' : 
                currentStepId === formSteps[formSteps.length -1].id ? 
                  'שלח הגשה' : 
                  (currentStepId === 1 && !clientId) ? 'שמור והמשך' : 'הבא'
              }
              {currentStepId !== formSteps[formSteps.length -1].id && <ChevronLeft className="mr-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FoodVisionUploadForm;
