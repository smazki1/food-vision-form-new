import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { NewItemFormData, useNewItemForm } from '@/contexts/NewItemFormContext';
import { useClientAuth } from '@/hooks/useClientAuth';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from 'lucide-react';
import { useClientPackage } from '@/hooks/useClientPackage';
import FormProgress from './FormProgress';
import { cn } from '@/lib/utils';
import { allSteps } from './config/formStepsConfig';
import { useFormNavigation } from './hooks/useFormNavigation';
import { useRestaurantDetailsSubmission } from './hooks/useRestaurantDetailsSubmission';
import { useFormSubmission } from './hooks/useFormSubmission';

export interface StepProps {
  setExternalErrors?: (errors: Record<string, string>) => void;
  clearExternalErrors?: () => void;
  errors?: Record<string, string>;
  onFinalSubmit?: () => void;
}

const LOADING_TIMEOUT = 5000; // 5 seconds timeout for loading state

const FoodVisionUploadForm: React.FC = () => {
  const { clientId, authenticating, refreshClientAuth } = useClientAuth();
  const { formData, resetFormData } = useNewItemForm();
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const { remainingDishes } = useClientPackage();
  const [forceRender, setForceRender] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    formSteps,
    currentStepId,
    updateStepsForAuthenticatedUser,
    resetToAllSteps,
    moveToNextStep,
    moveToPreviousStep,
    moveToStep
  } = useFormNavigation(clientId);

  const { handleRestaurantDetailsSubmit, isCreatingClient } = useRestaurantDetailsSubmission(refreshClientAuth);
  const { handleSubmit: submitForm, isSubmitting } = useFormSubmission();

  // Set up loading timeout
  useEffect(() => {
    if (authenticating) {
      loadingTimerRef.current = setTimeout(() => {
        console.log('[FoodVisionUploadForm] Auth loading timeout exceeded. Forcing render.');
        setForceRender(true);
      }, LOADING_TIMEOUT);
    } else if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }

    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [authenticating]);

  // Update steps when auth changes
  useEffect(() => {
    if (!authenticating || forceRender) {
      updateStepsForAuthenticatedUser();
    }
  }, [clientId, authenticating, forceRender, updateStepsForAuthenticatedUser]);

  const typedFormSteps = formSteps.map(step => ({ id: step.id, name: step.name }));
  const CurrentStepComponent = formSteps.find(step => step.id === currentStepId)?.component || (() => <div>שלב לא תקין</div>);
  const currentStepConfig = formSteps.find(step => step.id === currentStepId);

  const handleClearStepErrors = () => {
    setStepErrors({});
  };

  const handleRestaurantDetailsFlow = async () => {
    if (currentStepConfig?.validate) {
      const newErrors = currentStepConfig.validate(formData);
      setStepErrors(newErrors);
      if (Object.keys(newErrors).length === 0) {
        const success = await handleRestaurantDetailsSubmit(formData, setStepErrors);
        if (success) {
          const nextStepInAllSteps = allSteps.find(step => step.id === 2);
          if (nextStepInAllSteps) {
            updateStepsForAuthenticatedUser();
          }
        }
      }
    }
  };

  const handleNext = async () => {
    if (currentStepId === 1 && !clientId) {
      await handleRestaurantDetailsFlow();
      return;
    }

    if (currentStepConfig?.validate) {
      const newErrors = currentStepConfig.validate(formData);
      setStepErrors(newErrors);
      if (Object.keys(newErrors).length === 0) {
        const currentIndexInCurrentSteps = formSteps.findIndex(step => step.id === currentStepId);
        if (currentIndexInCurrentSteps < formSteps.length - 1) {
          moveToNextStep();
        } else {
          console.warn("[FoodVisionUploadForm] Reached end of steps via footer button. This should ideally be handled by ReviewSubmitStep's button.")
          await handleMainSubmit();
        }
      }
    }
  };

  const handlePrevious = () => {
    setStepErrors({});
    moveToPreviousStep();
  };
  
  const handleMainSubmit = async () => {
    const finalClientId = clientId;

    if (!finalClientId) {
      const errorMessage = "שגיאה: לא זוהה מזהה לקוח. אנא התחברו או השלימו את פרטי המסעדה.";
      if (!formSteps.find(s => s.id === 1)) {
        resetToAllSteps();
      } else if (currentStepId !== 1) {
        moveToStep(allSteps[0].id);
      }
      setStepErrors({ submit: "יש להשלים את פרטי המסעדה או להתחבר לפני ההגשה." });
      return;
    }

    const reviewStepConfig = allSteps.find(step => step.id === 4);
    if (reviewStepConfig?.validate) {
      const newErrors = reviewStepConfig.validate(formData);
      setStepErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        if (currentStepId !== 4) moveToStep(4);
        return;
      }
    }

    const success = await submitForm(formData, finalClientId, remainingDishes, setStepErrors);
    if (success) {
      resetFormData();
      updateStepsForAuthenticatedUser();
      setStepErrors({});
    } else {
      if (currentStepId !== 4) moveToStep(4);
    }
  };

  if (authenticating && !forceRender) {
    return (
      <div className="flex justify-center items-center h-screen" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B1E3F]"></div>
        <p className="mr-4 text-lg">טוען פרטי משתמש...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50" dir="rtl">
      <div className="relative p-4 bg-[#8B1E3F] shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
            <FormProgress currentStepId={currentStepId} formSteps={typedFormSteps} />
        </div>
      </div>

      <main className="flex-grow overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-lg">
          {(currentStepId !== 1 && !clientId) && (
             <Alert className="mb-6 bg-[#F3752B]/10 border-[#F3752B]">
                <InfoIcon className="h-4 w-4 text-[#F3752B]" />
                <AlertDescription className="text-[#333]">
                  נראה שלא השלמת את פרטי המסעדה. 
                  <Button variant="link" className="p-0 h-auto text-[#8B1E3F] hover:underline" onClick={() => {
                      resetToAllSteps();
                  }}>
                    לחץ כאן
                  </Button>
                  {' '}להשלמת הפרטים או התחבר למערכת.
                </AlertDescription>
              </Alert>
          )}
          
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-[#8B1E3F]">
              העלאת פריט חדש
            </h1>
            <p className="text-gray-600 mt-2">
              מלאו את הפרטים הנדרשים להעלאת הפריט שלכם
            </p>
          </div>
          
          <CurrentStepComponent 
            setExternalErrors={setStepErrors} 
            clearExternalErrors={handleClearStepErrors} 
            errors={stepErrors}
            onFinalSubmit={handleMainSubmit} 
          />
          
          {Object.keys(stepErrors).length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-sm font-semibold text-red-700 mb-1 text-center">שגיאות:</h3>
              <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5">
                {Object.entries(stepErrors).map(([key, value]) => (
                  <li key={key}>{value}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={cn(
            "mt-8 flex justify-center gap-4",
            formSteps.length === 1 || (currentStepId === formSteps[0].id && clientId) ? "justify-center" : "justify-center"
          )}>
            {(formSteps.length > 1 && !(currentStepId === formSteps[0].id && clientId) )&& (
              <Button 
                variant="outline"
                onClick={handlePrevious} 
                disabled={isSubmitting || isCreatingClient}
                className="min-w-[120px] md:min-w-[140px] py-2 md:py-3 rounded-full border-[#8B1E3F] text-[#8B1E3F] hover:bg-[#8B1E3F]/10"
              >
                הקודם
              </Button>
            )}
            <Button 
              onClick={currentStepId === formSteps[formSteps.length -1].id ? handleMainSubmit : handleNext} 
              disabled={isSubmitting || isCreatingClient}
              className={cn("min-w-[120px] md:min-w-[140px] py-2 md:py-3 rounded-full",
                currentStepId === formSteps[formSteps.length -1].id 
                ? "bg-[#8B1E3F] hover:bg-[#8B1E3F]/90" 
                : "bg-[#F3752B] hover:bg-[#F3752B]/90"
              )}
            >
              {isSubmitting ? 
                'שולח...' : 
                currentStepId === formSteps[formSteps.length -1].id ? 
                  'שלח הגשה' : 
                  (currentStepId === 1 && !clientId) ? 'שמור והמשך' : 'הבא'
              }
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FoodVisionUploadForm;
