import { useState } from 'react';

interface FormData {
  restaurantName: string;
  contactEmail: string;
  contactPhone: string;
  itemName: string;
  itemType: 'dish' | 'cocktail' | 'drink';
  description: string;
  specialNotes: string;
  referenceImages: File[];
}

export const useFormValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number, formData: FormData, isAuthenticated: boolean): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.restaurantName.trim()) {
          newErrors.restaurantName = 'שם המסעדה הוא שדה חובה';
        }
        if (!isAuthenticated) {
          if (!formData.contactEmail.trim()) {
            newErrors.contactEmail = 'אימייל הוא שדה חובה';
          }
          if (!formData.contactPhone.trim()) {
            newErrors.contactPhone = 'מספר טלפון הוא שדה חובה';
          }
        }
        break;
      case 2:
        if (!formData.itemName.trim()) {
          newErrors.itemName = 'שם הפריט הוא שדה חובה';
        }
        break;
      case 3:
        if (formData.referenceImages.length < 4) {
          newErrors.referenceImages = 'יש להעלות לפחות 4 תמונות';
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
    errors,
    validateStep,
    clearErrors
  };
};
