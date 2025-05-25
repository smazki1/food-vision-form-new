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
import FormHeader from "@/components/food-vision/FormHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from 'lucide-react';
import { useClientPackage } from '@/hooks/useClientPackage';
import ReviewSubmitStep from './steps/ReviewSubmitStep';
import { getOrCreateClient } from '@/utils/client-utils';
import { ClientDetails as FoodVisionClientDetails } from '@/types/food-vision';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';

export interface StepProps {
  setExternalErrors?: (errors: Record<string, string>) => void;
  clearExternalErrors?: () => void;
  errors?: Record<string, string>;
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

          const nextStepInSequence = allSteps.find(step => step.id === 2);
          if (nextStepInSequence) {
            const stepsForLoggedInUser = allSteps.filter(step => step.id !== 1);
            setFormSteps(stepsForLoggedInUser);
            setCurrentStepId(nextStepInSequence.id);
            window.scrollTo(0, 0);
          } else {
            toast.error("שגיאה במעבר לשלב הבא לאחר אימות מסעדה.");
          }

        } catch (error: any) {
          console.error("[FoodVisionUploadForm] Error in handleRestaurantDetailsSubmit:", error);
          toast.error(error.message || "שגיאה באימות פרטי המסעדה.");
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
        const currentIndex = formSteps.findIndex(step => step.id === currentStepId);
        if (currentIndex < formSteps.length - 1) {
          setCurrentStepId(formSteps[currentIndex + 1].id);
          window.scrollTo(0, 0);
        } else {
          await handleSubmit();
        }
      }
    }
  };

  const handlePrevious = () => {
    setStepErrors({});
    const currentIndex = formSteps.findIndex(step => step.id === currentStepId);
    if (currentIndex > 0) {
      setCurrentStepId(formSteps[currentIndex - 1].id);
      window.scrollTo(0, 0);
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
      return;
    }

    const reviewStepConfig = formSteps.find(step => step.id === currentStepId);
    if (reviewStepConfig?.validate) {
      const newErrors = reviewStepConfig.validate(formData);
      setStepErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        toast.error("אנא תקן את השגיאות בטופס הסקירה.");
        return;
      }
    }

    if (remainingDishes !== undefined && remainingDishes <= 0) {
        toast.error("אין לך מספיק מנות נותרות בחבילה כדי לבצע הגשה זו.");
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
        if (uploadError) throw new Error(`שגיאה בהעלאת קובץ ${file.name}: ${uploadError.message}`);
        
        const { data: publicUrlData } = supabase.storage.from('food-vision-images').getPublicUrl(filePath);
        if (!publicUrlData || !publicUrlData.publicUrl) throw new Error(`שגיאה בקבלת URL ציבורי עבור ${file.name}`);
        return publicUrlData.publicUrl;
      });
      const resolvedUploadedImageUrls = await Promise.all(uploadPromises);

      let itemInsertError: any = null;
      const itemData = {
        client_id: finalClientId,
        name: formData.itemName,
        description: formData.description,
        notes: formData.specialNotes,
        reference_image_urls: resolvedUploadedImageUrls,
      };

      switch (formData.itemType) {
        case 'dish':
          const { error: dishError } = await supabase.from('dishes').insert({ ...itemData, dish_id: newItemId });
          itemInsertError = dishError;
          break;
        case 'cocktail':
          const { error: cocktailError } = await supabase.from('cocktails').insert({ ...itemData, cocktail_id: newItemId });
          itemInsertError = cocktailError;
          break;
        case 'drink':
          const { error: drinkError } = await supabase.from('drinks').insert({ ...itemData, drink_id: newItemId });
          itemInsertError = drinkError;
          break;
        default:
          throw new Error('סוג פריט לא ידוע או לא נתמך.');
      }

      if (itemInsertError) throw new Error(`שגיאה ביצירת הפריט (${formData.itemType}): ${itemInsertError.message}`);
      
      const submissionToInsert = {
        client_id: finalClientId,
        original_item_id: newItemId,
        item_type: formData.itemType as ItemType,
        item_name_at_submission: formData.itemName,
        submission_status: 'ממתינה לעיבוד' as const,
      };
      const { error: submissionInsertError } = await supabase.from('customer_submissions').insert(submissionToInsert);

      if (submissionInsertError) {
        const itemTable = `${formData.itemType}s`;
        const itemIdColumn = `${formData.itemType}_id`;
        await supabase.from(itemTable as any).delete().eq(itemIdColumn, newItemId);
        throw new Error(`שגיאה בשמירת ההגשה: ${submissionInsertError.message}`);
      }

      toast.success("הפריט הוגש בהצלחה!");
      resetFormData();
      if (finalClientId) {
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
      console.error("Submission error:", error);
      toast.error(error.message || "אירעה שגיאה במהלך ההגשה. נסה שוב.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authenticating) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-4 text-lg">טוען פרטי משתמש...</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container max-w-4xl mx-auto">
        <FormHeader />
        
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <div className="flex items-center text-sm text-muted-foreground mb-2 md:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-transparent hover:text-primary p-0 text-xs"
              onClick={() => navigate('/customer/home')}
            >
              דף הבית
            </Button>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="font-medium text-foreground text-xs">הוספת פריט חדש</span>
          </div>
          
          <h1 className="text-2xl font-semibold text-center mb-2">
            {formSteps.find(step => step.id === currentStepId)?.name || 'טעינת שלב...'}
          </h1>

          <div className="flex justify-center items-center my-6 md:my-8 space-x-2 space-x-reverse">
            {formSteps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out 
                      ${currentStepId === step.id ? 'bg-primary text-primary-foreground' : 
                       (formSteps.findIndex(s => s.id === currentStepId) > index ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500')}`}
                  >
                    {formSteps.findIndex(s => s.id === currentStepId) > index ? <InfoIcon className="h-5 w-5" /> : step.id}
                  </div>
                  <p className={`mt-2 text-xs text-center ${currentStepId === step.id ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                    {step.name}
                  </p>
                </div>
                {index < formSteps.length - 1 && (
                  <div className={`flex-1 h-1 rounded transition-all duration-300 ease-in-out 
                    ${formSteps.findIndex(s => s.id === currentStepId) > index ? 'bg-green-500' : 'bg-gray-200'}`}>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {currentStepId === 1 && !clientId && (
            <Alert variant="default" className="mb-6 bg-blue-50 border-blue-200 text-blue-700">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                משתמש חדש? מלא את פרטי המסעדה שלך כדי שנוכל לשייך אליך את ההגשות. אם כבר יש לך חשבון, המערכת תזהה אותך.
              </AlertDescription>
            </Alert>
          )}
          
          {currentStepId === formSteps.find(s => s.id === 2)?.id && remainingDishes !== undefined && remainingDishes <= 10 && (
            <Alert 
              variant={remainingDishes <=0 ? "destructive" : "default"} 
              className={`mb-6 ${remainingDishes > 0 && remainingDishes <= 5 ? 'bg-orange-50 border-orange-400 text-orange-700' : (remainingDishes > 5 ? 'bg-sky-50 border-sky-400 text-sky-700' : '')}`}>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                {remainingDishes <= 0 
                  ? "לא נותרו לך מנות בחבילה. לא תוכל להגיש פריטים חדשים עד לחידוש החבילה."
                  : `שים לב: נותרו לך ${remainingDishes} מנות בחבילה.` 
                }
              </AlertDescription>
            </Alert>
          )}

          <div className="min-h-[300px]">
            <CurrentStepComponent errors={stepErrors} clearExternalErrors={handleClearStepErrors} setExternalErrors={setStepErrors} />
          </div>

          <div className="mt-8 pt-6 border-t flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={handlePrevious} 
              disabled={currentStepId === formSteps[0].id || isSubmitting || isCreatingClient}
            >
              <ChevronRight className="ml-2 h-4 w-4" />
              הקודם
            </Button>
            
            {currentStepId === formSteps[formSteps.length - 1].id ? (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || isCreatingClient || (remainingDishes !== undefined && remainingDishes <= 0)}
                size="lg"
              >
                {isSubmitting ? 'שולח...' : 'הגש פריט'}
              </Button>
            ) : (
              <Button 
                onClick={handleNext} 
                disabled={isSubmitting || isCreatingClient || (currentStepId === 1 && !clientId && isCreatingClient)}
                size="lg"
              >
                {isCreatingClient && currentStepId ===1 ? 'מאמת פרטים...' : 'הבא'}
                <ChevronLeft className="mr-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodVisionUploadForm; 