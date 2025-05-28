import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { NewItemFormData, useNewItemForm } from '@/contexts/NewItemFormContext';
import { useClientAuth } from '@/hooks/useClientAuth';
import { RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, AlertTriangle } from 'lucide-react';
import { useClientPackage } from '@/hooks/useClientPackage';
import FormProgress from './FormProgress';
import { cn } from '@/lib/utils';
import { allSteps } from './config/formStepsConfig';
import { useFormNavigation } from './hooks/useFormNavigation';
import { useRestaurantDetailsSubmission } from './hooks/useRestaurantDetailsSubmission';
import { useFormSubmission } from './hooks/useFormSubmission';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface StepProps {
  setExternalErrors?: (errors: Record<string, string>) => void;
  clearExternalErrors?: () => void;
  errors?: Record<string, string>;
  onFinalSubmit?: () => void;
}

const LOADING_TIMEOUT = 5000; // 5 seconds timeout for loading state

const FoodVisionUploadForm: React.FC = () => {
  const { clientId, authenticating, refreshClientAuth, clientRecordStatus, errorState } = useClientAuth();
  const { formData, resetFormData } = useNewItemForm();
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const { remainingDishes } = useClientPackage();
  const [forceRender, setForceRender] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

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
      setShowSuccessDialog(true);
      resetFormData();
      updateStepsForAuthenticatedUser();
      setStepErrors({});
    } else {
      if (currentStepId !== 4) moveToStep(4);
    }
  };
  
  const handleNewSubmission = () => {
    setShowSuccessDialog(false);
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
    <div className="flex flex-col min-h-screen bg-gray-100" dir="rtl">
      <div className="relative p-4 bg-[#8B1E3F] shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
            <FormProgress currentStepId={currentStepId} formSteps={typedFormSteps} />
        </div>
      </div>

      <main className="flex-grow overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-lg">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#8B1E3F]">העלאת פריט חדש</h1>
            <p className="text-gray-600">אנא מלא את הפרטים הבאים כדי להעלות פריט חדש</p>
          </div>
          
          {/* Error state alert with immediate action */}
          {errorState && clientRecordStatus === 'error' && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                שגיאה בטעינת פרטי לקוח: {errorState}. 
                נסה לרענן את הדף או פנה לתמיכה אם הבעיה נמשכת.
                <Button onClick={() => window.location.reload()} size="sm" variant="outline" className="mr-2 mt-2">
                  <RefreshCw className="ml-1 h-3 w-3" /> רענן דף
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Stuck loading alert */}
          {authenticating && forceRender && (
            <Alert variant="default" className="mb-6">
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                    טעינת פרטי המשתמש לוקחת זמן רב מהצפוי. 
                    <Button onClick={() => window.location.reload()} size="sm" variant="outline" className="mr-2 mt-2">
                        <RefreshCw className="ml-1 h-3 w-3" /> נסה לרענן
                    </Button>
                    <Button onClick={() => { 
                        resetToAllSteps(); // Ensure this resets to the initial form state
                        setForceRender(false); // Reset forceRender to allow re-evaluation
                    }} size="sm" variant="outline" className="mt-2">
                        המשך בכל זאת (ייתכן שפרטים חסרים)
                    </Button>
                </AlertDescription>
            </Alert>
          )}

          {/* General submission errors */}
          {stepErrors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-sm font-semibold text-red-700 mb-1 text-center">שגיאות:</h3>
              <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5">
                {Object.entries(stepErrors).map(([key, value]) => (
                  <li key={key}>{value}</li>
                ))}
              </ul>
            </div>
          )}

          {currentStepId !== 1 && !clientId && !errorState && (
             <Alert className="mb-6 bg-[#F3752B]/10 border-[#F3752B] text-[#8B1E3F]">
                <InfoIcon className="h-4 w-4 mr-2" />
                <AlertDescription className="text-right">
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
          
          <CurrentStepComponent 
            setExternalErrors={setStepErrors} 
            clearExternalErrors={handleClearStepErrors} 
            errors={stepErrors}
            onFinalSubmit={handleMainSubmit} 
          />
          
          <div className="mt-8 flex justify-center gap-4">
            {(formSteps.length > 1 && !(currentStepId === formSteps[0].id && clientId)) && (
              <Button 
                variant="outline"
                onClick={handlePrevious} 
                disabled={isSubmitting || isCreatingClient}
                className="min-w-[120px] border-[#8B1E3F] text-[#8B1E3F] hover:bg-[#8B1E3F]/10"
              >
                הקודם
              </Button>
            )}
            <Button 
              onClick={currentStepId === formSteps[formSteps.length -1].id ? handleMainSubmit : handleNext} 
              disabled={isSubmitting || isCreatingClient}
              className={cn("min-w-[120px]",
                currentStepId === formSteps[formSteps.length -1].id 
                ? "bg-[#8B1E3F] hover:bg-[#8B1E3F]/90 text-white" 
                : "bg-[#F3752B] hover:bg-[#F3752B]/90 text-white"
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
      
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-white p-6 rounded-lg max-w-md mx-auto text-center">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#8B1E3F]">ההגשה נשלחה בהצלחה!</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">תודה שהעלית פריט חדש. הצוות שלנו יטפל בבקשתך בהקדם.</p>
          </div>
          <DialogFooter className="flex justify-center">
            <Button 
              onClick={handleNewSubmission} 
              className="bg-[#F3752B] hover:bg-[#F3752B]/90 text-white"
            >
              העלאה נוספת
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FoodVisionUploadForm;
