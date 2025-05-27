
import React from 'react';
import RestaurantDetailsStep from '../steps/RestaurantDetailsStep';
import CombinedUploadStep from '../steps/CombinedUploadStep';
import ReviewSubmitStep from '../steps/ReviewSubmitStep';
import { NewItemFormData } from '@/contexts/NewItemFormContext';

export interface FormStep {
  id: number;
  name: string;
  component: React.ComponentType<any>;
  validate?: (formData: NewItemFormData) => Record<string, string>;
}

const validateRestaurantDetails = (formData: NewItemFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!formData.restaurantName?.trim()) {
    errors.restaurantName = 'שם המסעדה הוא שדה חובה';
  }
  if (!formData.contactEmail?.trim()) {
    errors.contactEmail = 'אימייל הוא שדה חובה';
  }
  if (!formData.contactPhone?.trim()) {
    errors.contactPhone = 'טלפון הוא שדה חובה';
  }
  return errors;
};

const validateCombinedUpload = (formData: NewItemFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!formData.itemName?.trim()) {
    errors.itemName = 'שם הפריט הוא שדה חובה';
  }
  if (!formData.itemType) {
    errors.itemType = 'סוג הפריט הוא שדה חובה';
  }
  if (formData.referenceImages.length === 0) {
    errors.referenceImages = 'יש להעלות לפחות תמונה אחת';
  }
  if (formData.referenceImages.length > 10) {
    errors.referenceImages = 'ניתן להעלות עד 10 תמונות';
  }
  return errors;
};

const validateReview = (formData: NewItemFormData): Record<string, string> => {
  return {
    ...validateCombinedUpload(formData)
  };
};

export const allSteps: FormStep[] = [
  {
    id: 1,
    name: 'פרטי מסעדה',
    component: RestaurantDetailsStep,
    validate: validateRestaurantDetails,
  },
  {
    id: 2,
    name: 'פרטי העלאה',
    component: CombinedUploadStep,
    validate: validateCombinedUpload,
  },
  {
    id: 3,
    name: 'סקירה ואישור',
    component: ReviewSubmitStep,
    validate: validateReview,
  },
];

export const authenticatedSteps: FormStep[] = [
  {
    id: 2,
    name: 'פרטי העלאה',
    component: CombinedUploadStep,
    validate: validateCombinedUpload,
  },
  {
    id: 3,
    name: 'סקירה ואישור',
    component: ReviewSubmitStep,
    validate: validateReview,
  },
];
