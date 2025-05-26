
import { ClientDetails, FoodItem, AdditionalDetails } from "@/types/food-vision";
import { generateId } from "@/utils/generateId";
import { cacheService } from "@/services/cacheService";

const STORAGE_KEY = "foodVisionForm";
const FORM_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours for form data

/**
 * Saves the form data to localStorage with enhanced caching
 */
export const saveFormToStorage = (formData: {
  clientDetails: ClientDetails;
  dishes: FoodItem[];
  cocktails: FoodItem[];
  drinks: FoodItem[];
  additionalDetails: AdditionalDetails;
}): void => {
  try {
    const serializableData = {
      clientDetails: formData.clientDetails,
      dishes: formData.dishes.map(dish => ({ ...dish, referenceImages: [] })),
      cocktails: formData.cocktails.map(cocktail => ({ ...cocktail, referenceImages: [] })),
      drinks: formData.drinks.map(drink => ({ ...drink, referenceImages: [] })),
      additionalDetails: { ...formData.additionalDetails, brandingMaterials: undefined },
    };
    
    // Use both old method for backward compatibility and new cache service
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableData));
    
    // Also cache using the cache service for better management
    cacheService.set('food_vision_form', serializableData, { 
      ttl: FORM_CACHE_TTL,
      version: '2.0.0' 
    });
    
    console.log('[FORM_CACHE] Form data saved to storage and cache');
  } catch (error) {
    console.error("Error saving form data:", error);
  }
};

/**
 * Loads the form data from localStorage with cache fallback
 */
export const loadFormFromStorage = (): {
  clientDetails: ClientDetails;
  dishes: FoodItem[];
  cocktails: FoodItem[];
  drinks: FoodItem[];
  additionalDetails: AdditionalDetails;
  success: boolean;
  fromCache?: boolean;
} | null => {
  try {
    // Try cache service first
    const cachedForm = cacheService.get('food_vision_form', '2.0.0');
    if (cachedForm) {
      console.log('[FORM_CACHE] Loaded form data from cache service');
      return {
        ...parseFormData(cachedForm),
        fromCache: true
      };
    }

    // Fallback to localStorage
    const savedForm = localStorage.getItem(STORAGE_KEY);
    if (!savedForm) return null;
    
    const parsedForm = JSON.parse(savedForm);
    console.log('[FORM_CACHE] Loaded form data from localStorage');
    
    return parseFormData(parsedForm);
  } catch (error) {
    console.error("Error loading saved form:", error);
    return null;
  }
};

/**
 * Parse form data with defaults
 */
const parseFormData = (parsedForm: any) => {
  // Create default objects in case some properties are missing
  const clientDetails: ClientDetails = {
    restaurantName: "",
    contactName: "",
    phoneNumber: "",
    email: "",
    ...(parsedForm.clientDetails || {})
  };
  
  // Parse dishes with default empty arrays for referenceImages
  const dishes = Array.isArray(parsedForm.dishes) 
    ? parsedForm.dishes.map((dish: any) => ({
        id: dish.id || generateId(),
        name: dish.name || "",
        ingredients: dish.ingredients || "",
        description: dish.description || "",
        notes: dish.notes || "",
        referenceImages: [],
      }))
    : [];
  
  // Parse cocktails with default empty arrays for referenceImages
  const cocktails = Array.isArray(parsedForm.cocktails)
    ? parsedForm.cocktails.map((cocktail: any) => ({
        id: cocktail.id || generateId(),
        name: cocktail.name || "",
        ingredients: cocktail.ingredients || "",
        description: cocktail.description || "",
        notes: cocktail.notes || "",
        referenceImages: [],
      }))
    : [];
  
  // Parse drinks with default empty arrays for referenceImages
  const drinks = Array.isArray(parsedForm.drinks)
    ? parsedForm.drinks.map((drink: any) => ({
        id: drink.id || generateId(),
        name: drink.name || "",
        ingredients: drink.ingredients || "",
        description: drink.description || "",
        notes: drink.notes || "",
        referenceImages: [],
      }))
    : [];
  
  // Parse additional details
  const additionalDetails: AdditionalDetails = {
    visualStyle: "",
    brandColors: "",
    generalNotes: "",
    ...(parsedForm.additionalDetails || {})
  };
  
  return {
    clientDetails,
    dishes,
    cocktails,
    drinks,
    additionalDetails,
    success: true
  };
};

/**
 * Clears the form data from localStorage and cache
 */
export const clearFormStorage = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  cacheService.remove('food_vision_form');
  console.log('[FORM_CACHE] Cleared form data from storage and cache');
};

/**
 * Get form cache statistics
 */
export const getFormCacheStats = () => {
  const isValidCache = cacheService.isValid('food_vision_form', '2.0.0');
  const hasLegacyData = !!localStorage.getItem(STORAGE_KEY);
  
  return {
    hasValidCache: isValidCache,
    hasLegacyData,
    cacheStats: cacheService.getStats()
  };
};
