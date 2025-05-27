
import { useUnifiedFormSubmission } from '@/hooks/useUnifiedFormSubmission';

export const useFormSubmission = () => {
  const { isSubmitting, submitForm: unifiedSubmitForm } = useUnifiedFormSubmission(false);

  const handleSubmit = async (
    formData: any,
    clientId: string | null,
    remainingDishes: number | undefined,
    setStepErrors: (errors: Record<string, string>) => void
  ) => {
    return await unifiedSubmitForm(formData, clientId, remainingDishes, setStepErrors);
  };

  return {
    handleSubmit,
    isSubmitting
  };
};
