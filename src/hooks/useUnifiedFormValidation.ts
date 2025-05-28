
import { useState } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { 
  validateRestaurantDetailsStep, 
  validateItemDetailsStep, 
  validateImageUploadStep,
  validateReviewStep 
} from '@/utils/publicFormValidation';

export const useUnifiedFormValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { formData } = useNewItemForm();

  const validateStep = async (step: number): Promise<boolean> => {
    let newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Restaurant Details
        newErrors = validateRestaurantDetailsStep(formData);
        break;
      case 2: // Item Details
        newErrors = validateItemDetailsStep(formData);
        break;
      case 3: // Image Upload
        newErrors = validateImageUploadStep(formData);
        break;
      case 4: // Review
        newErrors = validateReviewStep(formData);
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearErrors = () => {
    setErrors({});
  };

  return {
    validateStep,
    errors,
    clearErrors,
    setErrors
  };
};
