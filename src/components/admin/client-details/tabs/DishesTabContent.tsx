
import React from "react";
import { BaseItemList } from "../shared/BaseItemList";

interface DishesTabContentProps {
  dishes: Array<{
    dish_id: string;
    name: string;
    ingredients: string;
    description: string;
    notes: string;
    reference_image_urls: string[];
  }>;
}

export const DishesTabContent: React.FC<DishesTabContentProps> = ({ dishes }) => {
  // Ensure dishes is always an array and all items have valid properties
  const safeDishes = Array.isArray(dishes) 
    ? dishes.map(dish => ({
        id: dish?.dish_id || "",
        name: dish?.name || "",
        ingredients: dish?.ingredients || "",
        description: dish?.description || "",
        notes: dish?.notes || "",
        reference_image_urls: Array.isArray(dish?.reference_image_urls) 
          ? dish.reference_image_urls 
          : []
      }))
    : [];

  return (
    <BaseItemList
      items={safeDishes}
      itemType="dish"
      itemTypeHebrew="מנה"
      onAddClick={() => window.location.href = '/'}
    />
  );
};
