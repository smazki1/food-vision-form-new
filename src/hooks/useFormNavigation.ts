
import { useState } from 'react';

export interface FormStep {
  id: number;
  name: string;
  component?: React.ComponentType<any>;
  validate?: (formData: any) => Record<string, string>;
}

export const useFormNavigation = (initialSteps: FormStep[], initialStepId: number = 1) => {
  const [currentStepId, setCurrentStepId] = useState(initialStepId);
  const [formSteps, setFormSteps] = useState<FormStep[]>(initialSteps);

  const currentStepIndex = formSteps.findIndex(step => step.id === currentStepId);
  const currentStepConfig = formSteps.find(step => step.id === currentStepId);

  const moveToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < formSteps.length) {
      setCurrentStepId(formSteps[nextIndex].id);
    }
  };

  const moveToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStepId(formSteps[prevIndex].id);
    }
  };

  const moveToStep = (stepId: number) => {
    const step = formSteps.find(s => s.id === stepId);
    if (step) {
      setCurrentStepId(stepId);
    }
  };

  const updateSteps = (newSteps: FormStep[]) => {
    setFormSteps(newSteps);
  };

  const resetToStep = (stepId: number) => {
    moveToStep(stepId);
  };

  return {
    currentStepId,
    currentStepIndex,
    currentStepConfig,
    formSteps,
    moveToNextStep,
    moveToPreviousStep,
    moveToStep,
    updateSteps,
    resetToStep,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === formSteps.length - 1
  };
};
