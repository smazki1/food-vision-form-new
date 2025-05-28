
import { useState } from 'react';

export const usePublicFormState = () => {
  const [loadingStartTime] = useState(Date.now());

  const getCurrentLoadingTime = () => {
    return Math.round((Date.now() - loadingStartTime) / 1000);
  };

  const isStuckLoading = (isSubmitting: boolean) => {
    const currentLoadingTime = getCurrentLoadingTime();
    return isSubmitting && currentLoadingTime > 5;
  };

  return {
    getCurrentLoadingTime,
    isStuckLoading
  };
};
