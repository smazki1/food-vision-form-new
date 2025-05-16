
import { ClientDetails, FoodItem, AdditionalDetails } from "@/types/food-vision";
import { generateId } from "@/utils/generateId";

const STORAGE_KEY = "foodVisionForm";

/**
 * Saves the form data to localStorage
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
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableData));
  } catch (error) {
    console.error("Error saving form data:", error);
  }
};

/**
 * Loads the form data from localStorage
 */
export const loadFormFromStorage = (): {
  clientDetails: ClientDetails;
  dishes: FoodItem[];
  cocktails: FoodItem[];
  drinks: FoodItem[];
  additionalDetails: AdditionalDetails;
  success: boolean;
} | null => {
  try {
    const savedForm = localStorage.getItem(STORAGE_KEY);
    if (!savedForm) return null;
    
    const parsedForm = JSON.parse(savedForm);
    
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
  } catch (error) {
    console.error("Error loading saved form:", error);
    return null;
  }
};

/**
 * Clears the form data from localStorage
 */
export const clearFormStorage = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
