
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { NewItemFormData, useNewItemForm } from '@/contexts/NewItemFormContext';
import { useClientAuth } from '@/hooks/useClientAuth';
import { ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, AlertTriangle } from 'lucide-react';
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

const FoodVisionUploadForm: React.FC = () => {
  const { clientId, authenticating, refreshClientAuth, clientRecordStatus, errorState } = useClientAuth();
  const { formData, resetFormData } = useNewItemForm();
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const { remainingDishes } = useClientPackage();
  const [loadingStartTime] = useState(Date.now());

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

  useEffect(() => {
    if (!authenticating) {
      updateStepsForAuthenticatedUser();
    }
  }, [clientId, authenticating]);

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

  // Simplified loading check with shorter timeouts
  const currentLoadingTime = Math.round((Date.now() - loadingStartTime) / 1000);
  const isStuckLoading = authenticating && currentLoadingTime > 5; // Reduced from 10 to 5

  if (authenticating && !isStuckLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="ml-4 text-lg mt-4">טוען פרטי משתמש... ({currentLoadingTime}s)</p>
          {currentLoadingTime > 3 && (
            <p className="text-sm text-muted-foreground mt-2">
              הטעינה לוקחת יותר זמן מהצפוי...
            </p>
          )}
        </div>
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
          {/* Error state alert with immediate action */}
          {(errorState || isStuckLoading) && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700">
                {errorState || "הטעינה תקועה - העמוד יטען ללא חיבור לנתוני הלקוח"}
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-red-700 hover:underline mr-2"
                  onClick={() => {
                    if (isStuckLoading) {
                      // Force stop loading and continue
                      updateStepsForAuthenticatedUser();
                    } else {
                      refreshClientAuth();
                    }
                  }}
                  disabled={isCreatingClient || isSubmitting}
                >
                  <RefreshCw className="h-3 w-3 ml-1" />
                  {isStuckLoading ? 'המשך בלי חיבור' : 'נסו שוב'}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {currentStepId !== 1 && !clientId && !errorState && (
             <Alert className="mb-6">
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  נראה שלא השלמת את פרטי המסעדה. 
                  <Button variant="link" className="p-0 h-auto text-amber-700 hover:underline" onClick={() => {
                      resetToAllSteps();
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
            onFinalSubmit={handleMainSubmit} 
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
              onClick={currentStepId === formSteps[formSteps.length -1].id ? handleMainSubmit : handleNext} 
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
