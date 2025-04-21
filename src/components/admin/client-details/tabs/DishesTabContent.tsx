
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
  const formattedDishes = dishes.map(dish => ({
    id: dish.dish_id,
    ...dish
  }));

  return (
    <BaseItemList
      items={formattedDishes}
      itemType="dish"
      itemTypeHebrew="מנה"
      onAddClick={() => window.location.href = '/'}
    />
  );
};
