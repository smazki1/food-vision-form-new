
import { useCallback } from "react";
import { ClientDetails, FoodItem, AdditionalDetails } from "@/types/food-vision";
import { generateId } from "@/utils/generateId";

export const useFoodVisionLocalStorage = (
  setClientDetails: React.Dispatch<React.SetStateAction<ClientDetails>>,
  setDishes: React.Dispatch<React.SetStateAction<FoodItem[]>>,
  setCocktails: React.Dispatch<React.SetStateAction<FoodItem[]>>,
  setDrinks: React.Dispatch<React.SetStateAction<FoodItem[]>>,
  setAdditionalDetails: React.Dispatch<React.SetStateAction<AdditionalDetails>>,
) => {
  const loadFromStorage = useCallback(() => {
    try {
      const savedForm = localStorage.getItem("foodVisionForm");
      if (!savedForm) return false;
      const parsedForm = JSON.parse(savedForm);

      if (parsedForm?.clientDetails) {
        setClientDetails({
          restaurantName: parsedForm.clientDetails.restaurantName || "",
          contactName: parsedForm.clientDetails.contactName || "",
          phoneNumber: parsedForm.clientDetails.phoneNumber || "",
          email: parsedForm.clientDetails.email || "",
        });
      }
      if (Array.isArray(parsedForm.dishes)) {
        setDishes(parsedForm.dishes.map((dish: any) => ({
          id: dish.id || generateId(),
          name: dish.name || "",
          ingredients: dish.ingredients || "",
          description: dish.description || "",
          notes: dish.notes || "",
          referenceImages: [],
        })));
      } else setDishes([]);

      if (Array.isArray(parsedForm.cocktails)) {
        setCocktails(parsedForm.cocktails.map((cocktail: any) => ({
          id: cocktail.id || generateId(),
          name: cocktail.name || "",
          ingredients: cocktail.ingredients || "",
          description: cocktail.description || "",
          notes: cocktail.notes || "",
          referenceImages: [],
        })));
      } else setCocktails([]);

      if (Array.isArray(parsedForm.drinks)) {
        setDrinks(parsedForm.drinks.map((drink: any) => ({
          id: drink.id || generateId(),
          name: drink.name || "",
          ingredients: drink.ingredients || "",
          description: drink.description || "",
          notes: drink.notes || "",
          referenceImages: [],
        })));
      } else setDrinks([]);

      if (parsedForm?.additionalDetails) {
        setAdditionalDetails({
          visualStyle: parsedForm.additionalDetails.visualStyle || "",
          brandColors: parsedForm.additionalDetails.brandColors || "",
          generalNotes: parsedForm.additionalDetails.generalNotes || "",
        });
      }

      return true;
    } catch (error) {
      console.error("Error loading saved form:", error);
      localStorage.removeItem("foodVisionForm");
      setDishes([]);
      setCocktails([]);
      setDrinks([]);
      return false;
    }
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
    try {
      const serializableDishes = dishes.map(dish => ({
        ...dish, referenceImages: []
      }));
      const serializableCocktails = cocktails.map(cocktail => ({
        ...cocktail, referenceImages: []
      }));
      const serializableDrinks = drinks.map(drink => ({
        ...drink, referenceImages: []
      }));

      localStorage.setItem(
        "foodVisionForm",
        JSON.stringify({
          clientDetails,
          dishes: serializableDishes,
          cocktails: serializableCocktails,
          drinks: serializableDrinks,
          additionalDetails: { ...additionalDetails, brandingMaterials: undefined },
        })
      );
    } catch (error) {
      console.error("Error saving form data:", error);
    }
  }, []);

  return { loadFromStorage, saveToStorage };
};
