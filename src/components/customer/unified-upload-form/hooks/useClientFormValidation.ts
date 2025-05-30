import { useState } from 'react';
import { NewItemFormData } from '@/contexts/NewItemFormContext';

// Define the specific fields from NewItemFormData relevant for validation in the client form
// This might be a subset if not all fields from NewItemFormData are validated here.
// For now, let's assume we might need to validate any of the core item fields.
// Restaurant details (restaurantName, submitterName) are typically pre-filled for clients.

type ValidatableClientFormData = Pick<
  NewItemFormData,
  'restaurantName' | 'submitterName' | 'itemName' | 'itemType' | 'referenceImages'
>

export const useClientFormValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // For client form, isAuthenticated is always true. ClientId should always be present.
  // The `formData` parameter will be NewItemFormData.
  const validateClientStep = (step: number, formData: NewItemFormData): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Restaurant Details (mostly pre-filled for clients)
        if (!formData.restaurantName?.trim()) {
          newErrors.restaurantName = 'שם המסעדה חסר (ייתכן שנדרש רענון)';
        }
        if (!formData.submitterName?.trim()) {
          newErrors.submitterName = 'שם איש קשר חסר (ייתכן שנדרש רענון)';
        }
        break;
      case 2: // Item Details
        if (!formData.itemName?.trim()) {
          newErrors.itemName = 'שם הפריט הוא שדה חובה';
        }
        break;
      case 3: // Image Upload
        if (!formData.referenceImages || formData.referenceImages.length === 0) {
          newErrors.referenceImages = 'יש להעלות לפחות תמונה אחת';
        }
        break;
      case 4: // Review step - Final check
        if (!formData.itemName?.trim()) {
          newErrors.itemName = 'שם הפריט הוא שדה חובה';
        }
        if (!formData.itemType) { // Ensure itemType is selected
          newErrors.itemType = 'סוג הפריט הוא שדה חובה';
        }
        if (!formData.referenceImages || formData.referenceImages.length === 0) {
          newErrors.referenceImages = 'יש להעלות לפחות תמונה אחת';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearClientErrors = () => {
    setErrors({});
  };

  return {
    clientErrors: errors,
    validateClientStep,
    clearClientErrors
  };
}; 