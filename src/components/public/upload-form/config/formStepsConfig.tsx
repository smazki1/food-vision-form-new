
import ItemDetailsStep from '@/components/customer/upload-form/steps/ItemDetailsStep';
import ImageUploadStep from '@/components/customer/upload-form/steps/ImageUploadStep';
import PublicReviewSubmitStep from '../steps/PublicReviewSubmitStep';
import RestaurantNameStep from '../steps/RestaurantNameStep';
import { NewItemFormData } from '@/contexts/NewItemFormContext';
import {
  validateRestaurantNameStep,
  validateItemDetailsStep,
  validateImageUploadStep,
  validateReviewStep
} from '@/utils/publicFormValidation';

export const publicFormSteps = [
  {
    id: 1,
    name: 'שם מסעדה',
    component: RestaurantNameStep,
    validate: validateRestaurantNameStep
  },
  {
    id: 2,
    name: 'פרטי פריט',
    component: ItemDetailsStep,
    validate: validateItemDetailsStep
  },
  {
    id: 3,
    name: 'העלאת תמונות',
    component: ImageUploadStep,
    validate: validateImageUploadStep
  },
  {
    id: 4,
    name: 'סקירה ואישור',
    component: PublicReviewSubmitStep,
    validate: validateReviewStep
  }
];
