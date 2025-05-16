
import { supabase } from "@/integrations/supabase/client";
import { FoodItem } from "@/types/food-vision";
import { uploadFileToStorage } from "./storage-utils";

/**
 * Processes dish items, uploads images and saves to database
 */
export const processDishItems = async (dishes: FoodItem[], clientId: string): Promise<string[]> => {
  const dishPromises = dishes.map(async (dish) => {
    const imageUrls = [];
    if (dish.referenceImages) {
      for (const image of dish.referenceImages) {
        const imageUrl = await uploadFileToStorage(image);
        if (imageUrl) imageUrls.push(imageUrl);
      }
    }
    return {
      client_id: clientId,
      name: dish.name,
      ingredients: dish.ingredients,
      description: dish.description,
      notes: dish.notes,
      reference_image_urls: imageUrls
    };
  });
  
  const processedDishes = await Promise.all(dishPromises);
  
  if (processedDishes.length > 0) {
    const { data: insertedDishes, error } = await supabase
      .from('dishes')
      .insert(processedDishes)
      .select('dish_id');
    
    if (error) throw error;
    return insertedDishes.map(dish => dish.dish_id);
  }
  
  return [];
}

/**
 * Processes cocktail items, uploads images and saves to database
 */
export const processCocktailItems = async (cocktails: FoodItem[], clientId: string): Promise<string[]> => {
  const cocktailPromises = cocktails.map(async (cocktail) => {
    const imageUrls = [];
    if (cocktail.referenceImages) {
      for (const image of cocktail.referenceImages) {
        const imageUrl = await uploadFileToStorage(image);
        if (imageUrl) imageUrls.push(imageUrl);
      }
    }
    return {
      client_id: clientId,
      name: cocktail.name,
      ingredients: cocktail.ingredients,
      description: cocktail.description,
      notes: cocktail.notes,
      reference_image_urls: imageUrls
    };
  });
  
  const processedCocktails = await Promise.all(cocktailPromises);
  
  if (processedCocktails.length > 0) {
    const { data: insertedCocktails, error } = await supabase
      .from('cocktails')
      .insert(processedCocktails)
      .select('cocktail_id');
    
    if (error) throw error;
    return insertedCocktails.map(cocktail => cocktail.cocktail_id);
  }
  
  return [];
}

/**
 * Processes drink items, uploads images and saves to database
 */
export const processDrinkItems = async (drinks: FoodItem[], clientId: string): Promise<string[]> => {
  const drinkPromises = drinks.map(async (drink) => {
    const imageUrls = [];
    if (drink.referenceImages) {
      for (const image of drink.referenceImages) {
        const imageUrl = await uploadFileToStorage(image);
        if (imageUrl) imageUrls.push(imageUrl);
      }
    }
    return {
      client_id: clientId,
      name: drink.name,
      ingredients: drink.ingredients,
      description: drink.description,
      notes: drink.notes,
      reference_image_urls: imageUrls
    };
  });
  
  const processedDrinks = await Promise.all(drinkPromises);
  
  if (processedDrinks.length > 0) {
    const { data: insertedDrinks, error } = await supabase
      .from('drinks')
      .insert(processedDrinks)
      .select('drink_id');
    
    if (error) throw error;
    return insertedDrinks.map(drink => drink.drink_id);
  }
  
  return [];
}
