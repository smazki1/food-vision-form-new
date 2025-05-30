import { useCallback, useState } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { usePublicFormSubmission } from '@/hooks/usePublicFormSubmission';
import { toast } from 'sonner';

export const usePublicFormHandlers = (
  currentStepId: number,
  isLastStep: boolean,
  moveToNextStep: () => void,
  moveToPreviousStep: () => void,
  moveToStep: (step: number) => void,
  validateStep: (stepId: number) => Promise<boolean>,
  clearErrors: () => void
) => {
  const { formData, resetFormData, updateFormData } = useNewItemForm();
  const { isSubmitting, submitForm } = usePublicFormSubmission();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleNext = useCallback(async () => {
    console.log('1. handleNext called');
    const isValid = await validateStep(currentStepId);
    console.log('2. Validation result:', isValid);
    if (isValid && !isLastStep) {
      console.log('3. Moving to next step');
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
    console.log('1. handleSubmit started');
    const isValid = await validateStep(currentStepId);
    console.log('2. Validation result:', isValid);
    if (!isValid) return;

    try {
      console.log('3. Submitting form data');
      const success = await submitForm(formData);
      console.log('4. Submit result:', success);
      
      if (success) {
        console.log('5. Setting showSuccessModal to true');
        setShowSuccessModal(true);
        toast.success('המנה נשלחה בהצלחה!');
        setTimeout(() => {
          console.log('6. Modal state after delay:', showSuccessModal);
          if (!showSuccessModal) {
            setShowSuccessModal(true);
          }
        }, 300);
        fetch('https://hook.eu2.make.com/h15kqbjphouh5wvmsnvxopkl7tff8o7u', { method: 'POST' }).catch(() => {});
      } else {
        console.log('5. Submission failed');
      }
    } catch (e) {
      console.error('Error during form submission:', e);
      toast.error('שגיאה בשליחת הטופס');
    }
  }, [currentStepId, validateStep, submitForm, formData, showSuccessModal]);

  const handleNewSubmission = useCallback(() => {
    console.log('handleNewSubmission called');
    const { restaurantName, submitterName } = formData;
    resetFormData();
    setTimeout(() => {
      updateFormData({ restaurantName, submitterName });
      if (restaurantName) {
        moveToStep(2);
      } else {
        moveToStep(1);
      }
    }, 100);
    clearErrors();
    setShowSuccessModal(false);
  }, [resetFormData, updateFormData, moveToStep, clearErrors, formData.restaurantName, formData.submitterName]);

  const handleCloseSuccessModal = useCallback(() => {
    console.log('handleCloseSuccessModal called');
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
