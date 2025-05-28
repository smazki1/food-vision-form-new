
import React from 'react';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import PublicFormContent from './PublicFormContent';
import PublicFormErrorDisplay from './PublicFormErrorDisplay';
import PublicFormNavigation from './PublicFormNavigation';
import SuccessModal from './SuccessModal';

interface PublicFormMainContentProps {
  CurrentStepComponent: React.ComponentType<PublicStepProps>;
  currentStepId: number;
  setErrors: (errors: Record<string, string>) => void;
  clearErrors: () => void;
  errors: Record<string, string>;
  isReviewStep: boolean;
  onFinalSubmit?: () => void;
  showNavigationButtons: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  onNext: () => void;
  onPrevious: () => void;
  showSuccessModal: boolean;
  onNewSubmission: () => void;
  onCloseSuccessModal: () => void;
}

const PublicFormMainContent: React.FC<PublicFormMainContentProps> = ({
  CurrentStepComponent,
  currentStepId,
  setErrors,
  clearErrors,
  errors,
  isReviewStep,
  onFinalSubmit,
  showNavigationButtons,
  isFirstStep,
  isLastStep,
  isSubmitting,
  onNext,
  onPrevious,
  showSuccessModal,
  onNewSubmission,
  onCloseSuccessModal
}) => {
  return (
    <>
      <PublicFormContent
        CurrentStepComponent={CurrentStepComponent}
        currentStepId={currentStepId}
        setErrors={setErrors}
        clearErrors={clearErrors}
        errors={errors}
        isReviewStep={isReviewStep}
        onFinalSubmit={onFinalSubmit}
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
              onNext={onNext}
              onPrevious={onPrevious}
            />
          )}
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={onCloseSuccessModal}
        onNewSubmission={onNewSubmission}
      />
    </>
  );
};

export default PublicFormMainContent;
