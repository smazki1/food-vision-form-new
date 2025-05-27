import React, { useEffect } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { useUnifiedFormNavigation } from '@/hooks/useUnifiedFormNavigation';
import { useUnifiedFormValidation } from '@/hooks/useUnifiedFormValidation';
import { usePublicFormSubmission } from '@/hooks/usePublicFormSubmission';
import RestaurantDetailsStep from './steps/RestaurantDetailsStep';
import CombinedUploadStep from './steps/CombinedUploadStep';
import ReviewSubmitStep from './steps/ReviewSubmitStep';
import PublicFormHeader from './components/PublicFormHeader';
import PublicFormContent from './components/PublicFormContent';
import PublicFormErrorDisplay from './components/PublicFormErrorDisplay';
import PublicFormNavigation from './components/PublicFormNavigation';

export interface PublicStepProps {
  setExternalErrors?: (errors: Record<string, string>) => void;
  clearExternalErrors?: () => void;
  errors?: Record<string, string>;
  onFinalSubmit?: () => void; 
  onNext?: () => Promise<void>;
  isSubmitting?: boolean;
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
    name: 'פרטי העלאה',
    component: CombinedUploadStep
  },
  {
    id: 3,
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

  const showNavigationButtons = currentStepId !== 3; 
  const isReviewStep = currentStepId === 3;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PublicFormHeader 
        formSteps={typedFormSteps} 
        currentStepId={currentStepId} 
      />

      <PublicFormContent
        CurrentStepComponent={CurrentStepComponent}
        currentStepId={currentStepId}
        setErrors={setErrors}
        clearErrors={clearErrors}
        errors={errors}
        isReviewStep={isReviewStep}
        onFinalSubmit={handleSubmit}
      />

      <div className="max-w-2xl mx-auto w-full px-4 md:px-6">
        <div className="bg-white px-6 md:px-8 pb-6 md:pb-8 rounded-b-lg shadow-lg">
          <PublicFormErrorDisplay errors={errors} />
          
          {showNavigationButtons && (
            <PublicFormNavigation
              isFirstStep={isFirstStep}
              isLastStep={isLastStep}
              isSubmitting={isSubmitting}
              currentStepId={currentStepId}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicFoodVisionUploadForm;
