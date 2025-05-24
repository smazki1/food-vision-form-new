export type FoodItem = {
  id: string;
  name: string;
  ingredients: string;
  description: string;
  notes: string;
  referenceImages?: File[];
  reference_image_urls?: string[];
  processed_image_url?: string;
  status?: string;
};

export type ClientDetails = {
  restaurantName: string;
  contactName: string;
  phoneNumber: string;
  email: string;
};

export type AdditionalDetails = {
  visualStyle: string;
  brandColors: string;
  generalNotes: string;
  brandingMaterials?: File;
};

// Base type for item details displayed in client admin tabs
export interface BaseItemDetailsForTab {
  name: string;
  ingredients: string;
  description: string;
  notes: string;
  reference_image_urls: string[];
}

// Specific item types for tabs
export interface DishDetailsForTab extends BaseItemDetailsForTab {
  dish_id: string;
}

export interface CocktailDetailsForTab extends BaseItemDetailsForTab {
  cocktail_id: string;
}

export interface DrinkDetailsForTab extends BaseItemDetailsForTab {
  drink_id: string;
  // Add any drink-specific fields if they differ, e.g., volume, serving_temperature
}

// You can also create a union type if that becomes useful
export type AnyItemDetailsForTab = DishDetailsForTab | CocktailDetailsForTab | DrinkDetailsForTab;
