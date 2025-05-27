
import CombinedUploadStep from '../steps/CombinedUploadStep';
import PublicReviewSubmitStep from '../steps/PublicReviewSubmitStep';
import RestaurantNameStep from '../steps/RestaurantNameStep';
import { NewItemFormData } from '@/contexts/NewItemFormContext';
import {
  validateRestaurantNameStep,
  validateCombinedUploadStep,
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
    name: 'פרטי העלאה',
    component: CombinedUploadStep,
    validate: validateCombinedUploadStep
  },
  {
    id: 3,
    name: 'סקירה ואישור',
    component: PublicReviewSubmitStep,
    validate: validateReviewStep
  }
];
