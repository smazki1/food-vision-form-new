import { NewItemFormData } from '@/contexts/NewItemFormContext';

export const validateRestaurantDetailsStep = (formData: NewItemFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (formData.isNewBusiness === undefined) {
    errors.isNewBusiness = 'חובה לבחור האם העסק רשום במערכת';
  }
  
  if (!formData.restaurantName?.trim()) {
    errors.restaurantName = 'חסר שם מסעדה';
  }
  if (!formData.submitterName?.trim()) {
    errors.submitterName = 'חסר שם איש קשר';
  }
  if (formData.isNewBusiness) {
    if (!formData.contactEmail?.trim()) {
      errors.contactEmail = 'חסר מייל';
    }
    if (!formData.contactPhone?.trim()) {
      errors.contactPhone = 'חסר טלפון';
    }
  }
  return errors;
};

export const validateItemDetailsStep = (formData: NewItemFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  // If using dishes array (new combined upload), validate each dish
  if (formData.dishes && formData.dishes.length > 0) {
    // Validate dish count limits for leads
    if (formData.isLead && formData.dishes.length > 3) {
      errors.dishCount = 'ליד חדש יכול להעלות עד 3 מנות בלבד';
    }
    // Only validate if user has actually started filling at least one dish
    const hasAnyDishData = formData.dishes.some(dish => 
      dish.itemName?.trim() || dish.itemType || dish.description?.trim()
    );
    
    if (hasAnyDishData) {
      formData.dishes.forEach((dish, index) => {
        // Only validate filled dishes or dishes that have some content
        if (dish.itemName?.trim() || dish.itemType || dish.description?.trim()) {
          if (!dish.itemName?.trim()) {
            errors[`dish_${dish.id}_itemName`] = `חסר שם מנה ${index + 1}`;
          }
          if (!dish.itemType) {
            errors[`dish_${dish.id}_itemType`] = `חסר סוג מוצר במנה ${index + 1}`;
          }
          if (!dish.description?.trim()) {
            errors[`dish_${dish.id}_description`] = `חסר תיאור במנה ${index + 1}`;
          }
        }
      });
    }
  } else {
    // Legacy single dish validation
    if (!formData.itemName?.trim()) {
      errors.itemName = 'שם הפריט הוא שדה חובה';
    }
    if (!formData.itemType) {
      errors.itemType = 'יש לבחור סוג פריט';
    }
    if (!formData.description?.trim()) {
      errors.description = 'תיאור המנה הוא שדה חובה';
    }
  }
  return errors;
};

export const validateImageUploadStep = (formData: NewItemFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  // If using dishes array (new combined upload), validate each dish's images
  if (formData.dishes && formData.dishes.length > 0) {
    formData.dishes.forEach((dish, index) => {
      // Only validate images if dish has other content
      if (dish.itemName?.trim() || dish.itemType || dish.description?.trim()) {
        if (dish.referenceImages.length < 4) {
          errors[`dish_${dish.id}_referenceImages`] = `חסרות תמונות במנה ${index + 1}`;
        } else if (dish.referenceImages.length > 10) {
          errors[`dish_${dish.id}_referenceImages`] = `יותר מדי תמונות במנה ${index + 1}`;
        }
        
        if (!dish.qualityConfirmed) {
          errors[`dish_${dish.id}_qualityConfirmed`] = `חסר אישור איכות במנה ${index + 1}`;
        }
      }
    });
  } else {
    // Legacy single dish validation
    if (formData.referenceImages.length === 0) {
      errors.referenceImages = 'יש להעלות לפחות 4 תמונות';
    }
    if (formData.referenceImages.length < 4) {
      errors.referenceImages = 'יש להעלות לפחות 4 תמונות';
    }
    if (formData.referenceImages.length > 10) {
      errors.referenceImages = 'ניתן להעלות עד 10 תמונות';
    }
  }
  return errors;
};

export const validateReviewStep = (formData: NewItemFormData): Record<string, string> => {
  return {
    ...validateRestaurantDetailsStep(formData),
    ...validateItemDetailsStep(formData),
    ...validateImageUploadStep(formData)
  };
};
