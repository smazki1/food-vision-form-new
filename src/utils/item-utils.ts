
import { supabase } from "@/integrations/supabase/client";
import { FoodItem } from "@/types/food-vision";
import { uploadFileToStorage } from "./storage-utils";

/**
 * Generic function to process food items
 * @param items The food items to process
 * @param clientId The client ID
 * @param itemType The type of items ('dishes', 'cocktails', or 'drinks')
 * @returns An array of inserted item IDs
 */
export const processFoodItems = async (
  items: FoodItem[], 
  clientId: string, 
  itemType: 'dishes' | 'cocktails' | 'drinks'
): Promise<string[]> => {
  // Map to get the ID field name based on item type
  const itemIdMap = {
    dishes: 'dish_id',
    cocktails: 'cocktail_id',
    drinks: 'drink_id'
  };
  
  const itemIdField = itemIdMap[itemType];
  
  const itemPromises = items.map(async (item) => {
    const imageUrls = [];
    if (item.referenceImages) {
      for (const image of item.referenceImages) {
        const imageUrl = await uploadFileToStorage(image);
        if (imageUrl) imageUrls.push(imageUrl);
      }
    }
    
    return {
      client_id: clientId,
      name: item.name,
      ingredients: item.ingredients,
      description: item.description,
      notes: item.notes,
      reference_image_urls: imageUrls
    };
  });
  
  const processedItems = await Promise.all(itemPromises);
  
  if (processedItems.length > 0) {
    const { data: insertedItems, error } = await supabase
      .from(itemType)
      .insert(processedItems)
      .select(itemIdField);
    
    if (error) throw error;
    return insertedItems.map(item => item[itemIdField]);
  }
  
  return [];
}

/**
 * Processes dish items, uploads images and saves to database
 */
export const processDishItems = async (dishes: FoodItem[], clientId: string): Promise<string[]> => {
  return processFoodItems(dishes, clientId, 'dishes');
}

/**
 * Processes cocktail items, uploads images and saves to database
 */
export const processCocktailItems = async (cocktails: FoodItem[], clientId: string): Promise<string[]> => {
  return processFoodItems(cocktails, clientId, 'cocktails');
}

/**
 * Processes drink items, uploads images and saves to database
 */
export const processDrinkItems = async (drinks: FoodItem[], clientId: string): Promise<string[]> => {
  return processFoodItems(drinks, clientId, 'drinks');
}
