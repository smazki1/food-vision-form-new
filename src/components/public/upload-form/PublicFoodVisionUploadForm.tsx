
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import FormProgress from '@/components/customer/upload-form/FormProgress';
import { cn } from '@/lib/utils';
import { useUnifiedFormNavigation } from '@/hooks/useUnifiedFormNavigation';
import { useUnifiedFormValidation } from '@/hooks/useUnifiedFormValidation';
import { usePublicFormSubmission } from '@/hooks/usePublicFormSubmission';
import RestaurantDetailsStep from './steps/RestaurantDetailsStep';
import ItemDetailsStep from './steps/ItemDetailsStep';
import ImageUploadStep from './steps/ImageUploadStep';
import ReviewSubmitStep from './steps/ReviewSubmitStep';

export interface PublicStepProps {
  setExternalErrors?: (errors: Record<string, string>) => void;
  clearExternalErrors?: () => void;
  errors?: Record<string, string>;
  onFinalSubmit?: () => void; 
}

// Define the public form steps with validation
const publicFormSteps = [
  {
    id: 1,
    name: 'פרטי המסעדה',
    component: RestaurantDetailsStep
  },
  {
    id: 2,
    name: 'פרטי הפריט',
    component: ItemDetailsStep
  },
  {
    id: 3,
    name: 'העלאת תמונות',
    component: ImageUploadStep
  },
  {
    id: 4,
    name: 'סקירה ואישור',
    component: ReviewSubmitStep
  }
];

const PublicFoodVisionUploadForm: React.FC = () => {
  const { formData, resetFormData } = useNewItemForm();
  const { isSubmitting, submitForm } = usePublicFormSubmission();
  const {
    currentStepId,
    currentStepConfig,
    currentStepIndex,
    formSteps,
    moveToNextStep,
    moveToPreviousStep,
    moveToStep,
    isFirstStep,
    isLastStep
  } = useUnifiedFormNavigation(publicFormSteps, 1);

  const { validateStep, errors, clearErrors, setErrors } = useUnifiedFormValidation();

  useEffect(() => {
    resetFormData(); 
  }, []); 

  const typedFormSteps = formSteps.map(step => ({ id: step.id, name: step.name }));
  const CurrentStepComponent = currentStepConfig?.component || (() => <div>שלב לא תקין</div>);

  const handleNext = async () => {
    const isValid = await validateStep(currentStepId);
    if (isValid && !isLastStep) {
      moveToNextStep();
    }
  };

  const handlePrevious = () => {
    clearErrors();
    moveToPreviousStep();
  };

  const handleSubmit = async () => {
    const isValid = await validateStep(currentStepId);
    if (!isValid) return;

    const success = await submitForm(formData);
    if (success) {
      resetFormData();
      moveToStep(1);
      clearErrors();
    }
  };

  const showNavigationButtons = currentStepId !== 4; 
  const isReviewStep = currentStepId === 4;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header with Progress */}
      <div className="relative p-4 bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-800">
            העלאת פריט חדש
          </h1>
          <FormProgress formSteps={typedFormSteps} currentStepId={currentStepId} />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-lg">
          <CurrentStepComponent 
            key={currentStepId}
            setExternalErrors={setErrors} 
            clearExternalErrors={clearErrors}
            errors={errors}
            onFinalSubmit={isReviewStep ? handleSubmit : undefined} 
          />

          {/* Error Display */}
          {Object.keys(errors).length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-sm font-semibold text-red-700">אנא תקנו את השגיאות הבאות:</h3>
              <ul className="list-disc list-inside text-sm text-red-600 mt-1">
                {Object.entries(errors).map(([key, value]) => (
                  <li key={key}>{value}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Navigation Buttons */}
          {showNavigationButtons && (
            <div className={cn(
              "flex mt-8 pt-6 border-t",
              isFirstStep ? "justify-end" : "justify-between"
            )}>
              {!isFirstStep && (
                <Button 
                  variant="outline" 
                  onClick={handlePrevious} 
                  disabled={isSubmitting}
                  className="flex items-center bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900"
                >
                  <ChevronRight className="ml-2 h-4 w-4" /> 
                  הקודם
                </Button>
              )}
              <Button 
                onClick={handleNext} 
                disabled={isSubmitting}
                className="flex items-center bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600"
              >
                {isSubmitting ? 'מעבד...' : (currentStepId === 3 ? 'לסקירה ואישור' : 'הבא')}
                <ChevronLeft className="mr-2 h-4 w-4" /> 
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PublicFoodVisionUploadForm;
