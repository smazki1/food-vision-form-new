
import CombinedUploadStep from '../steps/CombinedUploadStep';
import PublicReviewSubmitStep from '../steps/PublicReviewSubmitStep';
import RestaurantNameStep from '../steps/RestaurantNameStep';
import { NewItemFormData } from '@/contexts/NewItemFormContext';
import {
  validateRestaurantDetailsStep,
  validateImageUploadStep,
  validateReviewStep
} from '@/utils/publicFormValidation';

export const publicFormSteps = [
  {
    id: 1,
    name: 'שם מסעדה',
    component: RestaurantNameStep,
    validate: validateRestaurantDetailsStep
  },
  {
    id: 2,
    name: 'פרטי העלאה',
    component: CombinedUploadStep,
    validate: validateImageUploadStep
  },
  {
    id: 3,
    name: 'סקירה ואישור',
    component: PublicReviewSubmitStep,
    validate: validateReviewStep
  }
];
