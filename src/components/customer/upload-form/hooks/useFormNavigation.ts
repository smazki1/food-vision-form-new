
import { useState } from 'react';
import { allSteps, FormStepConfig } from '../config/formStepsConfig';

export const useFormNavigation = (clientId: string | null) => {
  const [formSteps, setFormSteps] = useState<FormStepConfig[]>(allSteps);
  const [currentStepId, setCurrentStepId] = useState(allSteps[0].id);

  const updateStepsForAuthenticatedUser = () => {
    if (clientId) {
      const stepsForLoggedInUser = allSteps.filter(step => step.id !== 1);
      setFormSteps(stepsForLoggedInUser);
      setCurrentStepId(stepsForLoggedInUser[0]?.id || allSteps[1].id);
    } else {
      setFormSteps(allSteps);
      setCurrentStepId(allSteps[0].id);
    }
  };

  const resetToAllSteps = () => {
    setFormSteps(allSteps);
    setCurrentStepId(allSteps[0].id);
  };

  const moveToNextStep = () => {
    const currentIndexInCurrentSteps = formSteps.findIndex(step => step.id === currentStepId);
    if (currentIndexInCurrentSteps < formSteps.length - 1) {
      setCurrentStepId(formSteps[currentIndexInCurrentSteps + 1].id);
      window.scrollTo(0, 0);
    }
  };

  const moveToPreviousStep = () => {
    const currentIndexInCurrentSteps = formSteps.findIndex(step => step.id === currentStepId);
    if (currentIndexInCurrentSteps > 0) {
      setCurrentStepId(formSteps[currentIndexInCurrentSteps - 1].id);
      window.scrollTo(0, 0);
    }
  };

  const moveToStep = (stepId: number) => {
    setCurrentStepId(stepId);
    window.scrollTo(0, 0);
  };

  return {
    formSteps,
    currentStepId,
    setFormSteps,
    setCurrentStepId,
    updateStepsForAuthenticatedUser,
    resetToAllSteps,
    moveToNextStep,
    moveToPreviousStep,
    moveToStep
  };
};
