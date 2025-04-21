
import React from "react";
import { BaseItemList } from "../shared/BaseItemList";

interface CocktailsTabContentProps {
  cocktails: Array<{
    cocktail_id: string;
    name: string;
    ingredients: string;
    description: string;
    notes: string;
    reference_image_urls: string[];
  }>;
}

export const CocktailsTabContent: React.FC<CocktailsTabContentProps> = ({ cocktails }) => {
  const formattedCocktails = cocktails.map(cocktail => ({
    id: cocktail.cocktail_id,
    ...cocktail
  }));

  return (
    <BaseItemList
      items={formattedCocktails}
      itemType="cocktail"
      itemTypeHebrew="קוקטייל"
      onAddClick={() => window.location.href = '/'}
    />
  );
};
