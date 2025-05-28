
import { useState } from 'react';

export const useFormState = () => {
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [loadingStartTime] = useState(Date.now());

  const handleClearStepErrors = () => {
    setStepErrors({});
  };

  const isStuckLoading = (authenticating: boolean) => {
    const currentLoadingTime = Math.round((Date.now() - loadingStartTime) / 1000);
    return authenticating && currentLoadingTime > 5;
  };

  const getCurrentLoadingTime = () => {
    return Math.round((Date.now() - loadingStartTime) / 1000);
  };

  return {
    stepErrors,
    setStepErrors,
    handleClearStepErrors,
    isStuckLoading,
    getCurrentLoadingTime
  };
};
