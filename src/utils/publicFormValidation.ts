
import { NewItemFormData } from '@/contexts/NewItemFormContext';

export const validateRestaurantNameStep = (data: NewItemFormData) => {
  const newErrors: Record<string, string> = {};
  if (!data.restaurantName?.trim()) newErrors.restaurantName = 'שם המסעדה הוא שדה חובה.';
  return newErrors;
};

export const validateItemDetailsStep = (data: NewItemFormData) => {
  const newErrors: Record<string, string> = {};
  if (!data.itemName.trim()) newErrors.itemName = 'שם הפריט הוא שדה חובה.';
  if (!data.itemType) newErrors.itemType = 'סוג הפריט הוא שדה חובה.';
  return newErrors;
};

export const validateImageUploadStep = (data: NewItemFormData) => {
  const newErrors: Record<string, string> = {};
  if (data.referenceImages.length < 1) newErrors.referenceImages = 'יש להעלות לפחות תמונה אחת.';
  if (data.referenceImages.length > 10) newErrors.referenceImages = 'ניתן להעלות עד 10 תמונות.';
  return newErrors;
};

export const validateReviewStep = (data: NewItemFormData) => {
  const newErrors: Record<string, string> = {};
  if (data.referenceImages.length === 0) newErrors.finalCheck = "יש להעלות לפחות תמונה אחת לפני ההגשה.";
  return newErrors;
};
