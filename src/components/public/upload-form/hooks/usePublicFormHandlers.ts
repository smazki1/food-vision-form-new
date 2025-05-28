
import { useCallback } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { usePublicFormSubmission } from '@/hooks/usePublicFormSubmission';
import { useUnifiedFormValidation } from '@/hooks/useUnifiedFormValidation';

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

  const handleNext = useCallback(async () => {
    const isValid = await validateStep(currentStepId);
    if (isValid && !isLastStep) {
      moveToNextStep();
    }
  }, [currentStepId, isLastStep, moveToNextStep, validateStep]);

  const handlePrevious = useCallback(() => {
    clearErrors();
    moveToPreviousStep();
  }, [clearErrors, moveToPreviousStep]);

  const handleSubmit = useCallback(async () => {
    const isValid = await validateStep(currentStepId);
    if (!isValid) return;

    const success = await submitForm(formData);
    if (success) {
      resetFormData();
      moveToStep(1);
      clearErrors();
    }
  }, [currentStepId, validateStep, submitForm, formData, resetFormData, moveToStep, clearErrors]);

  return {
    handleNext,
    handlePrevious,
    handleSubmit,
    isSubmitting
  };
};
