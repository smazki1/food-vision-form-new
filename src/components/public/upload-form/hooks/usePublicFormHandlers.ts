
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
    console.log('[PublicFormHandlers] handlePrevious called - currentStepId:', currentStepId);
    clearErrors();
    
    // Prevent navigation issues by ensuring we only go back if we're not on the first step
    if (currentStepId > 1) {
      console.log('[PublicFormHandlers] Moving to previous step');
      moveToPreviousStep();
    } else {
      console.log('[PublicFormHandlers] Already on first step, not moving back');
    }
  }, [clearErrors, moveToPreviousStep, currentStepId]);

  const handleSubmit = useCallback(async () => {
    const isValid = await validateStep(currentStepId);
    if (!isValid) return;

    const success = await submitForm(formData);
    if (success) {
      setShowSuccessModal(true);
    }
  }, [currentStepId, validateStep, submitForm, formData]);

  const handleNewSubmission = useCallback(() => {
    // Keep restaurant details, reset the rest
    const restaurantName = formData.restaurantName;
    const submitterName = formData.submitterName;
    resetFormData();
    // Restore restaurant details for convenience
    setTimeout(() => {
      if (restaurantName) {
        moveToStep(2); // Skip to item details since restaurant info is filled
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
