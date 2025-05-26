
import { useState } from 'react';
import { NewItemFormData } from '@/contexts/NewItemFormContext';
import { publicFormSteps } from '@/components/public/upload-form/config/formStepsConfig';

export const useFormNavigation = () => {
  const [currentStepId, setCurrentStepId] = useState(publicFormSteps[0].id);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const currentStepConfig = publicFormSteps.find(step => step.id === currentStepId);
  const currentStepIndex = publicFormSteps.findIndex(step => step.id === currentStepId);

  const handleNext = async (formData: NewItemFormData, onSubmit?: () => Promise<void>) => {
    if (currentStepConfig?.validate) {
      const newErrors = currentStepConfig.validate(formData);
      setStepErrors(newErrors);
      
      if (Object.keys(newErrors).length === 0) {
        if (currentStepIndex < publicFormSteps.length - 1) {
          setCurrentStepId(publicFormSteps[currentStepIndex + 1].id);
          window.scrollTo(0, 0);
        } else if (onSubmit) {
          await onSubmit();
        }
      }
    }
  };

  const handlePrevious = () => {
    setStepErrors({});
    if (currentStepIndex > 0) {
      setCurrentStepId(publicFormSteps[currentStepIndex - 1].id);
      window.scrollTo(0, 0);
    }
  };

  const clearStepErrors = () => {
    setStepErrors({});
  };

  const resetNavigation = () => {
    setCurrentStepId(publicFormSteps[0].id);
    setStepErrors({});
  };

  return {
    currentStepId,
    currentStepConfig,
    currentStepIndex,
    stepErrors,
    setStepErrors,
    handleNext,
    handlePrevious,
    clearStepErrors,
    resetNavigation
  };
};
