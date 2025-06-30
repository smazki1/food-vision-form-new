import React, { useEffect } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { useClientAuth } from '@/hooks/useClientAuth';
import { useClientPackage } from '@/hooks/useClientPackage';
import FormProgress from './FormProgress';
import { useFormNavigation } from './hooks/useFormNavigation';
import { useFormState } from './hooks/useFormState';
import { useEnhancedFormSubmission } from './hooks/useEnhancedFormSubmission';
import FormLoadingState from './components/FormLoadingState';
import FormErrorAlert from './components/FormErrorAlert';
import FormNavigationButtons from './components/FormNavigationButtons';
import FormErrorDisplay from './components/FormErrorDisplay';
import CustomerUploadSuccessModal from './components/CustomerUploadSuccessModal';
import UploadProgressModal from './components/UploadProgressModal';
import { useNavigate } from 'react-router-dom';
import { authenticatedSteps } from './config/formStepsConfig';

export interface StepProps {
  setExternalErrors?: (errors: Record<string, string>) => void;
  clearExternalErrors?: () => void;
  errors?: Record<string, string>;
  onFinalSubmit?: () => void;
}

const CustomerUploadForm: React.FC = () => {
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

  // Use only authenticated steps (skip restaurant details)
  const formSteps = authenticatedSteps;
  const [currentStepId, setCurrentStepId] = React.useState(2); // Start at step 2 (upload details)

  const {
    handleSubmit,
    isSubmitting,
    showSuccessModal,
    showProgressModal,
    progressData,
    handleCloseSuccessModal,
    handleCloseProgressModal,
    handleCancel
  } = useEnhancedFormSubmission({
    clientId,
    formData,
    remainingDishes,
    setStepErrors,
    resetFormData
  });

  const typedFormSteps = formSteps.map(step => ({ id: step.id, name: step.name }));
  const CurrentStepComponent = formSteps.find(step => step.id === currentStepId)?.component || (() => <div>שלב לא תקין</div>);
  const currentStepConfig = formSteps.find(step => step.id === currentStepId);

  const moveToNextStep = () => {
    const currentIndex = formSteps.findIndex(step => step.id === currentStepId);
    if (currentIndex < formSteps.length - 1) {
      setCurrentStepId(formSteps[currentIndex + 1].id);
      window.scrollTo(0, 0);
    }
  };

  const moveToPreviousStep = () => {
    const currentIndex = formSteps.findIndex(step => step.id === currentStepId);
    if (currentIndex > 0) {
      setCurrentStepId(formSteps[currentIndex - 1].id);
      window.scrollTo(0, 0);
    }
  };

  const handleNext = async () => {
    if (currentStepConfig?.validate) {
      const newErrors = currentStepConfig.validate(formData);
      setStepErrors(newErrors);
      if (Object.keys(newErrors).length === 0) {
        const currentIndex = formSteps.findIndex(step => step.id === currentStepId);
        if (currentIndex < formSteps.length - 1) {
          moveToNextStep();
        } else {
          await handleSubmit();
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
      // Retry auth
      refreshClientAuth();
    } else {
      refreshClientAuth();
    }
  };

  const handleNewSubmission = () => {
    resetFormData();
    setCurrentStepId(2); // Reset to upload step
    handleCloseSuccessModal();
  };

  const handleGoHome = () => {
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
            isCreatingClient={false}
            isSubmitting={isSubmitting}
          />
          
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-[#8B1E3F]">
              העלאת מנות חדשות
            </h1>
            <p className="text-gray-600 mt-2">
              העלו מנות חדשות לעיבוד במערכת
            </p>
          </div>
          
          <CurrentStepComponent 
            setExternalErrors={setStepErrors} 
            clearExternalErrors={handleClearStepErrors} 
            errors={stepErrors}
            onFinalSubmit={handleSubmit} 
          />
          
          <FormErrorDisplay stepErrors={stepErrors} />

          <FormNavigationButtons
            formSteps={formSteps}
            currentStepId={currentStepId}
            clientId={clientId}
            isSubmitting={isSubmitting}
            isCreatingClient={false}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onMainSubmit={handleSubmit}
          />
        </div>
      </main>

      {/* Progress Modal */}
      <UploadProgressModal
        isOpen={showProgressModal}
        onClose={handleCloseProgressModal}
        onCancel={handleCancel}
        progressData={progressData}
      />

      {/* Success Modal */}
      <CustomerUploadSuccessModal
        key={`success-modal-${showSuccessModal}`}
        isOpen={showSuccessModal}
        onClose={handleGoHome}
        onNewSubmission={handleNewSubmission}
      />
    </div>
  );
};

export default CustomerUploadForm; 