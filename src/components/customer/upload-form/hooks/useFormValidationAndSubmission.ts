import { useCallback } from 'react';
import { NewItemFormData } from '@/contexts/NewItemFormContext';
import { allSteps } from '../config/formStepsConfig';
import { useRestaurantDetailsSubmission } from './useRestaurantDetailsSubmission';
import { useFormSubmission } from './useFormSubmission';

interface UseFormValidationAndSubmissionProps {
  clientId: string | null;
  formData: NewItemFormData;
  remainingDishes: number | undefined;
  formSteps: any[];
  currentStepId: number;
  setStepErrors: (errors: Record<string, string>) => void;
  updateStepsForAuthenticatedUser: () => void;
  resetToAllSteps: () => void;
  moveToStep: (stepId: number) => void;
  refreshClientAuth: () => void;
  resetFormData: () => void;
}

export const useFormValidationAndSubmission = ({
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
}: UseFormValidationAndSubmissionProps) => {
  const { handleRestaurantDetailsSubmit, isCreatingClient } = useRestaurantDetailsSubmission(refreshClientAuth);
  const { 
    handleSubmit: submitForm, 
    isSubmitting, 
    showSuccessModal, 
    handleCloseSuccessModal 
  } = useFormSubmission();

  const handleRestaurantDetailsFlow = useCallback(async () => {
    const currentStepConfig = formSteps.find(step => step.id === currentStepId);
    if (currentStepConfig?.validate) {
      const newErrors = currentStepConfig.validate(formData);
      setStepErrors(newErrors);
      if (Object.keys(newErrors).length === 0) {
        const success = await handleRestaurantDetailsSubmit(formData, setStepErrors);
        if (success) {
          const nextStepInAllSteps = allSteps.find(step => step.id === 2);
          if (nextStepInAllSteps) {
            updateStepsForAuthenticatedUser();
          }
        }
      }
    }
  }, [currentStepId, formSteps, formData, setStepErrors, handleRestaurantDetailsSubmit, updateStepsForAuthenticatedUser]);

  const handleMainSubmit = useCallback(async () => {
    const finalClientId = clientId;

    if (!finalClientId) {
      const errorMessage = "שגיאה: לא זוהה מזהה לקוח. אנא התחברו או השלימו את פרטי המסעדה.";
      if (!formSteps.find(s => s.id === 1)) {
        resetToAllSteps();
      } else if (currentStepId !== 1) {
        moveToStep(allSteps[0].id);
      }
      setStepErrors({ submit: "יש להשלים את פרטי המסעדה או להתחבר לפני ההגשה." });
      return;
    }

    const reviewStepConfig = allSteps.find(step => step.id === 4);
    if (reviewStepConfig?.validate) {
      const newErrors = reviewStepConfig.validate(formData);
      setStepErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        if (currentStepId !== 4) moveToStep(4);
        return;
      }
    }

    const success = await submitForm(formData, finalClientId, remainingDishes, setStepErrors);
    if (success) {
      setStepErrors({});
    } else {
      if (currentStepId !== 4) moveToStep(4);
    }
  }, [clientId, formSteps, currentStepId, formData, remainingDishes, setStepErrors, resetToAllSteps, moveToStep, submitForm, updateStepsForAuthenticatedUser]);

  return {
    handleRestaurantDetailsFlow,
    handleMainSubmit,
    isCreatingClient,
    isSubmitting,
    showSuccessModal,
    handleCloseSuccessModal
  };
};
