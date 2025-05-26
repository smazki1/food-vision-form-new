
import { NewItemFormData, ItemType } from '@/contexts/NewItemFormContext';
import RestaurantDetailsStep from '../steps/RestaurantDetailsStep';
import ItemDetailsStep from '../steps/ItemDetailsStep';
import ImageUploadStep from '../steps/ImageUploadStep';
import ReviewSubmitStep from '../steps/ReviewSubmitStep';

export interface FormStepConfig {
  id: number;
  name: string;
  component: React.ComponentType<any>;
  validate: (data: NewItemFormData) => Record<string, string>;
}

export const allSteps: FormStepConfig[] = [
  {
    id: 1,
    name: 'פרטי מסעדה',
    component: RestaurantDetailsStep,
    validate: (data: NewItemFormData) => {
      const newErrors: Record<string, string> = {};
      if (!data.restaurantName?.trim()) newErrors.restaurantName = 'שם המסעדה הוא שדה חובה.';
      return newErrors;
    }
  },
  { 
    id: 2, 
    name: 'פרטי פריט', 
    component: ItemDetailsStep, 
    validate: (data: NewItemFormData) => {
      const newErrors: Record<string, string> = {};
      if (!data.itemName.trim()) newErrors.itemName = 'שם הפריט הוא שדה חובה.';
      if (!data.itemType) newErrors.itemType = 'סוג הפריט הוא שדה חובה.';
      return newErrors;
    }
  },
  { 
    id: 3, 
    name: 'העלאת תמונות', 
    component: ImageUploadStep, 
    validate: (data: NewItemFormData) => {
      const newErrors: Record<string, string> = {};
      if (data.referenceImages.length < 1) newErrors.referenceImages = 'יש להעלות לפחות תמונה אחת.';
      if (data.referenceImages.length > 10) newErrors.referenceImages = 'ניתן להעלות עד 10 תמונות.';
      return newErrors;
    }
  },
  {
    id: 4,
    name: 'סקירה ואישור',
    component: ReviewSubmitStep,
    validate: (data: NewItemFormData) => {
        const newErrors: Record<string, string> = {};
        if (data.referenceImages.length === 0) newErrors.finalCheck = "יש להעלות לפחות תמונה אחת לפני ההגשה.";
        return newErrors;
    }
  }
];
