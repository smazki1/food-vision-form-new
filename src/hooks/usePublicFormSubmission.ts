
import { useUnifiedFormSubmission } from './useUnifiedFormSubmission';

export const usePublicFormSubmission = () => {
  const { isSubmitting, submitForm } = useUnifiedFormSubmission(true);
  
  return {
    isSubmitting,
    submitForm
  };
};
