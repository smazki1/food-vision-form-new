
import { useState } from "react";
import { FoodItem } from "@/types/food-vision";
import { generateId } from "@/utils/generateId";

type FoodItemType = "dishes" | "cocktails" | "drinks";

const getDefaultFoodItem = (): FoodItem => ({
  id: generateId(),
  name: "",
  ingredients: "",
  description: "",
  notes: "",
  referenceImages: [],
});

export const useFoodItems = () => {
  const [dishes, setDishes] = useState<FoodItem[]>([]);
  const [cocktails, setCocktails] = useState<FoodItem[]>([]);
  const [drinks, setDrinks] = useState<FoodItem[]>([]);

  const ensureAtLeastOneItem = (type: FoodItemType) => {
    if (type === "dishes" && dishes.length === 0) setDishes([getDefaultFoodItem()]);
    if (type === "cocktails" && cocktails.length === 0) setCocktails([getDefaultFoodItem()]);
    if (type === "drinks" && drinks.length === 0) setDrinks([getDefaultFoodItem()]);
  };

  return {
    dishes,
    setDishes,
    cocktails,
    setCocktails,
    drinks,
    setDrinks,
    ensureAtLeastOneItem
  };
};
