
import React from "react";
import { BaseItemList } from "../shared/BaseItemList";

interface DrinksTabContentProps {
  drinks: Array<{
    drink_id: string;
    name: string;
    ingredients: string;
    description: string;
    notes: string;
    reference_image_urls: string[];
  }>;
}

export const DrinksTabContent: React.FC<DrinksTabContentProps> = ({ drinks }) => {
  const formattedDrinks = drinks.map(drink => ({
    id: drink.drink_id,
    ...drink
  }));

  return (
    <BaseItemList
      items={formattedDrinks}
      itemType="drink"
      itemTypeHebrew="משקה"
      onAddClick={() => window.location.href = '/'}
    />
  );
};
