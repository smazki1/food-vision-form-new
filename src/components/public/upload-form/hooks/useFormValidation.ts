
import { useState } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';

export const useFormValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { formData } = useNewItemForm();

  const validateStep = async (step: number): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Combined Details Step
        if (!formData.restaurantName?.trim()) {
          newErrors.restaurantName = 'שם המסעדה הוא שדה חובה';
        }
        if (!formData.itemName?.trim()) {
          newErrors.itemName = 'שם הפריט הוא שדה חובה';
        }
        if (!formData.itemType) {
          newErrors.itemType = 'סוג הפריט הוא שדה חובה';
        }
        break;

      case 2: // Image Upload
        if (formData.referenceImages.length === 0) {
          newErrors.referenceImages = 'יש להעלות לפחות תמונה אחת';
        }
        if (formData.referenceImages.length > 10) {
          newErrors.referenceImages = 'ניתן להעלות עד 10 תמונות';
        }
        break;

      case 3: // Review
        // Final validation
        if (!formData.restaurantName?.trim()) {
          newErrors.restaurantName = 'שם המסעדה הוא שדה חובה';
        }
        if (!formData.itemName?.trim()) {
          newErrors.itemName = 'שם הפריט הוא שדה חובה';
        }
        if (!formData.itemType) {
          newErrors.itemType = 'סוג הפריט הוא שדה חובה';
        }
        if (formData.referenceImages.length === 0) {
          newErrors.referenceImages = 'יש להעלות לפחות תמונה אחת';
        }
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
