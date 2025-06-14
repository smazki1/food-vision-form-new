import React, { useEffect } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { useUnifiedFormNavigation } from '@/hooks/useUnifiedFormNavigation';
import { useUnifiedFormValidation } from '@/hooks/useUnifiedFormValidation';
import { usePublicFormHandlers } from './hooks/usePublicFormHandlers';
import RestaurantDetailsStep from './steps/RestaurantDetailsStep';
import CombinedUploadStep from './steps/CombinedUploadStep';
import AdditionalDetailsStep from './steps/AdditionalDetailsStep';
import ReviewSubmitStep from './steps/ReviewSubmitStep';
import ProgressBar from './components/ProgressBar';
import SuccessModal from './components/SuccessModal';
import FormErrorSummary from './components/FormErrorSummary';
import { ExistingBusinessSuccessDialog } from '@/components/ui/ExistingBusinessSuccessDialog';
import { Plus } from 'lucide-react';

export interface PublicStepProps {
  setExternalErrors?: (errors: Record<string, string>) => void;
  clearExternalErrors?: () => void;
  errors?: Record<string, string>;
  onFinalSubmit?: () => void; 
  onBack?: () => void;
  isSubmitting?: boolean;
}

const publicFormSteps = [
  {
    id: 1,
    name: 'פרטי מסעדה',
    component: RestaurantDetailsStep
  },
  {
    id: 2,
    name: 'פרטי העלאה',
    component: CombinedUploadStep
  },
  {
    id: 3,
    name: 'פרטים נוספים',
    component: AdditionalDetailsStep
  },
  {
    id: 4,
    name: 'סקירה ואישור',
    component: ReviewSubmitStep
  }
];

const PublicFoodVisionUploadForm: React.FC = () => {
  const { resetFormData, formData, updateFormData } = useNewItemForm();
  const [showExistingBusinessDialog, setShowExistingBusinessDialog] = React.useState(false);
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
    showSuccessModal,
    showValidationErrors,
    setShowValidationErrors
  } = usePublicFormHandlers(
    currentStepId,
    isLastStep,
    moveToNextStep,
    moveToPreviousStep,
    moveToStep,
    validateStep,
    clearErrors,
    () => setShowExistingBusinessDialog(true)
  );

  useEffect(() => {
    resetFormData(); 
  }, []); 

  // Auto-dismiss validation errors when user interacts with form data
  useEffect(() => {
    if (showValidationErrors) {
      setShowValidationErrors(false);
    }
  }, [formData]);

  // Log whenever showSuccessModal changes
  useEffect(() => {
    console.log('[PublicFoodVisionUploadForm] showSuccessModal changed:', showSuccessModal);
  }, [showSuccessModal]);

  const CurrentStepComponent = currentStepConfig?.component || (() => <div>שלב לא תקין</div>);
  const isReviewStep = currentStepId === 4;



  console.log('[PublicFoodVisionUploadForm] Current navigation state:', {
    currentStepId,
    isFirstStep,
    isLastStep,
    isReviewStep,
    totalSteps: publicFormSteps.length,
    showSuccessModal
  });

  // Handle final submit in review step
  const handleFinalSubmit = () => {
    console.log('[PublicFoodVisionUploadForm] handleFinalSubmit called');
    if (handleSubmit) {
      handleSubmit();
    }
  };

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
              onFinalSubmit={isReviewStep ? handleFinalSubmit : undefined}
              onBack={handlePrevious}
              isSubmitting={isSubmitting}
            />

            {/* Error Summary for Review Step */}
            {currentStepId === 4 && showValidationErrors && Object.keys(errors).length > 0 && (
              <div className="mt-8">
                <FormErrorSummary 
                  errors={errors}
                  onDismiss={() => setShowValidationErrors(false)}
                />
              </div>
            )}

            {/* Error Summary - Show when validation fails */}
            {currentStepId !== 4 && showValidationErrors && Object.keys(errors).length > 0 && (
              <div className="mt-8">
                <FormErrorSummary 
                  errors={errors}
                  onDismiss={() => setShowValidationErrors(false)}
                />
              </div>
            )}

            {/* Navigation Buttons - Centered and Mobile Responsive */}
            {currentStepId !== 4 && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12 pt-8 border-t border-gray-100">
                {!isFirstStep && (
                  <button
                    onClick={handlePrevious}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto order-2 sm:order-1 px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 min-w-[120px]"
                  >
                    חזור
                  </button>
                )}
                
                <button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto order-1 sm:order-2 px-8 py-4 bg-[#F3752B] text-white rounded-xl font-semibold hover:bg-orange-600 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 min-w-[120px]"
                >
                  {isSubmitting ? 'מעבד...' : 'הבא'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal - Added key to force re-render when isOpen changes */}
      <SuccessModal
        key={`success-modal-${showSuccessModal}`}
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        onNewSubmission={handleNewSubmission}
      />

      {/* Existing Business Success Dialog */}
      <ExistingBusinessSuccessDialog
        open={showExistingBusinessDialog}
        onOpenChange={setShowExistingBusinessDialog}
      />
    </div>
  );
};

export default PublicFoodVisionUploadForm;
