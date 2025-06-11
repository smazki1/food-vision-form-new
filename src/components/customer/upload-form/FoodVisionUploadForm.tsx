import React, { useEffect } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { useClientAuth } from '@/hooks/useClientAuth';
import { useClientPackage } from '@/hooks/useClientPackage';
import FormProgress from './FormProgress';
import { useFormNavigation } from './hooks/useFormNavigation';
import { useFormState } from './hooks/useFormState';
import { useFormValidationAndSubmission } from './hooks/useFormValidationAndSubmission';
import FormLoadingState from './components/FormLoadingState';
import FormErrorAlert from './components/FormErrorAlert';
import FormClientAlert from './components/FormClientAlert';
import FormNavigationButtons from './components/FormNavigationButtons';
import FormErrorDisplay from './components/FormErrorDisplay';
import CustomerSuccessModal from './components/CustomerSuccessModal';
import { useNavigate } from 'react-router-dom';

export interface StepProps {
  setExternalErrors?: (errors: Record<string, string>) => void;
  clearExternalErrors?: () => void;
  errors?: Record<string, string>;
  onFinalSubmit?: () => void;
}

const FoodVisionUploadForm: React.FC = () => {
  const navigate = useNavigate();
  const { clientId, authenticating, refreshClientAuth, clientRecordStatus, errorState } = useClientAuth();
  const { formData, resetFormData } = useNewItemForm();
  const { remainingDishes } = useClientPackage();

  const {
    stepErrors,
    setStepErrors,
    handleClearStepErrors,
    isStuckLoading,
    getCurrentLoadingTime
  } = useFormState();

  const {
    formSteps,
    currentStepId,
    updateStepsForAuthenticatedUser,
    resetToAllSteps,
    moveToNextStep,
    moveToPreviousStep,
    moveToStep
  } = useFormNavigation(clientId);

  const {
    handleRestaurantDetailsFlow,
    handleMainSubmit,
    isCreatingClient,
    isSubmitting,
    showSuccessModal,
    handleCloseSuccessModal
  } = useFormValidationAndSubmission({
    clientId,
    formData,
    remainingDishes,
    formSteps,
    currentStepId,
    setStepErrors,
    updateStepsForAuthenticatedUser,
    resetToAllSteps,
    moveToStep,
    refreshClientAuth,
    resetFormData
  });

  // Update steps when auth changes
  useEffect(() => {
    if (!authenticating) {
      updateStepsForAuthenticatedUser();
    }
  }, [clientId, authenticating, updateStepsForAuthenticatedUser]);

  const typedFormSteps = formSteps.map(step => ({ id: step.id, name: step.name }));
  const CurrentStepComponent = formSteps.find(step => step.id === currentStepId)?.component || (() => <div>שלב לא תקין</div>);
  const currentStepConfig = formSteps.find(step => step.id === currentStepId);

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

  const handleRetry = () => {
    if (isStuckLoading(authenticating)) {
      updateStepsForAuthenticatedUser();
    } else {
      refreshClientAuth();
    }
  };

  const handleNewSubmission = () => {
    resetFormData();
    moveToStep(2); // Skip the restaurant details step for existing clients
    handleCloseSuccessModal();
  };

  const handleGoToDashboard = () => {
    navigate('/customer/dashboard');
    handleCloseSuccessModal();
  };

  if (authenticating && !isStuckLoading(authenticating)) {
    return <FormLoadingState currentLoadingTime={getCurrentLoadingTime()} />;
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
          <FormErrorAlert
            errorState={errorState}
            isStuckLoading={isStuckLoading(authenticating)}
            onRetry={handleRetry}
            isCreatingClient={isCreatingClient}
            isSubmitting={isSubmitting}
          />

          <FormClientAlert
            currentStepId={currentStepId}
            clientId={clientId}
            errorState={errorState}
            onResetToAllSteps={resetToAllSteps}
          />
          
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
          
          <FormErrorDisplay stepErrors={stepErrors} />

          <FormNavigationButtons
            formSteps={formSteps}
            currentStepId={currentStepId}
            clientId={clientId}
            isSubmitting={isSubmitting}
            isCreatingClient={isCreatingClient}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onMainSubmit={handleMainSubmit}
          />
        </div>
      </main>

      {/* Success Modal */}
      <CustomerSuccessModal
        key={`success-modal-${showSuccessModal}`}
        isOpen={showSuccessModal}
        onClose={handleGoToDashboard}
        onNewSubmission={handleNewSubmission}
      />
    </div>
  );
};

export default FoodVisionUploadForm;
