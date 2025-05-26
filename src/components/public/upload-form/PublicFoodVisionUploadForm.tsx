
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import FormProgress from '@/components/customer/upload-form/FormProgress';
import { cn } from '@/lib/utils';
import { publicFormSteps } from './config/formStepsConfig';
import { useFormNavigation } from '@/hooks/useFormNavigation';
import { usePublicFormSubmission } from '@/hooks/usePublicFormSubmission';

export interface PublicStepProps {
  setExternalErrors?: (errors: Record<string, string>) => void;
  clearExternalErrors?: () => void;
  errors?: Record<string, string>;
  onFinalSubmit?: () => void; 
}

const PublicFoodVisionUploadForm: React.FC = () => {
  const { formData, resetFormData } = useNewItemForm();
  const { isSubmitting, submitForm } = usePublicFormSubmission();
  const {
    currentStepId,
    currentStepConfig,
    currentStepIndex,
    stepErrors,
    setStepErrors,
    handleNext,
    handlePrevious,
    clearStepErrors,
    resetNavigation
  } = useFormNavigation();

  useEffect(() => {
    resetFormData(); 
  }, []); 

  const typedFormSteps = publicFormSteps.map(step => ({ id: step.id, name: step.name }));
  const CurrentStepComponent = currentStepConfig?.component || (() => <div>שלב לא תקין</div>);

  const handleSubmit = async () => {
    const success = await submitForm(formData);
    if (success) {
      resetFormData();
      resetNavigation();
    } else {
      // Set specific errors based on validation
      if (!formData.restaurantName?.trim()) {
        setStepErrors({ restaurantName: "שם המסעדה הוא שדה חובה." });
        return;
      }
      if (!formData.itemName?.trim()) {
        setStepErrors({ itemName: "שם הפריט הוא שדה חובה." });
        return;
      }
      if (!formData.itemType) {
        setStepErrors({ itemType: "סוג הפריט הוא שדה חובה." });
        return;
      }
      if (formData.referenceImages.length === 0) {
        setStepErrors({ referenceImages: "יש להעלות לפחות תמונה אחת." });
        return;
      }
    }
  };

  const handleNextStep = () => {
    handleNext(formData, handleSubmit);
  };

  const showNavigationButtons = currentStepConfig && currentStepConfig.id !== 4; 
  const isLastNonReviewStep = currentStepConfig && currentStepConfig.id === 3; 

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 md:p-8 bg-white shadow-xl rounded-lg">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-800">
        העלאת פריט חדש (ציבורי)
      </h1>
      
      <FormProgress formSteps={typedFormSteps} currentStepId={currentStepId} />

      <div className="mt-8 min-h-[300px]"> 
        <CurrentStepComponent 
            key={currentStepId}
            setExternalErrors={setStepErrors} 
            clearExternalErrors={clearStepErrors}
            errors={stepErrors}
            onFinalSubmit={currentStepId === 4 ? handleSubmit : undefined} 
        />
      </div>

      {Object.keys(stepErrors).length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-sm font-semibold text-red-700">אנא תקנו את השגיאות הבאות:</h3>
          <ul className="list-disc list-inside text-sm text-red-600 mt-1">
            {Object.entries(stepErrors).map(([key, value]) => (
              <li key={key}>{value}</li>
            ))}
          </ul>
        </div>
      )}
      
      {showNavigationButtons && (
        <div className={cn(
            "flex mt-8 pt-6 border-t",
            currentStepId === publicFormSteps[0].id ? "justify-end" : "justify-between"
        )}>
          {currentStepId !== publicFormSteps[0].id && (
            <Button variant="outline" onClick={handlePrevious} disabled={isSubmitting} className="flex items-center">
              <ChevronRight className="ml-2 h-4 w-4" /> 
              הקודם
            </Button>
          )}
          <Button onClick={handleNextStep} disabled={isSubmitting} className="flex items-center">
            {isSubmitting ? 'מעבד...' : (isLastNonReviewStep ? 'לסקירה ואישור' : 'הבא')}
            <ChevronLeft className="mr-2 h-4 w-4" /> 
          </Button>
        </div>
      )}
    </div>
  );
};

export default PublicFoodVisionUploadForm;
