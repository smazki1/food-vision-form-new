
import { useCallback } from "react";
import { ClientDetails, FoodItem, AdditionalDetails } from "@/types/food-vision";
import { saveFormToStorage, loadFormFromStorage } from "@/utils/localStorage-utils";

export const useFoodVisionLocalStorage = (
  setClientDetails: React.Dispatch<React.SetStateAction<ClientDetails>>,
  setDishes: React.Dispatch<React.SetStateAction<FoodItem[]>>,
  setCocktails: React.Dispatch<React.SetStateAction<FoodItem[]>>,
  setDrinks: React.Dispatch<React.SetStateAction<FoodItem[]>>,
  setAdditionalDetails: React.Dispatch<React.SetStateAction<AdditionalDetails>>,
) => {
  const loadFromStorage = useCallback(() => {
    const loadedData = loadFormFromStorage();
    
    if (!loadedData) return false;
    
    // Update state with loaded data
    setClientDetails(loadedData.clientDetails);
    setDishes(loadedData.dishes);
    setCocktails(loadedData.cocktails);
    setDrinks(loadedData.drinks);
    setAdditionalDetails(loadedData.additionalDetails);
    
    return true;
  }, [
    setClientDetails,
    setDishes,
    setCocktails,
    setDrinks,
    setAdditionalDetails,
  ]);

  const saveToStorage = useCallback((
    { clientDetails, dishes, cocktails, drinks, additionalDetails } : {
      clientDetails: ClientDetails,
      dishes: FoodItem[],
      cocktails: FoodItem[],
      drinks: FoodItem[],
      additionalDetails: AdditionalDetails,
    }
  ) => {
    saveFormToStorage({
      clientDetails,
      dishes,
      cocktails,
      drinks,
      additionalDetails
    });
  }, []);

  return { loadFromStorage, saveToStorage };
};
