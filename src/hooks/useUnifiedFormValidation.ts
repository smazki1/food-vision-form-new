
import { useState } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';

export const useUnifiedFormValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { formData } = useNewItemForm();

  const validateRestaurantDetails = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (!formData.restaurantName?.trim()) {
      newErrors.restaurantName = 'שם המסעדה הוא שדה חובה';
    }
    return newErrors;
  };

  const validateItemDetails = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (!formData.itemName?.trim()) {
      newErrors.itemName = 'שם הפריט הוא שדה חובה';
    }
    if (!formData.itemType) {
      newErrors.itemType = 'סוג הפריט הוא שדה חובה';
    }
    return newErrors;
  };

  const validateImageUpload = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (formData.referenceImages.length === 0) {
      newErrors.referenceImages = 'יש להעלות לפחות תמונה אחת';
    }
    if (formData.referenceImages.length > 10) {
      newErrors.referenceImages = 'ניתן להעלות עד 10 תמונות';
    }
    return newErrors;
  };

  const validateAllFields = (): Record<string, string> => {
    return {
      ...validateRestaurantDetails(),
      ...validateItemDetails(),
      ...validateImageUpload()
    };
  };

  const validateStep = async (step: number): Promise<boolean> => {
    let newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Restaurant Details
        newErrors = validateRestaurantDetails();
        break;
      case 2: // Item Details
        newErrors = validateItemDetails();
        break;
      case 3: // Image Upload
        newErrors = validateImageUpload();
        break;
      case 4: // Review
        newErrors = validateAllFields();
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
