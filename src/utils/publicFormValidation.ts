
import { NewItemFormData } from '@/contexts/NewItemFormContext';

export const validateRestaurantNameStep = (formData: NewItemFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!formData.restaurantName?.trim()) {
    errors.restaurantName = 'שם המסעדה הוא שדה חובה';
  }
  if (!formData.submitterName?.trim()) {
    errors.submitterName = 'שם המגיש הוא שדה חובה';
  }
  return errors;
};

export const validateItemDetailsStep = (formData: NewItemFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!formData.itemName?.trim()) {
    errors.itemName = 'שם הפריט הוא שדה חובה';
  }
  if (!formData.itemType) {
    errors.itemType = 'סוג הפריט הוא שדה חובה';
  }
  return errors;
};

export const validateImageUploadStep = (formData: NewItemFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (formData.referenceImages.length === 0) {
    errors.referenceImages = 'יש להעלות לפחות תמונה אחת';
  }
  if (formData.referenceImages.length > 10) {
    errors.referenceImages = 'ניתן להעלות עד 10 תמונות';
  }
  return errors;
};

export const validateCombinedUploadStep = (formData: NewItemFormData): Record<string, string> => {
  return {
    ...validateItemDetailsStep(formData),
    ...validateImageUploadStep(formData)
  };
};

export const validateReviewStep = (formData: NewItemFormData): Record<string, string> => {
  return {
    ...validateRestaurantNameStep(formData),
    ...validateCombinedUploadStep(formData)
  };
};
