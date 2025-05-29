
import { useState } from 'react';

export interface UnifiedFormStep {
  id: number;
  name: string;
  component?: React.ComponentType<any>;
  validate?: (formData: any) => Record<string, string>;
}

export const useUnifiedFormNavigation = (initialSteps: UnifiedFormStep[], initialStepId: number = 1) => {
  const [currentStepId, setCurrentStepId] = useState(initialStepId);
  const [formSteps, setFormSteps] = useState<UnifiedFormStep[]>(initialSteps);

  const currentStepIndex = formSteps.findIndex(step => step.id === currentStepId);
  const currentStepConfig = formSteps.find(step => step.id === currentStepId);

  const moveToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < formSteps.length) {
      const nextStepId = formSteps[nextIndex].id;
      console.log('[UnifiedFormNavigation] Moving to next step:', { from: currentStepId, to: nextStepId });
      setCurrentStepId(nextStepId);
      window.scrollTo(0, 0);
    } else {
      console.log('[UnifiedFormNavigation] Already at last step, cannot move next');
    }
  };

  const moveToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStepId = formSteps[prevIndex].id;
      console.log('[UnifiedFormNavigation] Moving to previous step:', { from: currentStepId, to: prevStepId });
      setCurrentStepId(prevStepId);
      window.scrollTo(0, 0);
    } else {
      console.log('[UnifiedFormNavigation] Already at first step, cannot move back');
    }
  };

  const moveToStep = (stepId: number) => {
    const step = formSteps.find(s => s.id === stepId);
    if (step) {
      console.log('[UnifiedFormNavigation] Moving to specific step:', { from: currentStepId, to: stepId });
      setCurrentStepId(stepId);
      window.scrollTo(0, 0);
    } else {
      console.warn('[UnifiedFormNavigation] Step not found:', stepId);
    }
  };

  const updateSteps = (newSteps: UnifiedFormStep[]) => {
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
    isLastStep: currentStepIndex === formSteps.length - 1,
    totalSteps: formSteps.length
  };
};
