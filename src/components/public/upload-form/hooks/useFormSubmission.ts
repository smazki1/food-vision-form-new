
import { useState } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { usePublicFormSubmission as useRealSubmission } from '@/hooks/usePublicFormSubmission';

export const useFormSubmission = () => {
  const { formData, resetFormData } = useNewItemForm();
  const { submitForm: realSubmitForm, isSubmitting } = useRealSubmission();

  const submitForm = async (): Promise<boolean> => {
    const success = await realSubmitForm(formData);
    if (success) {
      resetFormData();
    }
    return success;
  };

  return {
    submitForm,
    isSubmitting
  };
};
