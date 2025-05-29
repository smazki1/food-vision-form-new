import { useCallback, useState } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { usePublicFormSubmission } from '@/hooks/usePublicFormSubmission';

export const usePublicFormHandlers = (
  currentStepId: number,
  isLastStep: boolean,
  moveToNextStep: () => void,
  moveToPreviousStep: () => void,
  moveToStep: (step: number) => void,
  validateStep: (stepId: number) => Promise<boolean>,
  clearErrors: () => void
) => {
  const { formData, resetFormData } = useNewItemForm();
  const { isSubmitting, submitForm } = usePublicFormSubmission();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleNext = useCallback(async () => {
    const isValid = await validateStep(currentStepId);
    if (isValid && !isLastStep) {
      moveToNextStep();
    }
  }, [currentStepId, isLastStep, moveToNextStep, validateStep]);

  const handlePrevious = useCallback(() => {
    clearErrors();
    if (currentStepId > 1) {
      moveToPreviousStep();
    }
  }, [clearErrors, moveToPreviousStep, currentStepId]);

  const handleSubmit = useCallback(async () => {
    const isValid = await validateStep(currentStepId);
    if (!isValid) return;

    try {
      const success = await submitForm(formData);
      if (success) {
        setShowSuccessModal(true);
      }
    } catch (e) {
      // Handle or log error appropriately in a real app
      console.error('Error during form submission:', e);
    }
  }, [currentStepId, validateStep, submitForm, formData]);

  const handleNewSubmission = useCallback(() => {
    const restaurantName = formData.restaurantName;
    resetFormData();
    setTimeout(() => {
      if (restaurantName) {
        moveToStep(2);
      } else {
        moveToStep(1);
      }
    }, 100);
    clearErrors();
    setShowSuccessModal(false);
  }, [resetFormData, moveToStep, clearErrors, formData.restaurantName, formData.submitterName]);

  const handleCloseSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
  }, []);

  return {
    handleNext,
    handlePrevious,
    handleSubmit,
    handleNewSubmission,
    handleCloseSuccessModal,
    isSubmitting,
    showSuccessModal
  };
};
