
import { useEffect } from "react";
import { FoodItem } from "@/types/food-vision";
import { generateId } from "@/utils/generateId";

export const useEnsureAtLeastOneDish = (
  initialized: boolean,
  dishes: FoodItem[],
  setDishes: React.Dispatch<React.SetStateAction<FoodItem[]>>
) => {
  useEffect(() => {
    if (initialized && Array.isArray(dishes) && dishes.length === 0) {
      setDishes([{
        id: generateId(),
        name: "",
        ingredients: "",
        description: "",
        notes: "",
        referenceImages: []
      }]);
    }
  }, [initialized, dishes, setDishes]);
};
