
import React, { useEffect } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { useUnifiedFormNavigation } from '@/hooks/useUnifiedFormNavigation';
import { useUnifiedFormValidation } from '@/hooks/useUnifiedFormValidation';
import { usePublicFormHandlers } from './hooks/usePublicFormHandlers';
import RestaurantDetailsStep from './steps/RestaurantDetailsStep';
import ItemDetailsStep from './steps/ItemDetailsStep';
import ImageUploadStep from './steps/ImageUploadStep';
import ReviewSubmitStep from './steps/ReviewSubmitStep';
import ProgressBar from './components/ProgressBar';
import SuccessModal from './components/SuccessModal';

export interface PublicStepProps {
  setExternalErrors?: (errors: Record<string, string>) => void;
  clearExternalErrors?: () => void;
  errors?: Record<string, string>;
  onFinalSubmit?: () => void; 
}

const publicFormSteps = [
  {
    id: 1,
    name: 'פרטי מסעדה',
    component: RestaurantDetailsStep
  },
  {
    id: 2,
    name: 'פרטי המנה',
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
  const { resetFormData } = useNewItemForm();
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

  const {
    handleNext,
    handlePrevious,
    handleSubmit,
    handleNewSubmission,
    handleCloseSuccessModal,
    isSubmitting,
    showSuccessModal
  } = usePublicFormHandlers(
    currentStepId,
    isLastStep,
    moveToNextStep,
    moveToPreviousStep,
    moveToStep,
    validateStep,
    clearErrors
  );

  useEffect(() => {
    resetFormData(); 
  }, []); 

  const CurrentStepComponent = currentStepConfig?.component || (() => <div>שלב לא תקין</div>);
  const isReviewStep = currentStepId === 4;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <ProgressBar 
          currentStep={currentStepId} 
          totalSteps={4}
          steps={publicFormSteps}
        />

        {/* Main Form Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mt-8 transition-all duration-300 hover:shadow-2xl">
          <div className="p-8 md:p-12">
            <CurrentStepComponent
              setExternalErrors={setErrors}
              clearExternalErrors={clearErrors}
              errors={errors}
              onFinalSubmit={isReviewStep ? handleSubmit : undefined}
            />

            {/* Navigation Buttons */}
            {currentStepId !== 4 && (
              <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-100">
                {!isFirstStep && (
                  <button
                    onClick={handlePrevious}
                    disabled={isSubmitting}
                    className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                  >
                    חזור
                  </button>
                )}
                
                <div className="flex-1"></div>
                
                <button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-[#F3752B] text-white rounded-xl font-semibold hover:bg-orange-600 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'מעבד...' : 'הבא'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        onNewSubmission={handleNewSubmission}
      />
    </div>
  );
};

export default PublicFoodVisionUploadForm;
