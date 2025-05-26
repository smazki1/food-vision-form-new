
import { useState } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';

export const useFormValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { formData } = useNewItemForm();

  const validateStep = async (step: number): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Restaurant Details
        if (!formData.restaurantName?.trim()) {
          newErrors.restaurantName = 'שם המסעדה הוא שדה חובה';
        }
        if (!formData.contactName?.trim()) {
          newErrors.contactName = 'שם איש הקשר הוא שדה חובה';
        }
        if (!formData.phoneNumber?.trim()) {
          newErrors.phoneNumber = 'מספר טלפון הוא שדה חובה';
        } else if (!/^05\d{8}$/.test(formData.phoneNumber.replace(/[-\s]/g, ''))) {
          newErrors.phoneNumber = 'מספר טלפון לא תקין';
        }
        if (!formData.emailAddress?.trim()) {
          newErrors.emailAddress = 'כתובת אימייל היא שדה חובה';
        } else if (!/\S+@\S+\.\S+/.test(formData.emailAddress)) {
          newErrors.emailAddress = 'כתובת אימייל לא תקינה';
        }
        break;

      case 2: // Item Details
        if (!formData.itemName?.trim()) {
          newErrors.itemName = 'שם הפריט הוא שדה חובה';
        }
        if (!formData.itemType) {
          newErrors.itemType = 'סוג הפריט הוא שדה חובה';
        }
        break;

      case 3: // Image Upload
        if (formData.referenceImages.length === 0) {
          newErrors.referenceImages = 'יש להעלות לפחות תמונה אחת';
        }
        if (formData.referenceImages.length > 10) {
          newErrors.referenceImages = 'ניתן להעלות עד 10 תמונות';
        }
        break;

      case 4: // Review
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
